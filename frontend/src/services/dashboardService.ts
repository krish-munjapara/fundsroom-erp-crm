import { apiService } from './api';

export const dashboardService = {
  async getStats() {
    return apiService.get('/dashboard/stats');
  },

  async getRecentOrders(limit: number = 10) {
    return apiService.get(`/dashboard/recent-orders?limit=${limit}`);
  },

  async getRecentActivities(limit: number = 10) {
    return apiService.get(`/dashboard/recent-activities?limit=${limit}`);
  },

  async getOrderStatusSummary() {
    return apiService.get('/dashboard/order-status-summary');
  },
};
