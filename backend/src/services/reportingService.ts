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
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const orderConditions = conditions.map((c) =>
      c.replace(/\border_date\b/g, 'o.order_date').replace(/\bstatus\b/g, 'o.status')
    );
    const orderWhereClause =
      orderConditions.length > 0 ? `WHERE ${orderConditions.join(' AND ')}` : '';

    // Get order stats
    const statsQuery = `
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value
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

    // Get monthly revenue
    const monthlyQuery = `
      SELECT
        TO_CHAR(order_date, 'YYYY-MM') as month,
        SUM(total_amount) as revenue
      FROM orders
      ${whereClause}
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
      ${orderWhereClause}
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
      ${orderWhereClause}
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

    return {
      total_orders: parseInt(statsRow.total_orders, 10) || 0,
      total_revenue: parseFloat(statsRow.total_revenue) || 0,
      average_order_value: parseFloat(statsRow.average_order_value) || 0,
      pending_orders: ordersByStatus.pending || 0,
      confirmed_orders: ordersByStatus.confirmed || 0,
      orders_by_status: ordersByStatus,
      revenue_by_month: revenueByMonth,
      sales_by_customer: salesByCustomer,
      sales_by_product: salesByProduct,
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
      LEFT JOIN orders o ON c.id = o.customer_id AND o.status IN ('delivered', 'confirmed')
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
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('delivered', 'confirmed')
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
