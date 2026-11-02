'use client';

import { useEffect, useRef, useState } from 'react';
import Topbar from '../../../components/layout/topbar';
import api, { BASE_URL } from '../../../lib/api';
import { Settings } from '../../../types';
import toast from 'react-hot-toast';
import {
  Save,
  Store,
  Percent,
  MapPin,
  Phone,
  Mail,
  FileText,
  Settings as SettingsIcon,
  RotateCw,
  ImagePlus,
  Trash2,
  Image as ImageIcon,
  Receipt,
  Sparkles,
} from 'lucide-react';

// ── Helper: build full URL for a stored image path ──────────────────────────
function imgUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

// ── Reusable image-upload card ───────────────────────────────────────────────
function LogoUploadCard({
  currentUrl,
  uploading,
  onUpload,
  onDelete,
}: {
  currentUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold text-on-surface">Restaurant Logo</label>
        <p className="text-[11px] text-on-surface-variant">
          This logo is displayed in the dashboard header, navigation bar, and printed at the top of customer invoices.
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Preview box */}
        <div className="relative w-28 h-28 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low overflow-hidden flex items-center justify-center group shrink-0">
          {currentUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUrl}
                alt="Restaurant Logo"
                className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
              />
              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-xl text-xs transition-all"
                  title="Change Logo"
                >
                  <ImagePlus size={14} />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={uploading}
                  className="p-2 bg-red-500/80 hover:bg-red-500 backdrop-blur text-white rounded-xl text-xs transition-all"
                  title="Remove Logo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors p-2"
            >
              {uploading ? (
                <>
                  <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-semibold">Uploading…</span>
                </>
              ) : (
                <>
                  <ImagePlus size={24} className="opacity-40" />
                  <span className="text-[10px] font-bold">Upload Logo</span>
                  <span className="text-[8px] opacity-60">PNG, JPG, WEBP</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Change/Remove quick action text buttons */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 rounded-xl text-xs font-bold text-on-surface transition-all press-effect"
            >
              {currentUrl ? 'Change Logo' : 'Choose File'}
            </button>
            {currentUrl && (
              <button
                type="button"
                onClick={onDelete}
                disabled={uploading}
                className="px-3 py-1.5 bg-error-container/40 hover:bg-error-container text-error rounded-xl text-xs font-bold transition-all press-effect"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-[10px] text-on-surface-variant/70">
            Recommended size: 200x200px or transparent PNG. Max 5MB.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ── Main Settings page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Operational variables
  const [restaurantName, setRestaurantName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxRate, setTaxRate] = useState<number | ''>(15);
  const [serviceChargeRate, setServiceChargeRate] = useState<number | ''>(5);
  const [invoiceFooter, setInvoiceFooter] = useState('Thank you for dining with us! Please visit again.');

  // Image uploading state
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      if (data.success) {
        const s = data.data;
        setSettings(s);
        setRestaurantName(s.restaurantName || '');
        setPhone(s.phone || '');
        setEmail(s.email || '');
        setAddress(s.address || '');
        setTaxRate(s.taxRate ?? 15);
        setServiceChargeRate(s.serviceChargeRate ?? 5);
        setInvoiceFooter(s.invoiceFooter || 'Thank you for dining with us! Please visit again.');
      }
    } catch {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTaxRate = taxRate === '' ? 0 : Number(taxRate);
    const finalServiceRate = serviceChargeRate === '' ? 0 : Number(serviceChargeRate);

    if (!restaurantName.trim() || finalTaxRate < 0 || finalServiceRate < 0) {
      toast.error('Please enter a valid restaurant name and tax rates');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put('/settings', {
        restaurantName: restaurantName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        taxRate: finalTaxRate,
        serviceChargeRate: finalServiceRate,
        invoiceFooter: invoiceFooter.trim(),
      });
      if (data.success) {
        toast.success('Restaurant settings saved successfully');
        setSettings(data.data);
      }
    } catch {
      toast.error('Failed to update configurations');
    } finally {
      setSaving(false);
    }
  };

  // ── Image upload / delete helpers ────────────────────────────────────────
  const uploadImage = async (file: File) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await api.post('/settings/upload-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        setSettings(data.data);
        toast.success('Restaurant logo updated successfully');
      }
    } catch {
      toast.error('Logo upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const deleteImage = async () => {
    setUploadingLogo(true);
    try {
      const { data } = await api.post('/settings/upload-images', { deleteLogo: 'true' });
      if (data.success) {
        setSettings(data.data);
        toast.success('Restaurant logo removed');
      }
    } catch {
      toast.error('Failed to remove image');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-background">
      <Topbar title="Restaurant Settings" subtitle="Configure restaurant profile, billing contact & operational rates" />

      <main className="p-3 sm:p-6 max-w-3xl space-y-4 sm:space-y-6">

        {/* Header card */}
        <div className="flex justify-between items-center bg-surface p-4 sm:p-5 rounded-2xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container text-primary-dark rounded-xl flex items-center justify-center shrink-0">
              <SettingsIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-on-surface">Restaurant Operational Settings</h3>
              <p className="text-[11px] text-on-surface-variant font-medium">
                Information configured here automatically updates your dashboard branding and customer printed invoices.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setLoading(true); fetchSettings(); }}
            className="p-2.5 bg-surface hover:bg-surface-container-high rounded-xl border border-outline-variant/30 transition-all press-effect shrink-0"
            title="Refresh settings"
          >
            <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-on-surface-variant font-medium">Loading settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">

            {/* ── 1. Restaurant Identity & Logo ── */}
            <div className="bg-surface rounded-2xl border border-outline-variant/40 shadow-sm p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                <Store size={18} className="text-primary" />
                <h4 className="text-xs font-black text-on-surface uppercase tracking-wider">
                  Restaurant Identity & Logo
                </h4>
              </div>

              {/* Restaurant Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">
                  Restaurant Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="e.g. Bahar Restaurant"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <p className="text-[10px] text-on-surface-variant/70">
                  Appears on the top of customer receipts, tickets, dashboard header, and POS terminal.
                </p>
              </div>

              {/* Logo Upload Card */}
              <LogoUploadCard
                currentUrl={imgUrl(settings?.logo)}
                uploading={uploadingLogo}
                onUpload={uploadImage}
                onDelete={deleteImage}
              />
            </div>

            {/* ── 2. Contact Information (Printed on Bills & Invoices) ── */}
            <div className="bg-surface rounded-2xl border border-outline-variant/40 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                <Phone size={18} className="text-primary" />
                <div>
                  <h4 className="text-xs font-black text-on-surface uppercase tracking-wider">
                    Contact Details
                  </h4>
                  <p className="text-[10px] text-on-surface-variant">
                    These contact details will be printed on customer invoices, payslips, and order tokens.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone / Hotline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Phone size={13} className="text-on-surface-variant" />
                    Support Hotline / Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1700-000000"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Mail size={13} className="text-on-surface-variant" />
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@bahar.com"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Physical Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <MapPin size={13} className="text-on-surface-variant" />
                  Postal / Physical Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House 12, Road 5, Dhanmondi, Dhaka-1205"
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                />
              </div>
            </div>

            {/* ── 3. Operational Taxation & Fees ── */}
            <div className="bg-surface rounded-2xl border border-outline-variant/40 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                <Percent size={18} className="text-primary" />
                <h4 className="text-xs font-black text-on-surface uppercase tracking-wider">
                  Operational Taxation & Fees
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* VAT Rate */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">VAT Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">%</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/70">Applied automatically to orders on checkout.</p>
                </div>

                {/* Service Charge */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Service Charge (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={serviceChargeRate}
                      onChange={(e) => setServiceChargeRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">%</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/70">Restaurant staff service fee added to subtotal.</p>
                </div>
              </div>
            </div>

            {/* ── 4. Invoice & Receipt Customization ── */}
            <div className="bg-surface rounded-2xl border border-outline-variant/40 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                <Receipt size={18} className="text-primary" />
                <div>
                  <h4 className="text-xs font-black text-on-surface uppercase tracking-wider">
                    Invoice & Receipt Customization
                  </h4>
                  <p className="text-[10px] text-on-surface-variant">
                    Customize the message printed at the bottom of customer bills and thermal slips.
                  </p>
                </div>
              </div>

              {/* Invoice Footer Greeting / Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <FileText size={13} className="text-on-surface-variant" />
                  Invoice Footer Message / Thank-You Note
                </label>
                <input
                  type="text"
                  value={invoiceFooter}
                  onChange={(e) => setInvoiceFooter(e.target.value)}
                  placeholder="e.g. Thank you for dining with us! Please visit again."
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <p className="text-[10px] text-on-surface-variant/70">
                  Example: &ldquo;Thank you for dining with us! Follow us on Facebook / Instagram.&rdquo;
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3 bg-primary hover:brightness-110 text-on-primary rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20 press-effect disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save All Settings</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </main>
    </div>
  );
}
