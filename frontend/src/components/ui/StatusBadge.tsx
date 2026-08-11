interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
    active: { label: 'Active', variant: 'success' },
    inactive: { label: 'Inactive', variant: 'neutral' },
    pending: { label: 'Pending', variant: 'warning' },
    confirmed: { label: 'Confirmed', variant: 'info' },
    processing: { label: 'Processing', variant: 'info' },
    shipped: { label: 'Shipped', variant: 'info' },
    delivered: { label: 'Delivered', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'danger' },
    healthy: { label: 'Healthy', variant: 'success' },
    low_stock: { label: 'Low Stock', variant: 'warning' },
    out_of_stock: { label: 'Out of Stock', variant: 'danger' },
  };

  const config = statusConfig[status.toLowerCase()] || { label: status, variant: 'neutral' as const };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
      config.variant === 'success' ? 'bg-success-100 text-success-800' :
      config.variant === 'warning' ? 'bg-warning-100 text-warning-800' :
      config.variant === 'danger' ? 'bg-danger-100 text-danger-800' :
      config.variant === 'info' ? 'bg-primary-100 text-primary-800' :
      'bg-navy-100 text-navy-800'
    }`}>
      {config.label}
    </span>
  );
}
