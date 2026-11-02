'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePlatform } from '../providers/PlatformProvider';
import { PublicNavbar } from '../components/common/PublicNavbar';
import { PublicFooter } from '../components/common/PublicFooter';
import {
  UtensilsCrossed,
  ChefHat,
  Receipt,
  Layers,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  PhoneCall,
  Play,
  ArrowUpRight,
  Store,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

function getEmbedUrl(rawUrl?: string): string {
  if (!rawUrl) return 'https://www.youtube.com/embed/dQw4w9WgXcQ';
  try {
    if (rawUrl.includes('embed/')) return rawUrl;
    if (rawUrl.includes('watch?v=')) {
      const id = rawUrl.split('watch?v=')[1]?.split('&')[0];
      return id ? `https://www.youtube.com/embed/${id}` : rawUrl;
    }
    if (rawUrl.includes('youtu.be/')) {
      const id = rawUrl.split('youtu.be/')[1]?.split('?')[0];
      return id ? `https://www.youtube.com/embed/${id}` : rawUrl;
    }
  } catch {
    return rawUrl;
  }
  return rawUrl;
}

export default function LandingPage() {
  const { projectName, youtubeUrl } = usePlatform();
  const videoEmbed = getEmbedUrl(youtubeUrl);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const faqs = [
    {
      num: '01',
      question: 'Can I manage multiple branches and central warehouse stock from a single dashboard?',
      answer:
        'Yes, BizPOS provides a centralized multi-branch management system. You can monitor live sales, transfer stock between outlets with digital challans, manage centralized warehouse inventory, and view aggregated profit & loss analytics in real time from any device.',
    },
    {
      num: '02',
      question: 'Does BizPOS support standard barcode scanners and thermal receipt printers?',
      answer:
        'Absolutely. BizPOS seamlessly connects to all standard 58mm and 80mm ESC/POS thermal printers, USB & Bluetooth barcode scanners, digital weighing scales, and cash drawers. Split billing, VAT compliance, and custom invoice logos are supported out-of-the-box.',
    },
    {
      num: '03',
      question: 'What happens if our branch internet connection drops temporarily?',
      answer:
        'BizPOS has built-in offline-tolerant data caching. Cashiers can continue scanning barcodes and punching orders without interruption. The moment the connection restores, all local transactions automatically sync back to the cloud.',
    },
    {
      num: '04',
      question: 'How does inter-branch stock transfer and digital challan work?',
      answer:
        'You can initiate stock transfer requests from any branch or warehouse. Once dispatched, a digital challan with barcode tracking is generated. The destination branch confirms received quantities upon physical arrival to ensure zero stock discrepancies.',
    },
    {
      num: '05',
      question: 'Can I track product batches, serial/IMEI numbers, and expiry dates?',
      answer:
        'Yes. Full batch tracking with FEFO (First Expired, First Out) and FIFO automated deduction is built in. You can also track serial/IMEI numbers for electronics and receive automated alerts before products reach expiration.',
    },
    {
      num: '06',
      question: 'How fast is setup and how easily can my cashiers be trained?',
      answer:
        'Setup takes under 2 minutes. The POS counter interface is designed for extreme speed and simplicity—new cashiers can be fully trained and punching orders in less than 5 minutes with zero technical background.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* ── Standalone Public Navbar ────────────────────────────────────────── */}
      <PublicNavbar />

      <main className="flex-1">
        {/* ── Hero Section (Full width container with balanced side gaps) ── */}
        <section className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 py-10 lg:py-16 xl:py-20">
          <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 2xl:gap-14 items-center">
            {/* Left Column (Hero Content): lg:col-span-6 */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-6">
              {/* Headline - Larger prominent font wrapping across 2 lines */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[40px] xl:text-[52px] 2xl:text-[62px] font-black tracking-tight leading-[1.12] text-slate-900 dark:text-white">
                Fast POS &amp; Restaurant Management Software —{' '}
                <span className="text-blue-600 dark:text-blue-400 block sm:inline xl:block 2xl:inline">
                  {projectName || 'ResPOS'}
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl xl:max-w-2xl">
                High-speed barcode &amp; touch billing, interactive table mapping, live Kitchen Display System (KDS), and real-time sales profit analytics. Built for dine-in restaurants, cafes, cloud kitchens, and multi-outlet chains.
              </p>

              {/* Feature Highlights Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] sm:text-xs font-medium px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  ⚡ Fast POS Billing
                </span>
                <span className="text-[10px] sm:text-xs font-medium px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  🍲 Live Kitchen KDS
                </span>
                <span className="text-[10px] sm:text-xs font-medium px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  📋 Table Floor Map
                </span>
                <span className="text-[10px] sm:text-xs font-medium px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  📊 Daily Sales &amp; Profit
                </span>
              </div>

              {/* Action Buttons: View Pricing links to /pricing */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
                <Link
                  href="/register"
                  className="h-10 sm:h-11 px-5 sm:px-7 text-xs sm:text-sm font-semibold rounded-none shadow-md bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-all group"
                >
                  <span>Get Started Now</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/pricing"
                  className="h-10 sm:h-11 px-5 sm:px-7 text-xs sm:text-sm font-semibold rounded-none shadow-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  <span>View Pricing Plans</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-5 pt-3 text-xs font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400" />
                  <span>Instant Setup</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400" />
                  <span>Real-Time Stock Auto-Deduct</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400" />
                  <span>SSLCommerz Secured</span>
                </div>
              </div>
            </div>

            {/* Right Column (Hero Video/Preview Card): lg:col-span-6 */}
            <div className="lg:col-span-6 w-full">
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl">
                {/* Video Title Header */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                      <Store size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                        {projectName || 'ResPOS'} Demo
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">Watch in 2 Minutes</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase">
                    Live Video
                  </span>
                </div>

                {/* Responsive Video / Preview Container */}
                <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  {isPlaying ? (
                    <iframe
                      src={`${videoEmbed}?autoplay=1`}
                      title="Software Demonstration"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <div
                      onClick={() => setIsPlaying(true)}
                      className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col items-center justify-center text-center p-6 cursor-pointer group transition-all"
                    >
                      <div className="w-16 h-16 rounded-full bg-blue-600/90 group-hover:bg-blue-600 group-hover:scale-110 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 transition-all mb-3">
                        <Play size={24} className="ml-1 fill-white" />
                      </div>
                      <h4 className="text-white font-black text-sm tracking-wide group-hover:text-blue-400 transition-colors">
                        Watch {projectName || 'RestroBiz'} Demo
                      </h4>
                      <p className="text-slate-400 text-xs mt-1">
                        Click to play 2-minute POS &amp; Kitchen Display walkthrough
                      </p>
                    </div>
                  )}
                </div>

                {/* 3 Tab Highlights underneath */}
                <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center py-2.5">
                  <div className="px-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">⚡ Fast POS</p>
                    <p className="text-[10px] text-slate-500">Instant Barcode</p>
                  </div>
                  <div className="px-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">📦 Live Stock</p>
                    <p className="text-[10px] text-slate-500">Auto Deduction</p>
                  </div>
                  <div className="px-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">📊 Daily Reports</p>
                    <p className="text-[10px] text-slate-500">Sales &amp; Profit</p>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>Complete Retail POS</span>
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">Fast • Simple • Reliable</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features Showcase Grid ─────────────────────────────────────────── */}
        <section className="w-full py-16 lg:py-24 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Enterprise Capabilities
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Everything Your Food Business Needs to Scale
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Designed specifically for rapid cashier counters, table floor operations, live kitchen ticket routing, and inventory forecasting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm hover:border-blue-500 transition-colors">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Receipt size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  High-Speed POS &amp; Billing
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Touch-friendly interface built for rapid order punching. Supports split bills, automated service charge, VAT calculations, and thermal receipt printing.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm hover:border-emerald-500 transition-colors">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <ChefHat size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Kitchen Display System (KDS)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Send kitchen order tickets (KOT) live to kitchen tablets. Color-coded timers alert chefs of delayed orders with zero paper ticket clutter.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm hover:border-purple-500 transition-colors">
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <UtensilsCrossed size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Interactive Table Floor Map
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Visual floor map showing occupied, reserved, and available tables in real time. Effortlessly transfer tables and merge guest bills.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm hover:border-amber-500 transition-colors">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Layers size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recipe &amp; Raw Stock Deduction
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Connect raw ingredients to menu items. Automatic stock deduction on every burger or biryani sold, with low-stock alerts.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm hover:border-indigo-500 transition-colors">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <BarChart3 size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Daily Profit &amp; Loss Reports
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Monitor live gross profit, hourly sales volume, top-selling items, and waiter performance from any phone or laptop at home.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm hover:border-rose-500 transition-colors">
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  100% Tenant Cloud Security
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Every restaurant operates in complete database isolation. Encrypted backups, role-based staff permissions, and zero data leakage.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Frequently Asked Questions (Q&A) Section (Matching Image Design) ── */}
        <section className="w-full py-16 lg:py-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 space-y-10">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-semibold shadow-xs">
                <HelpCircle size={14} className="text-blue-600 dark:text-blue-400" />
                <span>Got Questions? We&apos;ve Got Answers</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Everything you need to know about {projectName || 'BizPOS'} Multi-Branch Cloud POS, inventory sync, and hardware compatibility.
              </p>
            </div>

            {/* Accordion Cards matching the screenshot */}
            <div className="max-w-4xl mx-auto space-y-3.5 pt-2">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={faq.num}
                    data-rounded="true"
                    className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700 rounded-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span
                          data-rounded="true"
                          className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center justify-center shrink-0 rounded-md"
                        >
                          {faq.num}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                          {faq.question}
                        </h3>
                      </div>
                      <div
                        data-rounded="true"
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 transition-transform"
                      >
                        <ChevronDown
                          size={18}
                          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-6 pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                        <div className="pl-13 sm:pl-[52px]">
                          {faq.answer}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ── Standalone Public Footer ────────────────────────────────────────── */}
      <PublicFooter />
    </div>
  );
}
