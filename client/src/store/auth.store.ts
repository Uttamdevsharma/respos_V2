import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gastroflow_token', token);
      localStorage.setItem('gastroflow_user', JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true, isHydrated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      // Notify server to clear refresh token cookie (if present)
      try {
        // import lazily to avoid circular deps during SSR
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const api = require('../lib/api').default;
        api.post('/auth/logout').catch(() => {});
      } catch (e) {
        // ignore
      }
      localStorage.removeItem('gastroflow_token');
      localStorage.removeItem('gastroflow_user');
      localStorage.removeItem('gastroflow_refresh_token');
    }
    set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
  },

  loadFromStorage: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('gastroflow_token');
      const userStr = localStorage.getItem('gastroflow_user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          set({ user, token, isAuthenticated: true, isHydrated: true });
          return;
        } catch {
          localStorage.removeItem('gastroflow_token');
          localStorage.removeItem('gastroflow_user');
        }
      }

      set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
      return;
    }

    set({ isHydrated: true });
  },
}));
