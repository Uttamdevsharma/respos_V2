import { create } from 'zustand';
import { OrderItem } from '../types';

interface OrderState {
  items: OrderItem[];
  selectedTableId: string | null;
  addItem: (item: Omit<OrderItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, delta: number) => void;
  updateNote: (index: number, notes: string) => void;
  setTable: (tableId: string | null) => void;
  clearOrder: () => void;
  getSubtotal: () => number;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  items: [],
  selectedTableId: null,

  addItem: (item) => {
    const { items } = get();
    const addQty = item.quantity || 1;
    const existingIndex = items.findIndex(
      (i) => i.menuItem === item.menuItem && i.name === item.name && (i.notes || '') === (item.notes || '')
    );
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + addQty,
      };
      set({ items: updated });
    } else {
      set({ items: [...items, { ...item, quantity: addQty }] });
    }
  },

  removeItem: (index) => {
    set({ items: get().items.filter((_, i) => i !== index) });
  },

  updateQuantity: (index, delta) => {
    const items = [...get().items];
    items[index] = { ...items[index], quantity: items[index].quantity + delta };
    if (items[index].quantity <= 0) {
      items.splice(index, 1);
    }
    set({ items });
  },

  updateNote: (index, notes) => {
    const items = [...get().items];
    items[index] = { ...items[index], notes };
    set({ items });
  },

  setTable: (tableId) => set({ selectedTableId: tableId }),

  clearOrder: () => set({ items: [], selectedTableId: null }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));
