'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useNotificationStore, NotificationItem } from '../../store/notification.store';
import {
  Bell,
  Search,
  Clock,
  Check,
  X,
  Flame,
  UtensilsCrossed,
  Receipt,
  RotateCw,
  BellOff
} from 'lucide-react';

interface TopbarProps {
  title?: string;
  subtitle?: string;
}

// Simple time-ago formatter
function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'Just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(isoString).toLocaleDateString();
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { user } = useAuthStore();
  const { notifications, markAllAsRead, clearAll } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleBellClick = () => {
    setShowNotifications((prev) => !prev);
    if (!showNotifications) {
      // Proactively mark all as read when opening notifications panel
      markAllAsRead();
    }
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'orderCreated':
        return <UtensilsCrossed size={14} className="text-primary" />;
      case 'orderUpdated':
        return <Flame size={14} className="text-amber-500" />;
      case 'orderPaid':
        return <Receipt size={14} className="text-emerald-500" />;
    }
  };

  const getNotificationBg = (type: NotificationItem['type']) => {
    switch (type) {
      case 'orderCreated':
        return 'bg-primary/10';
      case 'orderUpdated':
        return 'bg-amber-500/10';
      case 'orderPaid':
        return 'bg-emerald-500/10';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/30 h-14 sm:h-16 px-3 sm:px-6 flex justify-between items-center">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {title && (
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-on-surface truncate">{title}</h1>
            {subtitle && <p className="text-[10px] sm:text-xs text-on-surface-variant truncate">{subtitle}</p>}
          </div>
        )}
        <div className="relative hidden lg:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search orders, tables, or menu..."
            className="pl-9 pr-4 py-2 bg-surface-container-low border-none rounded-full w-72 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative">
        {/* Bell Trigger */}
        <button
          onClick={handleBellClick}
          className="relative p-1.5 sm:p-2 hover:bg-surface-container-low rounded-full transition-all press-effect"
        >
          <Bell size={18} className="sm:w-5 sm:h-5 text-on-surface-variant" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-4.5 h-4.5 bg-error text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce shadow-md">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown Drawer */}
        {showNotifications && (
          <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface border border-outline-variant/50 rounded-2xl shadow-2xl flex flex-col z-[100] overflow-hidden animate-scale-in"
          >
            {/* Header */}
            <div className="p-4 bg-surface-container-high border-b border-outline-variant/30 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-on-surface uppercase tracking-wider">Notifications</h3>
                <p className="text-[9px] text-on-surface-variant font-medium mt-0.5">Real-time system updates</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearAll}
                  className="px-2 py-1 hover:bg-surface-container-highest rounded-lg text-[9px] font-bold text-on-surface-variant transition-all hover:text-error"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-surface-container-highest rounded-lg text-on-surface-variant transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/10">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant/40">
                  <BellOff size={32} strokeWidth={1.5} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 flex gap-3 items-start transition-colors hover:bg-surface-container-low ${
                      !n.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl ${getNotificationBg(n.type)} flex items-center justify-center shrink-0 mt-0.5`}>
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface leading-snug break-words">
                        {n.message}
                      </p>
                      <span className="text-[9px] text-on-surface-variant font-medium mt-1 inline-block">
                        {formatTimeAgo(n.timestamp)}
                      </span>
                    </div>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2.5 bg-surface-container-low border-t border-outline-variant/20 text-center">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Showing latest {notifications.length} alerts
                </span>
              </div>
            )}
          </div>
        )}

        {/* Clock In Button */}
        <button className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 border border-primary text-primary rounded-full hover:bg-primary-container/30 transition-all text-[10px] sm:text-xs font-bold">
          <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">Clock In</span>
        </button>

        {/* Profile Avater */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs sm:text-sm ml-0.5 sm:ml-1">
          {user?.name?.[0] || 'U'}
        </div>
      </div>
    </header>
  );
}
