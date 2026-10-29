import { create } from 'zustand';
import api from '../lib/api';
import { Order } from '../types';

interface BadgeState {
  kitchenCount: number;
  billingCount: number;
  ordersCount: number;
  fetchCounts: () => Promise<void>;
  handleSocketOrderCreated: (order: Order) => void;
  handleSocketOrderUpdated: (order: Order) => void;
}

export const useBadgeStore = create<BadgeState>((set, get) => ({
  kitchenCount: 0,
  billingCount: 0,
  ordersCount: 0,

  fetchCounts: async () => {
    try {
      const { data } = await api.get('/orders');
      if (data.success) {
        const orders = data.data as Order[];
        const kitchen = orders.filter((o) => ['pending', 'preparing'].includes(o.status)).length;
        const billing = orders.filter((o) => ['served', 'billing'].includes(o.status)).length;
        const activeOrders = orders.filter((o) => ['pending', 'preparing', 'ready', 'served', 'billing'].includes(o.status)).length;
        
        set({
          kitchenCount: kitchen,
          billingCount: billing,
          ordersCount: activeOrders,
        });
      }
    } catch (e) {
      console.error('Failed to fetch badge counts:', e);
    }
  },

  handleSocketOrderCreated: (order: Order) => {
    // Re-fetch to ensure counts match DB perfectly
    get().fetchCounts();
  },

  handleSocketOrderUpdated: (order: Order) => {
    get().fetchCounts();
  },
}));
