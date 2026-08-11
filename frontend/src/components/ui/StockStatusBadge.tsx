interface StockStatusBadgeProps {
  currentStock: number;
  minimumStock: number;
}

export default function StockStatusBadge({ currentStock, minimumStock }: StockStatusBadgeProps) {
  if (currentStock <= 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-700 border border-danger-200">
        Out of Stock
      </span>
    );
  }
  if (currentStock <= minimumStock) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 border border-warning-200">
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-700 border border-success-200">
      In Stock
    </span>
  );
}
