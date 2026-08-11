import { apiService } from './api';
import type { ApiResponse } from './api';

export interface Inventory {
  id: number;
  product_id: number;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  location?: string;
  warehouse?: string;
  last_stock_update: string;
  created_at: string;
  updated_at: string;
  product_name?: string;
  sku?: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  movement_type: string;
  quantity: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_by?: number;
  created_at: string;
  product_name?: string;
  sku?: string;
}

export const inventoryService = {
  async getAllInventory(): Promise<ApiResponse<Inventory[]>> {
    return apiService.get<Inventory[]>('/api/inventory');
  },

  async getInventoryByProductId(productId: number): Promise<ApiResponse<Inventory>> {
    return apiService.get<Inventory>(`/api/inventory/product/${productId}`);
  },

  async createInventory(data: { product_id: number; quantity?: number; location?: string; warehouse?: string }): Promise<ApiResponse<Inventory>> {
    return apiService.post<Inventory>('/api/inventory', data);
  },

  async updateInventory(id: number, data: Partial<Inventory>): Promise<ApiResponse<Inventory>> {
    return apiService.put<Inventory>(`/api/inventory/${id}`, data);
  },

  async updateStockQuantity(productId: number, quantity: number): Promise<ApiResponse<Inventory>> {
    return apiService.patch<Inventory>(`/api/inventory/product/${productId}/quantity`, { quantity });
  },

  async recordStockMovement(data: {
    product_id: number;
    quantity: number;
    movement_type: 'in' | 'out' | 'adjustment';
    reference_type?: string;
    reference_id?: number;
    notes?: string;
  }): Promise<ApiResponse<void>> {
    return apiService.post<void>('/api/inventory/movements', data);
  },

  async getLowStockProducts(threshold?: number): Promise<ApiResponse<Inventory[]>> {
    const endpoint = threshold ? `/api/inventory/low-stock?threshold=${threshold}` : '/api/inventory/low-stock';
    return apiService.get<Inventory[]>(endpoint);
  },

  async getStockMovements(productId?: number, limit?: number): Promise<ApiResponse<StockMovement[]>> {
    const queryParams = new URLSearchParams();
    if (productId) queryParams.append('productId', productId.toString());
    if (limit) queryParams.append('limit', limit.toString());

    const endpoint = `/api/inventory/movements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<StockMovement[]>(endpoint);
  },

  async deleteInventory(id: number): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/inventory/${id}`);
  },
};
