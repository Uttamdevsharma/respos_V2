'use client';

import { useState, useEffect } from 'react';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import { usePlatform } from '../../../../providers/PlatformProvider';
import {
  CreditCard,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Smartphone,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Power,
  Lock,
} from 'lucide-react';

export default function GatewaysSettingsPage() {
  const { refreshSettings } = usePlatform();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});

  // 1. bKash Settings
  const [bkashMerchantActive, setBkashMerchantActive] = useState(false);
  const [bkashAppKey, setBkashAppKey] = useState('');
  const [bkashAppSecret, setBkashAppSecret] = useState('');
  const [bkashUsername, setBkashUsername] = useState('');
  const [bkashPassword, setBkashPassword] = useState('');
  const [bkashIsSandbox, setBkashIsSandbox] = useState(true);
  const [bkashNumber, setBkashNumber] = useState('01973590937');
  const [bkashType, setBkashType] = useState('Personal (Send Money)');

  // 2. Nagad Settings
  const [nagadMerchantActive, setNagadMerchantActive] = useState(false);
  const [nagadMerchantId, setNagadMerchantId] = useState('');
  const [nagadPublicKey, setNagadPublicKey] = useState('');
  const [nagadPrivateKey, setNagadPrivateKey] = useState('');
  const [nagadIsSandbox, setNagadIsSandbox] = useState(true);
  const [nagadNumber, setNagadNumber] = useState('01973590937');

  // 3. SSLCommerz Settings
  const [sslcommerzActive, setSslcommerzActive] = useState(false);
  const [sslcommerzStoreId, setSslcommerzStoreId] = useState('');
  const [sslcommerzStorePasswd, setSslcommerzStorePasswd] = useState('');
  const [sslcommerzIsSandbox, setSslcommerzIsSandbox] = useState(true);

  // 4. EPS (Easy Payment System) Settings
  const [epsMerchantActive, setEpsMerchantActive] = useState(false);
  const [epsMerchantId, setEpsMerchantId] = useState('');
  const [epsStoreId, setEpsStoreId] = useState('');
  const [epsAppKey, setEpsAppKey] = useState('');
  const [epsAppSecret, setEpsAppSecret] = useState('');
  const [epsIsSandbox, setEpsIsSandbox] = useState(true);

  // 5. Manual Payment Instructions
  const [manualPaymentActive, setManualPaymentActive] = useState(true);
  const [manualPaymentInstruction, setManualPaymentInstruction] = useState(
    'Please send money to the official bKash/Nagad number above using "Send Money". Then copy your Transaction ID (TrxID) and submit below.'
  );

  const fetchSettings = () => {
    setLoading(true);
    api.get('/super-admin/settings')
      .then(({ data }) => {
        if (data.success && data.data) {
          const s = data.data;
          // bKash
          setBkashMerchantActive(Boolean(s.bkash_merchant_active));
          setBkashAppKey(s.bkash_app_key || '');
          setBkashAppSecret(s.bkash_app_secret || '');
          setBkashUsername(s.bkash_username || '');
          setBkashPassword(s.bkash_password || '');
          setBkashIsSandbox(s.bkash_is_sandbox !== undefined ? Boolean(s.bkash_is_sandbox) : true);
          setBkashNumber(s.bkash_number || '01973590937');
          setBkashType(s.bkash_type || 'Personal (Send Money)');

          // Nagad
          setNagadMerchantActive(Boolean(s.nagad_merchant_active));
          setNagadMerchantId(s.nagad_merchant_id || '');
          setNagadPublicKey(s.nagad_public_key || '');
          setNagadPrivateKey(s.nagad_private_key || '');
          setNagadIsSandbox(s.nagad_is_sandbox !== undefined ? Boolean(s.nagad_is_sandbox) : true);
          setNagadNumber(s.nagad_number || '01973590937');

          // SSLCommerz
          setSslcommerzActive(Boolean(s.sslcommerz_active));
          setSslcommerzStoreId(s.sslcommerz_store_id || '');
          setSslcommerzStorePasswd(s.sslcommerz_store_passwd || '');
          setSslcommerzIsSandbox(s.sslcommerz_is_sandbox !== undefined ? Boolean(s.sslcommerz_is_sandbox) : true);

          // EPS
          setEpsMerchantActive(Boolean(s.eps_merchant_active));
          setEpsMerchantId(s.eps_merchant_id || '');
          setEpsStoreId(s.eps_store_id || '');
          setEpsAppKey(s.eps_app_key || '');
          setEpsAppSecret(s.eps_app_secret || '');
          setEpsIsSandbox(s.eps_is_sandbox !== undefined ? Boolean(s.eps_is_sandbox) : true);

          // Manual
          setManualPaymentActive(s.manual_payment_active !== undefined ? Boolean(s.manual_payment_active) : true);
          setManualPaymentInstruction(
            s.manual_payment_instruction ||
              'Please send money to the official bKash/Nagad number above using "Send Money". Then copy your Transaction ID (TrxID) and submit below.'
          );
        }
      })
      .catch(() => toast.error('Failed to load gateway settings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleShowSecret = (field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      // bKash
      bkash_merchant_active: bkashMerchantActive,
      bkash_app_key: bkashAppKey.trim(),
      bkash_app_secret: bkashAppSecret.trim(),
      bkash_username: bkashUsername.trim(),
      bkash_password: bkashPassword.trim(),
      bkash_is_sandbox: bkashIsSandbox,
      bkash_number: bkashNumber.trim(),
      bkash_type: bkashType.trim(),

      // Nagad
      nagad_merchant_active: nagadMerchantActive,
      nagad_merchant_id: nagadMerchantId.trim(),
      nagad_public_key: nagadPublicKey.trim(),
      nagad_private_key: nagadPrivateKey.trim(),
      nagad_is_sandbox: nagadIsSandbox,
      nagad_number: nagadNumber.trim(),

      // SSLCommerz
      sslcommerz_active: sslcommerzActive,
      sslcommerz_store_id: sslcommerzStoreId.trim(),
      sslcommerz_store_passwd: sslcommerzStorePasswd.trim(),
      sslcommerz_is_sandbox: sslcommerzIsSandbox,

      // EPS
      eps_merchant_active: epsMerchantActive,
      eps_merchant_id: epsMerchantId.trim(),
      eps_store_id: epsStoreId.trim(),
      eps_app_key: epsAppKey.trim(),
      eps_app_secret: epsAppSecret.trim(),
      eps_is_sandbox: epsIsSandbox,

      // Manual
      manual_payment_active: manualPaymentActive,
      manual_payment_instruction: manualPaymentInstruction.trim(),
    };

    try {
      const res = await api.put('/super-admin/settings', payload);
      if (res.data?.success) {
        toast.success('Payment gateway credentials & status updated successfully!');
        await refreshSettings();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update gateway settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <RefreshCw size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading Payment Gateway Settings...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <CreditCard size={22} className="text-blue-600" />
            <span>Payment Gateways &amp; API Configuration</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure direct checkout credentials for bKash, Nagad, SSLCommerz, and EPS. Toggle any gateway ON or OFF dynamically.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{saving ? 'Saving Changes...' : 'Save All Gateway Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── 1. bKash Gateway Card ────────────────────────────────────────────── */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
          {/* Header & Toggle */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-pink-50 dark:bg-pink-950/60 text-pink-600 font-black flex items-center justify-center text-sm border border-pink-200 dark:border-pink-900">
                bK
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  bKash Payment Gateway
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Supports instant online checkout via official bKash Merchant API &amp; Send Money.
                </p>
              </div>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  bkashMerchantActive
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {bkashMerchantActive ? 'Enabled / Active' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={() => setBkashMerchantActive(!bkashMerchantActive)}
                className={`w-12 h-6 flex items-center p-0.5 transition-colors cursor-pointer ${
                  bkashMerchantActive ? 'bg-pink-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label="Toggle bKash"
              >
                <div
                  className={`w-5 h-5 bg-white shadow-sm transition-transform ${
                    bkashMerchantActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Direct API Credentials Grid */}
          <div className={`space-y-4 text-xs ${!bkashMerchantActive ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Direct Merchant API Credentials
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-semibold">Environment:</span>
                <button
                  type="button"
                  onClick={() => setBkashIsSandbox(!bkashIsSandbox)}
                  className={`px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                    bkashIsSandbox
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 border-amber-300 dark:border-amber-800'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {bkashIsSandbox ? 'Sandbox (Test)' : 'Production (Live)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">
                  bKash App Key
                </label>
                <input
                  type="text"
                  value={bkashAppKey}
                  onChange={(e) => setBkashAppKey(e.target.value)}
                  placeholder="Enter bKash App Key"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                    bKash App Secret
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('bkash_secret')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showSecrets['bkash_secret'] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <input
                  type={showSecrets['bkash_secret'] ? 'text' : 'password'}
                  value={bkashAppSecret}
                  onChange={(e) => setBkashAppSecret(e.target.value)}
                  placeholder="Enter bKash App Secret"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">
                  API Username
                </label>
                <input
                  type="text"
                  value={bkashUsername}
                  onChange={(e) => setBkashUsername(e.target.value)}
                  placeholder="e.g. sandbox_user"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                    API Password
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('bkash_password')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showSecrets['bkash_password'] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <input
                  type={showSecrets['bkash_password'] ? 'text' : 'password'}
                  value={bkashPassword}
                  onChange={(e) => setBkashPassword(e.target.value)}
                  placeholder="Enter API Password"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Manual Send Money Fallback for bKash */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">
                  Recipient bKash Number (Send Money)
                </label>
                <input
                  type="text"
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  placeholder="01973590937"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">
                  Account Type
                </label>
                <select
                  value={bkashType}
                  onChange={(e) => setBkashType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-pink-500"
                >
                  <option value="Personal (Send Money)">Personal (Send Money)</option>
                  <option value="Agent (Cash In)">Agent (Cash In)</option>
                  <option value="Merchant (Payment)">Merchant (Payment)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Nagad Gateway Card ────────────────────────────────────────────── */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-50 dark:bg-orange-950/60 text-orange-600 font-black flex items-center justify-center text-sm border border-orange-200 dark:border-orange-900">
                NG
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Nagad Payment Gateway
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Accept payments via Nagad Merchant API and Send Money.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  nagadMerchantActive
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {nagadMerchantActive ? 'Enabled / Active' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={() => setNagadMerchantActive(!nagadMerchantActive)}
                className={`w-12 h-6 flex items-center p-0.5 transition-colors cursor-pointer ${
                  nagadMerchantActive ? 'bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label="Toggle Nagad"
              >
                <div
                  className={`w-5 h-5 bg-white shadow-sm transition-transform ${
                    nagadMerchantActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className={`space-y-4 text-xs ${!nagadMerchantActive ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Nagad Merchant API Configuration
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-semibold">Environment:</span>
                <button
                  type="button"
                  onClick={() => setNagadIsSandbox(!nagadIsSandbox)}
                  className={`px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                    nagadIsSandbox
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 border-amber-300 dark:border-amber-800'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {nagadIsSandbox ? 'Sandbox (Test)' : 'Production (Live)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">
                  Nagad Merchant ID
                </label>
                <input
                  type="text"
                  value={nagadMerchantId}
                  onChange={(e) => setNagadMerchantId(e.target.value)}
                  placeholder="e.g. 68XXXXXXXX"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">
                  PG Public Key
                </label>
                <input
                  type="text"
                  value={nagadPublicKey}
                  onChange={(e) => setNagadPublicKey(e.target.value)}
                  placeholder="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">
                  Merchant Private Key
                </label>
                <input
                  type="password"
                  value={nagadPrivateKey}
                  onChange={(e) => setNagadPrivateKey(e.target.value)}
                  placeholder="MIIEvgIBADANBgkqhkiG9w0BAQEFAASC..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">
                Recipient Nagad Number (Send Money)
              </label>
              <input
                type="text"
                value={nagadNumber}
                onChange={(e) => setNagadNumber(e.target.value)}
                placeholder="01973590937"
                className="w-full max-w-sm px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* ── 3. SSLCommerz Gateway Card ───────────────────────────────────────── */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-black flex items-center justify-center text-sm border border-blue-200 dark:border-blue-900">
                SSL
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  SSLCommerz Payment Gateway
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Accept Visa, MasterCard, UnionPay, Internet Banking, and All Bangladeshi Mobile Wallets.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  sslcommerzActive
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {sslcommerzActive ? 'Enabled / Active' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={() => setSslcommerzActive(!sslcommerzActive)}
                className={`w-12 h-6 flex items-center p-0.5 transition-colors cursor-pointer ${
                  sslcommerzActive ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label="Toggle SSLCommerz"
              >
                <div
                  className={`w-5 h-5 bg-white shadow-sm transition-transform ${
                    sslcommerzActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className={`space-y-4 text-xs ${!sslcommerzActive ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                SSLCommerz Merchant Credentials
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-semibold">Mode:</span>
                <button
                  type="button"
                  onClick={() => setSslcommerzIsSandbox(!sslcommerzIsSandbox)}
                  className={`px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                    sslcommerzIsSandbox
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 border-amber-300 dark:border-amber-800'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {sslcommerzIsSandbox ? 'Sandbox (Test)' : 'Production (Live)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">
                  Store ID *
                </label>
                <input
                  type="text"
                  value={sslcommerzStoreId}
                  onChange={(e) => setSslcommerzStoreId(e.target.value)}
                  placeholder="e.g. pharmacy_live01"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                    Store Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('ssl_passwd')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showSecrets['ssl_passwd'] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <input
                  type={showSecrets['ssl_passwd'] ? 'text' : 'password'}
                  value={sslcommerzStorePasswd}
                  onChange={(e) => setSslcommerzStorePasswd(e.target.value)}
                  placeholder="Enter Store Password"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. EPS (Easy Payment System) Gateway Card ────────────────────────── */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-50 dark:bg-teal-950/60 text-teal-600 font-black flex items-center justify-center text-sm border border-teal-200 dark:border-teal-900">
                EPS
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Easy Payment System (EPS) Gateway
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Accept Cards, Net Banking, and Mobile Financial Services via Bangladesh Bank certified EPS API.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  epsMerchantActive
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {epsMerchantActive ? 'Enabled / Active' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={() => setEpsMerchantActive(!epsMerchantActive)}
                className={`w-12 h-6 flex items-center p-0.5 transition-colors cursor-pointer ${
                  epsMerchantActive ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label="Toggle EPS"
              >
                <div
                  className={`w-5 h-5 bg-white shadow-sm transition-transform ${
                    epsMerchantActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className={`space-y-4 text-xs ${!epsMerchantActive ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                EPS API Credentials
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-semibold">Environment:</span>
                <button
                  type="button"
                  onClick={() => setEpsIsSandbox(!epsIsSandbox)}
                  className={`px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                    epsIsSandbox
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 border-amber-300 dark:border-amber-800'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {epsIsSandbox ? 'Sandbox (Test)' : 'Production (Live)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">
                  Merchant ID
                </label>
                <input
                  type="text"
                  value={epsMerchantId}
                  onChange={(e) => setEpsMerchantId(e.target.value)}
                  placeholder="EPS Merchant ID"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">
                  Store ID
                </label>
                <input
                  type="text"
                  value={epsStoreId}
                  onChange={(e) => setEpsStoreId(e.target.value)}
                  placeholder="EPS Store ID"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">
                  App / Client Key
                </label>
                <input
                  type="text"
                  value={epsAppKey}
                  onChange={(e) => setEpsAppKey(e.target.value)}
                  placeholder="EPS Client Key"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                    App Secret
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('eps_secret')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showSecrets['eps_secret'] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <input
                  type={showSecrets['eps_secret'] ? 'text' : 'password'}
                  value={epsAppSecret}
                  onChange={(e) => setEpsAppSecret(e.target.value)}
                  placeholder="EPS Secret Key"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. Manual Payment Instructions Card ─────────────────────────────── */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-50 dark:bg-purple-950/60 text-purple-600 font-black flex items-center justify-center text-sm border border-purple-200 dark:border-purple-900">
                <Smartphone size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Manual Send Money (bKash / Nagad / Rocket)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Allow applicants to manually send fees and submit their Transaction ID (TrxID).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  manualPaymentActive
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {manualPaymentActive ? 'Enabled / Active' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={() => setManualPaymentActive(!manualPaymentActive)}
                className={`w-12 h-6 flex items-center p-0.5 transition-colors cursor-pointer ${
                  manualPaymentActive ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label="Toggle Manual Payment"
              >
                <div
                  className={`w-5 h-5 bg-white shadow-sm transition-transform ${
                    manualPaymentActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
              Customer Instructions on Registration Page
            </label>
            <textarea
              rows={3}
              value={manualPaymentInstruction}
              onChange={(e) => setManualPaymentInstruction(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-sans leading-relaxed focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? 'Saving...' : 'Save All Gateway Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
