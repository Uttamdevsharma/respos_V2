'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { usePlatform } from '../../providers/PlatformProvider';
import { ThemeToggle } from './ThemeToggle';
import { Store, Menu, X, ArrowRight } from 'lucide-react';

export function PublicNavbar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const { projectName, logoUrl } = usePlatform();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 h-20 sm:h-[84px] md:h-[88px] flex items-center justify-between">
        {/* Brand Logo & Name - Logo on top, Name underneath */}
        <Link href="/" className="flex flex-col items-center justify-center shrink-0 group py-1">
          <img
            src={logoUrl || '/images/restobiz-icon.png'}
            alt={projectName || 'Restobiz'}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== window.location.origin + '/images/restobiz-icon.png') {
                target.src = '/images/restobiz-icon.png';
              }
            }}
            className="h-10 sm:h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-105"
          />
          {(!projectName || projectName.toLowerCase() === 'restobiz' || projectName.toLowerCase() === 'respos') ? (
            <div className="flex items-center text-base sm:text-lg lg:text-[20px] font-black tracking-tight leading-none mt-1">
              <span className="text-[#082c4d] dark:text-slate-100">Resto</span>
              <span className="text-[#ff6d00]">biz</span>
            </div>
          ) : (
            <span className="text-base sm:text-lg lg:text-[20px] font-black text-slate-900 dark:text-white tracking-tight leading-none mt-1">
              {projectName}
            </span>
          )}
        </Link>

        {/* Center Navigation Links: Home, Pricing, Contact */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 dark:text-slate-300">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`py-1 transition-colors relative ${
                  active
                    ? 'text-blue-600 dark:text-blue-400 font-black'
                    : 'hover:text-blue-600 dark:hover:text-white'
                }`}
              >
                {link.name}
                {active && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Items */}
        <div className="flex items-center gap-3">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />

          {/* Language Indicator EN | BN */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            <span className="text-blue-600 dark:text-blue-400 font-bold">EN</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer">BN</span>
          </div>

          {/* Authentication Buttons */}
          {isAuthenticated && user ? (
            <Link
              href={user.role === 'SUPER_ADMIN' ? '/super-admin/overview' : '/dashboard'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-block px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <ArrowRight size={13} />
              </Link>
            </>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-800"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-5 space-y-4 shadow-lg animate-slide-up">
          <nav className="flex flex-col space-y-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-3 transition-colors ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-black'
                      : 'hover:text-blue-600'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold uppercase"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
