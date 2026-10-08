export type UserRole = "student" | "staff" | "cafe_staff" | "admin";
export type CafeStaffRole = "staff" | "manager";
export type OrderStatus =
  | "not_paid"
  | "paid"
  | "preparing"
  | "ready"
  | "collected"
  | "cancelled";

export type PaymentMethod = "card" | "cash" | "upi";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  cafeterias?: Array<{
    assignment_id: number;
    cafeteria_id: number;
    cafeteria_name: string;
    role: CafeStaffRole;
  }>;
}

export interface Cafeteria {
  id: number;
  name: string;
  image?: string | null;
  location: string;
  is_open: boolean;
  is_active: boolean;
  manager_id?: number | null;
  payment_instructions?: string | null;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
}

export interface MasterItem {
  id: number;
  name: string;
  description?: string | null;
  category_id: number;
  category_name?: string;
  price: number;
  image?: string | null;
  is_active: boolean;
}

export interface MenuItem {
  cafeteria_id: number;
  item_id: number;
  name: string;
  description?: string | null;
  category_id: number;
  category_name?: string;
  price: number;
  image?: string | null;
  stock: number;
  is_available: boolean;
  reorder_level: number;
  last_updated?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface OrderItem {
  id?: number;
  item_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface OrderPayment {
  id: number;
  order_id: number;
  payment_method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transaction_id?: string | null;
  staff_note?: string | null;
  verified_by?: number | null;
  verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  cafeteria_name?: string;
  payment_instructions?: string | null;
}

export interface OrderQueueInfo {
  queue_item_id: number;
  position: number;
  orders_ahead: number;
}

export interface Order {
  id: number;
  user_id: number;
  cafeteria_id: number;
  cafeteria_name: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  pickup_time: string;
  customer_name?: string;
  customer_email?: string;
  items?: OrderItem[];
  payment?: OrderPayment | null;
  queue?: OrderQueueInfo | null;
}

export interface QueueEntry {
  queue_item_id: number;
  order_id: number;
  position: number;
  customer_name: string;
  total_amount: number;
  status: OrderStatus;
  pickup_time: string;
  created_at: string;
}

export interface AnalyticsSummary {
  date: string;
  total_orders: number;
  total_revenue: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
