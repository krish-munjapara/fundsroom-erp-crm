import { pool } from '../config/database';
import {
  ReportFilters,
  SalesReport,
  CustomerReport,
  ProductPerformanceReport,
  InventoryReport,
} from '../types';

export class ReportingService {
  // Sales Report
  static async getSalesReport(filters: ReportFilters = {}): Promise<SalesReport> {
    const { start_date, end_date, status } = filters;
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (start_date || end_date || status) {
      const conditions: string[] = [];
      if (start_date) {
        conditions.push(`order_date >= $${paramIndex++}`);
        params.push(start_date);
      }
      if (end_date) {
        conditions.push(`order_date <= $${paramIndex++}`);
        params.push(end_date);
      }
      if (status) {
        conditions.push(`status = $${paramIndex++}`);
        params.push(status);
      }
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    const query = `
      WITH order_stats AS (
        SELECT
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as average_order_value
        FROM orders
        ${whereClause}
      ),
      status_breakdown AS (
        SELECT status, COUNT(*) as count
        FROM orders
        ${whereClause}
        GROUP BY status
      ),
      monthly_revenue AS (
        SELECT
          TO_CHAR(order_date, 'YYYY-MM') as month,
          SUM(total_amount) as revenue
        FROM orders
        ${whereClause}
        GROUP BY TO_CHAR(order_date, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      )
      SELECT
        os.total_orders,
        COALESCE(os.total_revenue, 0) as total_revenue,
        COALESCE(os.average_order_value, 0) as average_order_value,
        COALESCE(json_object_agg(sb.status, sb.count), '{}'::json) as orders_by_status,
        COALESCE(json_agg(json_build_object('month', mr.month, 'revenue', mr.revenue)) FILTER (WHERE mr.month IS NOT NULL), '[]'::json) as revenue_by_month
      FROM order_stats os
      CROSS JOIN status_breakdown sb
      CROSS JOIN monthly_revenue mr
      GROUP BY os.total_orders, os.total_revenue, os.average_order_value
    `;

    const result = await pool.query(query, params);
    const row = result.rows[0];

    return {
      total_orders: parseInt(row.total_orders),
      total_revenue: parseFloat(row.total_revenue),
      average_order_value: parseFloat(row.average_order_value),
      orders_by_status: row.orders_by_status,
      revenue_by_month: row.revenue_by_month,
    };
  }

  // Customer Report
  static async getCustomerReport(filters: ReportFilters = {}): Promise<CustomerReport> {
    const { customer_id } = filters;

    let customerFilter = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (customer_id) {
      customerFilter = `WHERE c.id = $${paramIndex++}`;
      params.push(customer_id);
    }

    const query = `
      WITH customer_stats AS (
        SELECT
          COUNT(*) as total_customers,
          COUNT(*) FILTER (WHERE is_active = true) as active_customers,
          SUM(credit_limit) as total_credit_limit
        FROM customers
        ${customerFilter}
      ),
      top_customers AS (
        SELECT
          c.id as customer_id,
          c.company_name,
          COUNT(o.id) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_spent
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id AND o.status IN ('delivered', 'confirmed')
        ${customerFilter}
        GROUP BY c.id, c.company_name
        ORDER BY total_spent DESC
        LIMIT 10
      )
      SELECT
        cs.total_customers,
        cs.active_customers,
        COALESCE(cs.total_credit_limit, 0) as total_credit_limit,
        COALESCE(json_agg(json_build_object(
          'customer_id', tc.customer_id,
          'company_name', tc.company_name,
          'total_orders', tc.total_orders,
          'total_spent', tc.total_spent
        )) FILTER (WHERE tc.customer_id IS NOT NULL), '[]'::json) as top_customers
      FROM customer_stats cs
      CROSS JOIN top_customers tc
      GROUP BY cs.total_customers, cs.active_customers, cs.total_credit_limit
    `;

    const result = await pool.query(query, params);
    const row = result.rows[0];

    return {
      total_customers: parseInt(row.total_customers),
      active_customers: parseInt(row.active_customers),
      total_credit_limit: parseFloat(row.total_credit_limit),
      top_customers: row.top_customers,
    };
  }

  // Product Performance Report
  static async getProductPerformanceReport(filters: ReportFilters = {}): Promise<ProductPerformanceReport> {
    const { product_id } = filters;

    let productFilter = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (product_id) {
      productFilter = `WHERE p.id = $${paramIndex++}`;
      params.push(product_id);
    }

    const query = `
      WITH product_stats AS (
        SELECT
          COUNT(*) as total_products,
          COUNT(*) FILTER (WHERE is_active = true) as active_products
        FROM products
        ${productFilter}
      ),
      top_products AS (
        SELECT
          p.id as product_id,
          p.name as product_name,
          p.sku,
          COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
          COALESCE(SUM(oi.total_amount), 0) as total_revenue
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('delivered', 'confirmed')
        ${productFilter}
        GROUP BY p.id, p.name, p.sku
        ORDER BY total_revenue DESC
        LIMIT 10
      )
      SELECT
        ps.total_products,
        ps.active_products,
        COALESCE(json_agg(json_build_object(
          'product_id', tp.product_id,
          'product_name', tp.product_name,
          'sku', tp.sku,
          'total_quantity_sold', tp.total_quantity_sold,
          'total_revenue', tp.total_revenue
        )) FILTER (WHERE tp.product_id IS NOT NULL), '[]'::json) as top_selling_products
      FROM product_stats ps
      CROSS JOIN top_products tp
      GROUP BY ps.total_products, ps.active_products
    `;

    const result = await pool.query(query, params);
    const row = result.rows[0];

    return {
      total_products: parseInt(row.total_products),
      active_products: parseInt(row.active_products),
      top_selling_products: row.top_selling_products,
    };
  }

  // Inventory Report
  static async getInventoryReport(filters: ReportFilters = {}): Promise<InventoryReport> {
    const { product_id } = filters;

    let productFilter = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (product_id) {
      productFilter = `WHERE p.id = $${paramIndex++}`;
      params.push(product_id);
    }

    const query = `
      WITH inventory_stats AS (
        SELECT
          COUNT(*) as total_products,
          COUNT(*) FILTER (WHERE i.available_quantity <= p.reorder_level AND i.available_quantity > 0) as low_stock_count,
          COUNT(*) FILTER (WHERE i.available_quantity = 0) as out_of_stock_count,
          SUM(i.quantity * p.base_price) as total_inventory_value
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        ${productFilter}
      ),
      stock_summary AS (
        SELECT
          i.product_id,
          p.name as product_name,
          p.sku,
          i.quantity,
          i.available_quantity,
          (i.quantity * p.base_price) as value
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        ${productFilter}
        ORDER BY i.available_quantity ASC
        LIMIT 50
      )
      SELECT
        is.total_products,
        is.low_stock_count,
        is.out_of_stock_count,
        COALESCE(is.total_inventory_value, 0) as total_inventory_value,
        COALESCE(json_agg(json_build_object(
          'product_id', ss.product_id,
          'product_name', ss.product_name,
          'sku', ss.sku,
          'quantity', ss.quantity,
          'available_quantity', ss.available_quantity,
          'value', ss.value
        )) FILTER (WHERE ss.product_id IS NOT NULL), '[]'::json) as stock_summary
      FROM inventory_stats is
      CROSS JOIN stock_summary ss
      GROUP BY is.total_products, is.low_stock_count, is.out_of_stock_count, is.total_inventory_value
    `;

    const result = await pool.query(query, params);
    const row = result.rows[0];

    return {
      total_products: parseInt(row.total_products),
      low_stock_count: parseInt(row.low_stock_count),
      out_of_stock_count: parseInt(row.out_of_stock_count),
      total_inventory_value: parseFloat(row.total_inventory_value),
      stock_summary: row.stock_summary,
    };
  }
}
