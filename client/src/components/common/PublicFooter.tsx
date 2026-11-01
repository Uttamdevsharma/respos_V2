'use client';

import Link from 'next/link';
import { usePlatform } from '../../providers/PlatformProvider';
import { Store, Phone, Mail, ArrowUpRight } from 'lucide-react';
import { FloatingChatWidget } from './FloatingChatWidget';

export function PublicFooter() {
  const { projectName, logoUrl, settings } = usePlatform();

  return (
    <footer className="w-full bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="inline-flex flex-col items-start gap-1 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl || '/images/restobiz-icon.png'}
                alt={projectName || 'Restobiz'}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== window.location.origin + '/images/restobiz-icon.png') {
                    target.src = '/images/restobiz-icon.png';
                  }
                }}
                className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
              {(!projectName || projectName.toLowerCase() === 'restobiz' || projectName.toLowerCase() === 'respos') ? (
                <div className="flex items-center text-lg font-black tracking-tight leading-none mt-1">
                  <span className="text-[#082c4d] dark:text-slate-100">Resto</span>
                  <span className="text-[#ff6d00]">biz</span>
                </div>
              ) : (
                <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none mt-1">
                  {projectName}
                </span>
              )}
            </Link>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Complete restaurant POS, multi-counter billing, live Kitchen Display (KDS), and inventory software for cafes, cloud kitchens, and restaurant chains.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link href="/" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Home Landing
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Contact &amp; Support
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-blue-600 dark:hover:text-white transition-colors flex items-center gap-1">
                  <span>Start Free Trial</span>
                  <ArrowUpRight size={11} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Support Contact */}
          <div>
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-3">
              Direct Contact
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-blue-600" />
                <a
                  href={`tel:${settings?.support_phone || '01973590937'}`}
                  className="hover:underline font-mono"
                >
                  {settings?.support_phone || '01973590937'}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-emerald-600" />
                <a
                  href={`mailto:${settings?.support_email || 'support@restopos.com'}`}
                  className="hover:underline"
                >
                  {settings?.support_email || 'support@restopos.com'}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} {projectName || 'ResPOS'}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-blue-600">
              Merchant Login
            </Link>
            <span>•</span>
            <Link href="/register" className="hover:text-blue-600">
              Free 14-Day Registration
            </Link>
          </div>
        </div>
      </div>

      {/* ── Persistent Floating Live Chat Widget ── */}
      <FloatingChatWidget />
    </footer>
  );
}
