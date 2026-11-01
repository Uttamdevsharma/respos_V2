'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { SubscriptionPlan } from '../../types';
import { usePlatform } from '../../providers/PlatformProvider';
import { PublicNavbar } from '../../components/common/PublicNavbar';
import { PublicFooter } from '../../components/common/PublicFooter';
import {
  CheckCircle2,
  Building2,
  Users,
  PhoneCall,
  MessageCircle,
  Phone,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function PricingPage() {
  const { settings } = usePlatform();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(true);

  const contactPhone = settings?.support_phone || '01973590937';
  const cleanPhone = contactPhone.replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;

  useEffect(() => {
    api.get('/public/plans')
      .then(({ data }) => {
        if (data.success && Array.isArray(data.data)) {
          setPlans(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <PublicNavbar />

      <main className="flex-1">
        {/* ── Subtitle & Billing Switcher ────────────────────────────────────── */}
        <section className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-12 lg:py-16">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 text-center space-y-4">
            <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Select a subscription tailored to your branch network. Transparent pricing with no hidden setup fees.
            </p>

            {/* Monthly vs Annual Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs sm:text-sm font-bold ${!isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                Monthly Billing
              </span>
              <button
                type="button"
                onClick={() => setIsAnnual(!isAnnual)}
                className={`w-12 h-6 flex items-center bg-slate-200 dark:bg-slate-700 p-0.5 transition-colors cursor-pointer ${
                  isAnnual ? 'bg-blue-600' : ''
                }`}
                aria-label="Toggle Billing Cycle"
              >
                <div
                  className={`w-5 h-5 bg-white shadow-sm transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs sm:text-sm font-bold ${isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                  Annual Billing
                </span>
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase">
                  SAVE 20%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing Cards Grid ─────────────────────────────────────────────── */}
        <section className="w-full py-12 lg:py-16">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 xl:px-16">
            {loading ? (
              <div className="py-20 text-center text-xs font-mono text-slate-400">
                Loading subscription plans...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                {plans.map((plan: any) => {
                  const isCustom = Boolean(plan.is_custom_pricing);
                  const price = isAnnual ? plan.annual_price : plan.monthly_price;
                  const isPopular =
                    plan.is_popular ||
                    plan.badge?.toLowerCase().includes('popular') ||
                    plan.name.toLowerCase().includes('growth');

                  return (
                    <div
                      key={plan._id}
                      className={`p-7 sm:p-8 bg-white dark:bg-slate-900 border flex flex-col justify-between transition-all relative ${
                        isPopular
                          ? 'border-2 border-blue-600 shadow-xl ring-1 ring-blue-600/30'
                          : 'border-slate-200 dark:border-slate-800 shadow-sm'
                      }`}
                    >
                      {/* Top Badges */}
                      {isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <span className="px-3.5 py-1 bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider shadow-sm">
                            MOST POPULAR
                          </span>
                        </div>
                      )}

                      {isCustom && !isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <span className="px-3.5 py-1 bg-slate-900 dark:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider shadow-sm">
                            CUSTOM PLAN
                          </span>
                        </div>
                      )}

                      <div>
                        {/* Plan Title */}
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                          {plan.name}
                        </h3>

                        {/* Price Box */}
                        <div className="mt-3 mb-4">
                          {isCustom ? (
                            <div>
                              <div className="text-3xl font-black text-slate-900 dark:text-white">
                                Custom Pricing
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                Talk to system owner for tailored enterprise setup
                              </p>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-900 dark:text-white">
                                  ৳{Number(price || 0).toLocaleString()}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                  /{isAnnual ? 'year' : 'month'}
                                </span>
                              </div>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                                Billed in BDT via SSLCommerz / bKash
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Quotas Box */}
                        {isCustom ? (
                          <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 text-xs mb-6 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
                              <Building2 size={14} className="text-blue-600" />
                              <span>Custom Scale &amp; Flexible Quota</span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                              Outlets and staff quotas are customized directly per consultation based on your retail chain.
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs mb-6 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 flex items-center gap-1.5">
                                <Building2 size={13} className="text-slate-400" />
                                <span>Branches Allowed:</span>
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {plan.max_branches >= 90 ? 'Unlimited' : `${plan.max_branches || 1} Outlets`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/80">
                              <span className="text-slate-500 flex items-center gap-1.5">
                                <Users size={13} className="text-slate-400" />
                                <span>Staff Allowed (Per Branch):</span>
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {plan.max_staff >= 90 ? 'Unlimited' : `${plan.max_staff || 3} Members / Branch`}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Checklist */}
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
                          WHAT'S INCLUDED:
                        </p>
                        <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-8">
                          {Array.isArray(plan.features) && plan.features.length > 0 ? (
                            plan.features.map((f: string, i: number) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <CheckCircle2 size={15} className="text-blue-600 shrink-0 mt-0.5" />
                                <span className="leading-tight">{f}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-400 text-xs italic">Standard cloud POS features</li>
                          )}
                        </ul>
                      </div>

                      {/* ── Action Buttons ────────────────────────────────────────── */}
                      <div>
                        {isCustom ? (
                          <div className="space-y-2.5">
                            <a
                              href={`https://wa.me/${waNumber}?text=Assalamu%20Alaikum,%20I%20am%20interested%20in%20the%20${encodeURIComponent(
                                plan.name
                              )}%20enterprise%20setup.`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm"
                            >
                              <PhoneCall size={14} />
                              <span>Contact System Owner</span>
                            </a>

                            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500">
                              <a
                                href={`https://wa.me/${waNumber}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 font-bold text-emerald-600 hover:underline"
                              >
                                <MessageCircle size={13} />
                                <span>WhatsApp</span>
                              </a>
                              <span>•</span>
                              <a
                                href={`tel:${contactPhone}`}
                                className="flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300 hover:underline"
                              >
                                <Phone size={12} className="text-blue-600" />
                                <span>{contactPhone}</span>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <Link
                            href={`/register?plan_id=${plan._id}&billing_cycle=${isAnnual ? 'ANNUAL' : 'MONTHLY'}`}
                            className={`w-full py-3 text-center font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-colors ${
                              isPopular
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                                : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            <span>Choose {plan.name}</span>
                            <ArrowRight size={14} />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
