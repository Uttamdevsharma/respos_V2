'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  RefreshCw,
  X,
  Sparkles,
  PhoneCall,
  Clock,
  ShieldCheck,
  Percent,
  Coins,
  Building2,
  Users,
} from 'lucide-react';

type PlanMode = 'TRIAL' | 'PAID' | 'CUSTOM';

export default function PlansManagementPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // 3 Modes: 'TRIAL' | 'PAID' | 'CUSTOM'
  const [planMode, setPlanMode] = useState<PlanMode>('PAID');

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  
  // Paid Mode Fields
  const [monthlyPrice, setMonthlyPrice] = useState<number | string>(1200);
  const [annualPricingType, setAnnualPricingType] = useState<'DISCOUNT' | 'FIXED'>('DISCOUNT');
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [annualPrice, setAnnualPrice] = useState<number | string>(11520);

  // Trial Mode Fields
  const [trialDays, setTrialDays] = useState<number>(14);

  // Custom Pricing Fields
  const [contactPhone, setContactPhone] = useState('01973590937');

  // Quotas & Flags
  const [maxBranches, setMaxBranches] = useState<number | string>(1);
  const [maxStaff, setMaxStaff] = useState<number | string>(3);
  const [maxTables, setMaxTables] = useState<number | string>(10);
  const [featuresText, setFeaturesText] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const fetchPlans = () => {
    setLoading(true);
    api.get('/super-admin/plans')
      .then(({ data }) => {
        if (data.success && Array.isArray(data.data)) {
          setPlans(data.data);
        }
      })
      .catch(() => toast.error('Failed to load subscription plans'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Recalculate annual price when monthlyPrice or discountPercent changes in DISCOUNT mode
  useEffect(() => {
    if (annualPricingType === 'DISCOUNT' && planMode === 'PAID') {
      const m = Number(monthlyPrice) || 0;
      const calculated = Math.round(m * 12 * (1 - (discountPercent || 0) / 100));
      setAnnualPrice(calculated);
    }
  }, [monthlyPrice, discountPercent, annualPricingType, planMode]);

  const openCreateModal = (mode: PlanMode = 'PAID') => {
    setEditingPlan(null);
    setPlanMode(mode);
    
    if (mode === 'TRIAL') {
      setName('Free Trial (14 Days)');
      setDescription('14-day full access demo for pharmacy owners to test sales & inventory.');
      setBadge('14 Days Free');
      setTrialDays(14);
      setMonthlyPrice(0);
      setAnnualPrice(0);
    } else if (mode === 'CUSTOM') {
      setName('Enterprise Custom');
      setDescription('For hospital networks, chain pharmacies, and multi-branch operations.');
      setBadge('Enterprise');
      setContactPhone('01973590937');
      setMonthlyPrice(0);
      setAnnualPrice(0);
    } else {
      setName('Growth Plan');
      setDescription('Standard tier for growing community pharmacies with active billing.');
      setBadge('Most Popular');
      setMonthlyPrice(1200);
      setDiscountPercent(20);
      setAnnualPrice(11520);
      setAnnualPricingType('DISCOUNT');
    }

    setMaxBranches(mode === 'CUSTOM' ? 10 : 1);
    setMaxStaff(mode === 'CUSTOM' ? 25 : 3);
    setMaxTables(10);
    setFeaturesText(
      'Realtime Cloud POS & Billing\nInventory & Batch Expiry Tracking\nPurchase & Supplier Ledger\nThermal Slip & Barcode Printing\nDaily Cash & Profit Reports'
    );
    setIsPopular(mode === 'PAID');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (plan: any) => {
    setEditingPlan(plan);
    
    if (plan.is_trial_tier) {
      setPlanMode('TRIAL');
    } else if (plan.is_custom_pricing) {
      setPlanMode('CUSTOM');
    } else {
      setPlanMode('PAID');
    }

    setName(plan.name || '');
    setDescription(plan.description || '');
    setBadge(plan.badge || '');
    setMonthlyPrice(plan.monthly_price ?? 0);
    setAnnualPrice(plan.annual_price ?? 0);
    setAnnualPricingType('FIXED');
    setTrialDays(plan.trial_days ?? 14);
    setContactPhone(plan.contact_phone || '01973590937');
    setMaxBranches(plan.max_branches ?? 1);
    setMaxStaff(plan.max_staff ?? 3);
    setMaxTables(plan.max_tables ?? 10);
    setFeaturesText(Array.isArray(plan.features) ? plan.features.join('\n') : '');
    setIsPopular(Boolean(plan.is_popular));
    setIsActive(plan.is_active ?? true);
    setModalOpen(true);
  };

  const handleModeChange = (newMode: PlanMode) => {
    setPlanMode(newMode);
    if (newMode === 'TRIAL') {
      if (!name || name.includes('Plan') || name.includes('Enterprise')) {
        setName(`Free Trial (${trialDays} Days)`);
      }
      setMonthlyPrice(0);
      setAnnualPrice(0);
    } else if (newMode === 'CUSTOM') {
      if (!name || name.includes('Trial')) {
        setName('Enterprise Custom');
      }
      setMonthlyPrice(0);
      setAnnualPrice(0);
    } else {
      if (!name || name.includes('Trial') || name.includes('Enterprise')) {
        setName('Growth Plan');
      }
      if (Number(monthlyPrice) === 0) {
        setMonthlyPrice(1200);
      }
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Plan name is required');
      return;
    }

    setSaving(true);
    const parsedFeatures = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const isTrial = planMode === 'TRIAL';
    const isCustom = planMode === 'CUSTOM';

    const payload = {
      name: name.trim(),
      description: description.trim(),
      badge: badge.trim(),
      monthly_price: isTrial || isCustom ? 0 : Number(monthlyPrice) || 0,
      annual_price: isTrial || isCustom ? 0 : Number(annualPrice) || 0,
      trial_days: isTrial ? Number(trialDays) || 14 : 0,
      is_trial_tier: isTrial,
      is_custom_pricing: isCustom,
      contact_phone: isCustom ? contactPhone.trim() : undefined,
      max_branches: Number(maxBranches) || 1,
      max_staff: Number(maxStaff) || 3,
      max_tables: Number(maxTables) || 10,
      features: parsedFeatures,
      is_popular: Boolean(isPopular),
      is_active: Boolean(isActive),
    };

    try {
      if (editingPlan) {
        const { data } = await api.put(`/super-admin/plans/${editingPlan._id}`, payload);
        if (data.success) {
          toast.success('Subscription plan updated!');
          setModalOpen(false);
          fetchPlans();
        }
      } else {
        const { data } = await api.post('/super-admin/plans', payload);
        if (data.success) {
          toast.success('New subscription plan created!');
          setModalOpen(false);
          fetchPlans();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save subscription plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id: string, planName: string) => {
    if (!window.confirm(`Are you sure you want to delete the plan "${planName}"?`)) return;
    try {
      const res = await api.delete(`/super-admin/plans/${id}`);
      if (res.data.success) {
        toast.success(`Plan "${planName}" deleted`);
        fetchPlans();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl 2xl:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Subscription Plans Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure Free Trial Tiers, Regular Paid SaaS Packages, and Enterprise Custom Tiers with quota limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openCreateModal('TRIAL')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Sparkles size={14} />
            <span>+ Free Trial Tier</span>
          </button>
          <button
            onClick={() => openCreateModal('PAID')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            <span>Create Paid Plan</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw size={24} className="animate-spin text-teal-500 mx-auto mb-2" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Layers size={36} className="text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No subscription plans found.</p>
          <button
            onClick={() => openCreateModal('PAID')}
            className="mt-4 px-4 py-2 bg-teal-600 text-white text-xs font-bold"
          >
            Create Initial Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isTrial = plan.is_trial_tier;
            const isCustom = plan.is_custom_pricing;

            return (
              <div
                key={plan._id}
                className={`p-6 bg-white dark:bg-slate-900 border flex flex-col justify-between transition-all relative ${
                  plan.is_popular
                    ? 'border-teal-500 dark:border-teal-500 ring-1 ring-teal-500/30'
                    : plan.is_active
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-slate-200 dark:border-slate-800/40 opacity-60'
                }`}
              >
                {/* Badges & Mode indicators */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isTrial ? (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={11} />
                        {plan.trial_days || 14} Days Trial
                      </span>
                    ) : isCustom ? (
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider">
                        Enterprise Custom
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider">
                        Paid Tier
                      </span>
                    )}

                    {plan.is_popular && (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                        ⭐ Most Popular
                      </span>
                    )}

                    {plan.badge && !plan.is_popular && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      plan.is_active
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {plan.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px] leading-relaxed">
                    {plan.description || 'Pharmacy POS & inventory management system package.'}
                  </p>

                  {/* Price Box */}
                  <div className="mt-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    {isTrial ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">৳0</span>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                          Free for {plan.trial_days || 14} Days
                        </span>
                      </div>
                    ) : isCustom ? (
                      <div>
                        <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                          Custom / Contact Sales
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                          <PhoneCall size={12} className="text-emerald-600" />
                          <span>WhatsApp / Call:</span>
                          <a
                            href={`https://wa.me/88${plan.contact_phone || '01973590937'}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
                          >
                            {plan.contact_phone || '01973590937'}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">
                          ৳{Number(plan.monthly_price || 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">/month</span>
                        <span className="text-xs text-slate-400 ml-auto font-mono">
                          ৳{Number(plan.annual_price || 0).toLocaleString()}/yr
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quota Cards */}
                  <div className="grid grid-cols-2 gap-2 py-2.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center mb-5 text-xs">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1 font-black text-slate-900 dark:text-white">
                        <Building2 size={13} className="text-teal-600" />
                        <span>{plan.max_branches >= 99 ? 'Unlimited' : plan.max_branches || 1}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
                        Branch Quota
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1 font-black text-slate-900 dark:text-white">
                        <Users size={13} className="text-blue-600" />
                        <span>{plan.max_staff >= 99 ? 'Unlimited' : plan.max_staff || 3}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
                        Staff Accounts
                      </p>
                    </div>
                  </div>

                  {/* Features Checklist */}
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5">
                    Plan Features Included:
                  </p>
                  <ul className="space-y-2 mb-6 text-xs text-slate-600 dark:text-slate-300">
                    {Array.isArray(plan.features) && plan.features.length > 0 ? (
                      plan.features.map((f: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 size={14} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                          <span className="leading-tight">{f}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-400 italic text-[11px]">No custom features specified</li>
                    )}
                  </ul>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(plan)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit2 size={13} />
                    <span>Edit Plan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan._id, plan.name)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 text-xs transition-colors"
                    title="Delete Plan"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Plan Modal (3 Distinct Modes) ────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Configure SaaS Subscription Plan'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select one of the 3 plan modes below to dynamically adjust billing options and quotas.
              </p>

              {/* 3 Modes Switcher */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => handleModeChange('TRIAL')}
                  className={`py-2 px-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                    planMode === 'TRIAL'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles size={14} />
                  <span>1. Free Trial Tier</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('PAID')}
                  className={`py-2 px-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                    planMode === 'PAID'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Coins size={14} />
                  <span>2. Regular Paid Plan</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('CUSTOM')}
                  className={`py-2 px-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                    planMode === 'CUSTOM'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <PhoneCall size={14} />
                  <span>3. Enterprise Custom</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              {/* Common Name & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Free Trial (14 Days) or Growth Plan"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Badge / Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. 14 Days Free or Most Popular"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Plan Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short tagline shown under plan title"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* ── MODE 1: FREE TRIAL MODE FIELDS ──────────────────────── */}
              {planMode === 'TRIAL' && (
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Sparkles size={14} />
                      Free Trial Configuration
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-mono text-[10px] font-black">
                      PRICE LOCKED TO ৳0
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                      Trial Duration (Days)
                    </label>
                    <div className="flex items-center gap-2">
                      {[3, 7, 14, 30].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => {
                            setTrialDays(days);
                            setName(`Free Trial (${days} Days)`);
                          }}
                          className={`px-3 py-1.5 text-xs font-bold border transition-colors ${
                            trialDays === days
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {days} Days
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-2">
                        <span className="text-[10px] text-slate-500">Custom:</span>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={trialDays}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setTrialDays(val);
                            setName(`Free Trial (${val} Days)`);
                          }}
                          className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── MODE 2: ENTERPRISE CUSTOM PRICING FIELDS ────────────── */}
              {planMode === 'CUSTOM' && (
                <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <PhoneCall size={14} />
                      Enterprise Custom Tier Setup
                    </span>
                    <span className="px-2 py-0.5 bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-mono text-[10px] font-black">
                      PRICE: "CUSTOM / CONTACT SALES"
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                      Sales WhatsApp & Contact Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. 01973590937"
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-purple-300 dark:border-purple-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Direct WhatsApp link will be shown on the pricing cards and registration page.
                    </p>
                  </div>
                </div>
              )}

              {/* ── MODE 3: REGULAR PAID PLAN BILLING OPTIONS ───────────── */}
              {planMode === 'PAID' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Monthly Price (৳) *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={monthlyPrice}
                        onChange={(e) => setMonthlyPrice(e.target.value)}
                        placeholder="1200"
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Annual Pricing Mode
                      </label>
                      <div className="grid grid-cols-2 gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-0.5">
                        <button
                          type="button"
                          onClick={() => setAnnualPricingType('DISCOUNT')}
                          className={`py-1.5 text-[10px] font-bold uppercase transition-colors ${
                            annualPricingType === 'DISCOUNT'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          % Discount (Auto)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnnualPricingType('FIXED')}
                          className={`py-1.5 text-[10px] font-bold uppercase transition-colors ${
                            annualPricingType === 'FIXED'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          Fixed Annual (৳)
                        </button>
                      </div>
                    </div>
                  </div>

                  {annualPricingType === 'DISCOUNT' ? (
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                          Mode A: Percentage Discount on Annual Billing
                        </span>
                        <span className="text-xs font-black text-blue-700 dark:text-blue-400 font-mono">
                          Auto: ৳{Number(annualPrice).toLocaleString()} / year
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[10, 15, 20, 25, 30].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setDiscountPercent(pct)}
                            className={`px-2.5 py-1 text-xs font-bold border transition-colors ${
                              discountPercent === pct
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                        <div className="flex items-center gap-1 ml-auto text-xs">
                          <input
                            type="number"
                            min={0}
                            max={90}
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(Number(e.target.value))}
                            className="w-14 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-center font-bold text-xs"
                          />
                          <span className="text-slate-500 font-bold">% off</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">
                        Formula: {monthlyPrice} × 12 months - {discountPercent}% discount = ৳
                        {Number(annualPrice).toLocaleString()} / year.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Fixed Annual Fee (৳) *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={annualPrice}
                        onChange={(e) => setAnnualPrice(e.target.value)}
                        placeholder="10000"
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Quotas: Outlets & Staff */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Outlets Quota (max_branches)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxBranches}
                    onChange={(e) => setMaxBranches(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-[9px] text-slate-400 mt-0.5">Use 99 for Unlimited</p>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Staff Quota (max_staff)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxStaff}
                    onChange={(e) => setMaxStaff(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-[9px] text-slate-400 mt-0.5">Use 99 for Unlimited</p>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Counters / Tables Quota
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxTables}
                    onChange={(e) => setMaxTables(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-[9px] text-slate-400 mt-0.5">POS terminals allowance</p>
                </div>
              </div>

              {/* Features List (Newline-separated) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                    Features List (One feature per line)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {featuresText.split('\n').filter((l) => l.trim()).length} features defined
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Realtime Cloud POS & Billing&#10;Inventory & Batch Expiry Tracking&#10;Thermal Slip & Barcode Printing"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-sans leading-relaxed focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-none focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mark as "Most Popular" / Recommended Tier
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-none focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Active & Available for Enrollment
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingPlan ? 'Update Subscription Plan' : 'Create Subscription Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
