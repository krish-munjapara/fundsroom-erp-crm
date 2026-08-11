import { apiService } from './api';
import type { ApiResponse } from './api';

export interface Challan {
  id: number;
  challan_number: string;
  customer_id: number;
  status: 'draft' | 'confirmed' | 'cancelled';
  total_items: number;
  total_quantity: number;
  total_amount: number;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  cancelled_at?: string;
  customer_name?: string;
  customer_contact?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  items?: ChallanItem[];
}

export interface ChallanItem {
  id: number;
  challan_id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  total: number;
  created_at: string;
}

export interface CreateChallanData {
  customer_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  notes?: string;
}

export interface UpdateChallanData {
  customer_id?: number;
  items?: Array<{
    product_id: number;
    quantity: number;
  }>;
  notes?: string;
}

export const challanService = {
  async getAllChallans(params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<ApiResponse<Challan[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    const endpoint = `/api/challans${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<Challan[]>(endpoint);
  },

  async getChallanById(id: number): Promise<ApiResponse<Challan>> {
    return apiService.get<Challan>(`/api/challans/${id}`);
  },

  async createChallan(data: CreateChallanData): Promise<ApiResponse<Challan>> {
    return apiService.post<Challan>('/api/challans', data);
  },

  async updateChallan(id: number, data: UpdateChallanData): Promise<ApiResponse<Challan>> {
    return apiService.put<Challan>(`/api/challans/${id}`, data);
  },

  async confirmChallan(id: number): Promise<ApiResponse<Challan>> {
    return apiService.post<Challan>(`/api/challans/${id}/confirm`, {});
  },

  async cancelChallan(id: number): Promise<ApiResponse<Challan>> {
    return apiService.post<Challan>(`/api/challans/${id}/cancel`, {});
  },

  async deleteChallan(id: number): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/challans/${id}`);
  },
};
