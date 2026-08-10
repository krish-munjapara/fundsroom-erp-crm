import { apiService } from './api';
import type { ApiResponse } from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    };
    token: string;
  };
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/api/auth/login', data);
    if (response.success && response.data?.data?.token) {
      apiService.setToken(response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      return response.data;
    }
    return response.data || { success: false, message: 'Login failed' };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/api/auth/register', data);
    if (response.success && response.data?.data?.token) {
      apiService.setToken(response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      return response.data;
    }
    return response.data || { success: false, message: 'Registration failed' };
  },

  async getProfile(): Promise<ApiResponse<any>> {
    return apiService.get('/api/auth/profile');
  },

  logout() {
    apiService.removeToken();
    localStorage.removeItem('user');
  },

  isAuthenticated() {
    return apiService.isAuthenticated();
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
