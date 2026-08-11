import { useState, useEffect } from 'react';
import type { Product } from '../../services';
import {
  parsePositiveQuantityInput,
  validateStockAdjustment,
  type StockAdjustmentErrors,
  type StockAdjustmentField,
} from '../../utils/stockAdjustmentValidation';

export type StockAdjustmentSaveResult =
  | { success: true }
  | { success: false; message: string; field?: StockAdjustmentField };

export interface StockAdjustmentPayload {
  productId: number;
  quantity: number;
  movement_type: 'in' | 'out';
  notes: string;
}

interface StockAdjustModalProps {
  products: Product[];
  onClose: () => void;
  onSave: (data: StockAdjustmentPayload) => Promise<StockAdjustmentSaveResult>;
}

const inputClass = (hasError: boolean) =>
  `w-full border rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
    hasError ? 'border-danger-300' : 'border-navy-300'
  }`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger-600">{message}</p>;
}

export default function StockAdjustModal({ products, onClose, onSave }: StockAdjustModalProps) {
  const [productId, setProductId] = useState(0);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [movementType, setMovementType] = useState<'in' | 'out'>('in');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<StockAdjustmentErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const selectedProduct = products.find((p) => p.id === productId);
  const availableStock = selectedProduct ? Number(selectedProduct.current_stock ?? 0) : undefined;

  const clearFieldError = (field: StockAdjustmentField) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericQuantity = quantity === '' ? 0 : quantity;
    const validationErrors = validateStockAdjustment({
      productId,
      quantity: numericQuantity,
      movement_type: movementType,
      notes,
      availableStock: movementType === 'out' ? availableStock : undefined,
      requireProduct: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await onSave({
        productId,
        quantity: numericQuantity,
        movement_type: movementType,
        notes: notes.trim(),
      });

      if (!result.success) {
        if (result.field) {
          setErrors({ [result.field]: result.message });
        } else {
          setErrors({ submit: result.message });
        }
      }
    } catch {
      setErrors({ submit: 'Unable to save the stock movement. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-lg-premium border border-navy-200 flex flex-col">
        <div className="p-6 border-b border-navy-200 shrink-0">
          <h2 className="text-xl font-semibold text-navy-900">Stock Adjustment</h2>
          <p className="text-sm text-navy-500 mt-1">Record stock IN or OUT movement</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <form id="stock-adjust-form" onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                {errors.submit}
              </div>
            )}
            <div>
              <label htmlFor="stock-adjust-product" className="block text-sm font-medium text-navy-700 mb-1">
                Product *
              </label>
              <select
                id="stock-adjust-product"
                name="productId"
                value={productId || ''}
                onChange={(e) => {
                  setProductId(parseInt(e.target.value) || 0);
                  clearFieldError('productId');
                  clearFieldError('quantity');
                }}
                className={inputClass(!!errors.productId)}
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
              <FieldError message={errors.productId} />
            </div>
            <div>
              <label htmlFor="stock-adjust-movement-type" className="block text-sm font-medium text-navy-700 mb-1">
                Movement Type *
              </label>
              <select
                id="stock-adjust-movement-type"
                name="movement_type"
                value={movementType}
                onChange={(e) => {
                  setMovementType(e.target.value as 'in' | 'out');
                  clearFieldError('quantity');
                }}
                className={inputClass(false)}
              >
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
              </select>
            </div>
            <div>
              <label htmlFor="stock-adjust-quantity" className="block text-sm font-medium text-navy-700 mb-1">
                Quantity *
              </label>
              <input
                id="stock-adjust-quantity"
                name="quantity"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => {
                  setQuantity(parsePositiveQuantityInput(e.target.value));
                  clearFieldError('quantity');
                }}
                className={inputClass(!!errors.quantity)}
              />
              <FieldError message={errors.quantity} />
              {selectedProduct && movementType === 'out' && (
                <p className="text-xs text-navy-500 mt-1">Available stock: {availableStock} units</p>
              )}
            </div>
            <div>
              <label htmlFor="stock-adjust-reason" className="block text-sm font-medium text-navy-700 mb-1">
                Reason *
              </label>
              <textarea
                id="stock-adjust-reason"
                name="notes"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  clearFieldError('notes');
                }}
                rows={3}
                className={inputClass(!!errors.notes)}
              />
              <FieldError message={errors.notes} />
            </div>
          </form>
        </div>
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
            form="stock-adjust-form"
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-w-[132px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Movement'}
          </button>
        </div>
      </div>
    </div>
  );
}
