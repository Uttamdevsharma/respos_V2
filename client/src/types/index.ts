// === User ===
export type UserRole = 'admin' | 'waiter' | 'cashier' | 'kitchen';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
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
