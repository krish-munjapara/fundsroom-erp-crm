import { apiService } from './api';

function buildQueryString(filters?: Record<string, string | number | undefined>): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const reportingService = {
  async getSalesReport(filters?: Record<string, string>) {
    return apiService.get(`/api/reports/sales${buildQueryString(filters)}`);
  },

  async getCustomerReport(filters?: Record<string, string>) {
    return apiService.get(`/api/reports/customers${buildQueryString(filters)}`);
  },

  async getProductPerformanceReport(filters?: Record<string, string>) {
    return apiService.get(`/api/reports/products${buildQueryString(filters)}`);
  },

  async getInventoryReport(filters?: Record<string, string>) {
    return apiService.get(`/api/reports/inventory${buildQueryString(filters)}`);
  },

  async getStockMovementSummary(productId?: number) {
    const params = productId ? `?product_id=${productId}` : '';
    return apiService.get(`/api/reports/stock-movements${params}`);
  },

  async getProductStockStatus() {
    return apiService.get('/api/reports/stock-status');
  },
};
