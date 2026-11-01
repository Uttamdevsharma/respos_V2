// === User ===
export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'admin' | 'waiter' | 'cashier' | 'kitchen';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  restaurant_id?: string | null;
  restaurant?: Restaurant | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// === Platform & SaaS Types ===
export interface PlatformSettings {
  project_name: string;
  logo_url: string;
  login_image_url?: string;
  support_email: string;
  support_phone: string;
  currency: string;
  currency_symbol: string;
  manual_payment_active: boolean;
  bkash_number: string;
  bkash_type?: string;
  nagad_number: string;
  manual_payment_instruction: string;
  bkash_merchant_active?: boolean;
  bkash_app_key?: string;
  bkash_app_secret?: string;
  bkash_username?: string;
  bkash_password?: string;
  bkash_is_sandbox?: boolean;
  nagad_merchant_active?: boolean;
  nagad_merchant_id?: string;
  nagad_public_key?: string;
  nagad_private_key?: string;
  nagad_is_sandbox?: boolean;
  sslcommerz_active?: boolean;
  sslcommerz_store_id?: string;
  sslcommerz_store_passwd?: string;
  sslcommerz_is_sandbox?: boolean;
  eps_merchant_active?: boolean;
  eps_merchant_id?: string;
  eps_store_id?: string;
  eps_app_key?: string;
  eps_app_secret?: string;
  eps_is_sandbox?: boolean;
  youtube_url?: string;
}

export interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  badge?: string;
  monthly_price: number;
  annual_price: number;
  trial_days: number;
  is_trial_tier?: boolean;
  is_custom_pricing?: boolean;
  contact_phone?: string;
  max_tables: number;
  max_staff: number;
  max_branches: number;
  features: string[];
  is_popular?: boolean;
  is_active: boolean;
}

export type RestaurantStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export interface Restaurant {
  _id: string;
  name: string;
  owner_name: string;
  email: string;
  contact_number: string;
  address: string;
  status: RestaurantStatus;
  plan_id: SubscriptionPlan | any;
  billing_cycle: BillingCycle;
  trade_license_number?: string;
  trade_license_doc?: string;
  nid_number?: string;
  nid_front_doc?: string;
  nid_back_doc?: string;
  payment_method?: string;
  payment_trx_id?: string;
  payment_amount?: number;
  payment_screenshot?: string;
  sender_number?: string;
  rejection_reason?: string;
  subscription_start?: string;
  subscription_end?: string;
  createdAt: string;
  updatedAt: string;
}

// === Auth ===
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// === Table ===
export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface Table {
  _id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  location: string;
  currentOrder?: Order | null;
  occupiedSeats?: number;
  activeOrdersCount?: number;
  createdAt: string;
  updatedAt: string;
}

// === Category ===
export interface Category {
  _id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

// === MenuItem ===
export interface MenuItemOption {
  name: string;
  price: number;
}

export interface MenuItemOptionGroup {
  title: string;
  required?: boolean;
  options: MenuItemOption[];
}

export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: Category | string;
  image?: string | null;
  isAvailable: boolean;
  optionGroups?: MenuItemOptionGroup[];
}

// === Order ===
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'billing' | 'paid' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'mobile';
export type OrderType = 'dine_in' | 'takeaway' | 'foodpanda' | 'pathao' | 'foodi' | 'delivery';

export interface OrderItem {
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  isAddon?: boolean;
  addonBatch?: number;
}

export interface PartialPayment {
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string;
  paidAt: string;
}

export interface SplitPaymentEntry {
  paymentMethod: PaymentMethod;
  amount: number;
  note?: string;
}

export interface Order {
  _id: string;
  token: string;
  table: Table | { _id: string; number: number; capacity: number; location: string };
  waiter: User | { _id: string; name: string };
  items: OrderItem[];
  status: OrderStatus;
  orderType?: OrderType;
  subtotal: number;
  tax: number;
  discount: number;
  serviceCharge: number;
  grandTotal: number;
  seatsOccupied?: number;
  latestAddonBatch?: number;
  // Partial payment support
  partialPayments: PartialPayment[];
  amountPaid: number;
  amountDue: number;
  // Split (multi-method) payment
  splitPayments: SplitPaymentEntry[];
  // Final settlement
  paymentMethod?: PaymentMethod;
  paidAmount?: number;
  returnAmount?: number;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// === Dashboard ===
export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  totalTables: number;
  activeTables: number;
  orderStatus: {
    pending: number;
    preparing: number;
    ready: number;
    completed: number;
  };
  recentOrders: Order[];
  dailySales?: { _id: string; sales: number; orders: number }[];
}

// === Sales Reports ===
export type ReportType = 'daily' | 'date' | 'weekly' | 'monthly' | 'yearly';

export interface SalesReportChartPoint {
  label: string;
  sales: number;
  orders: number;
}

export interface SalesReportTopItem {
  _id: string;
  quantity: number;
  revenue: number;
}

export interface SalesReportPayment {
  _id: string | null;
  count: number;
  total: number;
}

export interface SalesReportChannel {
  _id: OrderType;
  count: number;
  totalSales: number;
}

export interface SalesReportData {
  type: ReportType;
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  chartData: SalesReportChartPoint[];
  topItems: SalesReportTopItem[];
  paymentBreakdown: SalesReportPayment[];
  channelBreakdown?: SalesReportChannel[];
}


// === Settings ===
export interface Settings {
  _id: string;
  restaurantName: string;
  address: string;
  phone: string;
  taxRate: number;
  serviceChargeRate: number;
  currency: string;
  logo?: string;
  loginImage?: string;
  brandColor?: string;
  tagline?: string;
  description?: string;
}

// === API Response ===
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}


// === Support & Live Chat ===
export * from './support';
