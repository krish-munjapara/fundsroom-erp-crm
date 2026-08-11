import { apiService } from './api';
import type { ApiResponse } from './api';

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  base_price: number;
  selling_price: number;
  tax_rate: number;
  hsn_code?: string;
  is_active: boolean;
  reorder_level: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  base_price: number;
  selling_price: number;
  tax_rate?: number;
  hsn_code?: string;
  reorder_level?: number;
}

export const productService = {
  async getAllProducts(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<Product[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<Product[]>(endpoint);
  },

  async getActiveProducts(): Promise<ApiResponse<Product[]>> {
    return apiService.get<Product[]>('/products/active');
  },

  async getProductById(id: number): Promise<ApiResponse<Product>> {
    return apiService.get<Product>(`/products/${id}`);
  },

  async createProduct(data: CreateProductData): Promise<ApiResponse<Product>> {
    return apiService.post<Product>('/products', data);
  },

  async updateProduct(id: number, data: Partial<CreateProductData>): Promise<ApiResponse<Product>> {
    return apiService.put<Product>(`/products/${id}`, data);
  },

  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/products/${id}`);
  },
};
