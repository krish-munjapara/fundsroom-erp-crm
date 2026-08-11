import { useState, useEffect } from 'react';
import { challanService } from '../../services';
import type { Challan, Customer, Product } from '../../services';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context';
import {
  buildChallanPayload,
  calculateChallanSummary,
  calculateLineTotal,
  mapChallanApiError,
  parsePositiveQuantityInputForChallan,
  validateChallanForm,
  type ChallanFormErrors,
  type ChallanFormItem,
} from '../../utils/challanFormValidation';

interface CreateChallanModalProps {
  customers: Customer[];
  products: Product[];
  challan?: Challan;
  onClose: () => void;
  onSave: () => void;
}

const inputClass = (hasError: boolean) =>
  `w-full border rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
    hasError ? 'border-danger-300' : 'border-navy-300'
  }`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger-600">{message}</p>;
}

function createEmptyItem(): ChallanFormItem {
  return { product_id: 0, quantity: '', discount: 0 };
}

function mapChallanToFormItems(challan?: Challan): ChallanFormItem[] {
  if (!challan?.items?.length) return [];
  return challan.items.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    discount: 0,
  }));
}

export default function CreateChallanModal({
  customers,
  products,
  challan,
  onClose,
  onSave,
}: CreateChallanModalProps) {
  const { showToast } = useToast();
  const isEditing = !!challan;

  const [customerId, setCustomerId] = useState(challan?.customer_id || 0);
  const [items, setItems] = useState<ChallanFormItem[]>(() => mapChallanToFormItems(challan));
  const [notes, setNotes] = useState(challan?.notes || '');
  const [errors, setErrors] = useState<ChallanFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const summary = calculateChallanSummary(items, products);
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity === '' ? 0 : item.quantity), 0);

  const clearItemError = (index: number, field: 'product' | 'quantity' | 'discount') => {
    const key = `item_${index}_${field}`;
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
    setErrors((prev) => {
      if (!prev.items) return prev;
      const next = { ...prev };
      delete next.items;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const next: ChallanFormErrors = {};
      Object.entries(prev).forEach(([key, value]) => {
        if (key === 'submit' || key === 'customer_id' || key === 'items') {
          next[key] = value;
          return;
        }
        const match = key.match(/^item_(\d+)_(product|quantity|discount)$/);
        if (!match) {
          next[key] = value;
          return;
        }
        const itemIndex = Number(match[1]);
        if (itemIndex === index) return;
        if (itemIndex > index) {
          next[`item_${itemIndex - 1}_${match[2]}`] = value;
        } else {
          next[key] = value;
        }
      });
      return next;
    });
  };

  const handleProductChange = (index: number, productId: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], product_id: productId, quantity: next[index].quantity || '' };
      return next;
    });
    clearItemError(index, 'product');
  };

  const handleQuantityChange = (index: number, value: string) => {
    const parsed = parsePositiveQuantityInputForChallan(value);
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: parsed };
      return next;
    });
    clearItemError(index, 'quantity');
  };

  const handleDiscountChange = (index: number, value: string) => {
    const parsed = value === '' ? 0 : Math.max(Number(value), 0);
    if (Number.isNaN(parsed)) return;
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], discount: parsed };
      return next;
    });
    clearItemError(index, 'discount');
  };

  const handleSubmit = async (confirm: boolean) => {
    const validationErrors = validateChallanForm(customerId, items, products, {
      validateStock: confirm,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (confirm) {
      const confirmed = window.confirm(
        'Confirm this sales challan? Stock will be deducted from inventory for all listed products. This action cannot be undone.'
      );
      if (!confirmed) return;
      setIsConfirming(true);
    } else {
      setIsSubmitting(true);
    }

    setErrors({});

    try {
      const payload = buildChallanPayload(customerId, items, notes);
      const response =
        isEditing && challan
          ? await challanService.updateChallan(challan.id, payload)
          : await challanService.createChallan(payload);

      if (!response.success || !response.data) {
        setErrors({ submit: mapChallanApiError(response.message) });
        return;
      }

      const challanId = response.data.id;

      if (confirm) {
        const confirmResponse = await challanService.confirmChallan(challanId);
        if (confirmResponse.success) {
          showToast('Challan confirmed successfully', 'success');
          onSave();
          onClose();
        } else {
          setErrors({ submit: mapChallanApiError(confirmResponse.message) });
        }
      } else {
        showToast(isEditing ? 'Challan updated successfully' : 'Challan saved as draft', 'success');
        onSave();
        onClose();
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as { message?: string })?.message;
      setErrors({ submit: mapChallanApiError(message) });
    } finally {
      setIsSubmitting(false);
      setIsConfirming(false);
    }
  };

  const isBusy = isSubmitting || isConfirming;

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-lg-premium border border-navy-200 flex flex-col">
        <div className="p-6 border-b border-navy-200 shrink-0">
          <h2 className="text-xl font-semibold text-navy-900">
            {isEditing ? 'Edit Sales Challan' : 'Create Sales Challan'}
          </h2>
          <p className="text-sm text-navy-500 mt-1">
            {isEditing
              ? `Update draft challan ${challan?.challan_number}`
              : 'Create a challan for customer product dispatch'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">
                Customer Information
              </h3>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Customer *</label>
                <select
                  value={customerId || ''}
                  onChange={(e) => {
                    setCustomerId(parseInt(e.target.value, 10) || 0);
                    setErrors((prev) => {
                      if (!prev.customer_id) return prev;
                      const next = { ...prev };
                      delete next.customer_id;
                      return next;
                    });
                  }}
                  className={inputClass(!!errors.customer_id)}
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.contact_person})
                    </option>
                  ))}
                </select>
                <FieldError message={errors.customer_id} />
              </div>
              {selectedCustomer && (
                <div className="mt-3 bg-navy-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Contact Person</p>
                    <p className="text-sm text-navy-900">{selectedCustomer.contact_person}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Email</p>
                    <p className="text-sm text-navy-900">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Phone</p>
                    <p className="text-sm text-navy-900">{selectedCustomer.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">GST/Tax ID</p>
                    <p className="text-sm text-navy-900">{selectedCustomer.tax_id || '-'}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">
                Products
              </h3>
              {items.map((item, index) => {
                const product = products.find((p) => p.id === item.product_id);
                const availableStock = product ? Number(product.current_stock ?? 0) : 0;
                const unitPrice = product ? Number(product.unit_price ?? 0) : 0;
                const quantity = item.quantity === '' ? 0 : item.quantity;
                const lineTotal =
                  product && quantity > 0
                    ? calculateLineTotal(quantity, unitPrice, item.discount)
                    : 0;
                const quantityError = errors[`item_${index}_quantity`];
                const showStockWarning = Boolean(
                  !quantityError &&
                  product &&
                  quantity > 0 &&
                  quantity > availableStock
                );

                return (
                  <div key={index} className="bg-navy-50 rounded-lg p-4 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-navy-700 mb-1">
                          Product *
                        </label>
                        <select
                          value={item.product_id || ''}
                          onChange={(e) =>
                            handleProductChange(index, parseInt(e.target.value, 10) || 0)
                          }
                          className={inputClass(!!errors[`item_${index}_product`])}
                        >
                          <option value="">Select Product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                        <FieldError message={errors[`item_${index}_product`]} />
                      </div>

                      {product && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">
                              Product Name
                            </label>
                            <p className="text-sm text-navy-900 py-2.5">{product.name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">SKU</label>
                            <p className="text-sm text-navy-900 py-2.5 font-mono">{product.sku}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">
                          Available Stock
                        </label>
                        <p className="text-sm text-navy-900 py-2.5">{product ? availableStock : '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className={inputClass(!!quantityError || showStockWarning)}
                          placeholder="1"
                        />
                        <FieldError message={quantityError} />
                        {showStockWarning && (
                          <p className="mt-1 text-xs text-danger-600">
                            Insufficient stock. Only {availableStock} units available.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">
                          Unit Price
                        </label>
                        <p className="text-sm text-navy-900 py-2.5">
                          {product ? formatCurrency(unitPrice) : '-'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">
                          Discount <span className="text-navy-400 font-normal">(optional)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount || ''}
                          onChange={(e) => handleDiscountChange(index, e.target.value)}
                          className={inputClass(!!errors[`item_${index}_discount`])}
                          placeholder="0"
                        />
                        <FieldError message={errors[`item_${index}_discount`]} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Total</label>
                        <p className="text-sm font-semibold text-navy-900 py-2.5">
                          {product && quantity > 0 ? formatCurrency(lineTotal) : '-'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="mt-3 text-sm text-danger-600 hover:text-danger-700 font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2 border-2 border-dashed border-navy-300 rounded-lg text-navy-600 hover:border-primary-500 hover:text-primary-600 transition-colors"
              >
                + Add Product
              </button>
              <FieldError message={errors.items} />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={inputClass(false)}
              />
            </div>

            {errors.submit && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <p className="text-danger-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {items.length > 0 && (
              <div className="bg-navy-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">
                  Order Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-600">Subtotal</span>
                    <span className="font-medium text-navy-900">{formatCurrency(summary.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-600">Discount</span>
                    <span className="font-medium text-danger-600">
                      {summary.totalDiscount > 0 ? `-${formatCurrency(summary.totalDiscount)}` : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-600">Tax</span>
                    <span className="font-medium text-navy-900">
                      {summary.tax > 0 ? formatCurrency(summary.tax) : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="border-t border-navy-200 pt-2 mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-navy-900">Grand Total</span>
                    <span className="text-lg font-semibold text-navy-900">
                      {formatCurrency(summary.grandTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-navy-500 pt-1">
                    <span>
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </span>
                    <span>{totalQuantity} total units</span>
                  </div>
                  {summary.tax === 0 && (
                    <p className="text-xs text-navy-400">
                      Tax is not configured for sales challans. Amounts shown are before tax.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-navy-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="px-4 py-2 border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isBusy}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 shadow-sm-premium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isBusy}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? 'Confirming...' : 'Save & Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
