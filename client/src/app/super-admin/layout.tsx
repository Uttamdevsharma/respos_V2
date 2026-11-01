'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth.store';
import { usePlatform } from '../../providers/PlatformProvider';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import api from '../../lib/api';
import {
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Layers,
  Settings,
  Image as ImageIcon,
  Video,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Shield,
  User,
  PhoneCall,
  CreditCard,
  MessageSquare,
  LifeBuoy,
} from 'lucide-react';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isHydrated, loadFromStorage, logout } = useAuthStore();
  const { projectName, logoUrl } = usePlatform();
  const [checking, setChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [waitingChatCount, setWaitingChatCount] = useState<number>(0);
  const [pendingTicketCount, setPendingTicketCount] = useState<number>(0);
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith('/super-admin/settings')
  );

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated || !user) {
        router.replace('/login');
      } else if (user.role !== 'SUPER_ADMIN') {
        router.replace('/dashboard');
      } else {
        setChecking(false);

        // Fetch counts
        api.get('/super-admin/verifications')
          .then(({ data }) => {
            if (data.success) {
              const list = Array.isArray(data.data?.items) ? data.data.items : Array.isArray(data.data) ? data.data : [];
              setPendingCount(list.length);
            }
          })
          .catch(() => {});

        api.get('/super-admin/live-chat/stats')
          .then(({ data }) => {
            if (data.success && data.data?.waitingResponse !== undefined) {
              setWaitingChatCount(data.data.waitingResponse);
            }
          })
          .catch(() => {});

        api.get('/super-admin/support-tickets/stats')
          .then(({ data }) => {
            if (data.success && data.data?.pending !== undefined) {
              setPendingTicketCount(data.data.pending);
            }
          })
          .catch(() => {});
      }
    }
  }, [isHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (pathname.startsWith('/super-admin/settings')) {
      setSettingsOpen(true);
    }
  }, [pathname]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-slate-200">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Verifying Super Admin Privileges...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Overview', href: '/super-admin/overview', icon: LayoutDashboard },
    {
      label: 'Pending Verifications',
      href: '/super-admin/verifications',
      icon: ShieldCheck,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeBg: 'bg-amber-500 text-slate-950',
    },
    { label: 'Business Directory', href: '/super-admin/businesses', icon: Building2 },
    { label: 'Demo Accounts & Leads', href: '/super-admin/demo-accounts', icon: PhoneCall },
    { label: 'Subscription Plans', href: '/super-admin/plans', icon: Layers },
    {
      label: 'Live Chat Support',
      href: '/super-admin/live-chat',
      icon: MessageSquare,
      badge: waitingChatCount > 0 ? waitingChatCount : null,
      badgeBg: 'bg-rose-500 text-white',
    },
    {
      label: 'Support Tickets',
      href: '/super-admin/support-tickets',
      icon: LifeBuoy,
      badge: pendingTicketCount > 0 ? pendingTicketCount : null,
      badgeBg: 'bg-blue-600 text-white',
    },
  ];

  // Helper for Breadcrumb title on Top Navbar
  const getPageTitle = () => {
    if (pathname.includes('/overview')) return 'Dashboard Overview';
    if (pathname.includes('/verifications')) return 'Pending KYC Verifications';
    if (pathname.includes('/businesses') || pathname.includes('/restaurants')) return 'Business Directory';
    if (pathname.includes('/demo-accounts')) return 'Demo Accounts & Leads';
    if (pathname.includes('/plans')) return 'Subscription Plans';
    if (pathname.includes('/live-chat')) return 'Live Chat Support';
    if (pathname.includes('/support-tickets')) return 'Support Tickets Central';
    if (pathname.includes('/settings/branding')) return 'Settings / Logo & Name';
    if (pathname.includes('/settings/gateways')) return 'Settings / Payment Gateways';
    if (pathname.includes('/settings/video')) return 'Settings / YouTube URL';
    return 'Super Admin Portal';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors">
      {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-3.5 z-40 shrink-0">
        {/* Brand Header */}
        <div className="px-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={projectName} className="w-10 h-10 object-contain" />
          ) : (
            <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              <Shield size={22} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base font-black text-slate-900 dark:text-white leading-tight truncate">
              {projectName || 'ResPOS'}
            </h1>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
              Super Admin Portal
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-3 text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 font-black text-xs rounded-full ${
                      item.badgeBg || 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Settings Menu with Submenus */}
          <div className="pt-2">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              type="button"
              className={`w-full flex items-center justify-between px-3.5 py-3 text-sm font-bold transition-colors cursor-pointer ${
                pathname.startsWith('/super-admin/settings')
                  ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings size={20} />
                <span>Settings</span>
              </div>
              {settingsOpen ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
            </button>

            {settingsOpen && (
              <div className="mt-1.5 pl-4 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-5">
                <Link
                  href="/super-admin/settings/branding"
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm font-semibold transition-colors ${
                    pathname === '/super-admin/settings/branding'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <ImageIcon size={16} />
                  <span>Logo & Name</span>
                </Link>

                <Link
                  href="/super-admin/settings/gateways"
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm font-semibold transition-colors ${
                    pathname === '/super-admin/settings/gateways'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <CreditCard size={16} />
                  <span>Payment Gateways</span>
                </Link>

                <Link
                  href="/super-admin/settings/video"
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm font-semibold transition-colors ${
                    pathname === '/super-admin/settings/video'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Video size={16} />
                  <span>YouTube URL</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Footer Logout */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            type="button"
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Right Content Wrapper with Dedicated Top Navbar ─────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 sm:px-8 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              <Menu size={18} />
            </button>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">
              Super Admin /
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {getPageTitle()}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors"
            >
              <span>Visit Public Site</span>
              <ExternalLink size={13} />
            </Link>

            <ThemeToggle showLabel={false} />

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                <User size={15} />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Super Admin</p>
                <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{user?.email || 'admin'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Space */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 bg-slate-50 dark:bg-slate-950 transition-colors">
          <div className="max-w-[1500px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-5 flex flex-col z-10 border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <span className="font-black text-sm">{projectName || 'ResPOS'}</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 text-sm font-bold ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={19} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 font-black text-xs rounded-full ${
                          item.badgeBg || 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="pt-2">
                <p className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">Settings</p>
                <Link
                  href="/super-admin/settings/branding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  <ImageIcon size={16} />
                  <span>Logo & Name</span>
                </Link>
                <Link
                  href="/super-admin/settings/gateways"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  <CreditCard size={16} />
                  <span>Payment Gateways</span>
                </Link>
                <Link
                  href="/super-admin/settings/video"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  <Video size={16} />
                  <span>YouTube URL</span>
                </Link>
              </div>
            </nav>

            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="mt-auto py-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
