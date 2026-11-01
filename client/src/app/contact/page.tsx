'use client';

import { useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { usePlatform } from '../../providers/PlatformProvider';
import { PublicNavbar } from '../../components/common/PublicNavbar';
import { PublicFooter } from '../../components/common/PublicFooter';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Sparkles,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export default function ContactPage() {
  const { projectName, settings } = usePlatform();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast.error('Please complete all required fields');
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/public/contact', {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        pharmacy_name: pharmacyName.trim() || undefined,
        message: message.trim(),
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Inquiry submitted successfully! Our team will contact you shortly.');
        setSubmitted(true);
        setName('');
        setEmail('');
        setPhone('');
        setPharmacyName('');
        setMessage('');
      }
    } catch {
      toast.error('Failed to send message. Please try again or WhatsApp us directly.');
    } finally {
      setSending(false);
    }
  };

  const supportPhone = settings?.support_phone || '01973590937';
  const cleanPhone = supportPhone.replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <PublicNavbar />

      <main className="flex-1">
        {/* ── Page Header ────────────────────────────────────────────────────── */}
        <section className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-16 lg:py-20">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-black uppercase tracking-wider">
              <Sparkles size={13} />
              Get in Touch With Us
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Contact Sales &amp; Customer Support
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Have questions regarding multi-branch operations, thermal hardware compatibility, or custom franchise pricing? Our onboarding team is ready to assist.
            </p>
          </div>
        </section>

        {/* ── Main Contact Grid ──────────────────────────────────────────────── */}
        <section className="w-full py-16 lg:py-20">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-start">
            {/* Left Column: Direct Info & WhatsApp Callout */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Reach Out Directly
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Fastest response via phone call or direct WhatsApp chat during support hours.
                </p>
              </div>

              {/* Direct Channels */}
              <div className="space-y-3 text-xs">
                {/* Phone */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Direct Helpline</p>
                    <a
                      href={`tel:${supportPhone}`}
                      className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 font-mono"
                    >
                      {supportPhone}
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                      <MessageCircle size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">WhatsApp Instant Chat</p>
                      <p className="font-bold text-sm text-slate-900 dark:text-white font-mono">{supportPhone}</p>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${waNumber}?text=Assalamu%20Alaikum,%20I%20have%20an%20inquiry%20regarding%20${encodeURIComponent(
                      projectName || 'the software'
                    )}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Chat Now
                  </a>
                </div>

                {/* Email */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Email Inquiries</p>
                    <a
                      href={`mailto:${settings?.support_email || 'support@restopos.com'}`}
                      className="font-bold text-sm text-slate-900 dark:text-white hover:underline"
                    >
                      {settings?.support_email || 'support@restopos.com'}
                    </a>
                  </div>
                </div>

                {/* Address & Hours */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Head Office</p>
                      <p className="text-slate-500">Dhaka, Bangladesh</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Business Hours</p>
                      <p className="text-slate-500">Saturday – Thursday: 9:00 AM – 10:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Inquiry Form */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Send Us an Instant Inquiry
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Fill in your details and requirements. Our engineering team will review and reply promptly.
                </p>
              </div>

              {submitted && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 text-xs">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-bold">Thank you! Your message has been received.</p>
                    <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Our customer representative will call or WhatsApp you within business hours.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ahsan Habib"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ahsan@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Business / Store Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={pharmacyName}
                      onChange={(e) => setPharmacyName(e.target.value)}
                      placeholder="e.g. Cafe Bistro or Model Pharmacy"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Your Requirements / Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your restaurant branches, billing setup, or requested demo appointment..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-sans leading-relaxed focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Send size={14} />
                  <span>{sending ? 'Sending...' : 'Submit Inquiry'}</span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
