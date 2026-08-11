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

export const dashboardService = {
  async getStats() {
    return apiService.get<DashboardStats>('/dashboard/stats');
  },

  async getRecentOrders(limit: number = 10) {
    return apiService.get<RecentOrder[]>(`/dashboard/recent-orders?limit=${limit}`);
  },

  async getRecentActivities(limit: number = 10) {
    return apiService.get<RecentActivity[]>(`/dashboard/recent-activities?limit=${limit}`);
  },

  async getOrderStatusSummary() {
    return apiService.get<Record<string, number>>('/dashboard/order-status-summary');
  },
};
