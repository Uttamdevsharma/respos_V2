'use client';

import { useEffect } from 'react';
import api from '../lib/api';
import { applyBrandColor } from '../lib/colorUtils';

/**
 * BrandProvider
 * Fetches the restaurant settings on mount and applies the saved brandColor
 * to the entire app by overriding CSS variables on <html>.
 * Must be rendered inside an existing client-side tree.
 */
export function BrandProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => {
        if (data.success && data.data.brandColor) {
          applyBrandColor(data.data.brandColor);
        }
      })
      .catch(() => {/* silently ignore – keep default colors */});
  }, []);

  return <>{children}</>;
}
