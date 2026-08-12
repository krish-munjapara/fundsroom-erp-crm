import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

export function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function displayOrDash(value: string | number | null | undefined): string {
  const text = String(value ?? '').trim();
  return text || '-';
}

export function getStockStatus(
  currentStock: number,
  minimumStock: number
): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (currentStock <= 0) return 'Out of Stock';
  if (currentStock <= minimumStock) return 'Low Stock';
  return 'In Stock';
}

export function formatMovementQuantity(movementType: string, quantity: number): string {
  const qty = Math.abs(Number(quantity || 0));
  if (movementType === 'out') return `-${qty}`;
  if (movementType === 'in') return `+${qty}`;
  return String(qty);
}

export function signedMovementQuantity(movementType: string, quantity: number): number {
  const qty = Math.abs(Number(quantity || 0));
  if (movementType === 'out') return -qty;
  return qty;
}

export { formatCurrency, formatDate, formatDateTime };
