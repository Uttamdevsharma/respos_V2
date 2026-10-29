'use client';

import { useEffect, useRef, useState } from 'react';
import Topbar from '../../../components/layout/topbar';
import api, { BASE_URL } from '../../../lib/api';
import { Settings } from '../../../types';
import { applyBrandColor } from '../../../lib/colorUtils';
import toast from 'react-hot-toast';
import {
  Save,
  Store,
  Percent,
  MapPin,
  Phone,
  Settings as SettingsIcon,
  RotateCw,
  ImagePlus,
  Trash2,
  Image as ImageIcon,
  LayoutTemplate,
  Palette,
  Type,
  AlignLeft,
} from 'lucide-react';

// ── Helper: build full URL for a stored image path ──────────────────────────
function imgUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

// ── Preset brand colors ──────────────────────────────────────────────────────
const presetColors = [
  { label: 'Navy Blue',    value: '#1a3c5e' },
  { label: 'Deep Purple',  value: '#3b1f6e' },
  { label: 'Forest Green', value: '#14532d' },
  { label: 'Crimson',      value: '#7f1d1d' },
  { label: 'Teal',         value: '#134e4a' },
  { label: 'Slate',        value: '#1e293b' },
  { label: 'Indigo',       value: '#1e1b4b' },
  { label: 'Amber Dark',   value: '#78350f' },
  { label: 'Rose Dark',    value: '#881337' },
  { label: 'Cyan Dark',    value: '#164e63' },
];

