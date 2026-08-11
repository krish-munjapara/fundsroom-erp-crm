import { useState, useEffect } from 'react';
import type { CreateProductData } from '../../services';
import {
  buildProductPayload,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormField,
} from '../../utils/productFormValidation';

export type ProductSaveResult =
  | { success: true }
  | { success: false; message: string; field?: ProductFormField };

interface ProductModalProps {
  onClose: () => void;
  onSave: (data: CreateProductData) => Promise<ProductSaveResult>;
}

const inputClass = (hasError: boolean) =>
  `w-full border rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
    hasError ? 'border-danger-300' : 'border-navy-300'
  }`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger-600">{message}</p>;
}

function ProductModal({ onClose, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState<CreateProductData>({
    sku: '',
    name: '',
    description: '',
    category: '',
    unit_price: 0,
    current_stock: 0,
    minimum_stock: 10,
    location: '',
    warehouse: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const clearFieldError = (field: ProductFormField) => {
    setErrors((prev: ProductFormErrors) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateField = <K extends keyof CreateProductData>(field: K, value: CreateProductData[K]) => {
    setFormData((prev: CreateProductData) => ({ ...prev, [field]: value }));
    if (field in errors) {
      clearFieldError(field as ProductFormField);
    }
  };

  const handleNonNegativeDecimal = (field: 'unit_price', value: string) => {
    if (value === '') {
      updateField(field, 0);
      return;
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      updateField(field, parsed);
    }
  };

  const handleNonNegativeInteger = (field: 'current_stock' | 'minimum_stock', value: string) => {
    if (value === '') {
      updateField(field, 0);
      return;
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed >= 0 && Number.isInteger(parsed)) {
      updateField(field, parsed);
    } else if (!Number.isNaN(parsed) && parsed >= 0 && value.includes('.')) {
      updateField(field, Math.floor(parsed));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateProductForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = buildProductPayload(formData);
      const result = await onSave(payload);
      if (!result.success) {
        if (result.field) {
          setErrors({ [result.field]: result.message });
        } else {
          setErrors({ submit: result.message });
        }
      }
    } catch {
      setErrors({
        submit: 'Unable to save the product. Please check the entered details and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] shadow-lg-premium border border-navy-200 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-navy-200 shrink-0">
          <h2 className="text-xl font-semibold text-navy-900">Add Product</h2>
          <p className="text-sm text-navy-500 mt-1">Enter product details below</p>
        </div>

        <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errors.submit && (
            <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
              {errors.submit}
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-sku" className="block text-sm font-medium text-navy-700 mb-1">
                  SKU *
                </label>
                <input
                  id="product-sku"
                  name="sku"
                  type="text"
                  value={formData.sku}
                  onChange={(e) => updateField('sku', e.target.value)}
                  className={inputClass(!!errors.sku)}
                  autoComplete="off"
                />
                <FieldError message={errors.sku} />
              </div>
              <div>
                <label htmlFor="product-name" className="block text-sm font-medium text-navy-700 mb-1">
                  Product Name *
                </label>
                <input
                  id="product-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={inputClass(!!errors.name)}
                />
                <FieldError message={errors.name} />
              </div>
              <div>
                <label htmlFor="product-category" className="block text-sm font-medium text-navy-700 mb-1">
                  Category *
                </label>
                <input
                  id="product-category"
                  name="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className={inputClass(!!errors.category)}
                />
                <FieldError message={errors.category} />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="product-description" className="block text-sm font-medium text-navy-700 mb-1">
                  Description
                </label>
                <textarea
                  id="product-description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  className={inputClass(false)}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-unit-price" className="block text-sm font-medium text-navy-700 mb-1">
                  Unit Price (₹) *
                </label>
                <input
                  id="product-unit-price"
                  name="unit_price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.unit_price}
                  onChange={(e) => handleNonNegativeDecimal('unit_price', e.target.value)}
                  className={inputClass(!!errors.unit_price)}
                />
                <FieldError message={errors.unit_price} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-current-stock" className="block text-sm font-medium text-navy-700 mb-1">
                  Current Stock *
                </label>
                <input
                  id="product-current-stock"
                  name="current_stock"
                  type="number"
                  min={0}
                  step={1}
                  value={formData.current_stock}
                  onChange={(e) => handleNonNegativeInteger('current_stock', e.target.value)}
                  className={inputClass(!!errors.current_stock)}
                />
                <FieldError message={errors.current_stock} />
              </div>
              <div>
                <label htmlFor="product-minimum-stock" className="block text-sm font-medium text-navy-700 mb-1">
                  Minimum Stock Alert Quantity *
                </label>
                <input
                  id="product-minimum-stock"
                  name="minimum_stock"
                  type="number"
                  min={0}
                  step={1}
                  value={formData.minimum_stock}
                  onChange={(e) => handleNonNegativeInteger('minimum_stock', e.target.value)}
                  className={inputClass(!!errors.minimum_stock)}
                />
                <FieldError message={errors.minimum_stock} />
              </div>
              <div>
                <label htmlFor="product-location" className="block text-sm font-medium text-navy-700 mb-1">
                  Location *
                </label>
                <input
                  id="product-location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className={inputClass(!!errors.location)}
                />
                <FieldError message={errors.location} />
              </div>
              <div>
                <label htmlFor="product-warehouse" className="block text-sm font-medium text-navy-700 mb-1">
                  Warehouse (Optional)
                </label>
                <input
                  id="product-warehouse"
                  name="warehouse"
                  type="text"
                  value={formData.warehouse}
                  onChange={(e) => updateField('warehouse', e.target.value)}
                  className={inputClass(false)}
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-navy-200 flex justify-end space-x-3 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-w-[128px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;
