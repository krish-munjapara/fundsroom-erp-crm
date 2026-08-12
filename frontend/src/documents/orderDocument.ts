import type { Order } from '../services';
import { formatDate, displayOrDash } from './helpers';

export function buildOrderCsvRows(order: Order): (string | number)[][] {
  const items = order.items || [];
  const rows: (string | number)[][] = [
    ['Order Number', order.order_number],
    ['Order Date', formatDate(order.order_date)],
    ['Status', order.status],
    ['Customer', displayOrDash(order.customer_name)],
    ['Contact', displayOrDash(order.customer_contact)],
    ['Phone', displayOrDash(order.customer_phone)],
    ['Email', displayOrDash(order.customer_email)],
    ['Notes', displayOrDash(order.notes)],
    [],
    ['Product', 'SKU', 'Quantity', 'Unit Price', 'Discount', 'Line Total'],
  ];

  items.forEach((item) => {
    rows.push([
      item.product_name || '',
      item.product_sku || item.sku || '',
      item.quantity,
      item.unit_price,
      item.discount_amount ?? 0,
      item.line_total ?? item.total_amount ?? item.subtotal ?? 0,
    ]);
  });

  rows.push(
    [],
    ['Subtotal', order.subtotal ?? 0],
    ['Discount', order.discount_amount ?? 0],
    ['Tax', order.tax_amount ?? 0],
    ['Grand Total', order.total_amount ?? 0]
  );

  return rows;
}
