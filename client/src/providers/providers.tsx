'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrandProvider } from './BrandProvider';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // No centralized session-expired handling; per-page handlers manage 401 UI and redirect.

  return (
    <QueryClientProvider client={queryClient}>
      <BrandProvider>
        {children}
      </BrandProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#251913',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: { primary: '#00b251', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ba1a1a', secondary: '#fff' },
          },
        }}
      />
    </QueryClientProvider>
  );
}
