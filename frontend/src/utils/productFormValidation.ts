import type { CreateProductData } from '../services';

export type ProductFormField =
  | 'sku'
  | 'name'
  | 'category'
  | 'unit_price'
  | 'current_stock'
  | 'minimum_stock'
  | 'location'
  | 'submit';

export type ProductFormErrors = Partial<Record<ProductFormField, string>>;

export function validateProductForm(data: CreateProductData): ProductFormErrors {
  const errors: ProductFormErrors = {};

  const sku = data.sku.trim();
  if (!sku) {
    errors.sku = 'SKU is required';
  } else if (sku.length < 3) {
    errors.sku = 'SKU must be at least 3 characters';
  } else if (sku.length > 50) {
    errors.sku = 'SKU must not exceed 50 characters';
  }

  const name = data.name.trim();
  if (!name) {
    errors.name = 'Product name is required';
  } else if (name.length < 2) {
    errors.name = 'Product name must be at least 2 characters';
  }

  const category = data.category.trim();
  if (!category) {
    errors.category = 'Category is required';
  } else if (category.length < 2) {
    errors.category = 'Category must be at least 2 characters';
  }

  const unitPrice = Number(data.unit_price);
  if (Number.isNaN(unitPrice)) {
    errors.unit_price = 'Unit price must be a valid number';
  } else if (unitPrice < 0) {
    errors.unit_price = 'Unit price cannot be negative';
  }

  const currentStock = Number(data.current_stock);
  if (Number.isNaN(currentStock)) {
    errors.current_stock = 'Current stock must be a valid number';
  } else if (currentStock < 0) {
    errors.current_stock = 'Current stock cannot be negative';
  } else if (!Number.isInteger(currentStock)) {
    errors.current_stock = 'Current stock must be a whole number';
  }

  const minimumStock = Number(data.minimum_stock);
  if (Number.isNaN(minimumStock)) {
    errors.minimum_stock = 'Minimum stock must be a valid number';
  } else if (minimumStock < 0) {
    errors.minimum_stock = 'Minimum stock cannot be negative';
  } else if (!Number.isInteger(minimumStock)) {
    errors.minimum_stock = 'Minimum stock must be a whole number';
  }

  const location = data.location.trim();
  if (!location) {
    errors.location = 'Location is required';
  } else if (location.length < 2) {
    errors.location = 'Location must be at least 2 characters';
  }

  return errors;
}

export function buildProductPayload(data: CreateProductData): CreateProductData {
  const trim = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  };

  return {
    sku: data.sku.trim(),
    name: data.name.trim(),
    description: trim(data.description),
    category: data.category.trim(),
    unit_price: Number(data.unit_price),
    current_stock: Number(data.current_stock),
    minimum_stock: Number(data.minimum_stock),
    location: data.location.trim(),
    warehouse: trim(data.warehouse),
    is_active: data.is_active ?? true,
  };
}

export function mapProductApiError(message?: string): {
  field?: ProductFormField;
  message: string;
} {
  if (!message) {
    return {
      message: 'Unable to save the product. Please check the entered details and try again.',
    };
  }

  const lower = message.toLowerCase();
  if (lower.includes('sku') && (lower.includes('exist') || lower.includes('duplicate') || lower.includes('unique'))) {
    return { field: 'sku', message: 'A product with this SKU already exists.' };
  }

  if (lower.includes('validation') || lower.includes('required') || lower.includes('must')) {
    return { message };
  }

  return { message: 'Unable to save the product. Please check the entered details and try again.' };
}
