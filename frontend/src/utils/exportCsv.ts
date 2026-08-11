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
      ['Total Sales', Number(data.total_sales ?? 0)],
      ['Total Orders', Number(data.total_orders ?? 0)],
      ['Pending Orders', Number(data.pending_orders ?? 0)],
      ['Confirmed Orders', Number(data.confirmed_orders ?? 0)],
      []
    );

    const byDate = (data.sales_by_date as Array<{ date: string; total_sales: number }>) || [];
    if (byDate.length) {
      rows.push(['Date', 'Sales']);
      byDate.forEach((item) => rows.push([item.date, item.total_sales]));
      rows.push([]);
    }

    const byCustomer = (data.sales_by_customer as Array<{ customer_name: string; total_sales: number }>) || [];
    if (byCustomer.length) {
      rows.push(['Customer', 'Sales']);
      byCustomer.forEach((item) => rows.push([item.customer_name, item.total_sales]));
      rows.push([]);
    }

    const byProduct = (data.sales_by_product as Array<{ product_name: string; total_sales: number }>) || [];
    if (byProduct.length) {
      rows.push(['Product', 'Sales']);
      byProduct.forEach((item) => rows.push([item.product_name, item.total_sales]));
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
