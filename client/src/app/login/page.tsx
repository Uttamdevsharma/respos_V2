'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth.store';
import api, { BASE_URL } from '../../lib/api';
import { AuthResponse, ApiResponse, Settings } from '../../types';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ChefHat, Monitor, Receipt, ShieldCheck } from 'lucide-react';

const roleCards = [
  { role: 'admin',   label: 'Admin',   email: 'admin@gastroflow.com',   password: 'admin123',   icon: ShieldCheck, color: 'bg-primary' },
  { role: 'waiter',  label: 'Waiter',  email: 'waiter@gastroflow.com',  password: 'waiter123',  icon: Monitor,     color: 'bg-secondary' },
  { role: 'cashier', label: 'Cashier', email: 'cashier@gastroflow.com', password: 'cashier123', icon: Receipt,     color: 'bg-tertiary' },
  { role: 'kitchen', label: 'Kitchen', email: 'kitchen@gastroflow.com', password: 'kitchen123', icon: ChefHat,     color: 'bg-primary-dark' },
];

function imgUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

type Branding = Pick<Settings, 'restaurantName' | 'logo' | 'loginImage' | 'brandColor' | 'tagline' | 'description'>;

const DEFAULT_BRANDING: Branding = {
  restaurantName: 'GastroFlow',
  logo: undefined,
  loginImage: undefined,
  brandColor: '#1a3c5e',
  tagline: 'Restaurant POS System',
  description: 'Professional restaurant management for modern Bangladeshi restaurants. Manage orders, kitchen, billing, and more — all in one place.',
};

export default function LoginPage() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [branding, setBranding]         = useState<Branding>(DEFAULT_BRANDING);
  const router     = useRouter();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      if (data.success) {
        setBranding({
          restaurantName: data.data.restaurantName || DEFAULT_BRANDING.restaurantName,
          logo:           data.data.logo,
          loginImage:     data.data.loginImage,
          brandColor:     data.data.brandColor  || DEFAULT_BRANDING.brandColor,
          tagline:        data.data.tagline      || DEFAULT_BRANDING.tagline,
          description:    data.data.description  || DEFAULT_BRANDING.description,
        });
      }
    }).catch(() => {/* silently use defaults */});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
      setAuth(data.data.user, data.data.token);
      if (data.data.refreshToken) localStorage.setItem('gastroflow_refresh_token', data.data.refreshToken);
      toast.success(`Welcome back, ${data.data.user.name}!`);
      const redirect: Record<string, string> = { admin: '/dashboard', waiter: '/pos', cashier: '/billing', kitchen: '/kitchen' };
      router.replace(redirect[data.data.user.role] || '/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (e: string, p: string) => { setEmail(e); setPassword(p); };

  const loginImageUrl = imgUrl(branding.loginImage);
  const logoUrl       = imgUrl(branding.logo);
  const color         = branding.brandColor || '#1a3c5e';

  // Panel gradient built from brand color
  const panelStyle = loginImageUrl ? undefined : {
    background: `linear-gradient(135deg, ${color}ff 0%, ${color}bb 50%, ${color}ee 100%)`,
  };

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Left: Branding Panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden"
        style={panelStyle}
      >
        {/* Background image */}
        {loginImageUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={loginImageUrl}
              alt="Login background"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Tinted overlay using brand color */}
            <div
              className="absolute inset-0"
              style={{ background: `${color}88` }}
            />
          </>
        )}

        {/* Decorative blobs */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="text-center text-white z-10 px-12 flex flex-col items-center">

          {/* ── Logo ── circular, with glow ring */}
          {logoUrl ? (
            <div className="mb-6 relative">
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-40 scale-110"
                style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={branding.restaurantName}
                className="relative w-24 h-24 rounded-full object-cover border-4 border-white/60 shadow-2xl"
                style={{ boxShadow: '0 0 0 6px rgba(255,255,255,0.15), 0 20px 40px rgba(0,0,0,0.3)' }}
              />
            </div>
          ) : (
            <div className="mb-6 relative">
              <div className="absolute inset-0 rounded-full blur-xl opacity-30 scale-110 bg-white" />
              <div
                className="relative w-24 h-24 rounded-full flex items-center justify-center border-4 border-white/60 shadow-2xl"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  boxShadow: '0 0 0 6px rgba(255,255,255,0.10), 0 20px 40px rgba(0,0,0,0.3)',
                }}
              >
                <span className="text-white font-black text-4xl">
                  {(branding.restaurantName || 'G').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Restaurant name */}
          <h1 className="text-5xl font-black mb-3 drop-shadow-lg">{branding.restaurantName}</h1>

          {/* Tagline */}
          <p className="text-xl font-light opacity-90">{branding.tagline}</p>

          {/* Divider */}
          <div className="mt-6 w-24 h-0.5 bg-white/40 rounded-full" />

          {/* Description */}
          {branding.description && (
            <p className="mt-6 text-sm opacity-70 max-w-md leading-relaxed">
              {branding.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Right: Login Form ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={branding.restaurantName}
                className="w-16 h-16 rounded-full object-cover border-4 shadow-lg mb-3"
                style={{ borderColor: color }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-lg mb-3"
                style={{ backgroundColor: color, borderColor: color }}
              >
                <span className="text-white font-black text-2xl">
                  {(branding.restaurantName || 'G').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h2 className="text-2xl font-black" style={{ color }}>
              {branding.restaurantName}
            </h2>
          </div>

          <div className="text-center mb-8 hidden lg:block">
            <h2 className="text-3xl font-black text-primary-dark">Welcome Back</h2>
            <p className="text-on-surface-variant mt-2">
              Sign in to your {branding.restaurantName} account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-2 focus:border-primary outline-none transition-all"
                style={{ '--tw-ring-color': color } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password..."
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-2 outline-none transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-white rounded-xl font-bold text-sm shadow-lg hover:brightness-110 press-effect transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: color, boxShadow: `0 8px 24px ${color}44` }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Login Cards */}
          <div className="mt-8">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3 text-center">
              Quick Login (Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {roleCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.role}
                    onClick={() => quickLogin(card.email, card.password)}
                    className="flex items-center gap-2 p-3 rounded-xl border border-outline-variant hover:bg-primary-container/10 transition-all text-left group"
                    style={{ ['--hover-border-color' as string]: color }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
                  >
                    <div
                      className="w-8 h-8 text-white rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                        {card.label}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">{card.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
