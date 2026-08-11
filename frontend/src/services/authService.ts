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
  message?: string;
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
    const response = await apiService.post<{ user: any; token: string }>('/auth/login', data);
    if (response.success && response.data?.token) {
      apiService.setToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return { success: true, message: 'Login successful', data: response.data };
    }
    return { success: false, message: 'Login failed', data: { user: {} as any, token: '' } };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<{ user: any; token: string }>('/auth/register', data);
    if (response.success && response.data?.token) {
      apiService.setToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return { success: true, message: 'Registration successful', data: response.data };
    }
    return { success: false, message: 'Registration failed', data: { user: {} as any, token: '' } };
  },

  async getProfile(): Promise<ApiResponse<any>> {
    return apiService.get('/auth/profile');
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
