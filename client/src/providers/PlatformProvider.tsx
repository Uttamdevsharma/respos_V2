'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { getImageUrl } from '../lib/api';
import { PlatformSettings } from '../types';

interface PlatformContextType {
  settings: PlatformSettings | null;
  loading: boolean;
  projectName: string;
  logoUrl: string;
  loginImageUrl: string;
  youtubeUrl: string;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: PlatformSettings = {
  project_name: 'Restobiz',
  logo_url: '/images/restobiz-icon.png',
  login_image_url: '',
  support_email: 'support@restobiz.com',
  support_phone: '01973590937',
  currency: 'BDT',
  currency_symbol: '৳',
  manual_payment_active: true,
  bkash_number: '01973590937',
  nagad_number: '01973590937',
  manual_payment_instruction: 'Please send money to the official bKash/Nagad number above using "Send Money". Then copy your Transaction ID (TrxID) and submit below.',
  youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
};

const PlatformContext = createContext<PlatformContextType>({
  settings: defaultSettings,
  loading: false,
  projectName: 'Restobiz',
  logoUrl: '/images/restobiz-icon.png',
  loginImageUrl: '',
  youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  refreshSettings: async () => {},
});

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings | null>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await api.get('/public/platform-settings');
      if (res.data?.success && res.data?.data) {
        setSettings(res.data.data);
      }
    } catch {
      // Fallback to default
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <PlatformContext.Provider
      value={{
        settings,
        loading,
        projectName: settings?.project_name || 'Restobiz',
        logoUrl: settings?.logo_url ? getImageUrl(settings.logo_url) : '/images/restobiz-icon.png',
        loginImageUrl: settings?.login_image_url ? getImageUrl(settings.login_image_url) : '',
        youtubeUrl: settings?.youtube_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        refreshSettings,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  return useContext(PlatformContext);
}
