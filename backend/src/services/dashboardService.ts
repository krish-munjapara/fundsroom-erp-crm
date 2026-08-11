import { pool } from '../config/database';
import { DashboardStats, RecentOrder, RecentActivity } from '../types';
import { REVENUE_ORDER_STATUS_SQL, REVENUE_ORDER_STATUS_O_SQL } from '../utils/orderStatus';

export class DashboardService {
  private static buildDateFilter(period: string, startDate?: string, endDate?: string): { clause: string; values: string[] } {
    if (startDate && endDate) {
      return {
        clause: `AND o.created_at >= $1::date AND o.created_at < ($2::date + INTERVAL '1 day')`,
        values: [startDate, endDate],
      };
    }

    const filters: Record<string, string> = {
      today: `AND DATE(o.created_at) = CURRENT_DATE`,
      week: `AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'`,
      month: `AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'`,
      '3months': `AND o.created_at >= CURRENT_DATE - INTERVAL '3 months'`,
      '6months': `AND o.created_at >= CURRENT_DATE - INTERVAL '6 months'`,
      year: `AND o.created_at >= CURRENT_DATE - INTERVAL '12 months'`,
    };

    if (period !== 'all' && filters[period]) {
      return { clause: filters[period], values: [] };
    }

    return { clause: '', values: [] };
  }

  static async getDashboardStats(period: string = 'all', startDate?: string, endDate?: string): Promise<DashboardStats> {
    const { clause: dateFilter, values } = this.buildDateFilter(period, startDate, endDate);
    const useFilter = period !== 'all' || (startDate && endDate);

    const query = `
      SELECT
        (SELECT COUNT(*) FROM customers WHERE is_active = true) as total_customers,
        (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
        (SELECT COUNT(*) FROM orders o WHERE 1=1 ${useFilter ? dateFilter.replace(/o\./g, 'o.') : ''}) as total_orders,
        COALESCE((SELECT SUM(total_amount) FROM orders o WHERE ${REVENUE_ORDER_STATUS_SQL} ${useFilter ? dateFilter : ''}), 0) as total_sales,
        (SELECT COUNT(*) FROM products p WHERE p.is_active = true AND COALESCE(p.current_stock, 0) > 0 AND COALESCE(p.current_stock, 0) <= COALESCE(p.minimum_stock, p.reorder_level, 10)) as low_stock_count,
        (SELECT COUNT(*) FROM products p WHERE p.is_active = true AND COALESCE(p.current_stock, 0) = 0) as out_of_stock_count,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'confirmed') as confirmed_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as delivered_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') as cancelled_orders
    `;

    const result = values.length > 0 ? await pool.query(query, values) : await pool.query(query);
    return result.rows[0];
  }

  static async getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
    const query = `
      SELECT
        o.id,
        o.order_number,
        c.company_name as customer_name,
        o.total_amount,
        o.status,
        o.order_date
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  static async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    const query = `
      SELECT
        ca.id,
        c.company_name as customer_name,
        ca.activity_type,
        ca.subject,
        ca.status,
        ca.created_at
      FROM customer_activities ca
      JOIN customers c ON ca.customer_id = c.id
      ORDER BY ca.created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  static async getOrderStatusSummary(): Promise<Record<string, number>> {
    const query = `
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `;

    const result = await pool.query(query);
    const summary: Record<string, number> = {};
    result.rows.forEach(row => {
      summary[row.status] = parseInt(row.count);
    });
    return summary;
  }

  static async getSalesTrend(period: string = 'month', startDate?: string, endDate?: string): Promise<any[]> {
    if (startDate && endDate) {
      const granularity = this.resolveGranularityForRange(startDate, endDate);
      return this.querySalesTrendSeries(granularity, startDate, endDate, [startDate, endDate]);
    }

    switch (period) {
      case 'today':
        return this.querySalesTrendSeries(
          'hour',
          `date_trunc('day', CURRENT_DATE)`,
          `date_trunc('day', CURRENT_DATE) + INTERVAL '23 hours'`
        );
      case 'week':
        return this.querySalesTrendSeries('day', `CURRENT_DATE - INTERVAL '6 days'`, 'CURRENT_DATE');
      case '3months':
        return this.querySalesTrendSeries('week', `date_trunc('week', CURRENT_DATE - INTERVAL '3 months')::date`, `date_trunc('week', CURRENT_DATE)::date`);
      case '6months':
        return this.querySalesTrendSeries('month', `date_trunc('month', CURRENT_DATE - INTERVAL '5 months')::date`, `date_trunc('month', CURRENT_DATE)::date`);
      case 'year':
        return this.querySalesTrendSeries('month', `date_trunc('month', CURRENT_DATE - INTERVAL '11 months')::date`, `date_trunc('month', CURRENT_DATE)::date`);
      case 'month':
      default:
        return this.querySalesTrendSeries('day', `CURRENT_DATE - INTERVAL '29 days'`, 'CURRENT_DATE');
    }
  }

