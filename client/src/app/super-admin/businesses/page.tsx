'use client';

import { useEffect, useState } from 'react';
import api, { getImageUrl } from '../../../lib/api';
import toast from 'react-hot-toast';
import {
  Building2,
  Search,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Play,
  Calendar,
  ExternalLink,
  Eye,
  FileText,
  CreditCard,
  Printer,
  Users,
  Layers,
  MapPin,
  Clock,
  Phone,
  Mail,
  Download,
  X,
  ShieldCheck,
  History,
  Check,
} from 'lucide-react';

type DrilldownTab = 'overview' | 'kyc' | 'ledger' | 'staff' | 'trial';
type LedgerFilter = 'all' | 'this_year' | 'upcoming' | 'paid' | 'overdue';

export default function BusinessesDirectoryPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Drilldown View State
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DrilldownTab>('overview');
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>('all');

  const fetchBusinesses = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.append('status', statusFilter);
    if (planFilter !== 'ALL') params.append('plan', planFilter);
    if (searchTerm.trim()) params.append('search', searchTerm.trim());

    api.get(`/super-admin/businesses?${params.toString()}`)
      .then(({ data }) => {
        if (data.success && Array.isArray(data.data)) {
          setBusinesses(data.data);
        }
      })
      .catch(() => toast.error('Failed to load businesses directory'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/super-admin/plans').then(({ data }) => {
      if (data.success && Array.isArray(data.data)) setPlans(data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [statusFilter, planFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBusinesses();
  };

  const handleOpenDetail = (id: string) => {
    setSelectedBusinessId(id);
    setDetailLoading(true);
    setActiveTab('overview');

    api.get(`/super-admin/businesses/${id}`)
      .then(({ data }) => {
        if (data.success) {
          setDetailData(data.data);
        }
      })
      .catch(() => {
        toast.error('Failed to load business details');
        setSelectedBusinessId(null);
      })
      .finally(() => setDetailLoading(false));
  };

  const handleToggleStatus = async (business: any) => {
    const nextStatus = business.status === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';
    setActionLoadingId(business._id);
    try {
      const res = await api.patch(`/super-admin/businesses/${business._id}/status`, {
        status: nextStatus,
      });
      if (res.data.success) {
        toast.success(`Pharmacy "${business.name}" ${nextStatus === 'APPROVED' ? 'Re-activated' : 'Suspended'}`);
        fetchBusinesses();
        if (selectedBusinessId === business._id) {
          handleOpenDetail(business._id);
        }
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePrintReceipt = (cycle: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print receipt');
      return;
    }

    const business = detailData?.business;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${cycle.cycle_number} - ${business?.name || 'SaaS'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 24px; font-weight: 900; }
          .badge { background: #0f172a; color: white; padding: 4px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
          .meta { margin-bottom: 20px; font-size: 13px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
          th { background: #f8fafc; font-weight: bold; text-transform: uppercase; font-size: 11px; }
          .total { font-size: 16px; font-weight: bold; text-align: right; }
          .footer { margin-top: 50px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">OFFICIAL SUBSCRIPTION INVOICE</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Billing Cycle: ${cycle.cycle_number}</div>
          </div>
          <span class="badge">${cycle.status}</span>
        </div>

        <div class="meta">
          <strong>Pharmacy Tenant:</strong> ${business?.name}<br/>
          <strong>Owner:</strong> ${business?.owner_name} (${business?.email})<br/>
          <strong>Drug License:</strong> ${business?.drug_license_number || 'N/A'}<br/>
          <strong>Coverage Period:</strong> ${cycle.coverage_dates}<br/>
          <strong>Payment Method:</strong> ${cycle.payment_method} | TrxID: ${cycle.trx_id}
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Billing Frequency</th>
              <th>Base Fee</th>
              <th>Extra / License Fee</th>
              <th style="text-align: right;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${cycle.plan_name} SaaS Access</td>
              <td>${cycle.billing_cycle}</td>
              <td>৳${cycle.base_fee?.toLocaleString()}</td>
              <td>${cycle.extra_fee_label || 'None'}</td>
              <td style="text-align: right; font-weight: bold;">৳${cycle.total_payable?.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="total">
          Total Paid: ৳${cycle.total_payable?.toLocaleString()} BDT
        </div>

        <div class="footer">
          Generated automatically by Pharmacy SaaS Platform Management Engine. This is a computer-verified digital receipt.
        </div>
        <script>
          window.print();
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="w-full space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 size={22} className="text-blue-600" />
            <span>Business / Pharmacy Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, search, inspect KYC compliance, and audit 12-month billing ledgers across all tenants.
          </p>
        </div>

        <button
          onClick={fetchBusinesses}
          className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* ── Filter Toolbar ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by pharmacy name, owner, email, drug license..."
            className="w-full pl-9 pr-20 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <button
            type="submit"
            className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved / Active</option>
            <option value="PENDING">Pending Review</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Plan filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 font-semibold"
          >
            <option value="ALL">All Plans</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Directory Table ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {businesses.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Building2 size={36} className="mx-auto mb-2 opacity-30 text-blue-600" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No businesses match your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">Pharmacy / Business</th>
                  <th className="py-3 px-4">Authorized Owner</th>
                  <th className="py-3 px-4">Plan &amp; Mode</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {businesses.map((b) => {
                  const plan = b.plan_id;
                  const isDemo = b.is_demo || b.payment_method === 'FREE_TRIAL';
                  return (
                    <tr key={b._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 dark:text-white text-sm">
                            {b.name}
                          </span>
                          {isDemo && (
                            <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 text-[9px] font-black uppercase">
                              Demo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-xs">{b.address}</p>
                      </td>

                      <td className="py-4 px-4 space-y-0.5">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{b.owner_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{b.contact_number}</p>
                      </td>

                      <td className="py-4 px-4 space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white">{plan?.name || 'Standard'}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">
                          {b.billing_cycle} • {isDemo ? 'Trial Tier' : 'Paid'}
                        </p>
                      </td>

                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        {new Date(b.createdAt).toLocaleDateString('en-GB')}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black uppercase ${
                            b.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : b.status === 'SUSPENDED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(b._id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm flex items-center gap-1"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(b)}
                            disabled={actionLoadingId === b._id}
                            className={`p-1.5 border text-xs font-bold transition-colors cursor-pointer ${
                              b.status === 'SUSPENDED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-rose-600'
                            }`}
                            title={b.status === 'SUSPENDED' ? 'Re-activate' : 'Suspend Tenant'}
                          >
                            {b.status === 'SUSPENDED' ? <Play size={13} /> : <Ban size={13} />}
                          </button>
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

      {/* ── BusinessDetailView Modal (4 Core Tabs + 1 Conditional) ─────── */}
      {selectedBusinessId && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 text-white flex items-center justify-center font-black">
                  <Building2 size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    {detailData?.business?.name || 'Pharmacy Drilldown View'}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Owner: {detailData?.business?.owner_name} • Email: {detailData?.business?.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedBusinessId(null);
                  setDetailData(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs (4 Core + 1 Conditional for Trials) */}
            <div className="px-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto scroll-hide">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Tab 1: Overview &amp; Profile
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('kyc')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'kyc'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Tab 2: Compliance Docs (KYC)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ledger')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'ledger'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Tab 3: 1-Year Billing Ledger
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('staff')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'staff'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Tab 4: Branches &amp; Staff
              </button>

              {/* Conditional Tab 5: Free Trial Usage & History */}
              {detailData?.business?.is_demo && (
                <button
                  type="button"
                  onClick={() => setActiveTab('trial')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'trial'
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-emerald-700 hover:text-emerald-900'
                  }`}
                >
                  <History size={13} />
                  <span>Tab 5: Free Trial Usage</span>
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 space-y-6">
              {detailLoading || !detailData ? (
                <div className="py-20 text-center">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Loading details...</p>
                </div>
              ) : (
                <>
                  {/* ── TAB 1: Overview & Profile ────────────────────────────── */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Top 4 Metric Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Plan</span>
                          <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                            {detailData.overview.plan_name}
                          </p>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold uppercase mt-1 inline-block">
                            {detailData.overview.plan_badge}
                          </span>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Days Left</span>
                          <p className="text-lg font-black text-emerald-600 mt-1">
                            {detailData.overview.days_left} Days
                          </p>
                          <span className="text-[10px] text-slate-500">Until subscription renewal</span>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Branch Quota</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {detailData.overview.branch_quota.used} / {detailData.overview.branch_quota.max} Outlets
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
                            <div
                              className="h-full bg-blue-600"
                              style={{ width: `${detailData.overview.branch_quota.percentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {detailData.overview.branch_quota.percentage}% quota consumed
                          </span>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Staff Quota</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {detailData.overview.staff_quota.used} / {detailData.overview.staff_quota.max} Users
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
                            <div
                              className="h-full bg-emerald-600"
                              style={{ width: `${detailData.overview.staff_quota.percentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {detailData.overview.staff_quota.percentage}% quota consumed
                          </span>
                        </div>
                      </div>

                      {/* 2-Column Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Legal Pharmacy Info */}
                        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                            Legal Pharmacy Information
                          </h4>
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Registered Legal Name</span>
                              <span className="font-bold text-slate-900 dark:text-white">{detailData.business.name}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Drug License Number</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {detailData.business.drug_license_number || 'DGDA-NOT-PROVIDED'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Trade License Number</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {detailData.business.trade_license_number || 'TRAD-NOT-PROVIDED'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Physical Address</span>
                              <span className="text-slate-800 dark:text-slate-200">{detailData.business.address}</span>
                            </div>
                          </div>
                        </div>

                        {/* Authorized Owner Info */}
                        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                            Authorized Owner &amp; Billing Contact
                          </h4>
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Owner Full Name</span>
                              <span className="font-bold text-slate-900 dark:text-white">{detailData.business.owner_name}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Contact Phone</span>
                              <span className="font-mono font-bold text-blue-600">{detailData.business.contact_number}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Official Email</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">{detailData.business.email}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">National ID (NID)</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {detailData.business.nid_number || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── TAB 2: Compliance Documents (KYC) ───────────────────── */}
                  {activeTab === 'kyc' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            title: 'Drug License Copy (ঔষধ প্রশাসন ড্রাগ লাইসেন্স)',
                            doc: detailData.business.drug_license_doc,
                            number: detailData.business.drug_license_number,
                          },
                          {
                            title: 'Trade License (ট্রেড লাইসেন্স)',
                            doc: detailData.business.trade_license_doc,
                            number: detailData.business.trade_license_number,
                          },
                          {
                            title: 'National ID (NID) Front Side',
                            doc: detailData.business.nid_front_doc,
                            number: detailData.business.nid_number,
                          },
                          {
                            title: 'National ID (NID) Back Side',
                            doc: detailData.business.nid_back_doc,
                            number: detailData.business.nid_number,
                          },
                        ].map((card, idx) => {
                          const url = card.doc ? getImageUrl(card.doc) : '';
                          const isPdf = url.toLowerCase().endsWith('.pdf');

                          return (
                            <div
                              key={idx}
                              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-black text-slate-900 dark:text-white">{card.title}</h5>
                                {url && (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-[11px] font-bold flex items-center gap-1"
                                  >
                                    <Download size={12} />
                                    <span>Download</span>
                                  </a>
                                )}
                              </div>

                              <div className="h-44 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                                {url ? (
                                  isPdf ? (
                                    <iframe src={url} title={card.title} className="w-full h-full border-0" />
                                  ) : (
                                    <img
                                      src={url}
                                      alt={card.title}
                                      className="max-w-full max-h-full object-contain p-1"
                                    />
                                  )
                                ) : (
                                  <div className="text-center text-slate-400 text-xs">
                                    <FileText size={28} className="mx-auto mb-1 opacity-40" />
                                    <span>No Document Uploaded</span>
                                  </div>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-500 font-mono">
                                Registered Doc No: {card.number || 'N/A'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── TAB 3: 1-Year Billing Ledger ────────────────────────── */}
                  {activeTab === 'ledger' && (
                    <div className="space-y-4">
                      {/* Filter Bar */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 text-xs">
                          {(
                            [
                              { id: 'all', label: '1 Year Full' },
                              { id: 'this_year', label: 'This Year' },
                              { id: 'upcoming', label: 'Upcoming Cycles' },
                              { id: 'paid', label: 'Paid Only' },
                              { id: 'overdue', label: 'Overdue / Pending' },
                            ] as const
                          ).map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setLedgerFilter(f.id)}
                              className={`px-2.5 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                                ledgerFilter === f.id
                                  ? 'bg-blue-600 text-white'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>

                        <span className="text-xs text-slate-500 font-semibold">
                          12-Month Projected Cycle Schedule
                        </span>
                      </div>

                      {/* Ledger Table */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                              <th className="py-2.5 px-3">Cycle</th>
                              <th className="py-2.5 px-3">Plan</th>
                              <th className="py-2.5 px-3">Coverage Period</th>
                              <th className="py-2.5 px-3">Base Fee</th>
                              <th className="py-2.5 px-3">Extra / License</th>
                              <th className="py-2.5 px-3">Payable</th>
                              <th className="py-2.5 px-3">Payment Info</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Invoice</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                            {detailData.billingLedger
                              ?.filter((c: any) => {
                                if (ledgerFilter === 'paid') return c.status === 'Paid';
                                if (ledgerFilter === 'upcoming') return c.status === 'Upcoming';
                                if (ledgerFilter === 'overdue') return c.status.includes('Overdue');
                                return true;
                              })
                              .map((cycle: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                    {cycle.cycle_number}
                                  </td>
                                  <td className="py-2.5 px-3">{cycle.plan_name}</td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                                    {cycle.coverage_dates}
                                  </td>
                                  <td className="py-2.5 px-3">৳{cycle.base_fee?.toLocaleString()}</td>
                                  <td className="py-2.5 px-3 text-amber-600 font-semibold">
                                    {cycle.extra_fee_label}
                                  </td>
                                  <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">
                                    ৳{cycle.total_payable?.toLocaleString()}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                                    {cycle.trx_id}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`px-2 py-0.5 text-[9px] font-black uppercase ${
                                        cycle.status === 'Paid'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : cycle.status === 'Active Trial'
                                          ? 'bg-blue-100 text-blue-800'
                                          : cycle.status === 'Upcoming'
                                          ? 'bg-slate-100 text-slate-700'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {cycle.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handlePrintReceipt(cycle)}
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-[10px] uppercase flex items-center gap-1 ml-auto cursor-pointer"
                                    >
                                      <Printer size={11} />
                                      <span>Print</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── TAB 4: Branches & Staff ─────────────────────────────── */}
                  {activeTab === 'staff' && (
                    <div className="space-y-6">
                      {/* Branches */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          Registered Outlets / Branches
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(detailData.business.branches || []).map((br: any, i: number) => (
                            <div
                              key={i}
                              className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{br.name}</span>
                                  {br.is_main && (
                                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[9px] font-black uppercase">
                                      Main
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500">{br.address}</p>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400">{br.phone}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Staff */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          Authorized Staff &amp; Pharmacist Accounts
                        </h4>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-bold">
                              <tr>
                                <th className="p-3">Staff Name</th>
                                <th className="p-3">Email Address</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Contact</th>
                                <th className="p-3">Active Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {(detailData.users || []).map((u: any) => (
                                <tr key={u._id}>
                                  <td className="p-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                                  <td className="p-3 font-mono text-slate-500">{u.email}</td>
                                  <td className="p-3 font-bold uppercase text-[10px] text-blue-600">
                                    {u.role}
                                  </td>
                                  <td className="p-3 font-mono">{u.phone || 'N/A'}</td>
                                  <td className="p-3">
                                    <span
                                      className={`px-2 py-0.5 text-[9px] font-black uppercase ${
                                        u.isActive
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {u.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── TAB 5: Free Trial Usage (Conditional) ───────────────── */}
                  {activeTab === 'trial' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Sessions</span>
                          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                            {detailData.trialUsage.totalSessions} Sessions
                          </p>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Usage Duration</span>
                          <p className="text-xl font-black text-emerald-600 mt-1">
                            {detailData.trialUsage.formattedDuration}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-bold">
                            <tr>
                              <th className="p-3">Session Start</th>
                              <th className="p-3">Duration</th>
                              <th className="p-3">IP Address</th>
                              <th className="p-3">Device / Browser</th>
                              <th className="p-3">Pages Visited</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {(detailData.trialUsage.sessions || []).map((s: any, idx: number) => (
                              <tr key={idx}>
                                <td className="p-3 font-mono">
                                  {new Date(s.start_time).toLocaleString('en-GB')}
                                </td>
                                <td className="p-3 font-bold text-slate-900 dark:text-white">
                                  {Math.round((s.duration_seconds || 3600) / 60)} mins
                                </td>
                                <td className="p-3 font-mono text-slate-500">{s.ip}</td>
                                <td className="p-3 text-slate-700 dark:text-slate-300">{s.device}</td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">
                                  {(s.pages_visited || ['/pos', '/dashboard']).join(', ')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => {
                  setSelectedBusinessId(null);
                  setDetailData(null);
                }}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs uppercase"
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
