import { apiService } from './api';
import type { ApiResponse } from './api';

export interface CustomerActivity {
  id: number;
  customer_id: number;
  activity_type: string;
  subject: string;
  description?: string;
  status: string;
  due_date?: string;
  completed_at?: string;
  assigned_to?: number;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerActivityData {
  customer_id: number;
  activity_type: string;
  subject: string;
  description?: string;
  status?: string;
  due_date?: string;
  assigned_to?: number;
}

export const customerActivityService = {
  async createActivity(data: CreateCustomerActivityData): Promise<ApiResponse<CustomerActivity>> {
    return apiService.post('/api/activities', data);
  },

  async getAllActivities(params?: any): Promise<ApiResponse<CustomerActivity[]>> {
    const queryParams = new URLSearchParams(params).toString();
    return apiService.get(`/api/activities${queryParams ? `?${queryParams}` : ''}`);
  },

  async getActivityById(id: number): Promise<ApiResponse<CustomerActivity>> {
    return apiService.get(`/api/activities/${id}`);
  },

  async getActivitiesByCustomerId(customerId: number): Promise<ApiResponse<CustomerActivity[]>> {
    return apiService.get(`/api/activities/customer/${customerId}`);
  },

  async getActivityTimeline(customerId: number): Promise<ApiResponse<CustomerActivity[]>> {
    return apiService.get(`/api/activities/customer/${customerId}/timeline`);
  },

  async updateActivity(id: number, data: Partial<CreateCustomerActivityData>): Promise<ApiResponse<CustomerActivity>> {
    return apiService.put(`/api/activities/${id}`, data);
  },

  async deleteActivity(id: number): Promise<ApiResponse<void>> {
    return apiService.delete(`/api/activities/${id}`);
  },
};
