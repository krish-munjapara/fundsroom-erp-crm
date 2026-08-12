import { pool } from '../config/database';
import {
  ReportFilters,
  SalesReport,
  CustomerReport,
  ProductPerformanceReport,
  InventoryReport,
} from '../types';
import { REVENUE_ORDER_STATUS_O_SQL, REVENUE_ORDER_STATUS_SQL } from '../utils/orderStatus';

export class ReportingService {
  // Sales Report
  static async getSalesReport(filters: ReportFilters = {}): Promise<SalesReport> {
    const { start_date, end_date, status } = filters;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (start_date) {
      conditions.push(`order_date::date >= $${paramIndex++}::date`);
      params.push(start_date);
    }
    if (end_date) {
      conditions.push(`order_date::date <= $${paramIndex++}::date`);
      params.push(end_date);
    }
    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const orderConditions = conditions.map((c) =>
      c.replace(/\border_date\b/g, 'o.order_date').replace(/\bstatus\b/g, 'o.status')
    );
    const orderWhereClause =
      orderConditions.length > 0 ? `WHERE ${orderConditions.join(' AND ')}` : '';

    // Get order stats (revenue = confirmed sales only; pending tracked separately)
    const statsQuery = `
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN ${REVENUE_ORDER_STATUS_SQL} THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN ${REVENUE_ORDER_STATUS_SQL} THEN total_amount END), 0) as average_order_value,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_order_value
      FROM orders
      ${whereClause}
    `;
    const statsResult = await pool.query(statsQuery, params);
    const statsRow = statsResult.rows[0];

    // Get status breakdown
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM orders
      ${whereClause}
      GROUP BY status
    `;
    const statusResult = await pool.query(statusQuery, params);
    const ordersByStatus: any = {};
    statusResult.rows.forEach(row => {
      ordersByStatus[row.status] = parseInt(row.count);
    });

    // Get monthly revenue (confirmed sales only)
    const monthlyQuery = `
      SELECT
        TO_CHAR(order_date, 'YYYY-MM') as month,
        SUM(total_amount) as revenue
      FROM orders
      ${whereClause}${whereClause ? ' AND' : 'WHERE'} ${REVENUE_ORDER_STATUS_SQL}
      GROUP BY TO_CHAR(order_date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `;
    const monthlyResult = await pool.query(monthlyQuery, params);
    const revenueByMonth = monthlyResult.rows.map(row => ({
      month: row.month,
      revenue: parseFloat(row.revenue),
    }));

    const customerSalesQuery = `
      SELECT
        c.id as customer_id,
        c.company_name,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ${orderWhereClause}${orderWhereClause ? ' AND' : 'WHERE'} ${REVENUE_ORDER_STATUS_O_SQL}
      GROUP BY c.id, c.company_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `;
    const customerSalesResult = await pool.query(customerSalesQuery, params);
    const salesByCustomer = customerSalesResult.rows.map(row => ({
      customer_id: row.customer_id,
      company_name: row.company_name,
      total_orders: parseInt(row.total_orders, 10),
      total_revenue: parseFloat(row.total_revenue),
    }));

    const productSalesQuery = `
      SELECT
        p.id as product_id,
        COALESCE(oi.product_name, p.name) as product_name,
        COALESCE(oi.sku, p.sku) as sku,
        COALESCE(SUM(oi.quantity), 0) as total_quantity,
        COALESCE(SUM(oi.total_amount), 0) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      ${orderWhereClause}${orderWhereClause ? ' AND' : 'WHERE'} ${REVENUE_ORDER_STATUS_O_SQL}
      GROUP BY p.id, COALESCE(oi.product_name, p.name), COALESCE(oi.sku, p.sku)
      ORDER BY total_revenue DESC
      LIMIT 10
    `;
    const productSalesResult = await pool.query(productSalesQuery, params);
    const salesByProduct = productSalesResult.rows.map(row => ({
      product_id: row.product_id,
      product_name: row.product_name,
      sku: row.sku,
      total_quantity: parseInt(row.total_quantity, 10),
      total_revenue: parseFloat(row.total_revenue),
    }));

    const salesTrend = await this.getSalesTrendData(filters);

    return {
      total_orders: parseInt(statsRow.total_orders, 10) || 0,
      total_revenue: parseFloat(statsRow.total_revenue) || 0,
      average_order_value: parseFloat(statsRow.average_order_value) || 0,
      pending_order_value: parseFloat(statsRow.pending_order_value) || 0,
      pending_orders: ordersByStatus.pending || 0,
      confirmed_orders: ordersByStatus.confirmed || 0,
      orders_by_status: ordersByStatus,
      revenue_by_month: revenueByMonth,
      sales_trend: salesTrend,
      sales_by_customer: salesByCustomer,
      sales_by_product: salesByProduct,
    };
  }

  private static resolveGranularityForRange(startDate: Date, endDate: Date): 'hour' | 'day' | 'week' | 'month' {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;

    if (days <= 1) return 'hour';
    if (days <= 31) return 'day';
    if (days <= 90) return 'week';
    return 'month';
  }

  private static async getSalesTrendData(filters: ReportFilters = {}): Promise<
    Array<{ date: string; revenue: number; orders: number }>
  > {
    const { start_date, end_date, status } = filters;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (start_date) {
      conditions.push(`order_date::date >= $${paramIndex++}::date`);
      params.push(start_date);
    }
    if (end_date) {
      conditions.push(`order_date::date <= $${paramIndex++}::date`);
      params.push(end_date);
    }
    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    const extraWhere = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const rangeStart = start_date ? new Date(start_date) : new Date(Date.now() - 29 * 86400000);
    const rangeEnd = end_date ? new Date(end_date) : new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(0, 0, 0, 0);

    const granularity = this.resolveGranularityForRange(rangeStart, rangeEnd);
    const interval =
      granularity === 'hour'
        ? '1 hour'
        : granularity === 'day'
          ? '1 day'
          : granularity === 'week'
            ? '1 week'
            : '1 month';

    const bucketExpr =
      granularity === 'hour'
        ? "date_trunc('hour', order_date)"
        : granularity === 'day'
          ? 'DATE(order_date)'
          : granularity === 'week'
            ? "date_trunc('week', order_date)::date"
            : "date_trunc('month', order_date)::date";

    const dateFormat = granularity === 'hour' ? `YYYY-MM-DD"T"HH24:00:00` : 'YYYY-MM-DD';
    const seriesCast = granularity === 'hour' ? '::timestamp' : '::date';

    let startParam: string;
    let endParam: string;

    if (start_date && end_date) {
      startParam = '$1::date';
      endParam = '$2::date';
    } else {
      startParam = `$${paramIndex++}::date`;
      endParam = `$${paramIndex++}::date`;
      params.push(rangeStart, rangeEnd);
    }

    const seriesEndExpr =
      granularity === 'hour'
        ? `(${endParam}::date + INTERVAL '1 day' - INTERVAL '1 hour')`
        : endParam;

    const query = `
      WITH date_series AS (
        SELECT generate_series(
          (${startParam})${seriesCast},
          (${seriesEndExpr})${seriesCast},
          '${interval}'::interval
        ) AS bucket_date
      ),
      revenue_data AS (
        SELECT
          ${bucketExpr} AS bucket_date,
          COALESCE(SUM(CASE WHEN ${REVENUE_ORDER_STATUS_SQL} THEN total_amount ELSE 0 END), 0) AS revenue
        FROM orders
        WHERE 1=1 ${extraWhere}
        GROUP BY ${bucketExpr}
      ),
      order_data AS (
        SELECT
          ${bucketExpr} AS bucket_date,
          COUNT(*)::int AS orders
        FROM orders
        WHERE 1=1 ${extraWhere}
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

    const result = await pool.query(query, params);
    return result.rows.map((row) => ({
      date: row.date,
      revenue: parseFloat(row.revenue) || 0,
      orders: parseInt(row.orders, 10) || 0,
    }));
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

    // Get customer stats
    const statsQuery = `
      SELECT
        COUNT(*) as total_customers,
        COUNT(*) FILTER (WHERE is_active = true) as active_customers,
        COALESCE(SUM(credit_limit), 0) as total_credit_limit
      FROM customers
      ${customerFilter}
    `;
    const statsResult = await pool.query(statsQuery, params);
    const statsRow = statsResult.rows[0];

    // Get top customers
    const topCustomersQuery = `
      SELECT
        c.id as customer_id,
        c.company_name,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
      ${customerFilter}
      GROUP BY c.id, c.company_name
      ORDER BY total_spent DESC
      LIMIT 10
    `;
    const topCustomersResult = await pool.query(topCustomersQuery, params);
    const topCustomers = topCustomersResult.rows.map(row => ({
      customer_id: row.customer_id,
      company_name: row.company_name,
      total_orders: parseInt(row.total_orders),
      total_spent: parseFloat(row.total_spent),
    }));

    return {
      total_customers: parseInt(statsRow.total_customers) || 0,
      active_customers: parseInt(statsRow.active_customers) || 0,
      total_credit_limit: parseFloat(statsRow.total_credit_limit) || 0,
      top_customers: topCustomers,
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

    // Get product stats
    const statsQuery = `
      SELECT
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE is_active = true) as active_products
      FROM products
      ${productFilter}
    `;
    const statsResult = await pool.query(statsQuery, params);
    const statsRow = statsResult.rows[0];

    // Get top products
    const topProductsQuery = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.sku,
        COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
        COALESCE(SUM(oi.total_amount), 0) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
      ${productFilter}
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_revenue DESC
      LIMIT 10
    `;
    const topProductsResult = await pool.query(topProductsQuery, params);
    const topSellingProducts = topProductsResult.rows.map(row => ({
      product_id: row.product_id,
      product_name: row.product_name,
      sku: row.sku,
      total_quantity_sold: parseInt(row.total_quantity_sold),
      total_revenue: parseFloat(row.total_revenue),
    }));

    return {
      total_products: parseInt(statsRow.total_products) || 0,
      active_products: parseInt(statsRow.active_products) || 0,
      top_selling_products: topSellingProducts,
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

    // Get inventory stats
    const statsQuery = `
      SELECT
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE i.available_quantity <= p.reorder_level AND i.available_quantity > 0) as low_stock_count,
        COUNT(*) FILTER (WHERE i.available_quantity = 0) as out_of_stock_count,
        COALESCE(SUM(i.quantity * p.base_price), 0) as total_inventory_value
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      ${productFilter}
    `;
    const statsResult = await pool.query(statsQuery, params);
    const statsRow = statsResult.rows[0];

    // Get stock summary
    const stockSummaryQuery = `
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
    `;
    const stockSummaryResult = await pool.query(stockSummaryQuery, params);
    const stockSummary = stockSummaryResult.rows.map(row => ({
      product_id: row.product_id,
      product_name: row.product_name,
      sku: row.sku,
      quantity: parseInt(row.quantity),
      available_quantity: parseInt(row.available_quantity),
      value: parseFloat(row.value),
    }));

    return {
      total_products: parseInt(statsRow.total_products) || 0,
      low_stock_count: parseInt(statsRow.low_stock_count) || 0,
      out_of_stock_count: parseInt(statsRow.out_of_stock_count) || 0,
      total_inventory_value: parseFloat(statsRow.total_inventory_value) || 0,
      stock_summary: stockSummary,
    };
  }
}
