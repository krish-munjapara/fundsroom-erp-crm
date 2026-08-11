import { pool } from '../config/database';
import { DashboardStats, RecentOrder, RecentActivity } from '../types';

export class DashboardService {
  static async getDashboardStats(): Promise<DashboardStats> {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM customers WHERE is_active = true) as total_customers,
        (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
        (SELECT COUNT(*) FROM orders) as total_orders,
        COALESCE((SELECT SUM(total_amount) FROM orders WHERE status != 'cancelled'), 0) as total_sales,
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
}
