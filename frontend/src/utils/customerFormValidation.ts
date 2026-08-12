import type { CreateCustomerData } from '../services';

export type CustomerFormField =
  | 'company_name'
  | 'contact_person'
  | 'email'
  | 'phone'
  | 'postal_code'
  | 'credit_limit'
  | 'follow_up_date'
  | 'submit';

export type CustomerFormErrors = Partial<Record<CustomerFormField, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PIN_REGEX = /^[1-9][0-9]{5}$/;
const GENERAL_POSTAL_REGEX = /^[A-Za-z0-9\s-]{3,10}$/;

/** Normalize phone to digits for Indian mobile validation. */
export function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/[\s\-()+]/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    return digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return digits.slice(1);
  }
  return digits;
}

export function isValidIndianPhone(phone: string): boolean {
  const normalized = normalizeIndianPhone(phone.trim());
  return /^[6-9]\d{9}$/.test(normalized);
}

export function validateCustomerForm(data: CreateCustomerData): CustomerFormErrors {
  const errors: CustomerFormErrors = {};

  const companyName = data.company_name.trim();
  if (!companyName) {
    errors.company_name = 'Company name is required';
  } else if (companyName.length < 2) {
    errors.company_name = 'Company name must be at least 2 characters';
  }

  const contactPerson = data.contact_person.trim();
  if (!contactPerson) {
    errors.contact_person = 'Contact person is required';
  } else if (contactPerson.length < 2) {
    errors.contact_person = 'Contact person must be at least 2 characters';
  }

  const email = data.email.trim();
  if (!email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  const phone = data.phone?.trim() || '';
  if (phone && !isValidIndianPhone(phone)) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
  }

  const postalCode = data.postal_code?.trim() || '';
  if (postalCode && !INDIAN_PIN_REGEX.test(postalCode) && !GENERAL_POSTAL_REGEX.test(postalCode)) {
    errors.postal_code = 'Enter a valid postal code (e.g. 400001)';
  }

  const creditLimit = Number(data.credit_limit ?? 0);
  if (Number.isNaN(creditLimit) || creditLimit < 0) {
    errors.credit_limit = 'Credit limit must be zero or greater';
  }

  const followUpDate = data.follow_up_date?.trim() || '';
  if (followUpDate) {
    const parsed = new Date(`${followUpDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      errors.follow_up_date = 'Please enter a valid date';
    }
  }

  return errors;
}

export function sanitizeCustomerForm(data: CreateCustomerData): CreateCustomerData {
  const trim = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  };

  const creditLimit = Number(data.credit_limit ?? 0);

  return {
    company_name: data.company_name.trim(),
    contact_person: data.contact_person.trim(),
    email: data.email.trim(),
    phone: trim(data.phone),
    address: trim(data.address),
    city: trim(data.city),
    state: trim(data.state),
    postal_code: trim(data.postal_code),
    country: trim(data.country),
    tax_id: trim(data.tax_id),
    credit_limit: Number.isNaN(creditLimit) ? 0 : Math.max(0, creditLimit),
    notes: trim(data.notes),
    customer_type: data.customer_type,
    status: data.status,
    follow_up_date: trim(data.follow_up_date),
  };
}

export function buildCustomerPayload(
  data: CreateCustomerData,
  options?: { includeIsActive?: boolean }
): CreateCustomerData {
  const sanitized = sanitizeCustomerForm(data);
  const payload: CreateCustomerData = {
    ...sanitized,
    phone: sanitized.phone || undefined,
    address: sanitized.address || undefined,
    city: sanitized.city || undefined,
    state: sanitized.state || undefined,
    postal_code: sanitized.postal_code || undefined,
    country: sanitized.country || undefined,
    tax_id: sanitized.tax_id || undefined,
    notes: sanitized.notes || undefined,
    follow_up_date: sanitized.follow_up_date || undefined,
  };

  if (options?.includeIsActive) {
    payload.is_active = data.status !== 'inactive';
  }

  return payload;
}
