'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import {
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Filter,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  PhoneCall,
  UserCheck,
  TrendingUp,
  PieChart as PieIcon,
  Phone,
  MessageSquare,
  ArrowUpRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type TimeframePreset = 'all' | 'today' | 'yesterday' | 'this_month' | 'last_month' | 'this_year' | 'custom';

interface OverviewMetrics {
  totalActivePharmacies: number;
  awaitingPayment: number;
  pendingReview: number;
  demoCallRequests: number;
  expiringSoon: number;
  subscriptionRevenue: number;
  rejectedCount: number;
  newApprovals: number;
}

interface TrajectoryPoint {
  label: string;
  approvals: number;
  new_signups: number;
}

interface PlanShare {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface DemoCallItem {
  _id: string;
  name: string;
  phone: string;
  business_name?: string;
  message?: string;
  status: string;
  createdAt: string;
}

export default function SuperAdminOverviewPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalActivePharmacies: 0,
    awaitingPayment: 0,
    pendingReview: 0,
    demoCallRequests: 0,
    expiringSoon: 0,
    subscriptionRevenue: 0,
    rejectedCount: 0,
    newApprovals: 0,
  });

  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [planDistribution, setPlanDistribution] = useState<PlanShare[]>([]);
  const [totalActiveSubs, setTotalActiveSubs] = useState(0);
  const [recentDemoCalls, setRecentDemoCalls] = useState<DemoCallItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Date Filter State
  const [timeframe, setTimeframe] = useState<TimeframePreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchOverviewData = (tf: TimeframePreset = timeframe, start = customStart, end = customEnd) => {
    setLoading(true);
    let url = `/super-admin/overview?timeframe=${tf}`;
    if (tf === 'custom') {
      if (start) url += `&startDate=${start}`;
      if (end) url += `&endDate=${end}`;
    }

    api.get(url)
      .then(({ data }) => {
        if (data.success && data.data) {
          setMetrics(data.data.metrics || metrics);
          setTrajectory(data.data.trajectory || []);
          setPlanDistribution(data.data.planDistribution || []);
          setTotalActiveSubs(data.data.totalActiveSubs || 0);
          setRecentDemoCalls(data.data.recentDemoCalls || []);
        }
      })
      .catch(() => {
        toast.error('Failed to load overview analytics');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOverviewData(timeframe);
  }, [timeframe]);

  const handleApplyCustomFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      toast.error('Please specify both From and To dates');
      return;
    }
    fetchOverviewData('custom', customStart, customEnd);
  };

  const cleanPhoneForWa = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '88' + cleaned;
    } else if (!cleaned.startsWith('88') && cleaned.length === 10) {
      cleaned = '880' + cleaned;
    }
    return cleaned;
  };

  return (
    <div className="w-full space-y-8">
      {/* ── 1. Header & Date Range Filter Bar ────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>Platform Executive Dashboard</span>
              {loading && <RefreshCw size={16} className="animate-spin text-blue-600" />}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time enterprise metrics, compliance verification pipeline, and revenue insights.
            </p>
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
            {(
              [
                { id: 'all', label: 'All time' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'this_month', label: 'This Month' },
                { id: 'last_month', label: 'Last Month' },
                { id: 'this_year', label: 'This Year' },
                { id: 'custom', label: 'Custom Date' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTimeframe(item.id)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  timeframe === item.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Picker Accordion */}
        {timeframe === 'custom' && (
          <form
            onSubmit={handleApplyCustomFilter}
            className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 animate-slide-up"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Calendar size={14} className="text-blue-600" />
              <span>Custom Date Range:</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase">From:</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase">To:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                required
              />
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
            >
              Apply Filter
            </button>
          </form>
        )}
      </div>

      {/* ── 2. 8 Key Metric / KPI Cards Grid (4 Columns on Desktop) ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 2xl:gap-6">
        {/* Card 1: TOTAL ACTIVE PHARMACIES */}
        <Link
          href="/super-admin/businesses?status=APPROVED"
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors group block relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-600">
              Total Active Pharmacies
            </span>
            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.totalActivePharmacies.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <span>Paid &amp; Trial</span>
              <ArrowUpRight size={12} />
            </span>
          </div>
        </Link>

        {/* Card 2: AWAITING PAYMENT */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Awaiting Payment
            </span>
            <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.awaitingPayment.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-600 font-bold">
              Pending TrxID
            </span>
          </div>
        </div>

        {/* Card 3: PENDING REVIEW */}
        <Link
          href="/super-admin/verifications"
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 transition-colors group block relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-orange-600">
              Pending Review
            </span>
            <div className="w-9 h-9 bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.pendingReview.toLocaleString()}
            </span>
            <span className="text-[10px] text-orange-600 font-bold flex items-center gap-0.5">
              <span>KYC Awaiting</span>
              <ArrowUpRight size={12} />
            </span>
          </div>
        </Link>

        {/* Card 4: DEMO CALL REQUESTS */}
        <Link
          href="/super-admin/demo-accounts?tab=LEADS"
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors group block relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-600 flex items-center gap-1.5">
              <span>Demo Call Requests</span>
              {metrics.demoCallRequests > 0 && (
                <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-black uppercase animate-pulse">
                  New Call
                </span>
              )}
            </span>
            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <PhoneCall size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.demoCallRequests.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <span>Landing Leads</span>
              <ArrowUpRight size={12} />
            </span>
          </div>
        </Link>

        {/* Card 5: EXPIRING SOON */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Expiring Soon
            </span>
            <div className="w-9 h-9 bg-yellow-50 dark:bg-yellow-950/60 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.expiringSoon.toLocaleString()}
            </span>
            <span className="text-[10px] text-yellow-600 font-bold">
              Next 7 Days
            </span>
          </div>
        </div>

        {/* Card 6: SUBSCRIPTION REVENUE */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Subscription Revenue
            </span>
            <div className="w-9 h-9 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              ৳{metrics.subscriptionRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-purple-600 font-bold">
              Selected Time
            </span>
          </div>
        </div>

        {/* Card 7: REJECTED */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Rejected
            </span>
            <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.rejectedCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-rose-600 font-bold">
              Declined Accounts
            </span>
          </div>
        </div>

        {/* Card 8: NEW APPROVALS / SUBSCRIPTIONS */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              New Approvals / Subs
            </span>
            <div className="w-9 h-9 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.newApprovals.toLocaleString()}
            </span>
            <span className="text-[10px] text-teal-600 font-bold">
              Onboarded
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Analytics Charts (Recharts) ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Chart 1: Platform Growth (Line Chart) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} className="text-teal-600" />
                <span>Platform Growth &amp; Pharmacy Approvals</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Cumulative pharmacy onboarding trajectory over time (Teal curve #0d9488)
              </p>
            </div>
            <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-black uppercase">
              Live Trend
            </span>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-slate-900 text-white border border-slate-700 text-xs shadow-xl space-y-1">
                          <p className="font-bold text-teal-400">{label}</p>
                          <p className="font-semibold text-slate-200">
                            Approved Pharmacies: <span className="font-mono text-white">{payload[0]?.value}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="approvals"
                  stroke="#0d9488"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#0d9488' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Subscriptions by Plan (Donut Chart) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <PieIcon size={16} className="text-blue-600" />
                <span>Subscriptions by Plan</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Tier distribution and tenant market share
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {totalActiveSubs} Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 py-2">
            {/* Donut graphic */}
            <div className="sm:col-span-6 relative h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload as PlanShare;
                        return (
                          <div className="p-2 bg-slate-900 text-white text-xs border border-slate-700 shadow-md">
                            <p className="font-bold">{item.name}</p>
                            <p>{item.count} pharmacies ({item.percentage}%)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                  {totalActiveSubs}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                  Total Active Subs
                </span>
              </div>
            </div>

            {/* Right breakdown list */}
            <div className="sm:col-span-6 space-y-3">
              {planDistribution.map((plan) => (
                <div key={plan.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 inline-block" style={{ backgroundColor: plan.color }} />
                      <span>{plan.name}</span>
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {plan.count} ({plan.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${plan.percentage}%`, backgroundColor: plan.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Recent Demo Call Requests Live Table ─────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <PhoneCall size={16} className="text-emerald-600" />
              <span>Recent Inbound Demo Call Requests</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Prospective pharmacy owners who requested a direct phone demo from the landing page.
            </p>
          </div>

          <Link
            href="/super-admin/demo-accounts?tab=LEADS"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View All Leads &amp; Demos</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {recentDemoCalls.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <PhoneCall size={28} className="mx-auto mb-2 opacity-40 text-emerald-600" />
            <p className="font-semibold">No recent inbound demo call requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Prospect Name</th>
                  <th className="py-3 px-3">Phone Number</th>
                  <th className="py-3 px-3">Pharmacy Name</th>
                  <th className="py-3 px-3">Submitted Time</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Quick Contact Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {recentDemoCalls.map((lead) => {
                  const waNumber = cleanPhoneForWa(lead.phone);
                  return (
                    <tr key={lead._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {lead.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                        <a
                          href={`tel:${lead.phone}`}
                          className="hover:text-blue-600 underline font-semibold"
                          title="Call phone"
                        >
                          {lead.phone}
                        </a>
                      </td>
                      <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-semibold">
                        {lead.business_name || 'Prospect Pharmacy'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(lead.createdAt).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black uppercase ${
                            lead.status === 'CONVERTED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : lead.status === 'CALLED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                          }`}
                        >
                          {lead.status === 'PENDING_CALL' ? 'Pending Call' : lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`tel:${lead.phone}`}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Phone size={12} className="text-blue-600" />
                            <span>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                              `Hello ${lead.name}, regarding your pharmacy demo request for ${lead.business_name || 'your pharmacy'}:`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <MessageSquare size={12} />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
