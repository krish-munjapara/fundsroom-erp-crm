import type { Challan } from '../services';
import { formatDate, displayOrDash } from './helpers';

export function buildChallanCsvRows(challan: Challan): (string | number)[][] {
  const items = challan.items || [];
  const rows: (string | number)[][] = [
    ['Challan Number', challan.challan_number],
    ['Date', formatDate(challan.created_at)],
    ['Status', challan.status],
    ['Customer', challan.customer_name || `Customer #${challan.customer_id}`],
    ['Email', displayOrDash(challan.customer_email)],
    ['Phone', displayOrDash(challan.customer_phone)],
    ['Address', displayOrDash(challan.customer_address)],
    ['Notes', displayOrDash(challan.notes)],
    [],
    ['Product', 'SKU', 'Quantity', 'Unit Price', 'Total'],
  ];

  items.forEach((item) => {
    rows.push([item.product_name, item.sku, item.quantity, item.unit_price, item.total]);
  });

  rows.push(
    [],
    ['Total Items', challan.total_items],
    ['Total Quantity', challan.total_quantity],
    ['Grand Total', challan.total_amount]
  );

  return rows;
}
