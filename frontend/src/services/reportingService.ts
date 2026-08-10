import { apiService } from './api';

export const reportingService = {
  async getSalesReport(filters?: any) {
    const params = new URLSearchParams(filters as any).toString();
    return apiService.get(`/reports/sales${params ? `?${params}` : ''}`);
  },

  async getCustomerReport(filters?: any) {
    const params = new URLSearchParams(filters as any).toString();
    return apiService.get(`/reports/customers${params ? `?${params}` : ''}`);
  },

  async getProductPerformanceReport(filters?: any) {
    const params = new URLSearchParams(filters as any).toString();
    return apiService.get(`/reports/products${params ? `?${params}` : ''}`);
  },

  async getInventoryReport(filters?: any) {
    const params = new URLSearchParams(filters as any).toString();
    return apiService.get(`/reports/inventory${params ? `?${params}` : ''}`);
  },

  async getStockMovementSummary(productId?: number) {
    const params = productId ? `?product_id=${productId}` : '';
    return apiService.get(`/reports/stock-movements${params}`);
  },

  async getProductStockStatus() {
    return apiService.get('/reports/stock-status');
  },
};
