'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  UtensilsCrossed,
  Users,
  Store,
  ArrowRight,
  RefreshCw,
  X,
  Copy,
  Check,
} from 'lucide-react';

interface SubscriptionData {
  restaurant: {
    _id: string;
    name: string;
    status: string;
    billing_cycle: string;
    subscription_start?: string;
    subscription_end?: string;
  };
  plan: any;
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'PENDING';
  daysRemaining: number;
  quotas: {
    tables: { used: number; max: number };
    staff: { used: number; max: number };
    branches: { used: number; max: number };
  };
}

export default function SubscriptionPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [platform, setPlatform] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Upgrade / Renewal Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedCycle, setSelectedCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<'FREE_TRIAL' | 'MANUAL_BKASH' | 'MANUAL_NAGAD'>('MANUAL_BKASH');
  const [paymentTrxId, setPaymentTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const fetchSubscription = () => {
    setLoading(true);
    api.get('/subscription/current')
      .then(({ data }) => {
        if (data.success) {
          setData(data.data);
          if (data.data.plan?._id) {
            setSelectedPlanId(data.data.plan._id);
          }
          if (data.data.restaurant?.billing_cycle) {
            setSelectedCycle(data.data.restaurant.billing_cycle);
          }
        }
      })
      .catch(() => toast.error('Failed to load subscription details'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubscription();

    // Fetch public plans & platform settings for renewal modal
    api.get('/public/plans').then(({ data }) => {
      if (data.success && Array.isArray(data.data)) setPlans(data.data);
    }).catch(() => {});

    api.get('/public/platform-settings').then(({ data }) => {
      if (data.success) setPlatform(data.data);
    }).catch(() => {});
  }, []);

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) {
      toast.error('Please choose a subscription plan.');
      return;
    }

    if (paymentMethod !== 'FREE_TRIAL') {
      if (!senderNumber.trim()) { toast.error('Sender phone number is required'); return; }
      if (!paymentTrxId.trim()) { toast.error('Transaction ID (TrxID) is required'); return; }
    }

    setSubmitting(true);
    try {
      const res = await api.post('/subscription/upgrade', {
        planId: selectedPlanId,
        billingCycle: selectedCycle,
        paymentMethod,
        paymentTrxId,
        senderNumber,
      });

      if (res.data.success) {
        toast.success('Subscription plan successfully updated!');
        setUpgradeModalOpen(false);
        fetchSubscription();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(true);
    toast.success('Number copied to clipboard!');
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const chosenPlan = plans.find((p) => p._id === selectedPlanId);
  const payableAmount = chosenPlan
    ? selectedCycle === 'ANNUAL' ? chosenPlan.annual_price : chosenPlan.monthly_price
    : 0;

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
          <RefreshCw size={18} className="animate-spin text-primary" />
          <span>Loading subscription info...</span>
        </div>
      </div>
    );
  }

  const { plan, status, daysRemaining, quotas, restaurant } = data!;

  const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
    ACTIVE: { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400', text: 'Active Plan', label: 'Running Smoothly' },
    TRIAL: { bg: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400', text: 'Free Trial', label: 'Trial Active' },
    EXPIRED: { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400', text: 'Expired', label: 'Renewal Required' },
    PENDING: { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400', text: 'Pending Approval', label: 'Under Review' },
  };

  const currentStatusStyle = statusStyles[status] || statusStyles.ACTIVE;

  // Quota percentage helper
  const calcPercent = (used: number, max: number) => {
    if (max >= 900) return 10; // unlimited
    return Math.min(100, Math.round((used / max) * 100));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface flex items-center gap-2.5">
            <CreditCard className="text-primary" size={26} />
            <span>Restaurant Subscription & Quotas</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Manage your SaaS tier, table quotas, staff limits, and renew billing cycles.
          </p>
        </div>

        <button
          onClick={() => setUpgradeModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md shadow-primary/20 hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Sparkles size={16} />
          <span>Upgrade / Renew Plan</span>
        </button>
      </div>

      {/* ── Active Plan Card ────────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-outline-variant shadow-sm relative overflow-hidden">
        {/* Glow pill */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-outline-variant">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-black text-on-surface">
                {plan?.name || 'Standard Plan'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${currentStatusStyle.bg}`}>
                {currentStatusStyle.text}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1.5 max-w-xl">
              {plan?.description || 'Your active restaurant POS subscription plan.'}
            </p>
          </div>

          {/* Days Remaining Pill */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container border border-outline-variant/60 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-on-surface leading-none">{daysRemaining}</p>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mt-1">
                Days Remaining
              </p>
            </div>
          </div>
        </div>

        {/* Plan Details & Expiration Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-on-surface-variant/70 shrink-0" />
            <div>
              <p className="text-[11px] text-on-surface-variant">Expiration Date</p>
              <p className="text-xs font-bold text-on-surface">
                {restaurant.subscription_end
                  ? new Date(restaurant.subscription_end).toLocaleDateString(undefined, { dateStyle: 'long' })
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Layers size={18} className="text-on-surface-variant/70 shrink-0" />
            <div>
              <p className="text-[11px] text-on-surface-variant">Billing Interval</p>
              <p className="text-xs font-bold text-on-surface uppercase">
                {restaurant.billing_cycle || 'MONTHLY'} (৳{restaurant.billing_cycle === 'ANNUAL' ? plan?.annual_price?.toLocaleString() : plan?.monthly_price?.toLocaleString()})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-on-surface-variant/70 shrink-0" />
            <div>
              <p className="text-[11px] text-on-surface-variant">Badge</p>
              <p className="text-xs font-bold text-primary">
                {plan?.badge || 'SaaS Plan'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quotas & Resource Usage ──────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-on-surface mb-1">Limit Quotas & Usage</h2>
        <p className="text-xs text-on-surface-variant mb-4">
          Current consumption against your subscription plan quota allowance.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tables Quota */}
          <div className="p-6 rounded-2xl bg-surface border border-outline-variant shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                <UtensilsCrossed size={18} className="text-primary" />
                <span>Dining Tables</span>
              </div>
              <span className="text-xs font-mono font-bold text-on-surface">
                {quotas.tables.used} / {quotas.tables.max >= 900 ? 'Unlimited' : quotas.tables.max}
              </span>
            </div>

            <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden mb-2">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${calcPercent(quotas.tables.used, quotas.tables.max)}%` }}
              />
            </div>

            <p className="text-[11px] text-on-surface-variant">
              {quotas.tables.max >= 900
                ? 'Unlimited tables permitted'
                : `${Math.max(0, quotas.tables.max - quotas.tables.used)} table slots remaining`}
            </p>
          </div>

          {/* Staff Accounts Quota */}
          <div className="p-6 rounded-2xl bg-surface border border-outline-variant shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                <Users size={18} className="text-indigo-500" />
                <span>Staff Accounts</span>
              </div>
              <span className="text-xs font-mono font-bold text-on-surface">
                {quotas.staff.used} / {quotas.staff.max >= 900 ? 'Unlimited' : quotas.staff.max}
              </span>
            </div>

            <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden mb-2">
              <div
                className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${calcPercent(quotas.staff.used, quotas.staff.max)}%` }}
              />
            </div>

            <p className="text-[11px] text-on-surface-variant">
              {quotas.staff.max >= 900
                ? 'Unlimited staff user seats'
                : `${Math.max(0, quotas.staff.max - quotas.staff.used)} staff seats remaining`}
            </p>
          </div>

          {/* Branches / Outlets Quota */}
          <div className="p-6 rounded-2xl bg-surface border border-outline-variant shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                <Store size={18} className="text-emerald-500" />
                <span>Branches / Outlets</span>
              </div>
              <span className="text-xs font-mono font-bold text-on-surface">
                {quotas.branches.used} / {quotas.branches.max >= 900 ? 'Unlimited' : quotas.branches.max}
              </span>
            </div>

            <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden mb-2">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${calcPercent(quotas.branches.used, quotas.branches.max)}%` }}
              />
            </div>

            <p className="text-[11px] text-on-surface-variant">
              Primary restaurant branch active
            </p>
          </div>
        </div>
      </div>

      {/* ── Included Features Checklist ─────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-surface border border-outline-variant shadow-sm">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">
          Features Included in Your Plan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plan?.features?.map((feat: string, i: number) => (
            <div key={i} className="flex items-center gap-2.5 text-xs text-on-surface font-medium">
              <CheckCircle2 size={16} className="text-primary shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Upgrade / Renewal Modal ─────────────────────────────────────── */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface border border-outline-variant rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setUpgradeModalOpen(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-on-surface mb-1">
              Upgrade or Renew Subscription
            </h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Select another tier or extend your existing billing cycle.
            </p>

            <form onSubmit={handleUpgradeSubmit} className="space-y-5 text-xs">
              {/* Billing Cycle Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container border border-outline-variant">
                <span className="font-bold text-on-surface">Billing Interval:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCycle('MONTHLY')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedCycle === 'MONTHLY' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCycle('ANNUAL')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                      selectedCycle === 'ANNUAL' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-[9px] text-white font-black">
                      Save ~17%
                    </span>
                  </button>
                </div>
              </div>

              {/* Plans Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {plans.map((p) => {
                  const price = selectedCycle === 'ANNUAL' ? p.annual_price : p.monthly_price;
                  const isSelected = selectedPlanId === p._id;
                  return (
                    <div
                      key={p._id}
                      onClick={() => setSelectedPlanId(p._id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary ring-2 ring-primary/20'
                          : 'bg-surface-container border-outline-variant hover:border-outline'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-on-surface text-sm">{p.name}</span>
                        {isSelected && <CheckCircle2 size={16} className="text-primary" />}
                      </div>
                      <p className="text-lg font-black text-on-surface">৳{price?.toLocaleString()}</p>
                      <p className="text-[10px] text-on-surface-variant">/{selectedCycle === 'ANNUAL' ? 'yr' : 'mo'}</p>
                    </div>
                  );
                })}
              </div>

              {/* Payment Info */}
              <div className="p-4 rounded-xl bg-surface-container border border-outline-variant space-y-3">
                <p className="font-bold text-on-surface">Payment Options</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MANUAL_BKASH')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      paymentMethod === 'MANUAL_BKASH' ? 'bg-pink-600 text-white' : 'bg-surface text-on-surface-variant border border-outline-variant'
                    }`}
                  >
                    bKash Send Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MANUAL_NAGAD')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      paymentMethod === 'MANUAL_NAGAD' ? 'bg-orange-600 text-white' : 'bg-surface text-on-surface-variant border border-outline-variant'
                    }`}
                  >
                    Nagad Send Money
                  </button>
                </div>

                {/* Recipient Number Box */}
                <div className="p-3 rounded-lg bg-surface border border-outline-variant flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                      Send Money ({paymentMethod === 'MANUAL_BKASH' ? 'bKash' : 'Nagad'}):
                    </p>
                    <p className="text-sm font-black text-on-surface font-mono">
                      {paymentMethod === 'MANUAL_BKASH' ? (platform?.bkash_number || '01712-345678') : (platform?.nagad_number || '01812-345678')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(paymentMethod === 'MANUAL_BKASH' ? (platform?.bkash_number || '01712-345678') : (platform?.nagad_number || '01812-345678'))}
                    className="p-1.5 rounded bg-surface-container text-on-surface text-xs font-semibold flex items-center gap-1"
                  >
                    {copiedNumber ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    <span>{copiedNumber ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-on-surface-variant font-semibold mb-1">Your Sender Number *</label>
                    <input
                      type="tel"
                      required
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="e.g. 01700-112233"
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface-variant font-semibold mb-1">Transaction ID (TrxID) *</label>
                    <input
                      type="text"
                      required
                      value={paymentTrxId}
                      onChange={(e) => setPaymentTrxId(e.target.value)}
                      placeholder="e.g. BKASH98172648"
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface text-xs font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setUpgradeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface-variant font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Processing Renewal...' : `Confirm & Renew (৳${payableAmount.toLocaleString()})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
