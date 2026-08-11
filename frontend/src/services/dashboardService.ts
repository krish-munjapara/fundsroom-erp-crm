import { apiService } from './api';

interface DashboardStats {
  total_customers: number;
  total_products: number;
  total_orders: number;
  total_sales: number;
  low_stock_count: number;
  pending_orders: number;
  confirmed_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  order_date: string;
}

interface RecentActivity {
  id: number;
  customer_name: string;
  activity_type: string;
  subject: string;
  status: string;
  created_at: string;
}

interface SalesTrendItem {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  id: number;
  name: string;
  sku: string;
  units_sold: number;
  revenue: number;
}

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  needed: number;
}

export const dashboardService = {
  async getStats(period: string = 'all') {
    return apiService.get<DashboardStats>(`/api/dashboard/stats?period=${period}`);
  },

  async getRecentOrders(limit: number = 10) {
    return apiService.get<RecentOrder[]>(`/api/dashboard/recent-orders?limit=${limit}`);
  },

  async getRecentActivities(limit: number = 10) {
    return apiService.get<RecentActivity[]>(`/api/dashboard/recent-activities?limit=${limit}`);
  },

  async getOrderStatusSummary() {
    return apiService.get<Record<string, number>>('/api/dashboard/order-status-summary');
  },

  async getSalesTrend(period: string = 'month') {
    return apiService.get<SalesTrendItem[]>(`/api/dashboard/sales-trend?period=${period}`);
  },

  async getTopProducts(limit: number = 5) {
    return apiService.get<TopProduct[]>(`/api/dashboard/top-products?limit=${limit}`);
  },

  async getLowStockProducts(limit: number = 10) {
    return apiService.get<LowStockProduct[]>(`/api/dashboard/low-stock-products?limit=${limit}`);
  },
};
