import { apiService } from './api';
import type { ApiResponse } from './api';

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  order_date: string;
  delivery_date?: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_contact?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_tax_id?: string;
  created_by_name?: string;
  total_items?: number;
  total_quantity?: number;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_amount: number;
  subtotal: number;
  total_amount: number;
  line_total?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderData {
  customer_id: number;
  order_date?: string;
  delivery_date?: string;
  notes?: string;
  items: {
    product_id: number;
    quantity: number;
    unit_price?: number;
    tax_rate?: number;
    item_discount_amount?: number;
  }[];
}

export interface OrderStats {
  total_orders: string | number;
  pending_orders: string | number;
  confirmed_orders: string | number;
  delivered_orders: string | number;
  total_revenue: string | number;
}

export const orderService = {
  async getAllOrders(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<Order[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    const endpoint = `/api/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<Order[]>(endpoint);
  },

  async getOrderById(id: number): Promise<ApiResponse<Order>> {
    return apiService.get<Order>(`/api/orders/${id}`);
  },

  async getOrderByOrderNumber(orderNumber: string): Promise<ApiResponse<Order>> {
    return apiService.get<Order>(`/api/orders/number/${orderNumber}`);
  },

  async getOrdersByCustomerId(customerId: number): Promise<ApiResponse<Order[]>> {
    return apiService.get<Order[]>(`/api/orders/customer/${customerId}`);
  },

  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    return apiService.post<Order>('/api/orders', data);
  },

  async updateOrder(id: number, data: CreateOrderData): Promise<ApiResponse<Order>> {
    return apiService.put<Order>(`/api/orders/${id}`, data);
  },

  async confirmOrder(id: number): Promise<ApiResponse<Order>> {
    return apiService.post<Order>(`/api/orders/${id}/confirm`, {});
  },

  async updateOrderStatus(id: number, status: string): Promise<ApiResponse<Order>> {
    return apiService.patch<Order>(`/api/orders/${id}/status`, { status });
  },

  async deleteOrder(id: number): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/orders/${id}`);
  },

  async getOrderStats(): Promise<ApiResponse<OrderStats>> {
    return apiService.get<OrderStats>('/api/orders/stats');
  },
};
