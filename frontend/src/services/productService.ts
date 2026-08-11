import { apiService } from './api';
import type { ApiResponse } from './api';

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  location: string;
  warehouse?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  location: string;
  warehouse?: string;
  is_active?: boolean;
}

export interface UpdateProductData {
  sku?: string;
  name?: string;
  description?: string;
  category?: string;
  unit_price?: number;
  minimum_stock?: number;
  location?: string;
  warehouse?: string;
  is_active?: boolean;
}

export const productService = {
  async getAllProducts(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<Product[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<Product[]>(endpoint);
  },

  async getActiveProducts(): Promise<ApiResponse<Product[]>> {
    return apiService.get<Product[]>('/api/products/active');
  },

  async getProductById(id: number): Promise<ApiResponse<Product>> {
    return apiService.get<Product>(`/api/products/${id}`);
  },

  async createProduct(data: CreateProductData): Promise<ApiResponse<Product>> {
    return apiService.post<Product>('/api/products', data);
  },

  async updateProduct(id: number, data: Partial<UpdateProductData>): Promise<ApiResponse<Product>> {
    return apiService.put<Product>(`/api/products/${id}`, data);
  },

  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/products/${id}`);
  },

  async adjustStock(productId: number, data: { quantity: number; movement_type: 'in' | 'out'; notes: string }): Promise<ApiResponse<Product>> {
    return apiService.patch<Product>(`/api/products/${productId}/adjust-stock`, data);
  },
};
