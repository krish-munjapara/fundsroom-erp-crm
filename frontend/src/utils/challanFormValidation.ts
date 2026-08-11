import type { Product } from '../services';
import { parsePositiveQuantityInput } from './stockAdjustmentValidation';

export interface ChallanFormItem {
  product_id: number;
  quantity: number | '';
  discount: number;
}

export type ChallanFormErrors = Record<string, string>;

export function calculateLineSubtotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

export function calculateLineTotal(quantity: number, unitPrice: number, discount: number): number {
  const subtotal = calculateLineSubtotal(quantity, unitPrice);
  return Math.max(subtotal - Math.max(discount, 0), 0);
}

export function calculateChallanSummary(
  items: ChallanFormItem[],
  products: Product[],
  taxRate = 0
) {
  let subtotal = 0;
  let totalDiscount = 0;

  items.forEach((item) => {
    if (!item.product_id || item.quantity === '' || item.quantity <= 0) return;
    const product = products.find((p) => p.id === item.product_id);
    if (!product) return;
    const unitPrice = Number(product.unit_price ?? 0);
    const lineSubtotal = calculateLineSubtotal(item.quantity, unitPrice);
    subtotal += lineSubtotal;
    totalDiscount += Math.min(Math.max(item.discount, 0), lineSubtotal);
  });

  const taxableAmount = Math.max(subtotal - totalDiscount, 0);
  const tax = taxRate > 0 ? taxableAmount * (taxRate / 100) : 0;
  const grandTotal = taxableAmount + tax;

  return { subtotal, totalDiscount, tax, grandTotal };
}

export function validateChallanForm(
  customerId: number,
  items: ChallanFormItem[],
  products: Product[],
  options?: { validateStock?: boolean }
): ChallanFormErrors {
  const errors: ChallanFormErrors = {};

  if (!customerId) {
    errors.customer_id = 'Customer is required';
  }

  if (items.length === 0) {
    errors.items = 'At least one product is required';
    return errors;
  }

  const usedProductIds = new Set<number>();

  items.forEach((item, index) => {
    if (!item.product_id) {
      errors[`item_${index}_product`] = 'Product is required';
      return;
    }

    if (usedProductIds.has(item.product_id)) {
      errors[`item_${index}_product`] = 'This product is already added';
    }
    usedProductIds.add(item.product_id);

    const quantity = item.quantity === '' ? 0 : item.quantity;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors[`item_${index}_quantity`] = 'Quantity must be a whole number greater than 0';
    }

    const product = products.find((p) => p.id === item.product_id);
    const availableStock = product ? Number(product.current_stock ?? 0) : 0;

    if (product && Number.isInteger(quantity) && quantity > 0 && quantity > availableStock) {
      errors[`item_${index}_quantity`] = `Insufficient stock. Only ${availableStock} units available.`;
    }

    if (options?.validateStock && product && quantity > availableStock) {
      errors[`item_${index}_quantity`] = `Insufficient stock. Available: ${availableStock}`;
    }

    const unitPrice = product ? Number(product.unit_price ?? 0) : 0;
    const lineSubtotal = calculateLineSubtotal(quantity, unitPrice);
    if (item.discount < 0) {
      errors[`item_${index}_discount`] = 'Discount cannot be negative';
    } else if (item.discount > lineSubtotal) {
      errors[`item_${index}_discount`] = 'Discount cannot exceed line subtotal';
    }
  });

  return errors;
}

export function parsePositiveQuantityInputForChallan(value: string): number | '' {
  return parsePositiveQuantityInput(value);
}

export function buildChallanPayload(customerId: number, items: ChallanFormItem[], notes: string) {
  return {
    customer_id: customerId,
    items: items
      .filter((item) => item.product_id && item.quantity !== '' && item.quantity > 0)
      .map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity as number,
      })),
    notes: notes.trim() || undefined,
  };
}

export function mapChallanApiError(message?: string): string {
  if (!message) return 'Unable to save the challan. Please try again.';
  const lower = message.toLowerCase();
  if (lower.includes('insufficient stock') || lower.includes('available')) return message;
  if (lower.includes('customer') || lower.includes('product') || lower.includes('quantity')) return message;
  return 'Unable to save the challan. Please check the entered details and try again.';
}