// ── Reusable image-upload card ───────────────────────────────────────────────
function BrandingImageCard({
  label,
  description,
  icon: Icon,
  currentUrl,
  uploading,
  onUpload,
  onDelete,
}: {
  label: string;
  description: string;
  icon: React.ElementType;
  currentUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-primary" />
        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-[10px] text-on-surface-variant">{description}</p>

      {/* Preview */}
      <div className="relative w-full h-40 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low overflow-hidden group">
        {currentUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt={label}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 backdrop-blur text-white rounded-xl text-[10px] font-bold hover:bg-white/30 transition-all"
              >
                <ImagePlus size={12} />
                Change
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/80 backdrop-blur text-white rounded-xl text-[10px] font-bold hover:bg-red-500 transition-all"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full h-full flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
          >
            {uploading ? (
              <>
                <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-semibold">Uploading…</span>
              </>
            ) : (
              <>
                <ImagePlus size={28} className="opacity-40" />
                <span className="text-[10px] font-semibold">Click to upload</span>
                <span className="text-[9px] opacity-60">JPG, PNG, WEBP · max 5 MB</span>
              </>
            )}
          </button>
        )}
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

// ── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Text fields
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [taxRate, setTaxRate] = useState<number | ''>(15);
  const [serviceChargeRate, setServiceChargeRate] = useState<number | ''>(5);

  // Branding fields
  const [brandColor, setBrandColor]     = useState('#1a3c5e');
  const [tagline, setTagline]           = useState('Restaurant POS System');
  const [description, setDescription]  = useState('');

  // Image uploading state
  const [uploadingLogo, setUploadingLogo]             = useState(false);
  const [uploadingLoginImage, setUploadingLoginImage] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      if (data.success) {
        const s = data.data;
        setSettings(s);
        setRestaurantName(s.restaurantName || '');
        setAddress(s.address || '');
        setPhone(s.phone || '');
        setTaxRate(s.taxRate ?? 15);
        setServiceChargeRate(s.serviceChargeRate ?? 5);
        setBrandColor(s.brandColor || '#1a3c5e');
        setTagline(s.tagline || 'Restaurant POS System');
        setDescription(s.description || '');
      }
    } catch {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTaxRate = taxRate === '' ? 0 : Number(taxRate);
    const finalServiceRate = serviceChargeRate === '' ? 0 : Number(serviceChargeRate);

    if (!restaurantName || finalTaxRate < 0 || finalServiceRate < 0) {
      toast.error('Invalid settings parameters');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/settings', {
        restaurantName, address, phone, taxRate: finalTaxRate, serviceChargeRate: finalServiceRate,
        brandColor, tagline, description,
      });
      if (data.success) {
        toast.success('Settings saved successfully');
        setSettings(data.data);
        // Apply brand color to entire app immediately
        if (brandColor) applyBrandColor(brandColor);
      }
    } catch {
      toast.error('Failed to update configurations');
    } finally {
      setSaving(false);
    }
  };

  // ── Image upload / delete helpers ────────────────────────────────────────
  const uploadImage = async (field: 'logo' | 'loginImage', file: File) => {
    const setter = field === 'logo' ? setUploadingLogo : setUploadingLoginImage;
    setter(true);
    try {
      const formData = new FormData();
      formData.append(field, file);
      const { data } = await api.post('/settings/upload-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        setSettings(data.data);
        toast.success(`${field === 'logo' ? 'Logo' : 'Login image'} updated`);
      }
    } catch {
      toast.error('Image upload failed');
    } finally {
      setter(false);
    }
  };

  const deleteImage = async (field: 'logo' | 'loginImage') => {
    const setter = field === 'logo' ? setUploadingLogo : setUploadingLoginImage;
    setter(true);
    try {
      const body = field === 'logo' ? { deleteLogo: 'true' } : { deleteLoginImage: 'true' };
      const { data } = await api.post('/settings/upload-images', body);
      if (data.success) {
        setSettings(data.data);
        toast.success(`${field === 'logo' ? 'Logo' : 'Login image'} removed`);
      }
    } catch {
      toast.error('Failed to remove image');
    } finally {
      setter(false);
    }
  };

  // ── Live color preview gradient ──────────────────────────────────────────
  const gradientStyle = {
    background: `linear-gradient(135deg, ${brandColor}dd 0%, ${brandColor}99 50%, ${brandColor}cc 100%)`,
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-background">
      <Topbar title="Restaurant Settings" subtitle="Configure system parameters" />

      <main className="p-3 sm:p-6 max-w-2xl space-y-4 sm:space-y-6">

        {/* Header card */}
        <div className="flex justify-between items-center bg-surface p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container text-primary-dark rounded-xl flex items-center justify-center">
              <SettingsIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-on-surface">Configuration Dashboard</h3>
              <p className="text-[10px] text-on-surface-variant font-medium">Update restaurant operational variables</p>
            </div>
          </div>
          <button
            onClick={() => { setLoading(true); fetchSettings(); }}
            className="p-2 bg-surface hover:bg-surface-container-high rounded-xl border border-outline-variant/30 transition-all press-effect"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Branding Images ────────────────────────────────────────── */}
            <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm p-6 space-y-6">
              <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={14} className="text-primary" />
                Branding &amp; Appearance
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo */}
                <BrandingImageCard
                  label="Restaurant Logo"
                  description="Circular logo shown on login screen and sidebar header."
                  icon={Store}
                  currentUrl={imgUrl(settings?.logo)}
                  uploading={uploadingLogo}
                  onUpload={(file) => uploadImage('logo', file)}
                  onDelete={() => deleteImage('logo')}
                />

                {/* Login page image */}
                <BrandingImageCard
                  label="Login Page Image"
                  description="Full background image on the left panel of the login page."
                  icon={LayoutTemplate}
                  currentUrl={imgUrl(settings?.loginImage)}
                  uploading={uploadingLoginImage}
                  onUpload={(file) => uploadImage('loginImage', file)}
                  onDelete={() => deleteImage('loginImage')}
                />
              </div>
            </div>

            {/* ── Brand Color ────────────────────────────────────────────── */}
            <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm p-6 space-y-5">
              <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <Palette size={14} className="text-primary" />
                Brand Color
              </h4>

              {/* Live preview strip */}
              <div
                className="w-full h-16 rounded-xl flex items-center justify-center transition-all duration-300 shadow-inner"
                style={gradientStyle}
              >
                <span className="text-white font-black text-sm tracking-wide drop-shadow">
                  {restaurantName || 'Restaurant Name'}
                </span>
              </div>

              {/* Preset swatches */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => {
                        setBrandColor(c.value);
                        applyBrandColor(c.value);
                      }}
                      className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 press-effect"
                      style={{
                        backgroundColor: c.value,
                        borderColor: brandColor === c.value ? '#fff' : 'transparent',
                        outline: brandColor === c.value ? `2px solid ${c.value}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Custom color picker */}
              <div className="flex items-center gap-3">
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Custom Color (HEX)
                  </label>
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => {
                      setBrandColor(e.target.value);
                      if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                        applyBrandColor(e.target.value);
                      }
                    }}
                    placeholder="#1a3c5e"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-mono font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Picker
                  </label>
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => {
                      setBrandColor(e.target.value);
                      applyBrandColor(e.target.value);
                    }}
                    className="w-12 h-10 rounded-xl border border-outline-variant cursor-pointer bg-transparent p-0.5"
                  />
                </div>
              </div>
            </div>

            {/* ── Login Page Text ────────────────────────────────────────── */}
            <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm p-6 space-y-5">
              <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <Type size={14} className="text-primary" />
                Login Page Content
              </h4>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Tagline
                  <span className="ml-1 text-on-surface-variant/50 normal-case font-normal">
                    — shown below the restaurant name
                  </span>
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Restaurant POS System"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <AlignLeft size={10} />
                  Description
                  <span className="ml-1 text-on-surface-variant/50 normal-case font-normal">
                    — paragraph shown on the left panel
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Professional restaurant management..."
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-semibold resize-none"
                />
              </div>

              {/* Live preview of login left panel */}
              <div
                className="w-full rounded-2xl p-5 flex flex-col items-center text-center gap-2 shadow-inner transition-all duration-300"
                style={gradientStyle}
              >
                {settings?.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl(settings.logo)!}
                    alt="Logo preview"
                    className="w-14 h-14 rounded-full object-cover border-4 border-white/40 shadow-lg"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-xl">
                      {(restaurantName || 'G').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <p className="text-white font-black text-lg mt-1">{restaurantName || 'Restaurant Name'}</p>
                <p className="text-white/80 text-xs">{tagline || 'Restaurant POS System'}</p>
                <div className="w-12 h-0.5 bg-white/40 rounded-full my-1" />
                <p className="text-white/60 text-[10px] max-w-xs leading-relaxed">
                  {description || 'Your description will appear here...'}
                </p>
              </div>
            </div>

            {/* ── Restaurant info + financial ───────────────────────────── */}
            <form onSubmit={handleSave} className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm p-6 space-y-6">

              {/* Identity section */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                  <Store size={14} className="text-primary" />
                  Restaurant Identity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      Support Hotline
                    </label>
                    <div className="relative">
                      <Phone size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-semibold"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Postal Address
                  </label>
                  <div className="relative">
                    <MapPin size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Parameters */}
              <div className="space-y-4 pt-6 border-t border-outline-variant/20 font-semibold">
                <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                  <Percent size={14} className="text-primary" />
                  Operational Taxation &amp; Fees
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      VAT rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={taxRate}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setTaxRate('');
                        } else {
                          const num = parseFloat(val);
                          setTaxRate(isNaN(num) ? '' : Math.max(0, num));
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      Service Charge (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={serviceChargeRate}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setServiceChargeRate('');
                        } else {
                          const num = parseFloat(val);
                          setServiceChargeRate(isNaN(num) ? '' : Math.max(0, num));
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-outline-variant/20 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3.5 bg-primary text-on-primary rounded-xl text-xs font-bold transition-all press-effect shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save All Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
