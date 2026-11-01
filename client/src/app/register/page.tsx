'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { usePlatform } from '../../providers/PlatformProvider';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { SubscriptionPlan } from '../../types';
import toast from 'react-hot-toast';
import {
  Store,
  CheckCircle2,
  FileText,
  Upload,
  CreditCard,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Send,
  Eye,
  EyeOff,
  Globe,
  Clock,
  Shield,
  X,
  AlertCircle,
  Building2,
  CheckCircle,
  Sparkles,
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
} from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projectName, logoUrl, settings } = usePlatform();

  // Mode: Full Registration (3 Steps) vs Free Demo (Step 1 Only)
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Wizard Step: 1 = Owner Info, 2 = KYC Documents, 3 = Plan & Payment, 4 = Success
  const [currentStep, setCurrentStep] = useState(1);

  // Platform & Plans
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  // Step 1: Owner & Business Info
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);

  // Step 2: KYC Documents
  const [nidNumber, setNidNumber] = useState('');
  const [nidFrontFile, setNidFrontFile] = useState<File | null>(null);
  const [nidBackFile, setNidBackFile] = useState<File | null>(null);
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState('');
  const [tradeLicenseFile, setTradeLicenseFile] = useState<File | null>(null);
  const [restaurantLicenseNumber, setRestaurantLicenseNumber] = useState('');
  const [restaurantLicenseFile, setRestaurantLicenseFile] = useState<File | null>(null);

  // Step 3: Plan Selection & Payment Method
  const [paymentGateway, setPaymentGateway] = useState<
    'BKASH_DIRECT' | 'NAGAD_DIRECT' | 'SSLCOMMERZ' | 'MANUAL_BKASH' | 'MANUAL_NAGAD' | 'EPS'
  >('BKASH_DIRECT');
  const [manualGatewayType, setManualGatewayType] = useState<'BKASH' | 'NAGAD'>('BKASH');
  const [paymentTrxId, setPaymentTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Registration Complete Details
  const [registeredResult, setRegisteredResult] = useState<any | null>(null);

  // Fetch plans & query params on mount
  useEffect(() => {
    const isDemoParam =
      searchParams.get('demo') === 'true' ||
      searchParams.get('trial') === 'true' ||
      searchParams.get('is_demo') === 'true';

    if (isDemoParam) {
      setIsDemoMode(true);
    }

    api.get('/public/plans')
      .then(({ data }) => {
        if (data.success && Array.isArray(data.data)) {
          setPlans(data.data);
          const paramPlan = searchParams.get('plan') || searchParams.get('plan_id');
          const paramCycle = searchParams.get('cycle') || searchParams.get('billing_cycle');

          if (paramCycle?.toUpperCase() === 'ANNUAL') setBillingCycle('ANNUAL');

          if (paramPlan) {
            const found = data.data.find((p: any) => p._id === paramPlan || String(p.id) === paramPlan);
            if (found) {
              setSelectedPlanId(found._id);
              if (found.trial_days > 0 || found.is_trial_tier) {
                setIsDemoMode(true);
              }
            }
          } else if (data.data.length > 0) {
            setSelectedPlanId(data.data[0]._id);
          }
        }
      })
      .catch(() => {});
  }, [searchParams]);

  const selectedPlan = plans.find((p) => p._id === selectedPlanId) || plans[0];
  const planPrice =
    selectedPlan?.is_trial_tier || isDemoMode
      ? 0
      : billingCycle === 'ANNUAL'
      ? selectedPlan?.annual_price || 0
      : selectedPlan?.monthly_price || 0;
  const oneTimeLicenseFee = isDemoMode ? 0 : 5000;
  const totalPayable = planPrice + oneTimeLicenseFee;

  // ── Step 1 Validation ──────────────────────────────────────────────────────
  const handleValidateStep1 = () => {
    if (!businessName.trim()) {
      toast.error('Please enter business legal name');
      return false;
    }
    if (!ownerName.trim()) {
      toast.error('Please enter owner full name');
      return false;
    }
    const cleanPhone = contactNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 11 || cleanPhone.length > 12) {
      toast.error('Please enter a valid phone number (11 to 12 digits)');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!address.trim()) {
      toast.error('Please enter your business address');
      return false;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  // ── Send OTP ───────────────────────────────────────────────────────────────
  const triggerSendOtp = async () => {
    if (!email.trim()) return;
    setOtpSending(true);
    setDevOtpCode(null);
    try {
      const res = await api.post('/auth/send-otp', { email: email.trim() });
      if (res.data?.success) {
        toast.success(`6-digit OTP code sent to ${email}`);
        if (res.data.data?.devOtp) {
          setDevOtpCode(res.data.data.devOtp);
        }
        setShowOtpModal(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send verification OTP');
    } finally {
      setOtpSending(false);
    }
  };

  // ── Verify OTP & Finalize Registration ─────────────────────────────────────
  const handleVerifyOtpAndProceed = async () => {
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }

    setOtpVerifying(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        email: email.trim(),
        otp: otpCode.trim(),
      });

      if (res.data?.success) {
        setOtpVerified(true);
        setShowOtpModal(false);
        toast.success('Email verified successfully!');

        // If Free Demo mode: grant instant demo access right away!
        if (isDemoMode) {
          await submitFinalRegistration();
        } else {
          // If Full Registration, advance to Step 2: Documents
          setCurrentStep(2);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setOtpVerifying(false);
    }
  };

  // ── Final Registration Submission ──────────────────────────────────────────
  const submitFinalRegistration = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('restaurantName', businessName.trim());
      formData.append('ownerName', ownerName.trim());
      formData.append('contactNumber', contactNumber.trim());
      formData.append('email', email.trim());
      formData.append('password', password);
      formData.append('address', address.trim() || 'Dhaka, Bangladesh');
      formData.append('planId', selectedPlanId || selectedPlan?._id || '');
      formData.append('billingCycle', billingCycle);
      formData.append('isDemo', isDemoMode ? 'true' : 'false');

      if (!isDemoMode) {
        formData.append('nidNumber', nidNumber.trim());
        formData.append('tradeLicenseNumber', tradeLicenseNumber.trim());
        formData.append('drugLicenseNumber', restaurantLicenseNumber.trim());

        const chosenMethod =
          paymentGateway === 'MANUAL_BKASH' || paymentGateway === 'MANUAL_NAGAD'
            ? manualGatewayType === 'BKASH'
              ? 'MANUAL_BKASH'
              : 'MANUAL_NAGAD'
            : paymentGateway;

        formData.append('paymentMethod', chosenMethod);
        formData.append('paymentTrxId', paymentTrxId.trim());
        formData.append('paymentAmount', String(totalPayable));
        formData.append('senderNumber', senderNumber.trim());

        if (nidFrontFile) formData.append('nidFrontDoc', nidFrontFile);
        if (nidBackFile) formData.append('nidBackDoc', nidBackFile);
        if (tradeLicenseFile) formData.append('tradeLicenseDoc', tradeLicenseFile);
        if (restaurantLicenseFile) formData.append('drugLicenseDoc', restaurantLicenseFile);
        if (paymentScreenshotFile) formData.append('paymentScreenshot', paymentScreenshotFile);
      } else {
        formData.append('paymentMethod', 'FREE_TRIAL');
        formData.append('paymentAmount', '0');
      }

      const res = await api.post('/auth/register-restaurant', formData);
      if (res.data?.success) {
        setRegisteredResult(res.data.data);
        setCurrentStep(4);
        toast.success(
          isDemoMode
            ? '14-Day Free Demo Activated! You can now log in.'
            : 'Registration submitted successfully! Pending verification.'
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Please check fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    toast.success('Number copied to clipboard!');
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans transition-colors">
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={projectName} className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                <Store size={20} />
              </div>
            )}
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {projectName || 'ResPOS'}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/pricing" className="hover:text-blue-600 dark:hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="hover:text-blue-600 dark:hover:text-white transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Language Switcher EN | BN */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <span className="text-blue-600 dark:text-blue-400 font-bold">EN</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer">BN</span>
            </div>

            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Container ──────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {currentStep < 4 && (
          <div className="space-y-6 mb-8">
            {/* Top Header & Prominent Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {isDemoMode ? 'FREE DEMO ACCESS' : 'BUSINESS REGISTRATION'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isDemoMode ? 'Try ResPOS Free Demo' : 'Register Your Business'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {isDemoMode
                    ? 'Start your 14-day full featured free demo in 1 quick step.'
                    : 'Complete the 3 quick steps to set up your business account.'}
                </p>
              </div>

              {/* Top prominent toggle button */}
              <div>
                {isDemoMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDemoMode(false);
                      setCurrentStep(1);
                    }}
                    className="border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 font-bold text-xs sm:text-sm px-5 py-2.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Full Registration</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDemoMode(true);
                      setCurrentStep(1);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Free Demo</span>
                    <Sparkles size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Mode Switcher Pill Container */}
            <div className="flex justify-center pt-2">
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsDemoMode(false);
                    setCurrentStep(1);
                  }}
                  className={`px-5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    !isDemoMode
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Full Registration (3 Steps)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDemoMode(true);
                    setCurrentStep(1);
                  }}
                  className={`px-5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isDemoMode
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-emerald-600/80 hover:text-emerald-700 dark:text-emerald-400/90'
                  }`}
                >
                  Free Demo (Step 1 Only)
                </button>
              </div>
            </div>

            {/* Stepper matching Image 2 */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 pt-3">
              {/* Step 1: Owner Info */}
              <div
                className={`flex items-center gap-2.5 px-4 py-2 border transition-all ${
                  currentStep === 1
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : currentStep > 1
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                    currentStep === 1
                      ? 'bg-white text-blue-600'
                      : currentStep > 1
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {currentStep > 1 ? <Check size={12} /> : '1'}
                </span>
                <span className="text-xs sm:text-sm font-bold">1. Owner Info</span>
              </div>

              {/* Separator Line */}
              <div className="w-8 sm:w-12 h-px bg-slate-300 dark:bg-slate-700" />

              {/* Step 2 & 3 or Skipped Notice */}
              {isDemoMode ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-xs">
                  <span className="text-[11px] font-semibold">⚡ Documents &amp; Payment Skipped</span>
                </div>
              ) : (
                <>
                  {/* Step 2: Documents */}
                  <div
                    className={`flex items-center gap-2.5 px-4 py-2 border transition-all ${
                      currentStep === 2
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : currentStep > 2
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                        currentStep === 2
                          ? 'bg-white text-blue-600'
                          : currentStep > 2
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {currentStep > 2 ? <Check size={12} /> : '2'}
                    </span>
                    <span className="text-xs sm:text-sm font-bold">2. Documents</span>
                  </div>

                  {/* Separator Line */}
                  <div className="w-8 sm:w-12 h-px bg-slate-300 dark:bg-slate-700" />

                  {/* Step 3: Plan & Payment */}
                  <div
                    className={`flex items-center gap-2.5 px-4 py-2 border transition-all ${
                      currentStep === 3
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                        currentStep === 3
                          ? 'bg-white text-blue-600'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      3
                    </span>
                    <span className="text-xs sm:text-sm font-bold">3. Plan &amp; Payment</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 1: Owner & Business Info (matching Image 2) ────────────────── */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 space-y-6 shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Step 1: Owner &amp; Business Info
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Enter your business and account credentials.
              </p>
            </div>

            <div className="space-y-4">
              {/* Business Legal Name */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Business Legal Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 size={16} />
                  </div>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter your business legal name"
                    className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              {/* Owner Name & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Owner Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Enter owner full name"
                      className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="Enter your phone number (11-12 digits)"
                      maxLength={12}
                      className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 font-mono"
                      required
                    />
                  </div>
                  <span className="block text-[11px] text-slate-400 mt-1">
                    Numbers only, 11 to 12 digits (no letters allowed)
                  </span>
                </div>
              </div>

              {/* Email Address & Business Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="root@root.com"
                      className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Business Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your business address"
                      className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="•••••"
                      className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Enter confirm password"
                      className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (handleValidateStep1()) {
                    if (!otpVerified) {
                      triggerSendOtp();
                    } else if (isDemoMode) {
                      submitFinalRegistration();
                    } else {
                      setCurrentStep(2);
                    }
                  }
                }}
                disabled={otpSending}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {otpSending ? (
                  <span>Sending OTP...</span>
                ) : isDemoMode ? (
                  <>
                    <span>Next: Start Free Demo</span>
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <span>Next: Upload Documents</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Documents (For Full Registration) ────────────────────── */}
        {currentStep === 2 && !isDemoMode && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 space-y-6 shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Shield className="text-blue-600" size={24} />
                <span>Step 2: Upload Business Documents &amp; Licenses</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Provide your official verification documents for tenant compliance.
              </p>
            </div>

            <div className="space-y-5">
              {/* Trade License */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  Trade License Number (ট্রেড লাইসেন্স নম্বর) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={tradeLicenseNumber}
                  onChange={(e) => setTradeLicenseNumber(e.target.value)}
                  placeholder="e.g., TRAD/DNCC/012345/2026"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                  required
                />
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Trade License Document (Image or PDF)
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setTradeLicenseFile(f);
                    }}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              {/* National ID (NID) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  National ID (NID) Card Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nidNumber}
                  onChange={(e) => setNidNumber(e.target.value)}
                  placeholder="e.g., 19901234567890"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      NID Front Side (Image or PDF)
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setNidFrontFile(f);
                      }}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      NID Back Side (Image or PDF)
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setNidBackFile(f);
                      }}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Restaurant / Food Hygiene / Other License (Optional) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  Restaurant / Food Hygiene License Number (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={restaurantLicenseNumber}
                  onChange={(e) => setRestaurantLicenseNumber(e.target.value)}
                  placeholder="e.g., BSTI/REST/2026/102"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                />
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    License Document Copy (Image or PDF)
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setRestaurantLicenseFile(f);
                    }}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!tradeLicenseNumber.trim() || !nidNumber.trim()) {
                    toast.error('Please enter Trade License number and NID number');
                    return;
                  }
                  setCurrentStep(3);
                }}
                className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-colors"
              >
                <span>Proceed to Payment</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Plan Confirmation & Stacked Payment Gateway ─────────── */}
        {currentStep === 3 && !isDemoMode && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 space-y-6 shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <CreditCard className="text-blue-600" size={24} />
                <span>Step 3: Plan Summary &amp; Payment Gateway</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Select your preferred payment gateway to activate your ResPOS account.
              </p>
            </div>

            {/* Order Summary Card */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Summary</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                  {billingCycle} Billing
                </span>
              </div>
              <div className="space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Selected Plan: {selectedPlan?.name || 'Standard Plan'} ({billingCycle})
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">৳{planPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">One-Time Software Setup &amp; License Fee:</span>
                  <span className="font-bold text-slate-900 dark:text-white">৳5,000</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-base font-black">
                  <span>Total Payable Amount:</span>
                  <span className="text-blue-600 dark:text-blue-400">৳{totalPayable.toLocaleString()} BDT</span>
                </div>
              </div>
            </div>

            {/* Stacked Payment Gateways */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Select Payment Option
              </label>

              <div className="space-y-3">
                {/* ── Option 1: bKash (Official Checkout) ────────────────── */}
                <div
                  onClick={() => setPaymentGateway('BKASH_DIRECT')}
                  className={`p-4 border transition-all cursor-pointer flex items-center justify-between ${
                    paymentGateway === 'BKASH_DIRECT'
                      ? 'border-[#E2136E] bg-pink-50/30 dark:bg-pink-950/20 shadow-sm ring-1 ring-[#E2136E]/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Custom Radio Button */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                        paymentGateway === 'BKASH_DIRECT'
                          ? 'border-[#E2136E]'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {paymentGateway === 'BKASH_DIRECT' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#E2136E]" />
                      )}
                    </div>

                    {/* bKash Square Icon */}
                    <div className="w-10 h-10 bg-[#E2136E] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                      ৳
                    </div>

                    {/* Title & Badge */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          bKash
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E2136E]/10 text-[#E2136E] uppercase">
                          Instant
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Pay directly via official bKash Checkout
                      </p>
                    </div>
                  </div>

                  {/* Right: Total Payable */}
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      ৳{totalPayable.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* ── Option 2: Nagad (Official Checkout - Placed right below bKash) ── */}
                <div
                  onClick={() => setPaymentGateway('NAGAD_DIRECT')}
                  className={`p-4 border transition-all cursor-pointer flex items-center justify-between ${
                    paymentGateway === 'NAGAD_DIRECT'
                      ? 'border-[#F7941D] bg-orange-50/30 dark:bg-orange-950/20 shadow-sm ring-1 ring-[#F7941D]/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Custom Radio Button */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                        paymentGateway === 'NAGAD_DIRECT'
                          ? 'border-[#F7941D]'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {paymentGateway === 'NAGAD_DIRECT' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#F7941D]" />
                      )}
                    </div>

                    {/* Nagad Square Icon */}
                    <div className="w-10 h-10 bg-[#F7941D] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                      ন
                    </div>

                    {/* Title & Badge */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          Nagad
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F7941D]/10 text-[#F7941D] uppercase">
                          Instant
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Pay directly via official Nagad Checkout
                      </p>
                    </div>
                  </div>

                  {/* Right: Total Payable */}
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      ৳{totalPayable.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* ── Option 3: SSLCommerz / Card Payment ─────────────── */}
                <div
                  onClick={() => setPaymentGateway('SSLCOMMERZ')}
                  className={`p-4 border transition-all cursor-pointer flex items-center justify-between ${
                    paymentGateway === 'SSLCOMMERZ'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 shadow-sm ring-1 ring-blue-600/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                        paymentGateway === 'SSLCOMMERZ'
                          ? 'border-blue-600'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {paymentGateway === 'SSLCOMMERZ' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      )}
                    </div>

                    <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                      <CreditCard size={18} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          SSLCommerz / Cards &amp; Net Banking
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase">
                          Secure
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Visa, MasterCard, Amex, Internet Banking
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      ৳{totalPayable.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* ── Option 4: Manual Send Money ─────────────────────── */}
                <div
                  onClick={() => setPaymentGateway('MANUAL_BKASH')}
                  className={`p-4 border transition-all cursor-pointer flex items-center justify-between ${
                    paymentGateway === 'MANUAL_BKASH' || paymentGateway === 'MANUAL_NAGAD'
                      ? 'border-amber-600 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm ring-1 ring-amber-600/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                        paymentGateway === 'MANUAL_BKASH' || paymentGateway === 'MANUAL_NAGAD'
                          ? 'border-amber-600'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {(paymentGateway === 'MANUAL_BKASH' || paymentGateway === 'MANUAL_NAGAD') && (
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                      )}
                    </div>

                    <div className="w-10 h-10 bg-amber-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                      <Send size={18} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          Manual Send Money
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 uppercase">
                          Personal
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        bKash / Nagad Personal Send Money with Recipient Number &amp; TrxID
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      Manual Review
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Send Money Form (when Manual Send Money is selected) */}
            {(paymentGateway === 'MANUAL_BKASH' || paymentGateway === 'MANUAL_NAGAD') && (
              <div className="p-5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-4 text-xs">
                {/* Method Switcher: bKash vs Nagad */}
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                    Select Wallet:
                  </span>
                  <div className="inline-flex p-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setManualGatewayType('BKASH')}
                      className={`px-3 py-1 font-bold text-xs cursor-pointer ${
                        manualGatewayType === 'BKASH'
                          ? 'bg-[#E2136E] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      bKash Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualGatewayType('NAGAD')}
                      className={`px-3 py-1 font-bold text-xs cursor-pointer ${
                        manualGatewayType === 'NAGAD'
                          ? 'bg-[#F7941D] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Nagad Personal
                    </button>
                  </div>
                </div>

                {/* Recipient Number with 1-Click Copy */}
                <div className="p-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Recipient {manualGatewayType === 'BKASH' ? 'bKash' : 'Nagad'} Number
                    </span>
                    <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                      {manualGatewayType === 'BKASH'
                        ? settings?.bkash_number || '01973590937'
                        : settings?.nagad_number || '01973590937'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyNumber(
                        manualGatewayType === 'BKASH'
                          ? settings?.bkash_number || '01973590937'
                          : settings?.nagad_number || '01973590937'
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-xs"
                  >
                    {copiedNumber ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedNumber ? 'Copied!' : 'Copy Number'}</span>
                  </button>
                </div>

                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Send exact total amount (<strong>৳{totalPayable.toLocaleString()} BDT</strong>) via personal &quot;Send Money&quot;. Once completed, enter your sender phone number and the Transaction ID (TrxID) below:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Sender Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="01711223344"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Transaction ID (TrxID) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={paymentTrxId}
                      onChange={(e) => setPaymentTrxId(e.target.value)}
                      placeholder="e.g. 9J4K8L9M0"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono uppercase"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Payment Screenshot (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setPaymentScreenshotFile(f);
                    }}
                    className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Note for Direct Checkouts */}
            {(paymentGateway === 'BKASH_DIRECT' ||
              paymentGateway === 'NAGAD_DIRECT' ||
              paymentGateway === 'SSLCOMMERZ') && (
              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
                <Shield className="text-blue-600 shrink-0" size={18} />
                <span>
                  You will be securely routed to the official {paymentGateway === 'BKASH_DIRECT' ? 'bKash' : paymentGateway === 'NAGAD_DIRECT' ? 'Nagad' : 'SSLCommerz'} gateway to authorize payment. Your ResPOS instance will be provisioned immediately.
                </span>
              </div>
            )}

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>
                  I agree to the <strong>Terms of Service</strong>, Privacy Policy, and restaurant compliance standards.
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!agreeTerms) {
                    toast.error('Please agree to terms and policy');
                    return;
                  }
                  if (
                    (paymentGateway === 'MANUAL_BKASH' || paymentGateway === 'MANUAL_NAGAD') &&
                    (!senderNumber.trim() || !paymentTrxId.trim())
                  ) {
                    toast.error('Please provide Sender Number and Transaction ID');
                    return;
                  }
                  submitFinalRegistration();
                }}
                disabled={submitting}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {submitting ? 'Submitting Application...' : 'Submit Registration Application'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Success Screen ──────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center space-y-6 shadow-sm animate-scale-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {isDemoMode
                  ? '🎉 14-Day Free Demo Activated!'
                  : '🎉 Application Received for Verification!'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {isDemoMode
                  ? `Your business account "${businessName}" is provisioned with 14 days of free trial access.`
                  : `Your verification documents and payment details for "${businessName}" have been received.`}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Login Email:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-600">
                  {isDemoMode ? 'ACTIVE TRIAL (14 Days)' : 'PENDING REVIEW'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider inline-block shadow-sm"
              >
                Proceed to Merchant Login
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* ── Email OTP Verification Modal ─────────────────────────────────── */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Send size={15} className="text-blue-600" />
                <span>Verify Email Address</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              We have dispatched a 6-digit verification code to <strong>{email}</strong>. Please enter the code below to confirm your account.
            </p>

            {devOtpCode && (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-mono text-blue-700 dark:text-blue-300">
                <span>Dev / Local OTP Code: </span>
                <strong className="text-sm">{devOtpCode}</strong>
              </div>
            )}

            <div>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full text-center text-xl font-mono font-black tracking-widest py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={triggerSendOtp}
                disabled={otpSending}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Resend Code
              </button>

              <button
                type="button"
                onClick={handleVerifyOtpAndProceed}
                disabled={otpVerifying}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                {otpVerifying ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="w-full px-6 py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {projectName || 'BizPOS'}. Enterprise Security &amp; Tenant Isolation.
      </footer>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
