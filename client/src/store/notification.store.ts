import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  message: string;
  type: 'orderCreated' | 'orderUpdated' | 'orderPaid';
  timestamp: string; // ISO string to keep it serializable / stable
  read: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (message: string, type: NotificationItem['type']) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (message, type) => {
    const newItem: NotificationItem = {
      id: Math.random().toString(36).substring(7),
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };
    set((state) => ({
      notifications: [newItem, ...state.notifications],
    }));
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
  clearAll: () => {
    set({ notifications: [] });
  },
}));
