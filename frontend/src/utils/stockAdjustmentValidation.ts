export type StockAdjustmentField = 'productId' | 'quantity' | 'notes' | 'submit';

export type StockAdjustmentErrors = Partial<Record<StockAdjustmentField, string>>;

export interface StockAdjustmentInput {
  productId?: number;
  quantity: number;
  movement_type: 'in' | 'out';
  notes: string;
  availableStock?: number;
  requireProduct?: boolean;
}

export function validateStockAdjustment(data: StockAdjustmentInput): StockAdjustmentErrors {
  const errors: StockAdjustmentErrors = {};

  if (data.requireProduct && !data.productId) {
    errors.productId = 'Product is required';
  }

  if (!Number.isInteger(data.quantity) || data.quantity <= 0) {
    errors.quantity = 'Quantity must be a whole number greater than 0';
  } else if (
    data.movement_type === 'out' &&
    data.availableStock !== undefined &&
    data.quantity > data.availableStock
  ) {
    errors.quantity = `Cannot remove more than available stock (${data.availableStock} units)`;
  }

  const notes = data.notes.trim();
  if (!notes) {
    errors.notes = 'Reason is required';
  } else if (notes.length < 2) {
    errors.notes = 'Reason must be at least 2 characters';
  }

  return errors;
}

/** Parse quantity input — returns positive integer or empty string while typing. */
export function parsePositiveQuantityInput(value: string): number | '' {
  if (value === '') return '';
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return '';
  }
  return parsed;
}

export function mapStockAdjustmentApiError(message?: string): string {
  if (!message) {
    return 'Unable to save the stock movement. Please try again.';
  }

  const lower = message.toLowerCase();
  if (lower.includes('insufficient stock') || lower.includes('available quantity')) {
    return message;
  }

  if (lower.includes('quantity') || lower.includes('reason') || lower.includes('product')) {
    return message;
  }

  return 'Unable to save the stock movement. Please try again.';
}
