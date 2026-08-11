export const formatCurrency = (value: number | string | null | undefined): string => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits:  2,
  }).format(amount);
};

export const formatCompactCurrency = (value: number | string | null | undefined): string => {
  const amount = Number(value || 0);

  if (amount >= 10000000) {
    // Crores (10 million+)
    const crores = amount / 10000000;
    return `₹${crores.toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    // Lakhs (100,000+)
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(2)} L`;
  } else if (amount >= 1000) {
    // Thousands (1,000+)
    const thousands = amount / 1000;
    return `₹${thousands.toFixed(2)} K`;
  }

  // For smaller values, use standard formatting
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatRelativeTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(date);
};

export const formatPercentage = (value: number | string | null | undefined): string => {
  const amount = Number(value || 0);
  return `${amount.toFixed(1)}%`;
};

export const safeNumber = (value: number | string | null | undefined): number => {
  return Number(value || 0);
};
