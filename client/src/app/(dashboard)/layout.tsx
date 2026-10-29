'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/auth.store';
import Sidebar from '../../components/layout/sidebar';
import { Menu, X, LogOut, LayoutDashboard, UtensilsCrossed, Monitor, ChefHat, ClipboardList, Receipt, BookOpen, Users, Settings as SettingsIcon, Wallet } from 'lucide-react';
import Link from 'next/link';
import { socket } from '../../lib/socket';
import { useNotificationStore } from '../../store/notification.store';
import { useBadgeStore } from '../../store/badge.store';
import { playSound } from '../../lib/sound';
import api from '../../lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { loadFromStorage, isAuthenticated, isHydrated, user, logout } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { kitchenCount, billingCount, ordersCount } = useBadgeStore();
  const [checking, setChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('GastroFlow POS');

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Load branding for mobile header / drawer
  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      if (data.success) setRestaurantName(data.data.restaurantName || 'GastroFlow POS');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      socket.connect();
      
      // Fetch initial badge counts
      useBadgeStore.getState().fetchCounts();

      // Listen to real-time events to push to NotificationStore globally
      const handleOrderCreated = (order: any) => {
        // Update badges for everyone
        useBadgeStore.getState().handleSocketOrderCreated(order);

        // Role-based notification: only Admin and Kitchen get notified of new orders
        const isKitchenOrAdmin = user && ['admin', 'kitchen'].includes(user.role);
        if (isKitchenOrAdmin) {
          const qty = order.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
          addNotification(`New Order #${order.token} (${qty} Item${qty !== 1 ? 's' : ''}) submitted!`, 'orderCreated');
          
          // Play Chime sound
          playSound.playChime();
        }
      };

      const handleOrderUpdated = (order: any) => {
        // Update badges for everyone
        useBadgeStore.getState().handleSocketOrderUpdated(order);

        if (!user) return;

        const qty = order.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
        const orderWaiterId = typeof order.waiter === 'object' ? order.waiter?._id : order.waiter;
        const isMyOrder = orderWaiterId === user._id;

        // Role-based notification routing
        if (user.role === 'admin') {
          // Admin gets everything
          if (order.status === 'ready') {
            addNotification(`Order #${order.token} (${qty} Item${qty !== 1 ? 's' : ''}) is READY to serve!`, 'orderUpdated');
            playSound.playChime();
          } else if (['completed', 'paid'].includes(order.status)) {
            addNotification(`Order #${order.token} (${qty} Item${qty !== 1 ? 's' : ''}) payment settled!`, 'orderPaid');
            playSound.playSuccess();
          } else {
            addNotification(`Order #${order.token} updated to ${order.status.toUpperCase()}`, 'orderUpdated');
            playSound.playBeep();
          }
        } 
        else if (user.role === 'waiter') {
          // Waiter only gets notifications for their own orders
          if (isMyOrder) {
            if (order.status === 'ready') {
              addNotification(`Your Order #${order.token} (${qty} Item${qty !== 1 ? 's' : ''}) is READY to serve!`, 'orderUpdated');
              playSound.playChime();
            } else if (order.status === 'preparing') {
              addNotification(`Your Order #${order.token} (${qty} Item${qty !== 1 ? 's' : ''}) is now PREPARING`, 'orderUpdated');
              playSound.playBeep();
            } else if (order.status === 'cancelled') {
              addNotification(`Your Order #${order.token} has been CANCELLED`, 'orderUpdated');
              playSound.playBeep();
            }
          }
        } 
        else if (user.role === 'cashier') {
          // Cashier gets ready-for-billing notifications (served/billing) and payment settlements
          if (['served', 'billing'].includes(order.status)) {
            addNotification(`Table T-${((order.table as any)?.number || 0).toString().padStart(2, '0')} ready for billing!`, 'orderUpdated');
            playSound.playChime();
          } else if (['completed', 'paid'].includes(order.status)) {
            addNotification(`Order #${order.token} (${qty} Item${qty !== 1 ? 's' : ''}) payment settled!`, 'orderPaid');
            playSound.playSuccess();
          }
        } 
        else if (user.role === 'kitchen') {
          // Kitchen only gets notified if an active kitchen order is cancelled or updated (items change)
          if (order.status === 'cancelled') {
            addNotification(`Order #${order.token} has been CANCELLED`, 'orderUpdated');
            playSound.playBeep();
          }
        }
      };

      socket.on('orderCreated', handleOrderCreated);
      socket.on('orderUpdated', handleOrderUpdated);

      return () => {
        socket.off('orderCreated', handleOrderCreated);
        socket.off('orderUpdated', handleOrderUpdated);
        socket.disconnect();
      };
    }
  }, [isAuthenticated, addNotification, user]);


  useEffect(() => {
    if (isHydrated) {
      setChecking(false);
    }
  }, [isHydrated]);

  useEffect(() => {
    const hasStoredSession = typeof window !== 'undefined' && !!localStorage.getItem('gastroflow_token');

    if (!checking && !isAuthenticated && !hasStoredSession) {
      router.replace('/login');
    }
  }, [checking, isAuthenticated, router]);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (checking || !isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant text-sm font-medium">Verifying Session...</p>
        </div>
      </div>
    );
  }

  // Icons matching constants key
  const iconMap: Record<string, React.ElementType> = {
    LayoutDashboard,
    UtensilsCrossed,
    Monitor,
    ChefHat,
    ClipboardList,
    Receipt,
    BookOpen,
    Users,
    Settings: SettingsIcon,
    Wallet
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: ['admin'] },
    { label: 'Tables', href: '/tables', icon: 'UtensilsCrossed', roles: ['admin', 'waiter'] },
    { label: 'POS', href: '/pos', icon: 'Monitor', roles: ['admin', 'waiter'] },
    { label: 'Kitchen', href: '/kitchen', icon: 'ChefHat', roles: ['admin', 'kitchen'] },
    { label: 'Orders', href: '/orders', icon: 'ClipboardList', roles: ['admin', 'waiter', 'cashier'] },
    { label: 'Billing', href: '/billing', icon: 'Receipt', roles: ['admin', 'cashier'] },
    { label: 'Accounts', href: '/accounts', icon: 'Wallet', roles: ['admin'] },
    { label: 'Menu', href: '/menu', icon: 'BookOpen', roles: ['admin', 'kitchen'] },
    { label: 'Users', href: '/users', icon: 'Users', roles: ['admin'] },
    { label: 'Settings', href: '/settings', icon: 'Settings', roles: ['admin'] },
  ];

  const renderBadge = (label: string) => {
    if (label === 'Kitchen' && kitchenCount > 0) {
      return (
        <span className="ml-auto bg-error text-white font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse shadow-sm">
          {kitchenCount}
        </span>
      );
    }
    if (label === 'Billing' && billingCount > 0) {
      return (
        <span className="ml-auto bg-amber-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse shadow-sm">
          {billingCount}
        </span>
      );
    }
    if (label === 'Orders' && ordersCount > 0) {
      return (
        <span className="ml-auto bg-primary text-on-primary font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
          {ordersCount}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col md:flex-row">
      {/* Desktop Sidebar (visible on md+) */}
      <Sidebar />

      {/* Mobile Top Bar Header (visible on <md) */}
      <header className="md:hidden h-16 bg-surface border-b border-outline-variant/30 flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 hover:bg-surface-container-high rounded-xl text-on-surface-variant transition-all press-effect"
          >
            <Menu size={22} />
          </button>
          <span className="text-base font-black text-primary-dark">{restaurantName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-surface-container text-on-surface text-[10px] font-black rounded-lg uppercase tracking-wider">
            {user?.role}
          </span>
        </div>
      </header>

      {/* Mobile Drawer (visible on <md when open) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop mask */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Drawer Content */}
          <div className="relative w-64 bg-surface h-full flex flex-col py-6 shadow-2xl z-50 transition-transform duration-300">
            {/* Header / Brand */}
            <div className="px-6 mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-lg font-black text-primary-dark">{restaurantName}</h1>
                <p className="text-[10px] text-on-surface-variant mt-0.5">Active: {user?.name || 'Unknown'}</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
              {navItems
                .filter(item => user ? item.roles.includes(user.role) : false)
                .map((item) => {
                  const Icon = iconMap[item.icon];
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 py-3 px-4 mx-4 rounded-lg transition-all duration-200 press-effect text-sm font-semibold ${isActive
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                    >
                      {Icon && <Icon size={18} />}
                      <span>{item.label}</span>
                      {renderBadge(item.label)}
                    </Link>
                  );
                })}
            </nav>

            {/* Logout button at bottom of mobile drawer */}
            <div className="px-4 mt-auto">
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                className="w-full py-2.5 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-lg flex items-center justify-center gap-2 transition-all text-sm font-medium"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Space */}
      <div className="flex-1 md:pl-64 flex flex-col h-screen overflow-hidden">
        {children}
      </div>
    </div>
  );
}
