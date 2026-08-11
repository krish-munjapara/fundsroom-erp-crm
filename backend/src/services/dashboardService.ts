import { pool } from '../config/database';
import { DashboardStats, RecentOrder, RecentActivity } from '../types';

export class DashboardService {
  static async getDashboardStats(period: string = 'all'): Promise<DashboardStats> {
    let dateFilter = '';
    const now = new Date();
    
    if (period === 'today') {
      dateFilter = `AND DATE(o.created_at) = CURRENT_DATE`;
    } else if (period === 'week') {
      dateFilter = `AND o.created_at >= DATE_TRUNC('week', CURRENT_DATE)`;
    } else if (period === 'month') {
      dateFilter = `AND o.created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
    }

    const query = `
      SELECT
        (SELECT COUNT(*) FROM customers WHERE is_active = true) as total_customers,
        (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
        (SELECT COUNT(*) FROM orders o WHERE 1=1 ${period !== 'all' ? dateFilter : ''}) as total_orders,
        COALESCE((SELECT SUM(total_amount) FROM orders o WHERE status != 'cancelled' ${period !== 'all' ? dateFilter : ''}), 0) as total_sales,
        (SELECT COUNT(*) FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.available_quantity <= p.reorder_level AND p.is_active = true) as low_stock_count,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'confirmed') as confirmed_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as delivered_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') as cancelled_orders
    `;

    const result = await pool.query(query);
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

  static async getSalesTrend(period: string = 'month'): Promise<any[]> {
    let groupBy = 'DATE(created_at)';
    let limit = '30';
    
    if (period === 'week') {
      groupBy = 'DATE(created_at)';
      limit = '7';
    } else if (period === '3months') {
      groupBy = 'DATE_TRUNC("week", created_at)';
      limit = '12';
    } else if (period === '6months') {
      groupBy = 'DATE_TRUNC("month", created_at)';
      limit = '6';
    } else if (period === 'year') {
      groupBy = 'DATE_TRUNC("month", created_at)';
      limit = '12';
    }

    const query = `
      SELECT
        ${groupBy} as date,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE status != 'cancelled'
        AND created_at >= CASE
          WHEN '${period}' = 'week' THEN CURRENT_DATE - INTERVAL '7 days'
          WHEN '${period}' = '3months' THEN CURRENT_DATE - INTERVAL '3 months'
          WHEN '${period}' = '6months' THEN CURRENT_DATE - INTERVAL '6 months'
          WHEN '${period}' = 'year' THEN CURRENT_DATE - INTERVAL '12 months'
          ELSE CURRENT_DATE - INTERVAL '30 days'
        END
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
        i.available_quantity as current_stock,
        p.reorder_level as min_stock,
        p.reorder_level - i.available_quantity as needed
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.available_quantity <= p.reorder_level
        AND p.is_active = true
      ORDER BY (p.reorder_level - i.available_quantity) DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}
