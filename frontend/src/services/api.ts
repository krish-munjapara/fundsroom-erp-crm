const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiService {
  private onUnauthorized?: () => void;

  setUnauthorizedHandler(handler: () => void): void {
    this.onUnauthorized = handler;
  }

  private handleUnauthorized(): void {
    this.removeToken();
    localStorage.removeItem('user');
    this.onUnauthorized?.();
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (response.status === 401) {
      this.handleUnauthorized();
      return { success: false, message: 'Session expired. Please sign in again.' };
    }

    if (response.status === 304) {
      return { success: true, data: undefined };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ success: false, message: 'Request failed' }));
      return errorData;
    }

    return response.json();
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(API_URL + endpoint, {
      method: 'GET',
      headers: this.getHeaders(),
      cache: 'no-store',
    });

    return this.parseResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await fetch(API_URL + endpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.parseResponse<T>(response);
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await fetch(API_URL + endpoint, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.parseResponse<T>(response);
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await fetch(API_URL + endpoint, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.parseResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(API_URL + endpoint, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.parseResponse<T>(response);
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeToken(): void {
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const apiService = new ApiService();
