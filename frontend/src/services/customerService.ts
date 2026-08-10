import { apiService } from './api';
import type { ApiResponse } from './api';

export interface Customer {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  tax_id?: string;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerData {
  company_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tax_id?: string;
  credit_limit?: number;
  notes?: string;
}

export const customerService = {
  async getAllCustomers(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<Customer[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/api/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<Customer[]>(endpoint);
  },

  async getCustomerById(id: number): Promise<ApiResponse<Customer>> {
    return apiService.get<Customer>(`/api/customers/${id}`);
  },

  async createCustomer(data: CreateCustomerData): Promise<ApiResponse<Customer>> {
    return apiService.post<Customer>('/api/customers', data);
  },

  async updateCustomer(id: number, data: Partial<CreateCustomerData>): Promise<ApiResponse<Customer>> {
    return apiService.put<Customer>(`/api/customers/${id}`, data);
  },

  async deleteCustomer(id: number): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/customers/${id}`);
  },

  async deactivateCustomer(id: number): Promise<ApiResponse<Customer>> {
    return apiService.patch<Customer>(`/api/customers/${id}/deactivate`, {});
  },
};
