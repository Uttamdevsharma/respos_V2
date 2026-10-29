'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useBadgeStore } from '../../store/badge.store';
import api, { BASE_URL } from '../../lib/api';
import {
  LayoutDashboard, UtensilsCrossed, Monitor, ChefHat, Receipt,
  ClipboardList, BookOpen, Users, Settings, Plus, LogOut, Wallet
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, UtensilsCrossed, Monitor, ChefHat, Receipt,
  ClipboardList, BookOpen, Users, Settings, Wallet
};

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: ['admin'] },
  { label: 'POS', href: '/pos', icon: 'Monitor', roles: ['admin', 'waiter'] },
  { label: 'Kitchen', href: '/kitchen', icon: 'ChefHat', roles: ['admin', 'kitchen'] },
  { label: 'Orders', href: '/orders', icon: 'ClipboardList', roles: ['admin', 'waiter', 'cashier'] },
  { label: 'Billing', href: '/billing', icon: 'Receipt', roles: ['admin', 'cashier'] },
  { label: 'Accounts', href: '/accounts', icon: 'Wallet', roles: ['admin'] },
  { label: 'Menu', href: '/menu', icon: 'BookOpen', roles: ['admin', 'kitchen'] },
  { label: 'Tables', href: '/tables', icon: 'UtensilsCrossed', roles: ['admin', 'waiter'] },
  { label: 'Users', href: '/users', icon: 'Users', roles: ['admin'] },
  { label: 'Settings', href: '/settings', icon: 'Settings', roles: ['admin'] },
];

function imgUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { kitchenCount, billingCount, ordersCount } = useBadgeStore();

  const [restaurantName, setRestaurantName] = useState('GastroFlow POS');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      if (data.success) {
        setRestaurantName(data.data.restaurantName || 'GastroFlow POS');
        setLogoUrl(imgUrl(data.data.logo));
      }
    }).catch(() => {});
  }, []);

  const filteredNav = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

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
    <aside className="fixed left-0 top-0 h-full flex flex-col py-6 z-40 bg-surface border-r border-outline-variant w-64 hidden md:flex">
      {/* Brand */}
      <div className="px-6 mb-6 flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={restaurantName}
            className="w-10 h-10 object-contain rounded-xl border border-outline-variant shadow-sm shrink-0"
          />
        ) : (
          <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center shrink-0">
            <span className="text-primary-dark font-black text-lg">
              {restaurantName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-base font-black text-primary-dark truncate">{restaurantName}</h1>
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold truncate">
            {user?.name || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {filteredNav.map((item) => {
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
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
              {renderBadge(item.label)}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 mt-auto pt-4">
        <Link
          href="/pos"
          className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 press-effect transition-all text-sm"
        >
          <Plus size={18} />
          New Order
        </Link>

        <button
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          className="w-full mt-3 py-2.5 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-lg flex items-center justify-center gap-2 transition-all text-sm font-medium"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
