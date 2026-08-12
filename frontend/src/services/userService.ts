import { apiService } from './api';
import type { ApiResponse } from './api';

export interface AppUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'sales' | 'warehouse' | 'accounts';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'sales' | 'warehouse' | 'accounts';
}

export interface UpdateUserPayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'sales' | 'warehouse' | 'accounts';
}

export const userService = {
  async getAllUsers(): Promise<ApiResponse<AppUser[]>> {
    return apiService.get<AppUser[]>('/api/users');
  },

  async getUserById(id: number): Promise<ApiResponse<AppUser>> {
    return apiService.get<AppUser>(`/api/users/${id}`);
  },

  async createUser(data: CreateUserPayload): Promise<ApiResponse<AppUser>> {
    return apiService.post<AppUser>('/api/users', data);
  },

  async updateUser(id: number, data: UpdateUserPayload): Promise<ApiResponse<AppUser>> {
    return apiService.put<AppUser>(`/api/users/${id}`, data);
  },

  async updateUserStatus(id: number, isActive: boolean): Promise<ApiResponse<AppUser>> {
    return apiService.patch<AppUser>(`/api/users/${id}/status`, { is_active: isActive });
  },
};
