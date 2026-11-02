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
  FileText,
  Plus,
  Megaphone,
  Send,
  Users as UsersIcon,
  Smartphone,
  KeyRound,
  ShieldPlus,
  CheckSquare,
  UserPlus,
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

  // Accordion active & toggle states
  const isQuotationTabActive = pathname.startsWith('/super-admin/quotations');
  const [quotationsMenuOpen, setQuotationsMenuOpen] = useState(isQuotationTabActive);

  const isSmsTabActive = pathname.startsWith('/super-admin/sms');
  const [smsMenuOpen, setSmsMenuOpen] = useState(isSmsTabActive);

  const isStaffTabActive = pathname.startsWith('/super-admin/staff');
  const [staffMenuOpen, setStaffMenuOpen] = useState(isStaffTabActive);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

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

  useEffect(() => {
    if (isQuotationTabActive) {
      setQuotationsMenuOpen(true);
    }
  }, [isQuotationTabActive]);

  useEffect(() => {
    if (isSmsTabActive) {
      setSmsMenuOpen(true);
    }
  }, [isSmsTabActive]);

  useEffect(() => {
    if (isStaffTabActive) {
      setStaffMenuOpen(true);
    }
  }, [isStaffTabActive]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-slate-200">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Verifying Super Admin Privileges...</p>
        </div>
      </div>
    );
  }

  const primaryNavItems = [
    { label: 'Overview', href: '/super-admin/overview', icon: LayoutDashboard },
    {
      label: 'Pending Verifications',
      href: '/super-admin/verifications',
      icon: ShieldCheck,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeBg: 'bg-amber-500 text-slate-950',
    },
    { label: 'Business Directory', href: '/super-admin/businesses', icon: Building2 },
  ];

  const secondaryNavItems = [
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
    if (pathname.includes('/quotations')) return 'Quotations & Proposals';
    if (pathname.includes('/notices')) return 'System Notices & Announcements';
    if (pathname.includes('/sms')) return 'SMS Gateway & Bulk Campaigns';
    if (pathname.includes('/staff')) return 'Platform Staff & Governance';
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
      {/* ── Desktop Sidebar (Comfortable, responsive width & font sizes) ── */}
      <aside className="hidden md:flex flex-col w-72 lg:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 z-40 shrink-0">
        {/* Brand Header */}
        <div className="px-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3.5">
          {logoUrl ? (
            <img src={logoUrl} alt={projectName} className="w-10 h-10 lg:w-11 lg:h-11 object-contain" />
          ) : (
            <div className="w-10 h-10 lg:w-11 lg:h-11 bg-teal-600 text-white flex items-center justify-center font-black text-xl rounded-xl shadow-xs">
              <Shield size={24} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base lg:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
              {projectName || 'ResPOS'}
            </h1>
            <p className="text-xs lg:text-[13px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider mt-0.5">
              Super Admin Portal
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 lg:py-3 text-sm lg:text-[15px] font-bold transition-all rounded-xl ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`px-2.5 py-0.5 font-black text-xs rounded-full ${
                      item.badgeBg || 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* ── 1. Quotation Accordion Section ── */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => setQuotationsMenuOpen(!quotationsMenuOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 lg:py-3 rounded-xl text-sm lg:text-[15px] font-bold transition-all cursor-pointer ${
                isQuotationTabActive
                  ? "bg-teal-50/90 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-teal-600" />
                <span>Quotations</span>
              </div>
              {quotationsMenuOpen ? (
                <ChevronDown className="h-4.5 w-4.5 text-slate-400" />
              ) : (
                <ChevronRight className="h-4.5 w-4.5 text-slate-400" />
              )}
            </button>

            {quotationsMenuOpen && (
              <div className="pl-4 pr-1 pt-1 space-y-1 border-l-2 border-teal-500/40 ml-5 mt-1">
                <Link
                  href="/super-admin/quotations?tab=create"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50/60 dark:hover:bg-teal-950/40"
                >
                  <Plus className="h-4 w-4 shrink-0 text-teal-600" />
                  <span>Add Quotation</span>
                </Link>

                <Link
                  href="/super-admin/quotations"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50/60 dark:hover:bg-teal-950/40"
                >
                  <FileText className="h-4 w-4 shrink-0 text-teal-600" />
                  <span>Manage Quotations</span>
                </Link>
              </div>
            )}
          </div>

          {/* ── 2. Notices & Announcements (Direct Menu) ── */}
          <Link
            href="/super-admin/notices"
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 lg:py-3 rounded-xl text-sm lg:text-[15px] font-bold transition-all cursor-pointer ${
              pathname.startsWith('/super-admin/notices')
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Megaphone className={`h-5 w-5 shrink-0 ${pathname.startsWith('/super-admin/notices') ? 'text-white' : 'text-teal-600'}`} />
            <span>Notices &amp; Announcements</span>
          </Link>

          {/* ── 3. SMS Management (Dropdown Accordion) ── */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => setSmsMenuOpen(!smsMenuOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 lg:py-3 rounded-xl text-sm lg:text-[15px] font-bold transition-all cursor-pointer ${
                isSmsTabActive
                  ? "bg-teal-50/90 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 shrink-0 text-teal-600" />
                <span>SMS Management</span>
              </div>
              {smsMenuOpen ? (
                <ChevronDown className="h-4.5 w-4.5 text-slate-400" />
              ) : (
                <ChevronRight className="h-4.5 w-4.5 text-slate-400" />
              )}
            </button>

            {smsMenuOpen && (
              <div className="pl-4 pr-1 pt-1 space-y-1 border-l-2 border-teal-500/40 ml-5 mt-1">
                {/* Submenu 1: Send SMS */}
                <Link
                  href="/super-admin/sms?tab=sms-send"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50/60 dark:hover:bg-teal-950/40"
                >
                  <Send className="h-4 w-4 shrink-0 text-teal-600" />
                  <span>Send SMS</span>
                </Link>

                {/* Submenu 2: Gateway Settings */}
                <Link
                  href="/super-admin/sms?tab=sms-settings"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50/60 dark:hover:bg-teal-950/40"
                >
                  <Settings className="h-4 w-4 shrink-0 text-teal-600" />
                  <span>Gateway Settings</span>
                </Link>

                {/* Submenu 3: SMS Logs */}
                <Link
                  href="/super-admin/sms?tab=sms-logs"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50/60 dark:hover:bg-teal-950/40"
                >
                  <FileText className="h-4 w-4 shrink-0 text-teal-600" />
                  <span>SMS Logs</span>
                </Link>
              </div>
            )}
          </div>

          {/* ── 4. Staff Management (Dropdown Accordion with Sub-Accordion) ── */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => setStaffMenuOpen(!staffMenuOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 lg:py-3 rounded-xl text-sm lg:text-[15px] font-bold transition-all cursor-pointer ${
                isStaffTabActive
                  ? "bg-teal-50/90 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <UsersIcon className="h-5 w-5 shrink-0 text-teal-600" />
                <span>Staff Management</span>
              </div>
              {staffMenuOpen ? (
                <ChevronDown className="h-4.5 w-4.5 text-slate-400" />
              ) : (
                <ChevronRight className="h-4.5 w-4.5 text-slate-400" />
              )}
            </button>

            {staffMenuOpen && (
              <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-teal-500/40 ml-5 mt-1">
                {/* Sub-group: Role Management */}
                <div>
                  <button
                    type="button"
                    onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>Role Management</span>
                    </div>
                    {roleMenuOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>

                  {roleMenuOpen && (
                    <div className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-teal-500/40 ml-3.5 mt-1">
                      <Link
                        href="/super-admin/staff?tab=create-role"
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50/60 dark:hover:bg-teal-950/40"
                      >
                        <ShieldPlus className="h-4 w-4 text-teal-600" />
                        <span>Create Role</span>
                      </Link>
                      <Link
                        href="/super-admin/staff?tab=permission-assignment"
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50/60 dark:hover:bg-teal-950/40"
                      >
                        <CheckSquare className="h-4 w-4 text-teal-600" />
                        <span>Permission Assign</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Submenu 2: Create Staff */}
                <Link
                  href="/super-admin/staff?tab=staff-create"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50/60 dark:hover:bg-teal-950/40 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 text-teal-600" />
                  <span>Create Staff</span>
                </Link>

                {/* Submenu 3: Staff List */}
                <Link
                  href="/super-admin/staff?tab=staff-list"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50/60 dark:hover:bg-teal-950/40 cursor-pointer"
                >
                  <UsersIcon className="h-4 w-4 text-teal-600" />
                  <span>Staff List</span>
                </Link>
              </div>
            )}
          </div>

          {/* Secondary Nav Items */}
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 lg:py-3 text-sm lg:text-[15px] font-bold transition-all rounded-xl ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`px-2.5 py-0.5 font-black text-xs rounded-full ${
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 lg:py-3 text-sm lg:text-[15px] font-bold transition-all rounded-xl cursor-pointer ${
                pathname.startsWith('/super-admin/settings')
                  ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 shrink-0" />
                <span>Settings</span>
              </div>
              {settingsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>

            {settingsOpen && (
              <div className="mt-1 pl-4 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-5">
                <Link
                  href="/super-admin/settings/branding"
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                    pathname === '/super-admin/settings/branding'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <ImageIcon size={16} />
                  <span>Logo &amp; Name</span>
                </Link>

                <Link
                  href="/super-admin/settings/gateways"
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
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
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
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
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Right Content Wrapper with Dedicated Top Navbar ─────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 lg:h-18 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 sm:px-8 lg:px-10 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-bold text-slate-500 hidden sm:inline">
              Super Admin /
            </span>
            <span className="text-sm sm:text-base lg:text-lg font-black text-slate-900 dark:text-white">
              {getPageTitle()}
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/"
              target="_blank"
              className="hidden lg:flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-white transition-colors"
            >
              <span>Visit Public Site</span>
              <ExternalLink size={14} />
            </Link>

            <ThemeToggle showLabel={false} />

            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-sm">
                <User size={18} />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">Super Admin</p>
                <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{user?.email || 'admin'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Space */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 xl:p-10 bg-slate-50 dark:bg-slate-950 transition-colors">
          <div className="max-w-[1700px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-5 flex flex-col z-10 border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <span className="font-black text-base">{projectName || 'ResPOS'}</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-sm font-bold rounded-xl ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
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

              {/* Mobile Quotation Accordion Section */}
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => setQuotationsMenuOpen(!quotationsMenuOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    isQuotationTabActive
                      ? "bg-teal-50/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-teal-600" />
                    <span>Quotations</span>
                  </div>
                  {quotationsMenuOpen ? (
                    <ChevronDown className="h-4.5 w-4.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4.5 w-4.5 text-slate-400" />
                  )}
                </button>
                {quotationsMenuOpen && (
                  <div className="pl-4 pr-1 pt-1 space-y-1 border-l-2 border-teal-500/30 ml-5 mt-1">
                    <Link
                      href="/super-admin/quotations?tab=create"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600"
                    >
                      <Plus className="h-4 w-4 shrink-0 text-teal-600" />
                      <span>Add Quotation</span>
                    </Link>
                    <Link
                      href="/super-admin/quotations"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-teal-600" />
                      <span>Manage Quotations</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Notices Direct Link */}
              <Link
                href="/super-admin/notices"
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  pathname.startsWith('/super-admin/notices')
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Megaphone className={`h-5 w-5 shrink-0 ${pathname.startsWith('/super-admin/notices') ? 'text-white' : 'text-teal-600'}`} />
                <span>Notices &amp; Announcements</span>
              </Link>

              {/* Mobile SMS Accordion Section */}
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => setSmsMenuOpen(!smsMenuOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    isSmsTabActive
                      ? "bg-teal-50/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 shrink-0 text-teal-600" />
                    <span>SMS Management</span>
                  </div>
                  {smsMenuOpen ? <ChevronDown className="h-4.5 w-4.5 text-slate-400" /> : <ChevronRight className="h-4.5 w-4.5 text-slate-400" />}
                </button>
                {smsMenuOpen && (
                  <div className="pl-4 pr-1 pt-1 space-y-1 border-l-2 border-teal-500/30 ml-5 mt-1">
                    <Link
                      href="/super-admin/sms?tab=sms-send"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600"
                    >
                      <Send className="h-4 w-4 shrink-0 text-teal-600" />
                      <span>Send SMS</span>
                    </Link>
                    <Link
                      href="/super-admin/sms?tab=sms-settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600"
                    >
                      <Settings className="h-4 w-4 shrink-0 text-teal-600" />
                      <span>Gateway Settings</span>
                    </Link>
                    <Link
                      href="/super-admin/sms?tab=sms-logs"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-teal-600" />
                      <span>SMS Logs</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Staff Accordion Section */}
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => setStaffMenuOpen(!staffMenuOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    isStaffTabActive
                      ? "bg-teal-50/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UsersIcon className="h-5 w-5 shrink-0 text-teal-600" />
                    <span>Staff Management</span>
                  </div>
                  {staffMenuOpen ? <ChevronDown className="h-4.5 w-4.5 text-slate-400" /> : <ChevronRight className="h-4.5 w-4.5 text-slate-400" />}
                </button>
                {staffMenuOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-teal-500/30 ml-5 mt-1">
                    <div>
                      <button
                        type="button"
                        onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <KeyRound className="h-4 w-4 text-amber-500" />
                          <span>Role Management</span>
                        </div>
                        {roleMenuOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                      {roleMenuOpen && (
                        <div className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-teal-500/40 ml-3.5 mt-1">
                          <Link
                            href="/super-admin/staff?tab=create-role"
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs sm:text-sm text-slate-600 hover:text-teal-600"
                          >
                            <ShieldPlus className="h-4 w-4 text-teal-600" />
                            <span>Create Role</span>
                          </Link>
                          <Link
                            href="/super-admin/staff?tab=permission-assignment"
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs sm:text-sm text-slate-600 hover:text-teal-600"
                          >
                            <CheckSquare className="h-4 w-4 text-teal-600" />
                            <span>Permission Assign</span>
                          </Link>
                        </div>
                      )}
                    </div>
                    <Link
                      href="/super-admin/staff?tab=staff-create"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:text-teal-600"
                    >
                      <UserPlus className="h-4 w-4 text-teal-600" />
                      <span>Create Staff</span>
                    </Link>
                    <Link
                      href="/super-admin/staff?tab=staff-list"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:text-teal-600"
                    >
                      <UsersIcon className="h-4 w-4 text-teal-600" />
                      <span>Staff List</span>
                    </Link>
                  </div>
                )}
              </div>

              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-sm font-bold rounded-xl ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
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
                  className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400"
                >
                  <ImageIcon size={16} />
                  <span>Logo &amp; Name</span>
                </Link>
                <Link
                  href="/super-admin/settings/gateways"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400"
                >
                  <CreditCard size={16} />
                  <span>Payment Gateways</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
