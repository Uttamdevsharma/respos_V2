'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrandProvider } from './BrandProvider';
import { ThemeProvider } from './ThemeProvider';
import { PlatformProvider } from './PlatformProvider';

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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PlatformProvider>
          <BrandProvider>
            {children}
          </BrandProvider>
        </PlatformProvider>
      </ThemeProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0f172a',
            color: '#fff',
            borderRadius: '0px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </QueryClientProvider>
  );
}
