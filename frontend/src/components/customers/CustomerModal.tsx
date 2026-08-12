import { useState, useEffect } from 'react';
import type { Customer, CreateCustomerData } from '../../services';
import {
  buildCustomerPayload,
  validateCustomerForm,
  type CustomerFormErrors,
  type CustomerFormField,
} from '../../utils/customerFormValidation';

export type CustomerSaveResult = { success: true } | { success: false; message: string };

interface CustomerModalProps {
  onClose: () => void;
  onSave: (data: CreateCustomerData) => Promise<CustomerSaveResult>;
  customer?: Customer | null;
}

const inputClass = (hasError: boolean) =>
  `w-full border rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
    hasError ? 'border-danger-300' : 'border-navy-300'
  }`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger-600">{message}</p>;
}

function CustomerModal({ onClose, onSave, customer }: CustomerModalProps) {
  const [formData, setFormData] = useState<CreateCustomerData>({
    company_name: customer?.company_name || '',
    contact_person: customer?.contact_person || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    postal_code: customer?.postal_code || '',
    country: customer?.country || 'India',
    tax_id: customer?.tax_id || '',
    credit_limit: customer?.credit_limit ?? 0,
    notes: customer?.notes || '',
    customer_type: (customer?.customer_type as CreateCustomerData['customer_type']) || 'retail',
    status: (customer?.status as CreateCustomerData['status']) || (customer?.is_active === false ? 'inactive' : 'active'),
    follow_up_date: customer?.follow_up_date ? customer.follow_up_date.split('T')[0] : '',
    is_active: customer?.is_active !== undefined ? customer.is_active : true,
  });
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const clearFieldError = (field: CustomerFormField) => {
    setErrors((prev: CustomerFormErrors) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateField = <K extends keyof CreateCustomerData>(field: K, value: CreateCustomerData[K]) => {
    setFormData((prev: CreateCustomerData) => ({ ...prev, [field]: value }));
    if (field in errors) {
      clearFieldError(field as CustomerFormField);
    }
  };

  const handleCreditLimitChange = (value: string) => {
    if (value === '') {
      updateField('credit_limit', 0);
      return;
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      updateField('credit_limit', parsed);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateCustomerForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = buildCustomerPayload(formData, { includeIsActive: !!customer });
      const result = await onSave(payload);
      if (!result.success) {
        setErrors({ submit: result.message });
      }
    } catch {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-lg-premium border border-navy-200 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-navy-200 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-navy-900">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
              <p className="text-sm text-navy-500 mt-1">
                {customer ? 'Update customer information' : 'Add a new customer to your database'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-navy-400 hover:text-navy-600 hover:bg-navy-100 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Close customer form"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form id="customer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errors.submit && (
            <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customer-company-name" className="block text-sm font-medium text-navy-700 mb-1">
                Company Name *
              </label>
              <input
                id="customer-company-name"
                name="company_name"
                type="text"
                value={formData.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
                className={inputClass(!!errors.company_name)}
                autoComplete="organization"
              />
              <FieldError message={errors.company_name} />
            </div>
            <div>
              <label htmlFor="customer-contact-person" className="block text-sm font-medium text-navy-700 mb-1">
                Contact Person *
              </label>
              <input
                id="customer-contact-person"
                name="contact_person"
                type="text"
                value={formData.contact_person}
                onChange={(e) => updateField('contact_person', e.target.value)}
                className={inputClass(!!errors.contact_person)}
                autoComplete="name"
              />
              <FieldError message={errors.contact_person} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customer-email" className="block text-sm font-medium text-navy-700 mb-1">
                Email *
              </label>
              <input
                id="customer-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={inputClass(!!errors.email)}
                autoComplete="email"
              />
              <FieldError message={errors.email} />
            </div>
            <div>
              <label htmlFor="customer-phone" className="block text-sm font-medium text-navy-700 mb-1">
                Phone
              </label>
              <input
                id="customer-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className={inputClass(!!errors.phone)}
                placeholder="10-digit mobile number"
                autoComplete="tel"
              />
              <FieldError message={errors.phone} />
            </div>
          </div>

          <div>
            <label htmlFor="customer-address" className="block text-sm font-medium text-navy-700 mb-1">
              Address
            </label>
            <input
              id="customer-address"
              name="address"
              type="text"
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              className={inputClass(false)}
              autoComplete="street-address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="customer-city" className="block text-sm font-medium text-navy-700 mb-1">
                City
              </label>
              <input
                id="customer-city"
                name="city"
                type="text"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                className={inputClass(false)}
                autoComplete="address-level2"
              />
            </div>
            <div>
              <label htmlFor="customer-state" className="block text-sm font-medium text-navy-700 mb-1">
                State
              </label>
              <input
                id="customer-state"
                name="state"
                type="text"
                value={formData.state}
                onChange={(e) => updateField('state', e.target.value)}
                className={inputClass(false)}
                autoComplete="address-level1"
              />
            </div>
            <div>
              <label htmlFor="customer-postal-code" className="block text-sm font-medium text-navy-700 mb-1">
                Postal Code
              </label>
              <input
                id="customer-postal-code"
                name="postal_code"
                type="text"
                value={formData.postal_code}
                onChange={(e) => updateField('postal_code', e.target.value)}
                className={inputClass(!!errors.postal_code)}
                placeholder="e.g. 400001"
                autoComplete="postal-code"
              />
              <FieldError message={errors.postal_code} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customer-country" className="block text-sm font-medium text-navy-700 mb-1">
                Country
              </label>
              <input
                id="customer-country"
                name="country"
                type="text"
                value={formData.country}
                onChange={(e) => updateField('country', e.target.value)}
                className={inputClass(false)}
                autoComplete="country-name"
              />
            </div>
            <div>
              <label htmlFor="customer-tax-id" className="block text-sm font-medium text-navy-700 mb-1">
                GSTIN / Tax ID
              </label>
              <input
                id="customer-tax-id"
                name="tax_id"
                type="text"
                value={formData.tax_id}
                onChange={(e) => updateField('tax_id', e.target.value)}
                className={inputClass(false)}
                placeholder="Optional GSTIN or tax identifier"
              />
            </div>
          </div>

          <div>
            <label htmlFor="customer-credit-limit" className="block text-sm font-medium text-navy-700 mb-1">
              Credit Limit (₹)
            </label>
            <input
              id="customer-credit-limit"
              name="credit_limit"
              type="number"
              min={0}
              step={0.01}
              value={formData.credit_limit ?? 0}
              onChange={(e) => handleCreditLimitChange(e.target.value)}
              className={inputClass(!!errors.credit_limit)}
            />
            <FieldError message={errors.credit_limit} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customer-type" className="block text-sm font-medium text-navy-700 mb-1">
                Customer Type
              </label>
              <select
                id="customer-type"
                name="customer_type"
                value={formData.customer_type || 'retail'}
                onChange={(e) =>
                  updateField('customer_type', e.target.value as CreateCustomerData['customer_type'])
                }
                className={inputClass(false)}
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="distributor">Distributor</option>
              </select>
            </div>
            <div>
              <label htmlFor="customer-status" className="block text-sm font-medium text-navy-700 mb-1">
                Status
              </label>
              <select
                id="customer-status"
                name="status"
                value={formData.status || 'active'}
                onChange={(e) => updateField('status', e.target.value as CreateCustomerData['status'])}
                className={inputClass(false)}
              >
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="customer-follow-up-date" className="block text-sm font-medium text-navy-700 mb-1">
              Follow-up Date
            </label>
            <input
              id="customer-follow-up-date"
              name="follow_up_date"
              type="date"
              value={formData.follow_up_date || ''}
              onChange={(e) => updateField('follow_up_date', e.target.value)}
              className={inputClass(!!errors.follow_up_date)}
            />
            <FieldError message={errors.follow_up_date} />
          </div>

          <div>
            <label htmlFor="customer-notes" className="block text-sm font-medium text-navy-700 mb-1">
              Notes
            </label>
            <textarea
              id="customer-notes"
              name="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className={inputClass(false)}
              rows={3}
            />
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
            form="customer-form"
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-w-[132px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerModal;
