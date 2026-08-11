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

export type UserRole = 'admin' | 'sales' | 'warehouse' | 'accounts';

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
  customer_type: 'retail' | 'wholesale' | 'distributor';
  status: 'lead' | 'active' | 'inactive';
  follow_up_date?: Date;
  credit_limit: number;
  current_balance: number;
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
  customer_type?: 'retail' | 'wholesale' | 'distributor';
  status?: 'lead' | 'active' | 'inactive';
  follow_up_date?: string;
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
  customer_type?: 'retail' | 'wholesale' | 'distributor';
  status?: 'lead' | 'active' | 'inactive';
  follow_up_date?: string;
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
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  location: string;
  warehouse?: string;
  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  location: string;
  warehouse?: string;
  is_active?: boolean;
}

export interface UpdateProductDto {
  sku?: string;
  name?: string;
  description?: string;
  category?: string;
  unit_price?: number;
  minimum_stock?: number;
  location?: string;
  warehouse?: string;
  is_active?: boolean;
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
  movement_type: 'in' | 'out';
  reference_type?: string;
  reference_id?: number;
  notes: string;
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
  notes?: string;
  items?: OrderItemDto[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name?: string;
  sku?: string;
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

// Customer Activity Types
export interface CustomerActivity {
  id: number;
  customer_id: number;
  activity_type: string;
  subject: string;
  description?: string;
  status: string;
  due_date?: Date;
  completed_at?: Date;
  assigned_to?: number;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCustomerActivityDto {
  customer_id: number;
  activity_type: string;
  subject: string;
  description?: string;
  status?: string;
  due_date?: Date;
  assigned_to?: number;
  created_by?: number;
}

export interface UpdateCustomerActivityDto {
  id?: number;
  activity_type?: string;
  subject?: string;
  description?: string;
  status?: string;
  due_date?: Date;
  completed_at?: Date;
  assigned_to?: number;
  updated_by?: number;
}

// Dashboard Statistics Types
export interface DashboardStats {
  total_customers: number;
  total_products: number;
  total_orders: number;
  total_sales: number;
  low_stock_count: number;
  pending_orders: number;
  confirmed_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
}

export interface RecentOrder {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  order_date: Date;
}

export interface RecentActivity {
  id: number;
  customer_name: string;
  activity_type: string;
  subject: string;
  status: string;
  created_at: Date;
}

// Report Filter Types
export interface ReportFilters {
  start_date?: Date;
  end_date?: Date;
  customer_id?: number;
  product_id?: number;
  status?: string;
  activity_type?: string;
}

// Report Result Types
export interface SalesReport {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  pending_order_value?: number;
  pending_orders: number;
  confirmed_orders: number;
  orders_by_status: Record<string, number>;
  revenue_by_month: Array<{ month: string; revenue: number }>;
  sales_trend: Array<{ date: string; revenue: number; orders: number }>;
  sales_by_customer: Array<{
    customer_id: number;
    company_name: string;
    total_orders: number;
    total_revenue: number;
  }>;
  sales_by_product: Array<{
    product_id: number;
    product_name: string;
    sku: string;
    total_quantity: number;
    total_revenue: number;
  }>;
}

export interface CustomerReport {
  total_customers: number;
  active_customers: number;
  total_credit_limit: number;
  top_customers: Array<{
    customer_id: number;
    company_name: string;
    total_orders: number;
    total_spent: number;
  }>;
}

export interface ProductPerformanceReport {
  total_products: number;
  active_products: number;
  top_selling_products: Array<{
    product_id: number;
    product_name: string;
    sku: string;
    total_quantity_sold: number;
    total_revenue: number;
  }>;
}

export interface InventoryReport {
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_inventory_value: number;
  stock_summary: Array<{
    product_id: number;
    product_name: string;
    sku: string;
    quantity: number;
    available_quantity: number;
    value: number;
  }>;
}

export interface StockMovementSummary {
  total_movements: number;
  stock_in: number;
  stock_out: number;
  movements_by_type: Record<string, number>;
  recent_movements: Array<{
    id: number;
    product_name: string;
    sku: string;
    movement_type: string;
    quantity: number;
    created_at: Date;
  }>;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
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

// Challan Types
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
  created_at: Date;
  updated_at: Date;
  confirmed_at?: Date;
  cancelled_at?: Date;
  customer?: Customer;
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
  created_at: Date;
}

export interface CreateChallanDto {
  customer_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  notes?: string;
}

export interface UpdateChallanDto {
  customer_id?: number;
  items?: Array<{
    product_id: number;
    quantity: number;
  }>;
  notes?: string;
}

export interface ConfirmChallanDto {
  // No additional fields needed for confirmation
}
