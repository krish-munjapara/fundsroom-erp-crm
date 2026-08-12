import type { Product } from '../services';
import { getStockStatus, displayOrDash } from './helpers';

export function buildProductsCsvRows(products: Product[]): (string | number)[][] {
  return [
    [
      'Product Name',
      'SKU',
      'Category',
      'Description',
      'Unit Price',
      'Current Stock',
      'Minimum Stock Level',
      'Stock Status',
      'Location',
      'Warehouse',
      'Active',
    ],
    ...products.map((p) => [
      p.name,
      p.sku,
      p.category,
      displayOrDash(p.description),
      p.unit_price,
      p.current_stock,
      p.minimum_stock,
      getStockStatus(p.current_stock, p.minimum_stock),
      displayOrDash(p.location),
      displayOrDash(p.warehouse),
      p.is_active ? 'Yes' : 'No',
    ]),
  ];
}
