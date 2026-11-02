'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import api from '../../lib/api';
import { useRouter } from 'next/navigation';

export function AnnouncementBanner() {
  const router = useRouter();
  const [activeBanner, setActiveBanner] = useState<any>(null);

  const fetchBanners = async () => {
    try {
      const res = await api.get('/tenant/notices');
      if (res.data.success && res.data.data?.banner_notices?.length) {
        const dismissed = JSON.parse(sessionStorage.getItem('dismissed_banners') || '[]');
        const available = res.data.data.banner_notices.find(
          (n: any) => !dismissed.includes(n.id)
        );
        setActiveBanner(available || null);
      } else {
        setActiveBanner(null);
      }
    } catch (e) {
      // silent fail
    }
  };

  useEffect(() => {
    fetchBanners();
    // 30s auto-polling sync
    const interval = setInterval(fetchBanners, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    if (!activeBanner) return;
    const dismissed = JSON.parse(sessionStorage.getItem('dismissed_banners') || '[]');
    sessionStorage.setItem('dismissed_banners', JSON.stringify([...dismissed, activeBanner.id]));
    setActiveBanner(null);
  };

  const handleOpenNotices = async () => {
    if (activeBanner?.id) {
      try {
        await api.post(`/tenant/notices/${activeBanner.id}/read`);
      } catch (e) {
        // silent
      }
    }
    router.push('/notices');
  };

  if (!activeBanner) return null;

  return (
    <div
      role="alert"
      className="w-full bg-[#DC2626] text-white h-9 sm:h-10 px-3 sm:px-4 flex items-center justify-between shadow-md shrink-0 z-50 overflow-hidden select-none border-b border-red-700/50"
    >
      {/* 1. Left: Fixed Pill Badge (Exact Image 1 design) */}
      <div className="shrink-0 flex items-center gap-1.5 bg-black/25 dark:bg-black/40 border border-white/20 text-white px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xs mr-3">
        <Megaphone className="w-3.5 h-3.5 shrink-0 text-white fill-white/20 animate-pulse" />
        <span>NOTICE</span>
      </div>

      {/* 2. Middle: Infinite Smooth Marquee Moving Right to Left */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div
          onClick={handleOpenNotices}
          title="Click to view full notice details"
          className="animate-marquee inline-flex items-center gap-3 whitespace-nowrap cursor-pointer hover:opacity-95 text-xs sm:text-sm font-bold text-white transition-opacity"
        >
          {activeBanner.badge_text && (
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs uppercase px-2 py-0.5 rounded shadow-xs">
              [{activeBanner.badge_text}]
            </span>
          )}

          <span className="font-extrabold text-white text-xs sm:text-sm">
            {activeBanner.title}
          </span>

          {activeBanner.content && (
            <span className="opacity-95 font-medium text-xs sm:text-sm">
              — {activeBanner.content}
            </span>
          )}

          <span className="underline opacity-90 font-semibold text-[11px] sm:text-xs hover:text-amber-200 ml-1">
            (Click to Read)
          </span>
        </div>
      </div>

      {/* 3. Right: Dismiss Close Button */}
      <button
        onClick={handleDismiss}
        title="Dismiss notice"
        className="shrink-0 ml-3 p-1 hover:bg-black/20 text-white/90 hover:text-white rounded-lg transition-colors cursor-pointer"
      >
        <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
      </button>
    </div>
  );
}
