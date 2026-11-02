'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { SmsProvider, SmsSettings, SmsLogItem, SmsStats } from '../../../types';
import toast from 'react-hot-toast';
import {
  Send,
  MessageSquare,
  Settings,
  History,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Hash,
  Users,
  Key,
  Globe,
  Tag,
  Clock,
  Sparkles,
  Phone,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Code,
  Calendar,
  Filter,
  Check,
  Mail,
  SlidersHorizontal,
  X,
} from 'lucide-react';

const PREMADE_TEMPLATES = [
  {
    id: 'due',
    label: 'Due Reminder',
    text: 'Dear {owner_name}, your RestroBiz POS subscription for {restaurant_name} will expire on {expiry_date}. Outstanding amount: {due_amount}. Please renew to prevent service pause. Portal: {portal_url}',
  },
  {
    id: 'upgrade',
    label: 'Upgrade Offer',
    text: 'Exclusive offer for {restaurant_name}! Upgrade your {plan_name} today to unlock online QR ordering and multi-branch analytics. Visit: {portal_url}',
  },
  {
    id: 'maintenance',
    label: 'Maintenance Notice',
    text: 'Notice for {restaurant_name}: RestroBiz Cloud server maintenance is scheduled tonight from 2:00 AM to 4:00 AM. Contact support if needed. {portal_url}',
  },
];

function SuperAdminSmsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'sms-send' | 'sms-settings' | 'sms-logs'>(
    tabParam === 'sms-settings' || tabParam === 'gateways'
      ? 'sms-settings'
      : tabParam === 'sms-logs' || tabParam === 'logs'
      ? 'sms-logs'
      : 'sms-send'
  );

  useEffect(() => {
    if (tabParam === 'sms-settings' || tabParam === 'gateways') {
      setActiveTab('sms-settings');
    } else if (tabParam === 'sms-logs' || tabParam === 'logs') {
      setActiveTab('sms-logs');
    } else {
      setActiveTab('sms-send');
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'sms-send' | 'sms-settings' | 'sms-logs') => {
    setActiveTab(tab);
    router.push(`/super-admin/sms?tab=${tab}`);
  };

  // Tab 1: Campaign States
  const [channel, setChannel] = useState<'SMS' | 'EMAIL' | 'BOTH'>('SMS');
  const [recipientFilter, setRecipientFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'DEMO' | 'PENDING'>('ALL');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [messageText, setMessageText] = useState(
    'Dear {owner_name}, your RestroBiz POS subscription for {restaurant_name} will expire on {expiry_date}. Please renew to prevent service pause. Portal: {portal_url}'
  );
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  // Tab 2: Gateway Configuration States
  const [settings, setSettings] = useState<SmsSettings>({
    sms_provider: 'GREENWEB',
    sms_gateway_url: 'https://api.greenweb.com.bd/api.php',
    sms_api_key: '',
    sms_sender_id: 'RestroBiz',
    sms_is_masking: false,
    sms_masking_id: '',
    sms_non_masking_id: '',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Test SMS from RestroBiz Cloud POS Gateway.');
  const [testingSms, setTestingSms] = useState(false);

  // Tab 3: Delivery Logs States
  const [logs, setLogs] = useState<SmsLogItem[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsSearch, setLogsSearch] = useState('');
  const [logsStatusFilter, setLogsStatusFilter] = useState('ALL');
  const [logsDateRange, setLogsDateRange] = useState<'TODAY' | '7_DAYS' | '30_DAYS' | 'ALL'>('ALL');

  // Payload modal state
  const [selectedLogPayload, setSelectedLogPayload] = useState<any | null>(null);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);

  // ── SMS Calculator Engine ─────────────────────────────────────────────
  const smsCalculation = useMemo(() => {
    const text = messageText || '';
    const charCount = text.length;
    const isUnicode = /[^\u0000-\u007f]/.test(text);

    let smsCount = 1;
    let limitPerUnit = isUnicode ? 70 : 160;
    let multipartLimit = isUnicode ? 67 : 153;

    if (charCount === 0) {
      smsCount = 0;
    } else if (isUnicode) {
      if (charCount > 70) {
        smsCount = Math.ceil(charCount / 67);
      }
    } else {
      if (charCount > 160) {
        smsCount = Math.ceil(charCount / 153);
      }
    }

    const currentCap = smsCount <= 1 ? limitPerUnit : smsCount * multipartLimit;

    return {
      charCount,
      isUnicode,
      smsCount: Math.max(1, smsCount),
      limitPerUnit,
      remainingInCurrentUnit: Math.max(0, currentCap - charCount),
    };
  }, [messageText]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/super-admin/sms/settings');
      if (res.data.success && res.data.data) {
        setSettings(res.data.data);
      }
    } catch (e) {}
  };

  const fetchRestaurants = async () => {
    try {
      setLoadingRestaurants(true);
      const res = await api.get('/super-admin/businesses');
      if (res.data.success) {
        const list = Array.isArray(res.data.data?.items)
          ? res.data.data.items
          : Array.isArray(res.data.data)
          ? res.data.data
          : [];
        setRestaurants(list);
        setSelectedRecipientIds(list.map((r: any) => r._id));
      }
    } catch (e) {
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get('/super-admin/sms/logs', {
        params: {
          search: logsSearch || undefined,
          status: logsStatusFilter !== 'ALL' ? logsStatusFilter : undefined,
          page: logsPage,
          limit: 20,
        },
      });
      if (res.data.success) {
        setLogs(res.data.data?.items || []);
        setLogsTotal(res.data.data?.total || 0);
      }
    } catch (e) {
      toast.error('Failed to load SMS logs');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (activeTab === 'sms-logs') {
      fetchLogs();
    }
  }, [activeTab, logsPage, logsStatusFilter, logsDateRange]);

  // Filtered recipients
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      if (recipientFilter === 'ACTIVE' && r.status !== 'active') return false;
      if (recipientFilter === 'EXPIRED' && r.status !== 'suspended' && !r.isExpired) return false;
      if (recipientFilter === 'DEMO' && !r.is_demo && r.plan_name !== 'Free Trial') return false;
      if (recipientFilter === 'PENDING' && r.verification_status !== 'pending') return false;

      if (recipientSearch.trim()) {
        const q = recipientSearch.toLowerCase();
        const nameMatch = r.name?.toLowerCase().includes(q);
        const ownerMatch = (r.owner?.name || r.owner_name || '').toLowerCase().includes(q);
        const phoneMatch = (r.phone || r.owner?.phone || '').includes(q);
        const emailMatch = (r.email || r.owner?.email || '').toLowerCase().includes(q);
        if (!nameMatch && !ownerMatch && !phoneMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [restaurants, recipientFilter, recipientSearch]);

  const handleToggleSelectAll = () => {
    const visibleIds = filteredRestaurants.map((r) => r._id);
    const allSelected = visibleIds.every((id) => selectedRecipientIds.includes(id));

    if (allSelected) {
      setSelectedRecipientIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedRecipientIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleInsertTag = (tag: string) => {
    setMessageText((prev) => `${prev} {${tag}}`);
  };

  const handleApplyTemplate = (tmpl: string) => {
    setMessageText(tmpl);
    toast.success('Template loaded into message body');
  };

  const handleDispatchCampaign = async () => {
    if (!messageText.trim()) {
      toast.error('Message body cannot be empty');
      return;
    }
    if (selectedRecipientIds.length === 0) {
      toast.error('Please select at least one recipient restaurant');
      return;
    }

    const estimatedUnits = selectedRecipientIds.length * smsCalculation.smsCount;
    if (
      !confirm(
        `Are you sure you want to broadcast this campaign via ${channel} to ${selectedRecipientIds.length} recipient(s)?\nEstimated total SMS units: ${estimatedUnits}`
      )
    ) {
      return;
    }

    setDispatching(true);
    try {
      const res = await api.post('/super-admin/sms/campaign', {
        target_type: 'CUSTOM',
        custom_restaurant_ids: selectedRecipientIds,
        message_template: messageText,
        campaign_type: 'BULK',
        channel,
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Campaign processed successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch SMS campaign');
    } finally {
      setDispatching(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await api.put('/super-admin/sms/settings', settings);
      if (res.data.success) {
        toast.success('SMS Gateway configuration updated');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save gateway settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestSms = async () => {
    if (!testPhone.trim()) {
      toast.error('Please enter a recipient test phone number');
      return;
    }
    setTestingSms(true);
    try {
      const res = await api.post('/super-admin/sms/test', {
        phone: testPhone,
        message: testMessage,
      });
      if (res.data.success) {
        toast.success('Test SMS dispatched successfully');
      } else {
        toast.error(`Gateway response: ${res.data.response}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send test SMS');
    } finally {
      setTestingSms(false);
    }
  };

  const previewText = useMemo(() => {
    return messageText
      .replace(/{restaurant_name}/g, 'Sultans Dine')
      .replace(/{owner_name}/g, 'Asif Mahmud')
      .replace(/{plan_name}/g, 'Enterprise Growth')
      .replace(/{expiry_date}/g, '15 Nov, 2026')
      .replace(/{due_amount}/g, '3,500 BDT')
      .replace(/{portal_url}/g, 'https://pos.okobiz.com');
  }, [messageText]);

  const handleProviderSelect = (provider: SmsProvider) => {
    let url = settings.sms_gateway_url;
    if (provider === 'GREENWEB') url = 'https://api.greenweb.com.bd/api.php';
    if (provider === 'MIM_SMS') url = 'https://api.mimsms.com/api/v3/send-sms';
    if (provider === 'SSL_WIRELESS') url = 'https://smsplus.sslwireless.com/api/v3/send-sms';
    setSettings({ ...settings, sms_provider: provider, sms_gateway_url: url });
  };

  const openPayloadModal = (log: SmsLogItem) => {
    setSelectedLogPayload({
      recipient_phone: log.recipient_phone,
      restaurant: log.restaurant_name,
      gateway_provider: log.provider,
      status: log.status,
      timestamp: log.createdAt,
      sms_count: log.sms_count,
      gateway_response: log.gateway_response || '{"status":"OK","code":200,"message":"SMS submitted to telecom operator"}',
      request_payload: {
        to: log.recipient_phone,
        message: log.message,
        sender_id: log.sender_id || 'RestroBiz',
        type: log.is_unicode ? 'unicode' : 'text',
      },
    });
    setIsPayloadModalOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Smartphone className="w-7 h-7 sm:w-8 sm:h-8 text-teal-600 shrink-0" />
            SMS Management Suite
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Dispatch automated renewal reminders, multi-channel announcements, and manage telecom SMS gateways.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 sm:gap-8 text-sm sm:text-base font-bold overflow-x-auto">
        {[
          { id: 'sms-send', label: '1. Send SMS Campaign', icon: Send },
          { id: 'sms-settings', label: '2. Gateway Settings', icon: Settings },
          { id: 'sms-logs', label: '3. SMS Audit Logs', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`py-3.5 sm:py-4 border-b-2 flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: SEND SMS CAMPAIGN */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'sms-send' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
              {/* Channel Selector */}
              <div>
                <label className="block font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200 mb-2.5">
                  Dispatch Channel Selector
                </label>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { id: 'SMS', label: 'SMS Only', icon: Smartphone },
                    { id: 'EMAIL', label: 'Email Only', icon: Mail },
                    { id: 'BOTH', label: 'Both SMS & Email', icon: Sparkles },
                  ].map((ch) => {
                    const Icon = ch.icon;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setChannel(ch.id as any)}
                        className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          channel === ch.id
                            ? 'bg-teal-50 border-teal-600 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-500 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        <span>{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient Filter Chips */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-teal-600" />
                    Recipient Filter Chips
                  </label>
                  <span className="text-xs sm:text-sm text-teal-600 font-bold">
                    {selectedRecipientIds.length} Selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-2.5 text-xs sm:text-sm">
                  {[
                    { id: 'ALL', label: 'ALL RESTAURANTS' },
                    { id: 'ACTIVE', label: 'ACTIVE SUBSCRIBERS' },
                    { id: 'EXPIRED', label: 'EXPIRED / DUE' },
                    { id: 'DEMO', label: 'DEMO / TRIAL' },
                    { id: 'PENDING', label: 'PENDING APPROVAL' },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setRecipientFilter(chip.id as any)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        recipientFilter === chip.id
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Selection Table with Select All */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        filteredRestaurants.length > 0 &&
                        filteredRestaurants.every((r) => selectedRecipientIds.includes(r._id))
                      }
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                    <span>Select All Filtered ({filteredRestaurants.length})</span>
                  </label>

                  <div className="relative max-w-xs w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      placeholder="Search restaurant or phone..."
                      className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                  {loadingRestaurants ? (
                    <div className="p-4 text-center text-slate-400">Loading restaurants...</div>
                  ) : filteredRestaurants.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">No restaurants match criteria.</div>
                  ) : (
                    filteredRestaurants.map((r) => {
                      const isSelected = selectedRecipientIds.includes(r._id);
                      return (
                        <div
                          key={r._id}
                          onClick={() => handleToggleRecipient(r._id)}
                          className={`p-3 sm:p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            isSelected ? 'bg-teal-50/50 dark:bg-teal-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                {r.name}
                              </div>
                              <div className="text-xs sm:text-sm text-slate-500">
                                {r.owner?.name || r.owner_name || 'Owner'} &bull; {r.phone || r.owner?.phone || 'No phone'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {r.subscription?.plan?.name || r.plan_name || 'Standard'}
                            </span>
                            <div className="text-xs text-slate-400 mt-1">
                              Due: {r.due_amount ? `${r.due_amount} BDT` : '0 BDT'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Dynamic Variable Chips */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">
                    Insert Dynamic Variable Tags
                  </label>
                  <span className="text-xs text-slate-400">Click tag to append to message</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                  {[
                    { key: 'restaurant_name', label: 'Restaurant Name' },
                    { key: 'owner_name', label: 'Owner Name' },
                    { key: 'plan_name', label: 'Plan Name' },
                    { key: 'expiry_date', label: 'Expiry Date' },
                    { key: 'due_amount', label: 'Due Amount' },
                    { key: 'portal_url', label: 'Portal Link' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => handleInsertTag(t.key)}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 dark:text-teal-300 rounded-lg border border-teal-200 dark:border-teal-800 font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {`{${t.key}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pre-made Templates */}
              <div>
                <label className="block font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200 mb-2">
                  Pre-made Notification Templates
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {PREMADE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl.text)}
                      className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:text-teal-600 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Content Area */}
              <div>
                <label className="block font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200 mb-2">
                  SMS Message Body
                </label>
                <textarea
                  rows={5}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message or insert dynamic tags above..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 font-sans leading-relaxed"
                />

                {/* Character & SMS Unit Engine Badge */}
                <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-lg font-mono font-bold ${
                        smsCalculation.isUnicode
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                          : 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                      }`}
                    >
                      {smsCalculation.isUnicode ? 'Bengali (Unicode 70/67)' : 'English (ASCII 160/153)'}
                    </span>
                    <span className="font-mono text-slate-500">
                      {smsCalculation.charCount} Chars &bull;{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {smsCalculation.smsCount} SMS Unit{smsCalculation.smsCount > 1 ? 's' : ''}
                      </strong>{' '}
                      ({smsCalculation.remainingInCurrentUnit} chars remaining)
                    </span>
                  </div>

                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    Est. Total Units:{' '}
                    <strong className="text-teal-600 font-black text-sm sm:text-base">
                      {selectedRecipientIds.length * smsCalculation.smsCount}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Dispatch Action */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  disabled={dispatching || selectedRecipientIds.length === 0}
                  onClick={handleDispatchCampaign}
                  className="px-6 sm:px-8 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-sm sm:text-base font-bold flex items-center gap-2.5 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                  {dispatching ? 'Dispatching Campaign...' : `Dispatch to ${selectedRecipientIds.length} Recipient(s)`}
                </button>
              </div>
            </div>
          </div>

          {/* Right Phone Mockup Preview */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl border border-slate-800 max-w-sm mx-auto">
              <div className="flex justify-between items-center px-4 pb-3 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Smartphone className="w-4 h-4 text-teal-400" />
                  <span>RestroBiz SMS</span>
                </div>
                <span>SIM 1 &bull; 4G</span>
              </div>

              {/* Message Bubble inside mockup */}
              <div className="p-4 min-h-[320px] flex flex-col justify-end">
                <div className="bg-teal-600 text-white rounded-2xl rounded-tr-xs p-4 text-sm shadow-md space-y-2 leading-relaxed">
                  <p>{previewText || 'Type a message to preview...'}</p>
                  <div className="text-[11px] text-teal-200 text-right flex items-center justify-end gap-1">
                    <span>Just now</span>
                    <CheckCircle className="w-3 h-3" />
                  </div>
                </div>
                <div className="text-center text-xs text-slate-500 mt-4">
                  Sender: {settings.sms_is_masking ? settings.sms_masking_id || 'RestroBiz' : settings.sms_sender_id || 'RestroBiz'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: GATEWAY CONFIGURATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'sms-settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5 mb-5">
              <Key className="w-5 h-5 text-teal-600" />
              Gateway Provider Settings
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-4 sm:space-y-5 text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Active SMS Gateway Provider
                </label>
                <select
                  value={settings.sms_provider}
                  onChange={(e) => handleProviderSelect(e.target.value as SmsProvider)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer font-bold text-sm sm:text-base"
                >
                  <option value="GREENWEB">Greenweb BD (api.greenweb.com.bd)</option>
                  <option value="MIM_SMS">MIM SMS (api.mimsms.com)</option>
                  <option value="SSL_WIRELESS">SSL Wireless (smsplus.sslwireless.com)</option>
                  <option value="CUSTOM">Custom HTTP API Webhook</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  SMS Gateway URL
                </label>
                <input
                  type="text"
                  value={settings.sms_gateway_url}
                  onChange={(e) => setSettings({ ...settings, sms_gateway_url: e.target.value })}
                  placeholder="Gateway Endpoint URL"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  API Key / Token *
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.sms_api_key}
                    onChange={(e) => setSettings({ ...settings, sms_api_key: e.target.value })}
                    placeholder="Enter Gateway API Key or Token"
                    className="w-full p-3 pr-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-3.5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-2.5 text-sm sm:text-base">
                    <input
                      type="checkbox"
                      checked={settings.sms_is_masking}
                      onChange={(e) => setSettings({ ...settings, sms_is_masking: e.target.checked })}
                      className="w-4.5 h-4.5 text-teal-600 rounded"
                    />
                    Use Masking Sender ID
                  </label>
                </div>

                {settings.sms_is_masking ? (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Masking Sender ID (e.g. RestroBiz)
                    </label>
                    <input
                      type="text"
                      value={settings.sms_masking_id}
                      onChange={(e) => setSettings({ ...settings, sms_masking_id: e.target.value })}
                      placeholder="e.g. RestroBiz"
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-sm sm:text-base"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Non-Masking Sender ID / Phone
                    </label>
                    <input
                      type="text"
                      value={settings.sms_sender_id}
                      onChange={(e) => setSettings({ ...settings, sms_sender_id: e.target.value })}
                      placeholder="e.g. 8809612345678"
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-sm sm:text-base"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm sm:text-base cursor-pointer transition-colors shadow-xs"
                >
                  {savingSettings ? 'Saving Settings...' : 'Save Gateway Configuration'}
                </button>
              </div>
            </form>
          </div>

          {/* Test SMS Dispatch Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Phone className="w-5 h-5 text-emerald-600" />
              Gateway Test Verification
            </h2>
            <p className="text-sm text-slate-500">
              Send a test SMS to verify gateway connectivity, authentication token, and sender ID delivery.
            </p>

            <div className="space-y-4 text-sm sm:text-base">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs sm:text-sm">
                  Recipient Phone Number (e.g. 01973590937)
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="01973590937"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs sm:text-sm">
                  Test Message
                </label>
                <textarea
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base leading-relaxed"
                />
              </div>

              <button
                type="button"
                disabled={testingSms}
                onClick={handleTestSms}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm sm:text-base transition-colors cursor-pointer flex items-center justify-center gap-2.5 shadow-xs"
              >
                <Send className="w-4.5 h-4.5" />
                {testingSms ? 'Dispatching Test SMS...' : 'Dispatch Test SMS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: AUDIT HISTORY LOGS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'sms-logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden space-y-4 p-4 sm:p-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs sm:text-sm font-bold">
                {['ALL', 'DELIVERED', 'FAILED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setLogsStatusFilter(st)}
                    className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                      logsStatusFilter === st
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Date Range Filter */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs sm:text-sm font-bold">
                {[
                  { id: 'ALL', label: 'All Time' },
                  { id: 'TODAY', label: 'Today' },
                  { id: '7_DAYS', label: '7 Days' },
                  { id: '30_DAYS', label: '30 Days' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setLogsDateRange(d.id as any)}
                    className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
                      logsDateRange === d.id
                        ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={logsSearch}
                  onChange={(e) => setLogsSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                  placeholder="Search mobile number..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <button
                onClick={fetchLogs}
                className="px-4 py-2 text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-xs">
                <tr>
                  <th className="p-3.5 pl-4">Timestamp</th>
                  <th className="p-3.5">Recipient &amp; Restaurant</th>
                  <th className="p-3.5">Number</th>
                  <th className="p-3.5 text-center">Channel</th>
                  <th className="p-3.5 text-center">Units</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right pr-4">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logsLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No delivery logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3.5 pl-4 text-slate-500 font-mono text-xs sm:text-sm">
                        {new Date(log.createdAt).toLocaleString('en-GB')}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="text-sm sm:text-base font-bold">{log.restaurant_name || 'Individual'}</div>
                        <div className="text-xs text-slate-400">{log.recipient_name || 'Tenant Contact'}</div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {log.recipient_phone}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {log.channel || 'SMS'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-teal-600 text-sm">
                        {log.sms_count}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                            log.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <button
                          type="button"
                          onClick={() => openPayloadModal(log)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 dark:bg-slate-800 dark:hover:bg-teal-950/60 dark:hover:text-teal-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ml-auto"
                        >
                          <Code className="w-3.5 h-3.5" />
                          View Payload
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gateway Payload Modal (Dark JSON Syntax Console) */}
      {isPayloadModalOpen && selectedLogPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Code className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base text-white">Gateway API Raw Payload &amp; Response</h3>
              </div>
              <button
                onClick={() => setIsPayloadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs sm:text-sm">
                <span>Recipient: <strong className="text-white">{selectedLogPayload.recipient_phone}</strong> ({selectedLogPayload.restaurant})</span>
                <span>Gateway: <strong className="text-teal-400">{selectedLogPayload.gateway_provider}</strong></span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Dispatched Request Payload:
                </span>
                <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed">
                  {JSON.stringify(selectedLogPayload.request_payload, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Telecom Gateway Server Response:
                </span>
                <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-teal-300 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed">
                  {typeof selectedLogPayload.gateway_response === 'string'
                    ? selectedLogPayload.gateway_response
                    : JSON.stringify(selectedLogPayload.gateway_response, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsPayloadModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
              >
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuperAdminSmsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading SMS Management Suite...</p>
        </div>
      }
    >
      <SuperAdminSmsContent />
    </Suspense>
  );
}
