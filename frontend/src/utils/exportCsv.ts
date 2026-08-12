export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '');
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildReportCsv(reportType: string, data: Record<string, unknown>): (string | number)[][] {
  const rows: (string | number)[][] = [['Report Type', reportType], []];

  if (reportType === 'sales') {
    rows.push(
      ['Total Orders', Number(data.total_orders ?? 0)],
      ['Confirmed Revenue', Number(data.total_revenue ?? 0)],
      ['Pending Order Value', Number(data.pending_order_value ?? 0)],
      ['Avg Confirmed Order Value', Number(data.average_order_value ?? 0)],
      ['Pending Orders', Number(data.pending_orders ?? 0)],
      ['Confirmed Orders', Number(data.confirmed_orders ?? 0)],
      []
    );

    const byMonth = (data.revenue_by_month as Array<{ month: string; revenue: number }>) || [];
    if (byMonth.length) {
      rows.push(['Month', 'Confirmed Revenue']);
      byMonth.forEach((item) => rows.push([item.month, item.revenue]));
      rows.push([]);
    }

    const trend = (data.sales_trend as Array<{ date: string; revenue: number; orders: number }>) || [];
    if (trend.length) {
      rows.push(['Date', 'Confirmed Revenue', 'Orders']);
      trend.forEach((item) => rows.push([item.date, item.revenue, item.orders]));
      rows.push([]);
    }

    const byCustomer =
      (data.sales_by_customer as Array<{ company_name: string; total_revenue: number; total_orders: number }>) || [];
    if (byCustomer.length) {
      rows.push(['Customer', 'Orders', 'Confirmed Revenue']);
      byCustomer.forEach((item) => rows.push([item.company_name, item.total_orders, item.total_revenue]));
      rows.push([]);
    }

    const byProduct =
      (data.sales_by_product as Array<{ product_name: string; total_revenue: number; total_quantity: number }>) || [];
    if (byProduct.length) {
      rows.push(['Product', 'Quantity Sold', 'Confirmed Revenue']);
      byProduct.forEach((item) => rows.push([item.product_name, item.total_quantity, item.total_revenue]));
    }
  }

  if (reportType === 'customers') {
    rows.push(
      ['Total Customers', Number(data.total_customers ?? 0)],
      ['Active Customers', Number(data.active_customers ?? 0)],
      ['Total Credit Limit', Number(data.total_credit_limit ?? 0)],
      []
    );
    const customers =
      (data.top_customers as Array<{
        company_name: string;
        contact_person?: string;
        total_orders: number;
        total_spent: number;
      }>) || [];
    rows.push(['Company', 'Orders', 'Total Spent']);
    customers.forEach((c) =>
      rows.push([c.company_name, c.total_orders, c.total_spent])
    );
  }

  if (reportType === 'products') {
    rows.push(
      ['Total Products', Number(data.total_products ?? 0)],
      ['Active Products', Number(data.active_products ?? 0)],
      []
    );
    const products =
      (data.top_selling_products as Array<{
        product_name: string;
        sku: string;
        total_quantity_sold: number;
        total_revenue: number;
      }>) || [];
    rows.push(['Product', 'SKU', 'Quantity Sold', 'Revenue']);
    products.forEach((p) =>
      rows.push([p.product_name, p.sku, p.total_quantity_sold, p.total_revenue])
    );
  }

  if (reportType === 'inventory') {
    rows.push(
      ['Total Products', Number(data.total_products ?? 0)],
      ['Low Stock', Number(data.low_stock_count ?? 0)],
      ['Out of Stock', Number(data.out_of_stock_count ?? 0)],
      ['Total Inventory Value', Number(data.total_inventory_value ?? 0)],
      []
    );
    const items =
      (data.stock_summary as Array<{
        product_name: string;
        sku: string;
        quantity: number;
        available_quantity: number;
        value: number;
      }>) || [];
    rows.push(['Product', 'SKU', 'Quantity', 'Available', 'Value']);
    items.forEach((i) =>
      rows.push([i.product_name, i.sku, i.quantity, i.available_quantity, i.value])
    );
  }

  return rows;
}
