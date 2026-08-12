export const COMPANY = {
  name: 'FUNDSROOM',
  tagline: 'ERP + CRM',
  email: 'contact@fundsroom.com',
  phone: '+91 98765 43210',
  address: 'Business Park, Mumbai, Maharashtra, India',
  gstin: '',
};

export function getGeneratedTimestamp(): string {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
