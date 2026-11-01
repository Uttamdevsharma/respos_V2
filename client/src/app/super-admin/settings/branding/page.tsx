'use client';

import { useState, useEffect, useRef } from 'react';
import api, { getImageUrl } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { usePlatform } from '../../../../providers/PlatformProvider';
import {
  Image as ImageIcon,
  Save,
  RefreshCw,
  CheckCircle2,
  Shield,
  Eye,
  Upload,
  Trash2,
  Copy,
  ExternalLink,
  Cloud,
} from 'lucide-react';

export default function BrandingSettingsPage() {
  const { settings, refreshSettings } = usePlatform();
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projectName, setProjectName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [currencySymbol, setCurrencySymbol] = useState('৳');

  // File Upload State - Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [markedForDeletion, setMarkedForDeletion] = useState(false);

  // File Upload State - Login Background Image
  const [loginImageFile, setLoginImageFile] = useState<File | null>(null);
  const [loginImagePreview, setLoginImagePreview] = useState<string | null>(null);
  const [isDraggingLogin, setIsDraggingLogin] = useState(false);
  const [markedLoginImageForDeletion, setMarkedLoginImageForDeletion] = useState(false);
  const fileInputLoginRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setProjectName(settings.project_name || 'Restobiz');
      setSupportEmail(settings.support_email || 'support@restobiz.com');
      setSupportPhone(settings.support_phone || '01973590937');
      setCurrency(settings.currency || 'BDT');
      setCurrencySymbol(settings.currency_symbol || '৳');
      setLogoPreview(settings.logo_url ? getImageUrl(settings.logo_url) : '/images/restobiz-icon.png');
      setLoginImagePreview(settings.login_image_url ? getImageUrl(settings.login_image_url) : null);
      setMarkedForDeletion(false);
      setMarkedLoginImageForDeletion(false);
    }
  }, [settings]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP, SVG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file size must be less than 5MB');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setMarkedForDeletion(false);
    toast.success(`Selected logo "${file.name}"`);
  };

  const handleLoginImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Login image size must be less than 8MB');
      return;
    }
    setLoginImageFile(file);
    setLoginImagePreview(URL.createObjectURL(file));
    setMarkedLoginImageForDeletion(false);
    toast.success(`Selected login background image "${file.name}"`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveSelectedLogo = () => {
    setLogoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (settings?.logo_url) {
      setMarkedForDeletion(true);
      setLogoPreview(null);
      toast('Logo marked for removal. Click Save to confirm.', { icon: '🗑️' });
    } else {
      setLogoPreview(null);
    }
  };

  const handleCopyUrl = () => {
    if (settings?.logo_url) {
      navigator.clipboard.writeText(settings.logo_url);
      toast.success('Cloudinary logo URL copied to clipboard!');
    }
  };

  const handleRemoveSelectedLoginImage = () => {
    setLoginImageFile(null);
    if (fileInputLoginRef.current) {
      fileInputLoginRef.current.value = '';
    }
    if (settings?.login_image_url) {
      setMarkedLoginImageForDeletion(true);
      setLoginImagePreview(null);
      toast('Login background image marked for removal. Click Save to confirm.', { icon: '🗑️' });
    } else {
      setLoginImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      toast.error('Project Name is required');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append('project_name', projectName.trim());
      data.append('support_email', supportEmail.trim());
      data.append('support_phone', supportPhone.trim());
      data.append('currency', currency.trim());
      data.append('currency_symbol', currencySymbol.trim());

      if (logoFile) {
        data.append('logo', logoFile);
      } else if (markedForDeletion) {
        data.append('delete_logo', 'true');
      }

      if (loginImageFile) {
        data.append('login_image', loginImageFile);
      } else if (markedLoginImageForDeletion) {
        data.append('delete_login_image', 'true');
      }

      // Do NOT set manual 'Content-Type' header; Axios and browser auto-generate boundary
      const res = await api.put('/super-admin/settings', data);

      if (res.data?.success) {
        toast.success(
          logoFile || loginImageFile
            ? 'Branding assets successfully uploaded & saved!'
            : 'Platform branding updated successfully!'
        );
        setLogoFile(null);
        setMarkedForDeletion(false);
        setLoginImageFile(null);
        setMarkedLoginImageForDeletion(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (fileInputLoginRef.current) fileInputLoginRef.current.value = '';
        await refreshSettings();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update branding settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[2100px] mx-auto space-y-6 2xl:space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl 2xl:text-3xl font-black text-slate-900 dark:text-white">
          Platform Branding: Logo &amp; Name
        </h1>
        <p className="text-xs sm:text-sm 2xl:text-base text-slate-500 dark:text-slate-400 mt-1">
          Upload your official company logo directly from your PC. It will be uploaded directly to Cloudinary and the resulting secure URL is saved in your database record.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 2xl:gap-8 items-start">
        {/* Left 7 Cols: Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 2xl:p-8 space-y-5 2xl:space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5 2xl:space-y-6">
            {/* Website / Platform Name */}
            <div>
              <label className="block text-xs 2xl:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Platform / Website Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., ResPOS or BizPOS"
                className="w-full px-3.5 py-2.5 2xl:px-4 2xl:py-3 text-sm 2xl:text-base bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                required
              />
              <p className="text-[11px] 2xl:text-xs text-slate-500 mt-1">
                Appears on top of the Landing page, Merchant login, and Super Admin navigation header.
              </p>
            </div>

            {/* Logo Upload Zone from PC */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs 2xl:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Cloud size={14} className="text-blue-600" />
                  <span>Upload Logo from PC (Cloudinary Storage)</span>
                </label>
                {settings?.logo_url && !markedForDeletion && (
                  <span className="text-[10px] 2xl:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 border border-emerald-200 dark:border-emerald-800">
                    Saved in Cloudinary
                  </span>
                )}
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed p-6 2xl:p-8 text-center space-y-3 transition-colors ${
                  isDragging
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
                }`}
              >
                {logoPreview ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-24 h-24 2xl:w-28 2xl:h-28 bg-white border border-slate-200 p-2 flex items-center justify-center shadow-sm">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    {logoFile ? (
                      <div className="flex items-center gap-2 text-xs 2xl:text-sm">
                        <span className="font-semibold text-blue-600 dark:text-blue-400 truncate max-w-xs">
                          {logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)
                        </span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 font-bold uppercase">
                          Pending Upload
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveSelectedLogo}
                          className="text-rose-600 hover:text-rose-700 ml-1 cursor-pointer"
                          title="Remove selected file"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">Current Logo</span>
                        <button
                          type="button"
                          onClick={handleRemoveSelectedLogo}
                          className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>Delete Logo</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 2xl:w-16 2xl:h-16 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                      <ImageIcon size={26} />
                    </div>
                    <p className="text-xs 2xl:text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Drag and drop your logo image here, or browse from PC
                    </p>
                  </div>
                )}

                <div>
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 2xl:px-6 2xl:py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs 2xl:text-sm uppercase tracking-wider cursor-pointer shadow-sm transition-colors">
                    <Upload size={15} />
                    <span>
                      {logoPreview ? 'Choose Another Image from PC' : 'Select Logo File from PC'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] 2xl:text-xs text-slate-500">
                  Supported formats: PNG, JPG, WebP, SVG (Max 5MB). Automatically uploaded to Cloudinary upon clicking Save.
                </p>
              </div>

              {/* Show saved Cloudinary URL in DB */}
              {settings?.logo_url && !markedForDeletion && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Saved Cloudinary URL in DB:
                    </span>
                    <p className="font-mono text-[11px] text-blue-600 dark:text-blue-400 truncate">
                      {settings.logo_url}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="p-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:text-blue-600 cursor-pointer"
                      title="Copy URL"
                    >
                      <Copy size={13} />
                    </button>
                    <a
                      href={settings.logo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:text-blue-600"
                      title="Open in new tab"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Login Background Image Upload Zone */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs 2xl:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-blue-600" />
                  <span>Login Page Left Panel Background Image</span>
                </label>
                {settings?.login_image_url && !markedLoginImageForDeletion && (
                  <span className="text-[10px] 2xl:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 border border-emerald-200 dark:border-emerald-800">
                    Active Background
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Optional custom full-cover background image for the SaaS login page left panel. If omitted, the default navy brand gradient is displayed.
              </p>

              {/* Drag and Drop Zone */}
              <div
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingLogin(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleLoginImageFile(file);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingLogin(true);
                }}
                onDragLeave={() => setIsDraggingLogin(false)}
                className={`border-2 border-dashed p-6 text-center space-y-3 transition-colors ${
                  isDraggingLogin
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
                }`}
              >
                {loginImagePreview ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-full max-w-xs h-36 bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden relative shadow-sm">
                      <img
                        src={loginImagePreview}
                        alt="Login Background Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputLoginRef.current?.click()}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 cursor-pointer"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveSelectedLoginImage}
                        className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                      <Upload size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Drag &amp; drop a login background image here, or{' '}
                        <button
                          type="button"
                          onClick={() => fileInputLoginRef.current?.click()}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          browse from PC
                        </button>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        High resolution recommended (1200x1600 or 1920x1080), max 8MB
                      </p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputLoginRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLoginImageFile(f);
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Support Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 2xl:gap-6 pt-1">
              <div>
                <label className="block text-xs 2xl:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Support Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@respos.com"
                  className="w-full px-3.5 py-2.5 2xl:px-4 2xl:py-3 text-sm 2xl:text-base bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs 2xl:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Support Phone
                </label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+880 1700-112233"
                  className="w-full px-3.5 py-2.5 2xl:px-4 2xl:py-3 text-sm 2xl:text-base bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 2xl:gap-6">
              <div>
                <label className="block text-xs 2xl:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Currency Code
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="BDT"
                  className="w-full px-3.5 py-2.5 2xl:px-4 2xl:py-3 text-sm 2xl:text-base bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs 2xl:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="৳"
                  className="w-full px-3.5 py-2.5 2xl:px-4 2xl:py-3 text-sm 2xl:text-base bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 2xl:px-8 2xl:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs 2xl:text-sm uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Uploading to Cloudinary &amp; Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Branding Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right 5 Cols: Live Navbar & Cloudinary Sync Status Preview */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 2xl:p-8 space-y-6">
          <div>
            <h3 className="text-xs 2xl:text-sm font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Eye size={14} />
              <span>Live Navbar Preview</span>
            </h3>

            {/* Light Navbar Mock */}
            <div className="p-3 bg-white border border-slate-200 shadow-sm flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    <Shield size={16} />
                  </div>
                )}
                <span className="font-black text-sm text-slate-900">
                  {projectName || 'ResPOS'}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold">
                Get Started
              </span>
            </div>

            {/* Dark Navbar Mock */}
            <div className="p-3 bg-slate-950 border border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    <Shield size={16} />
                  </div>
                )}
                <span className="font-black text-sm text-white">
                  {projectName || 'ResPOS'}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold">
                Get Started
              </span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-slate-800/60 border border-blue-200 dark:border-slate-700 text-xs 2xl:text-sm space-y-2">
            <p className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <CheckCircle2 size={15} />
              <span>Cloudinary Direct Sync</span>
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] 2xl:text-xs leading-relaxed">
              When you select a logo from your PC, it is transmitted directly to Cloudinary and the resulting HTTPS URL is stored in the database record.
            </p>
            <ul className="list-disc pl-4 text-[11px] 2xl:text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <li>Public Landing Page (Top Header &amp; Footer)</li>
              <li>Merchant Registration Flow</li>
              <li>Super Admin Portal Sidebar and Header</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
