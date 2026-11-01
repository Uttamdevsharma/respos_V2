'use client';

import { useEffect, useState } from 'react';
import api, { getImageUrl } from '../../../lib/api';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  Clock,
  Check,
  X,
  ExternalLink,
  Eye,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CreditCard,
  MapPin,
  MessageSquare,
  History,
  Phone,
  Calendar,
  Download,
  FileCheck,
  Sparkles,
} from 'lucide-react';

type VerificationTab = 'all' | 'demo' | 'upgrades';
type DatePreset = 'all' | 'today' | 'yesterday' | 'this_month' | 'this_year' | 'custom';

export default function PendingVerificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [demoCount, setDemoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<VerificationTab>('all');
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState<DatePreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Modals State
  const [inspectItem, setInspectItem] = useState<any | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<'nidFront' | 'nidBack' | 'trade' | 'drug' | 'payment'>('nidFront');
  const [usageItem, setUsageItem] = useState<any | null>(null);
  const [rejectItem, setRejectItem] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVerifications = (
    currentTab = tab,
    term = search,
    tf = timeframe,
    start = customStart,
    end = customEnd
  ) => {
    setLoading(true);
    let url = `/super-admin/verifications?tab=${currentTab}&timeframe=${tf}`;
    if (term) url += `&search=${encodeURIComponent(term)}`;
    if (tf === 'custom') {
      if (start) url += `&startDate=${start}`;
      if (end) url += `&endDate=${end}`;
    }

    api.get(url)
      .then(({ data }) => {
        if (data.success) {
          const list = Array.isArray(data.data?.items) ? data.data.items : Array.isArray(data.data) ? data.data : [];
          setItems(list);
          if (data.data?.demoCount !== undefined) {
            setDemoCount(data.data.demoCount);
          }
        }
      })
      .catch(() => {
        toast.error('Failed to load verification requests');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVerifications(tab, search, timeframe);
  }, [tab, timeframe]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVerifications(tab, search, timeframe, customStart, customEnd);
  };

  const handleApprove = async (id: string, name: string) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/super-admin/verifications/${id}/approve`);
      if (res.data.success) {
        toast.success(res.data.message || `Pharmacy "${name}" verified & approved!`);
        setInspectItem(null);
        fetchVerifications();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectItem) return;
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post(`/super-admin/verifications/${rejectItem._id}/reject`, {
        reason: rejectReason.trim(),
      });
      if (res.data.success) {
        toast.success(`Application for "${rejectItem.name}" marked as rejected.`);
        setRejectItem(null);
        setRejectReason('');
        setInspectItem(null);
        fetchVerifications();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  const cleanPhoneForWa = (phone: string) => {
    let cleaned = (phone || '').replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) cleaned = '88' + cleaned;
    else if (!cleaned.startsWith('88') && cleaned.length === 10) cleaned = '880' + cleaned;
    return cleaned;
  };

  return (
    <div className="w-full space-y-6">
      {/* ── 1. Top Mode Switcher Tabs ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Pending Requests &amp; Verifications</span>
            {loading && <RefreshCw size={16} className="animate-spin text-blue-600" />}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review applicant pharmacy KYC documents, verify payment proofs, and provision tenant instances.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              tab === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Registrations
          </button>

          <button
            type="button"
            onClick={() => setTab('demo')}
            className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              tab === 'demo'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Free Demo Requests</span>
            {demoCount > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 text-[10px] font-black">
                {demoCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('upgrades')}
            className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              tab === 'upgrades'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Plan Upgrades &amp; Renewals
          </button>
        </div>
      </div>

      {/* ── 2. Modern Filter Toolbar ────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by pharmacy name, owner, NID, or email..."
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

          {/* Date presets */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'this_month', label: 'This Month' },
                { id: 'this_year', label: 'This Year' },
                { id: 'custom', label: 'Custom' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTimeframe(item.id)}
                className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                  timeframe === item.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date range inline inputs */}
        {timeframe === 'custom' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Calendar size={13} className="text-blue-600" /> Date Range:
            </span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => fetchVerifications(tab, search, 'custom', customStart, customEnd)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Data Table ───────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {items.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <ShieldAlert size={36} className="mx-auto opacity-40 text-blue-600" />
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
              No pending verification requests found.
            </p>
            <p className="text-[11px] text-slate-500">
              All registrations are currently up to date!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">Business Profile</th>
                  <th className="py-3 px-4">Authorized Owner</th>
                  <th className="py-3 px-4">KYC Credentials</th>
                  <th className="py-3 px-4">Selected Plan &amp; Payable</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {items.map((item) => {
                  const plan = item.plan_id;
                  const isDemo = item.is_demo || item.payment_method === 'FREE_TRIAL';
                  const waNumber = cleanPhoneForWa(item.contact_number);
                  const price = item.billing_cycle === 'ANNUAL' ? plan?.annual_price : plan?.monthly_price;
                  const payable = isDemo ? 0 : (price || 0) + 5000; // 5,000 License fee for paid

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. Business Profile */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 dark:text-white text-sm">
                            {item.name}
                          </span>
                          {isDemo && (
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase">
                              Free Demo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs">{item.address}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Applied: {new Date(item.createdAt).toLocaleDateString('en-GB')}
                        </p>
                      </td>

                      {/* 2. Authorized Owner */}
                      <td className="py-4 px-4 space-y-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {item.owner_name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono truncate max-w-xs">
                          {item.email}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                            {item.contact_number}
                          </span>
                          <a
                            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                              `Hello ${item.owner_name}, regarding your pharmacy account verification for ${item.name}:`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare size={12} />
                          </a>
                        </div>
                      </td>

                      {/* 3. KYC Credentials */}
                      <td className="py-4 px-4 space-y-1.5">
                        {isDemo ? (
                          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                            ⚡ Quick Demo Registration
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-[11px] text-slate-600 dark:text-slate-300">
                              <span className="text-slate-400 font-bold uppercase text-[9px] mr-1">NID:</span>
                              <span className="font-mono">{item.nid_number || 'Not provided'}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300">
                              <span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Trade Lic:</span>
                              <span className="font-mono">{item.trade_license_number || 'Not provided'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setInspectItem(item);
                                setActiveDocTab('nidFront');
                              }}
                              className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Eye size={11} />
                              <span>Inspect Docs</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 4. Selected Plan & Payable */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {plan?.name || 'Standard Tier'}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            ({item.billing_cycle})
                          </span>
                        </div>

                        {isDemo ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[9px] font-bold uppercase">
                              14 Days Demo
                            </span>
                            <span className="text-xs font-black text-emerald-600">৳0 (Free)</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-xs font-black text-slate-900 dark:text-white">
                              Payable: ৳{payable.toLocaleString()}{' '}
                              <span className="text-[10px] text-slate-400 font-normal">
                                (incl. ৳5k license)
                              </span>
                            </p>
                            {item.payment_trx_id && (
                              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                                TrxID: {item.payment_trx_id}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 5. Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black uppercase ${
                            item.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.status === 'PENDING' ? 'PENDING REVIEW' : item.status}
                        </span>
                      </td>

                      {/* 6. Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDemo && (
                            <button
                              type="button"
                              onClick={() => setUsageItem(item)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                              title="Usage History"
                            >
                              <History size={13} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleApprove(item._id, item.name)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1"
                          >
                            <Check size={12} />
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRejectItem(item)}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
                          >
                            <X size={12} />
                            <span>Reject</span>
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

      {/* ── Document Inspection Modal ────────────────────────────────────── */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCheck size={16} className="text-blue-600" />
                  <span>Inspect Compliance Documents: {inspectItem.name}</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Owner: {inspectItem.owner_name} • Phone: {inspectItem.contact_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Document Tabs */}
            <div className="px-4 pt-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              {(
                [
                  { id: 'nidFront', label: 'NID Front' },
                  { id: 'nidBack', label: 'NID Back' },
                  { id: 'trade', label: 'Trade License' },
                  { id: 'drug', label: 'Drug License' },
                  { id: 'payment', label: 'Payment Slip' },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setActiveDocTab(d.id)}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    activeDocTab === d.id
                      ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Document Preview Space */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center min-h-[350px]">
              {(() => {
                let url = '';
                let label = '';
                if (activeDocTab === 'nidFront') {
                  url = inspectItem.nid_front_doc;
                  label = `National ID (Front) — No: ${inspectItem.nid_number || 'N/A'}`;
                } else if (activeDocTab === 'nidBack') {
                  url = inspectItem.nid_back_doc;
                  label = `National ID (Back)`;
                } else if (activeDocTab === 'trade') {
                  url = inspectItem.trade_license_doc;
                  label = `Trade License — No: ${inspectItem.trade_license_number || 'N/A'}`;
                } else if (activeDocTab === 'drug') {
                  url = inspectItem.drug_license_doc;
                  label = `Drug License — No: ${inspectItem.drug_license_number || 'N/A'}`;
                } else if (activeDocTab === 'payment') {
                  url = inspectItem.payment_screenshot;
                  label = `Payment Proof Slip — TrxID: ${inspectItem.payment_trx_id || 'N/A'}`;
                }

                const fullUrl = url ? getImageUrl(url) : '';
                const isPdf = fullUrl.toLowerCase().endsWith('.pdf');

                if (!fullUrl) {
                  return (
                    <div className="text-center py-12 text-slate-400">
                      <FileText size={42} className="mx-auto mb-2 opacity-30" />
                      <p className="font-bold text-sm">No document uploaded for this slot.</p>
                      <p className="text-xs text-slate-500 mt-1">{label}</p>
                    </div>
                  );
                }

                return (
                  <div className="w-full flex flex-col items-center space-y-4">
                    <div className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{label}</span>
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Download size={13} />
                        <span>Open / Download File</span>
                      </a>
                    </div>

                    <div className="w-full max-h-[480px] overflow-auto flex items-center justify-center border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-inner">
                      {isPdf ? (
                        <iframe src={fullUrl} title={label} className="w-full h-[450px] border-0" />
                      ) : (
                        <img src={fullUrl} alt={label} className="max-w-full max-h-[450px] object-contain shadow-sm" />
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Quick Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <span className="text-xs text-slate-500">
                Decision for: <strong className="text-slate-900 dark:text-white">{inspectItem.name}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectItem(inspectItem);
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 font-bold text-xs uppercase"
                >
                  Reject Application
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(inspectItem._id, inspectItem.name)}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase shadow-sm flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Confirm &amp; Approve</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Rejection Reason Dialog Modal ───────────────────────────────── */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 text-rose-600">
              <AlertTriangle size={16} />
              <span>Reject Application: {rejectItem.name}</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Please state why this application cannot be approved. An email containing this explanation will automatically be sent to <strong>{rejectItem.email}</strong>.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Trade license number is expired or NID photo is blurred. Please resubmit."
              rows={4}
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-600"
              required
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectItem(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Demo Trial Usage History Modal ──────────────────────────────── */}
      {usageItem && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <History size={16} className="text-blue-600" />
                  <span>Free Trial Session Logs: {usageItem.name}</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  IP tracking and engagement duration during trial period
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUsageItem(null)}
                className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Sessions</span>
                  <span className="font-black text-slate-900 dark:text-white text-base">
                    {usageItem.trial_sessions?.length || 1}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Trial Window</span>
                  <span className="font-black text-emerald-600 text-base">
                    14 Days Active
                  </span>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2.5">Start Time</th>
                      <th className="p-2.5">Duration</th>
                      <th className="p-2.5">IP Address</th>
                      <th className="p-2.5">Pages Visited</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                    {(usageItem.trial_sessions || []).map((s: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-mono">
                          {new Date(s.start_time).toLocaleString('en-GB')}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                          {Math.round((s.duration_seconds || 3600) / 60)} mins
                        </td>
                        <td className="p-2.5 font-mono text-slate-500">{s.ip || '103.145.23.12'}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">
                          {(s.pages_visited || ['/pos', '/dashboard']).join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setUsageItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
