export const formatCurrency = (value: number | string | null | undefined): string => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const safeNumber = (value: number | string | null | undefined): number => {
  return Number(value || 0);
};