  private static resolveGranularityForRange(startDate: string, endDate: string): 'hour' | 'day' | 'week' | 'month' {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;

    if (days <= 1) return 'hour';
    if (days <= 31) return 'day';
    if (days <= 90) return 'week';
    return 'month';
  }

  private static async querySalesTrendSeries(
    granularity: 'hour' | 'day' | 'week' | 'month',
    startExpr: string,
    endExpr: string,
    paramDates?: [string, string]
  ): Promise<any[]> {
    const interval =
      granularity === 'hour' ? '1 hour' : granularity === 'day' ? '1 day' : granularity === 'week' ? '1 week' : '1 month';
    const bucketExpr =
      granularity === 'hour'
        ? "date_trunc('hour', o.created_at)"
        : granularity === 'day'
          ? 'DATE(o.created_at)'
          : granularity === 'week'
            ? "date_trunc('week', o.created_at)::date"
            : "date_trunc('month', o.created_at)::date";
    const dateFormat =
      granularity === 'hour' ? `YYYY-MM-DD"T"HH24:00:00` : 'YYYY-MM-DD';

    let startBound: string;
    let endBound: string;
    let rangeFilter: string;
    const values: string[] = [];

    if (paramDates) {
      startBound = granularity === 'hour' ? `$1::date` : '$1::date';
      endBound = granularity === 'hour'
        ? `($2::date + INTERVAL '1 day' - INTERVAL '1 hour')`
        : '$2::date';
      rangeFilter = `o.created_at >= $1::date AND o.created_at < ($2::date + INTERVAL '1 day')`;
      values.push(paramDates[0], paramDates[1]);
    } else {
      startBound = startExpr;
      endBound = endExpr;
      if (granularity === 'hour') {
        rangeFilter = `o.created_at >= (${startExpr}) AND o.created_at < (${startExpr}) + INTERVAL '1 day'`;
      } else {
        rangeFilter = `o.created_at >= (${startExpr})::date AND o.created_at < (${endExpr})::date + INTERVAL '1 day'`;
      }
    }

    const seriesCast = granularity === 'hour' ? '::timestamp' : '::date';

    const query = `
      WITH date_series AS (
        SELECT generate_series(
          (${startBound})${seriesCast},
          (${endBound})${seriesCast},
          '${interval}'::interval
        ) AS bucket_date
      ),
      revenue_data AS (
        SELECT
          ${bucketExpr} AS bucket_date,
          COALESCE(SUM(o.total_amount), 0) AS revenue
        FROM orders o
        WHERE ${REVENUE_ORDER_STATUS_O_SQL}
          AND ${rangeFilter}
        GROUP BY ${bucketExpr}
      ),
      order_data AS (
        SELECT
          ${bucketExpr} AS bucket_date,
          COUNT(*)::int AS orders
        FROM orders o
        WHERE ${rangeFilter}
        GROUP BY ${bucketExpr}
      )
      SELECT
        to_char(ds.bucket_date, '${dateFormat}') AS date,
        COALESCE(r.revenue, 0)::float AS revenue,
        COALESCE(ord.orders, 0)::int AS orders
      FROM date_series ds
      LEFT JOIN revenue_data r ON ds.bucket_date = r.bucket_date
      LEFT JOIN order_data ord ON ds.bucket_date = ord.bucket_date
      ORDER BY ds.bucket_date ASC
    `;

    const result = values.length > 0
      ? await pool.query(query, values)
      : await pool.query(query);

    return result.rows;
  }

  static async getTopProducts(limit: number = 5): Promise<any[]> {
    const query = `
      SELECT
        p.id,
        p.name,
        p.sku,
        COALESCE(SUM(oi.quantity), 0) as units_sold,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.sku
      ORDER BY revenue DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  static async getLowStockProducts(limit: number = 10): Promise<any[]> {
    const query = `
      SELECT
        p.id,
        p.name,
        p.sku,
        COALESCE(p.current_stock, i.available_quantity, 0) as current_stock,
        COALESCE(p.minimum_stock, p.reorder_level, 10) as min_stock,
        GREATEST(COALESCE(p.minimum_stock, p.reorder_level, 10) - COALESCE(p.current_stock, i.available_quantity, 0), 0) as needed
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id
      WHERE COALESCE(p.current_stock, i.available_quantity, 0) > 0
        AND COALESCE(p.current_stock, i.available_quantity, 0) <= COALESCE(p.minimum_stock, p.reorder_level, 10)
        AND p.is_active = true
      ORDER BY needed DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}
