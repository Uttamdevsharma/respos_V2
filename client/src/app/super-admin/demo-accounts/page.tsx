'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import {
  Users,
  Sparkles,
  PhoneCall,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  Plus,
  X,
  ExternalLink,
  MessageCircle,
  Copy,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
  Check,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalDemoAccounts: number;
  activeTrials: number;
  expiredTrials: number;
  callLeads: number;
}

function DemoAccountsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('filter') === 'LEADS' ? 'LEADS' : 'ALL';

  const [tab, setTab] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'LEADS'>(initialTab);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalDemoAccounts: 0,
    activeTrials: 0,
    expiredTrials: 0,
    callLeads: 0,
  });
  const [items, setItems] = useState<any[]>([]);

  // Create Demo Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  const generateRandomPassword = () => {
    return `demo${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const openCreateModalWithPrefill = (prefill?: { name?: string; pharmacy?: string; phone?: string }) => {
    setCreatedCredentials(null);
    setBusinessName(prefill?.pharmacy || '');
    setOwnerName(prefill?.name || '');
    setPhone(prefill?.phone || '');
    setEmail(
      prefill?.pharmacy
        ? `${prefill.pharmacy.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(100 + Math.random() * 900)}@pharmacy.demo`
        : ''
    );
    setPassword(generateRandomPassword());
    setCreateModalOpen(true);
  };

  const fetchData = () => {
    setLoading(true);
    api.get(`/super-admin/demo-accounts`, {
      params: { tab, search: search.trim() },
    })
      .then(({ data }) => {
        if (data.success) {
          setStats(data.data.stats || { totalDemoAccounts: 0, activeTrials: 0, expiredTrials: 0, callLeads: 0 });
          setItems(data.data.data || []);
        }
      })
      .catch((err) => {
        toast.error('Failed to load demo accounts & leads');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCreateDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !ownerName.trim() || !phone.trim() || !email.trim()) {
      toast.error('Please complete all required fields');
      return;
    }

    setCreating(true);
    try {
      const { data } = await api.post('/super-admin/demo-accounts', {
        business_name: businessName.trim(),
        owner_name: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (data.success) {
        toast.success('Active Demo Pharmacy provisioned successfully!');
        setCreatedCredentials(data.data.credentials);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create demo instance');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: 'PENDING_CALL' | 'CALLED' | 'CONVERTED') => {
    try {
      const { data } = await api.patch(`/super-admin/demo-accounts/lead/${id}`, { status });
      if (data.success) {
        toast.success(`Lead marked as ${status.replace('_', ' ')}`);
        fetchData();
      }
    } catch (err: any) {
      toast.error('Failed to update lead status');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="w-full space-y-6">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl 2xl:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Demo Accounts & Inbound Leads
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track active 14-day trials, provision instant demo pharmacies, and follow up with inbound phone demo requests.
          </p>
        </div>

        <button
          onClick={() => openCreateModalWithPrefill()}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={16} />
          <span>Provision New Demo Account</span>
        </button>
      </div>

      {/* ── 1. 4 Stats Counter Cards Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Demo Accounts */}
        <div
          onClick={() => setTab('ALL')}
          className={`p-5 bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            tab === 'ALL'
              ? 'border-blue-500 ring-1 ring-blue-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Demo Accounts
            </span>
            <div className="w-8 h-8 flex items-center justify-center bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Building2 size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.totalDemoAccounts.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">instances</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">All created 14-day demo accounts</p>
        </div>

        {/* Card 2: Active Trials */}
        <div
          onClick={() => setTab('ACTIVE')}
          className={`p-5 bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            tab === 'ACTIVE'
              ? 'border-emerald-500 ring-1 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Active Trials
            </span>
            <div className="w-8 h-8 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.activeTrials.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">in trial window</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Expires &gt; current timestamp</p>
        </div>

        {/* Card 3: Expired Trials */}
        <div
          onClick={() => setTab('EXPIRED')}
          className={`p-5 bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            tab === 'EXPIRED'
              ? 'border-rose-500 ring-1 ring-rose-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Expired Trials
            </span>
            <div className="w-8 h-8 flex items-center justify-center bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {stats.expiredTrials.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">expired</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Ready for upgrade conversion</p>
        </div>

        {/* Card 4: Call Leads */}
        <div
          onClick={() => setTab('LEADS')}
          className={`p-5 bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            tab === 'LEADS'
              ? 'border-teal-500 ring-1 ring-teal-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Call Leads
            </span>
            <div className="w-8 h-8 flex items-center justify-center bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <PhoneCall size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">
              {stats.callLeads.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">inbound leads</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">From landing page demo requests</p>
        </div>
      </div>

      {/* ── 2. Filter Bar & Search Toolbar ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800">
        {/* Tabs */}
        <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-950">
          {(
            [
              { key: 'ALL', label: 'All Demos', count: stats.totalDemoAccounts },
              { key: 'ACTIVE', label: 'Active Trials', count: stats.activeTrials },
              { key: 'EXPIRED', label: 'Expired Trials', count: stats.expiredTrials },
              { key: 'LEADS', label: 'Inbound Call Leads', count: stats.callLeads },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                tab === t.key
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                  tab === t.key
                    ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'LEADS' ? 'Search lead name, pharmacy, phone...' : 'Search demo pharmacy, owner, email...'}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={fetchData}
            className="p-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            title="Refresh Table"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-teal-500' : ''} />
          </button>
        </form>
      </div>

      {/* ── 3. Data Tables ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-24 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <RefreshCw size={24} className="animate-spin text-teal-500 mx-auto mb-2" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading data...</p>
        </div>
      ) : tab === 'LEADS' ? (
        /* LEADS TABLE */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {items.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <PhoneCall size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No inbound demo call requests found</p>
              <p className="text-xs text-slate-400 mt-1">Prospect phone numbers submitted on landing page will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Prospect Name</th>
                  <th className="py-3 px-4">Phone Number & Direct Links</th>
                  <th className="py-3 px-4">Pharmacy / Store Name</th>
                  <th className="py-3 px-4">Submitted Time</th>
                  <th className="py-3 px-4">Call Status</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {items.map((lead) => {
                  const rawPhone = lead.phone || lead.contact_number || '';
                  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
                  const waNumber = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;

                  return (
                    <tr key={lead._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{lead.name || 'Anonymous Prospect'}</div>
                        {lead.email && <div className="text-[11px] text-slate-400 font-mono mt-0.5">{lead.email}</div>}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${cleanPhone}`}
                            className="font-mono font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                          >
                            <PhoneCall size={12} />
                            <span>{rawPhone}</span>
                          </a>
                          <a
                            href={`https://wa.me/${waNumber}?text=Assalamu%20Alaikum%20${encodeURIComponent(
                              lead.name || ''
                            )},%20thank%20you%20for%20requesting%20a%20demo%20for%20${encodeURIComponent(
                              lead.pharmacy_name || 'your pharmacy'
                            )}.`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </a>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {lead.pharmacy_name || 'Not specified'}
                        </div>
                        {lead.notes && <div className="text-[11px] text-slate-400 italic mt-0.5">{lead.notes}</div>}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : 'N/A'}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            lead.status === 'CONVERTED'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : lead.status === 'CALLED'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 animate-pulse'
                          }`}
                        >
                          {lead.status === 'CONVERTED'
                            ? 'Converted to Demo'
                            : lead.status === 'CALLED'
                            ? 'Called / Contacted'
                            : 'Pending Call'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.status !== 'CALLED' && lead.status !== 'CONVERTED' && (
                            <button
                              onClick={() => handleUpdateLeadStatus(lead._id, 'CALLED')}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-[11px] font-bold transition-colors"
                            >
                              Mark Called
                            </button>
                          )}

                          <button
                            onClick={() =>
                              openCreateModalWithPrefill({
                                name: lead.name,
                                pharmacy: lead.pharmacy_name,
                                phone: lead.phone,
                              })
                            }
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                            title="Provision active 14-day demo account for this lead"
                          >
                            <Sparkles size={11} />
                            <span>Provision Demo</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* DEMO ACCOUNTS TABLE */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {items.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Building2 size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No demo accounts match this filter</p>
              <button
                onClick={() => openCreateModalWithPrefill()}
                className="mt-3 px-3.5 py-1.5 bg-teal-600 text-white text-xs font-bold"
              >
                + Provision New Demo
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Demo Pharmacy Profile</th>
                  <th className="py-3 px-4">Authorized Owner</th>
                  <th className="py-3 px-4">Trial Window & Expiry</th>
                  <th className="py-3 px-4">Usage / Sessions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {items.map((b) => {
                  const now = new Date();
                  const expiresAt = b.demo_expires_at ? new Date(b.demo_expires_at) : null;
                  const isExpired = expiresAt ? expiresAt <= now : false;
                  
                  // Days left or days expired
                  let daysLabel = '';
                  if (expiresAt) {
                    const diffTime = expiresAt.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays > 0) {
                      daysLabel = `${diffDays} days remaining`;
                    } else {
                      daysLabel = `Expired ${Math.abs(diffDays)} days ago`;
                    }
                  }

                  const sessionsCount = Array.isArray(b.trial_sessions) ? b.trial_sessions.length : 1;
                  const totalSecs = Array.isArray(b.trial_sessions)
                    ? b.trial_sessions.reduce((acc: number, s: any) => acc + (s.duration_seconds || 0), 0)
                    : 600;
                  const formattedUsage = `${Math.floor(totalSecs / 60)} mins`;

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{b.name}</span>
                          <span className="px-1.5 py-0.2 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[9px] font-black uppercase">
                            DEMO
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{b.address || 'Dhaka, Bangladesh'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{b.owner_name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          <span className="font-mono text-slate-500">{b.contact_number}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-400">{b.email}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                          {expiresAt ? expiresAt.toLocaleDateString() : 'N/A'}
                        </div>
                        <div
                          className={`text-[10px] font-bold mt-0.5 ${
                            isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {daysLabel}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {sessionsCount} sessions
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{formattedUsage} total logged</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            isExpired
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {isExpired ? 'Expired' : 'Active Trial'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/super-admin/businesses?id=${b._id}`}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <span>Inspect</span>
                            <ArrowRight size={11} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── 4. Create Demo Account Modal ─────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X size={20} />
            </button>

            {createdCredentials ? (
              /* Success / Provisioned Box */
              <div className="text-center py-2 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Demo Pharmacy Provisioned!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  The demo environment is now live with sample medicines and a 14-day trial window. Share these credentials with the prospect:
                </p>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left font-mono space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase text-[10px] font-bold">Login Email:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{createdCredentials.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase text-[10px] font-bold">Password:</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{createdCredentials.password}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `Assalamu Alaikum,\nYour Demo Pharmacy credentials:\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nLogin at: ${window.location.origin}/login`,
                        'Demo login message'
                      )
                    }
                    className="flex-1 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Copy size={13} />
                    <span>Copy WhatsApp Message</span>
                  </button>
                  <button
                    onClick={() => setCreateModalOpen(false)}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Create Form */
              <div>
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-5">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <Sparkles size={18} className="text-teal-600" />
                    <span>Instant Demo Pharmacy Provisioning</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Instantly creates an APPROVED demo pharmacy with 14-day validity and sample data.
                  </p>
                </div>

                <form onSubmit={handleCreateDemo} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Pharmacy / Business Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Care & Cure Model Pharmacy"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Owner Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g. Dr. Rafiqul Islam"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Login Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. demo@carecurepharmacy.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                        Initial Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setPassword(generateRandomPassword())}
                        className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline"
                      >
                        Regenerate
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="p-3 bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 text-[11px] text-teal-800 dark:text-teal-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      <span>Auto-Provisioned Package:</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      14-day validity, pre-loaded POS medicines catalog, 1 outlet, and instant admin login.
                    </p>
                  </div>

                  <div className="pt-3 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCreateModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                    >
                      {creating ? 'Provisioning...' : 'Provision Demo Account'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DemoAccountsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400 font-mono">Loading Demo Accounts...</div>}>
      <DemoAccountsContent />
    </Suspense>
  );
}
