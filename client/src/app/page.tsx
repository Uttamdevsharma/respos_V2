'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';

export default function HomePage() {
  const router = useRouter();
  const { loadFromStorage, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    const hasStoredSession = typeof window !== 'undefined' && !!localStorage.getItem('gastroflow_token');

    if ((isAuthenticated && user) || hasStoredSession) {
      const activeUser = user ?? JSON.parse(localStorage.getItem('gastroflow_user') || 'null');

      if (activeUser) {
        switch (activeUser.role) {
          case 'admin':
            router.replace('/dashboard');
            break;
          case 'waiter':
            router.replace('/pos');
            break;
          case 'cashier':
            router.replace('/billing');
            break;
          case 'kitchen':
            router.replace('/kitchen');
            break;
          default:
            router.replace('/dashboard');
        }
      } else {
        router.replace('/login');
      }
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-on-surface-variant text-sm font-medium">Loading GastroFlow POS...</p>
      </div>
    </div>
  );
}
