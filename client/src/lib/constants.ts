import { OrderStatus } from '../types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  billing: 'Billing',
  paid: 'Paid',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'badge-pending',
  preparing: 'badge-preparing',
  ready: 'badge-ready',
  served: 'badge-served',
  billing: 'badge-preparing',
  paid: 'badge-paid',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
};

export const CURRENCY = '৳';

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: ['admin'] },
  { label: 'Tables', href: '/tables', icon: 'UtensilsCrossed', roles: ['admin', 'waiter'] },
  { label: 'POS', href: '/pos', icon: 'Monitor', roles: ['admin', 'waiter'] },
  { label: 'Kitchen', href: '/kitchen', icon: 'ChefHat', roles: ['admin', 'kitchen'] },
  { label: 'Orders', href: '/orders', icon: 'ClipboardList', roles: ['admin', 'waiter', 'cashier'] },
  { label: 'Billing', href: '/billing', icon: 'Receipt', roles: ['admin', 'cashier'] },
  { label: 'Menu', href: '/menu', icon: 'BookOpen', roles: ['admin'] },
  { label: 'Users', href: '/users', icon: 'Users', roles: ['admin'] },
  { label: 'Settings', href: '/settings', icon: 'Settings', roles: ['admin'] },
] as const;

export const formatCurrency = (amount: number): string => {
  return `${CURRENCY}${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const timeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};
