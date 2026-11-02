import { create } from 'zustand';

interface UIState {
  isSidebarDrawerOpen: boolean;
  openSidebarDrawer: () => void;
  closeSidebarDrawer: () => void;
  toggleSidebarDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarDrawerOpen: false,
  openSidebarDrawer: () => set({ isSidebarDrawerOpen: true }),
  closeSidebarDrawer: () => set({ isSidebarDrawerOpen: false }),
  toggleSidebarDrawer: () => set((state) => ({ isSidebarDrawerOpen: !state.isSidebarDrawerOpen })),
}));

