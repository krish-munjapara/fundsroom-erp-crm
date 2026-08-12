import { formatDate } from '../utils/formatters';

export interface SalesReportExportData {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  pending_order_value?: number;
  pending_orders?: number;
  confirmed_orders?: number;
  orders_by_status?: Record<string, number>;
  revenue_by_month?: Array<{ month: string; revenue: number }>;
  sales_trend?: Array<{ date: string; revenue: number; orders: number }>;
  sales_by_customer?: Array<{
    company_name: string;
    total_orders: number;
    total_revenue: number;
  }>;
  sales_by_product?: Array<{
    product_name: string;
    sku: string;
    total_quantity: number;
    total_revenue: number;
  }>;
}

export function buildDateRangeLabel(startDate: string, endDate: string): string {
  if (startDate && endDate) {
    if (startDate === endDate) {
      return formatDate(startDate);
    }
    return `${formatDate(startDate)} to ${formatDate(endDate)}`;
  }
  if (startDate) return `From ${formatDate(startDate)}`;
  if (endDate) return `Until ${formatDate(endDate)}`;
  return 'All dates';
}
