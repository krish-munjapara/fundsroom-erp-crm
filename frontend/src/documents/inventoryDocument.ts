import type { Product, StockMovement } from '../services';
import {
  formatDateTime,
  getStockStatus,
  signedMovementQuantity,
  displayOrDash,
} from './helpers';

export function buildStockCsvRows(products: Product[]): (string | number)[][] {
  return [
    ['Product', 'SKU', 'Category', 'Current Stock', 'Minimum Stock Level', 'Stock Status', 'Location', 'Warehouse', 'Last Updated'],
    ...products.map((p) => [
      p.name,
      p.sku,
      p.category,
      p.current_stock,
      p.minimum_stock,
      getStockStatus(p.current_stock, p.minimum_stock),
      displayOrDash(p.location),
      displayOrDash(p.warehouse),
      formatDateTime(p.updated_at),
    ]),
  ];
}

export function buildMovementCsvRows(movements: StockMovement[]): (string | number)[][] {
  return [
    ['Product', 'SKU', 'Movement Type', 'Quantity', 'Signed Quantity', 'Reason', 'Created By', 'Timestamp'],
    ...movements.map((m) => [
      m.product_name || `Product ${m.product_id}`,
      displayOrDash(m.sku),
      m.movement_type.toUpperCase(),
      m.quantity,
      signedMovementQuantity(m.movement_type, m.quantity),
      displayOrDash(m.notes),
      m.created_by ? `User ${m.created_by}` : '-',
      formatDateTime(m.created_at),
    ]),
  ];
}
