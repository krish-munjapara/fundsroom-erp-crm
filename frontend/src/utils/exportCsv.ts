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
    const customers = (data.customers as Array<Record<string, unknown>>) || [];
    rows.push(['Company', 'Contact', 'Email', 'Status', 'Type']);
    customers.forEach((c) =>
      rows.push([
        String(c.company_name ?? ''),
        String(c.contact_person ?? ''),
        String(c.email ?? ''),
        String(c.status ?? ''),
        String(c.customer_type ?? ''),
      ])
    );
  }

  if (reportType === 'products') {
    const products = (data.products as Array<Record<string, unknown>>) || [];
    rows.push(['Name', 'SKU', 'Category', 'Unit Price', 'Stock']);
    products.forEach((p) =>
      rows.push([
        String(p.name ?? ''),
        String(p.sku ?? ''),
        String(p.category ?? ''),
        Number(p.unit_price ?? 0),
        Number(p.current_stock ?? 0),
      ])
    );
  }

  if (reportType === 'inventory') {
    const items = (data.items as Array<Record<string, unknown>>) || [];
    rows.push(['Product', 'SKU', 'Quantity', 'Location']);
    items.forEach((i) =>
      rows.push([
        String(i.product_name ?? ''),
        String(i.sku ?? ''),
        Number(i.quantity ?? 0),
        String(i.location ?? ''),
      ])
    );
  }

  return rows;
}
