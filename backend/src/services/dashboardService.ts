import { pool } from '../config/database';
import { DashboardStats, RecentOrder, RecentActivity } from '../types';

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
        COALESCE((SELECT SUM(total_amount) FROM orders o WHERE status != 'cancelled' ${useFilter ? dateFilter : ''}), 0) as total_sales,
        (SELECT COUNT(*) FROM products p WHERE p.is_active = true AND COALESCE(p.current_stock, 0) <= COALESCE(p.minimum_stock, p.reorder_level, 10)) as low_stock_count,
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
    let groupBy = 'DATE(created_at)';
    let limit = '30';
    let dateCondition = `created_at >= CURRENT_DATE - INTERVAL '30 days'`;

    if (startDate && endDate) {
      dateCondition = `created_at >= '${startDate}'::date AND created_at < ('${endDate}'::date + INTERVAL '1 day')`;
      groupBy = 'DATE(created_at)';
      limit = '90';
    } else if (period === 'today') {
      dateCondition = `DATE(created_at) = CURRENT_DATE`;
      limit = '1';
    } else if (period === 'week') {
      groupBy = 'DATE(created_at)';
      limit = '7';
      dateCondition = `created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === '3months') {
      groupBy = 'DATE_TRUNC(\'week\', created_at)';
      limit = '12';
      dateCondition = `created_at >= CURRENT_DATE - INTERVAL '3 months'`;
    } else if (period === '6months') {
      groupBy = 'DATE_TRUNC(\'month\', created_at)';
      limit = '6';
      dateCondition = `created_at >= CURRENT_DATE - INTERVAL '6 months'`;
    } else if (period === 'year') {
      groupBy = 'DATE_TRUNC(\'month\', created_at)';
      limit = '12';
      dateCondition = `created_at >= CURRENT_DATE - INTERVAL '12 months'`;
    }

    const query = `
      SELECT
        ${groupBy} as date,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE status != 'cancelled'
        AND ${dateCondition}
      GROUP BY ${groupBy}
      ORDER BY date ASC
      LIMIT ${limit}
    `;

    const result = await pool.query(query);
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
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
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
      WHERE COALESCE(p.current_stock, i.available_quantity, 0) <= COALESCE(p.minimum_stock, p.reorder_level, 10)
        AND p.is_active = true
      ORDER BY needed DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}
