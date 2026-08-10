export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: Omit<User, 'password_hash'>;
    token: string;
  };
}

export type UserRole = 'admin' | 'manager' | 'user';

// Customer Types
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
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCustomerDto {
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

export interface UpdateCustomerDto {
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tax_id?: string;
  credit_limit?: number;
  current_balance?: number;
  is_active?: boolean;
  notes?: string;
}

// Product Types
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
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductDto {
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

export interface UpdateProductDto {
  sku?: string;
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  base_price?: number;
  selling_price?: number;
  tax_rate?: number;
  hsn_code?: string;
  is_active?: boolean;
  reorder_level?: number;
}

// Inventory Types
export interface Inventory {
  id: number;
  product_id: number;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  location?: string;
  warehouse?: string;
  last_stock_update: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInventoryDto {
  product_id: number;
  quantity: number;
  location?: string;
  warehouse?: string;
}

export interface UpdateInventoryDto {
  quantity?: number;
  reserved_quantity?: number;
  location?: string;
  warehouse?: string;
}

export interface StockMovementDto {
  product_id: number;
  quantity: number;
  movement_type: 'in' | 'out' | 'adjustment';
  reference_type?: string;
  reference_id?: number;
  notes?: string;
}

// Order Types
export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  order_date: Date;
  delivery_date?: Date;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrderDto {
  customer_id: number;
  order_date?: Date;
  delivery_date?: Date;
  status?: string;
  notes?: string;
  items: OrderItemDto[];
}

export interface UpdateOrderDto {
  customer_id?: number;
  order_date?: Date;
  delivery_date?: Date;
  status?: string;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  notes?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_amount: number;
  subtotal: number;
  total_amount: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemDto {
  product_id: number;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  item_discount_amount?: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
