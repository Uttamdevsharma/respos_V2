'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { SystemNotice, NoticeType, NoticeTargetType } from '../../../types';
import toast from 'react-hot-toast';
import {
  Megaphone,
  Plus,
  Pin,
  Trash2,
  Edit2,
  CheckCircle,
  Eye,
  AlertTriangle,
  Sparkles,
  Info,
  Wrench,
  X,
  Building,
  Calendar,
  Layers,
  Check,
  Flag,
  Radio,
  Clock,
} from 'lucide-react';

export default function SuperAdminNoticesPage() {
  const [notices, setNotices] = useState<SystemNotice[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedNotice, setSelectedNotice] = useState<SystemNotice | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NoticeType>('ANNOUNCEMENT');
  const [badgeText, setBadgeText] = useState('');
  const [pinned, setPinned] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [showBanner, setShowBanner] = useState(true);
  const [bannerDurationDays, setBannerDurationDays] = useState(7);
  const [targetType, setTargetType] = useState<NoticeTargetType>('ALL');
  const [targetBusinessIds, setTargetBusinessIds] = useState<string[]>([]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/notices');
      if (res.data.success) {
        setNotices(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/super-admin/businesses');
      if (res.data.success) {
        const list = Array.isArray(res.data.data?.items)
          ? res.data.data.items
          : Array.isArray(res.data.data)
          ? res.data.data
          : [];
        setRestaurants(list);
      }
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    fetchNotices();
    fetchRestaurants();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedNotice(null);
    setTitle('');
    setContent('');
    setType('ANNOUNCEMENT');
    setBadgeText('');
    setPinned(false);
    setIsPublished(true);
    setShowBanner(true);
    setBannerDurationDays(7);
    setTargetType('ALL');
    setTargetBusinessIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (notice: SystemNotice) => {
    setModalMode('edit');
    setSelectedNotice(notice);
    setTitle(notice.title);
    setContent(notice.content);
    setType(notice.type);
    setBadgeText(notice.badge_text || '');
    setPinned(notice.pinned);
    setIsPublished(notice.is_published);
    setShowBanner(notice.show_banner);
    setBannerDurationDays(notice.banner_duration_days || 7);
    setTargetType(notice.target_type || 'ALL');
    setTargetBusinessIds(notice.target_business_ids || []);
    setIsModalOpen(true);
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and Content are required');
      return;
    }

    const payload = {
      title,
      content,
      type,
      badge_text: badgeText,
      pinned,
      is_published: isPublished,
      show_banner: showBanner,
      banner_duration_days: bannerDurationDays,
      target_type: targetType,
      target_business_ids: targetType === 'SPECIFIC' ? targetBusinessIds : [],
    };

    try {
      if (modalMode === 'create') {
        const res = await api.post('/super-admin/notices', payload);
        if (res.data.success) {
          toast.success('Announcement broadcasted successfully');
          setIsModalOpen(false);
          fetchNotices();
        }
      } else if (selectedNotice) {
        const res = await api.put(`/super-admin/notices/${selectedNotice._id}`, payload);
        if (res.data.success) {
          toast.success('Notice updated successfully');
          setIsModalOpen(false);
          fetchNotices();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save notice');
    }
  };

  const handleToggle = async (id: string, field: 'pinned' | 'is_published') => {
    try {
      const res = await api.patch(`/super-admin/notices/${id}/toggle`, { field });
      if (res.data.success) {
        toast.success(`Updated notice ${field}`);
        setNotices((prev) =>
          prev.map((n) => (n._id === id ? { ...n, [field]: !(n as any)[field] } : n))
        );
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      const res = await api.delete(`/super-admin/notices/${id}`);
      if (res.data.success) {
        toast.success('Notice deleted');
        fetchNotices();
      }
    } catch (err) {
      toast.error('Failed to delete notice');
    }
  };

  const toggleRestaurantSelection = (id: string) => {
    setTargetBusinessIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Megaphone className="w-7 h-7 sm:w-8 sm:h-8 text-teal-600 shrink-0" />
            System Notices &amp; Announcements
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Broadcast platform updates, scheduled maintenance alerts, and top marquee banners to all or specific restaurant tenants.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 sm:py-3 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4.5 h-4.5" />
          Broadcast New Notice
        </button>
      </div>

      {/* Notices Grid / List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent animate-spin rounded-full mx-auto mb-3" />
            Loading notices...
          </div>
        ) : notices.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-base">No notices broadcasted yet</p>
            <p className="mt-1">Click &quot;Broadcast New Notice&quot; to send your first platform announcement.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notices.map((n) => (
              <div
                key={n._id}
                className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    {n.pinned && (
                      <span className="inline-flex items-center gap-1 text-xs font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 px-2.5 py-1 rounded border border-amber-300 dark:border-amber-800">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    <span
                      className={`text-xs font-black uppercase px-2.5 py-1 rounded border ${
                        n.type === 'URGENT'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                          : n.type === 'MAINTENANCE'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                          : n.type === 'FEATURE'
                          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400'
                          : 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400'
                      }`}
                    >
                      {n.type}
                    </span>
                    {n.badge_text && (
                      <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded">
                        {n.badge_text}
                      </span>
                    )}
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded ${
                        n.is_published
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {n.is_published ? 'Published' : 'Draft / Hidden'}
                    </span>
                    {n.show_banner && (
                      <span className="text-xs text-teal-600 dark:text-teal-400 font-bold">
                        Marquee Banner Active
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {n.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {n.content}
                  </p>

                  <div className="flex items-center gap-4 mt-2.5 text-xs sm:text-sm text-slate-400 flex-wrap">
                    <span>
                      Audience:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {n.target_type === 'ALL'
                          ? 'All Restaurants'
                          : `${n.target_business_ids?.length || 0} Specific Restaurants`}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <Eye className="w-4 h-4" />
                      {n.read_count || 0} Restaurants Read
                    </span>
                    <span>
                      Date:{' '}
                      {new Date(n.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(n._id, 'pinned')}
                    title={n.pinned ? 'Unpin Notice' : 'Pin to Top'}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      n.pinned
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggle(n._id, 'is_published')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                      n.is_published
                        ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-slate-300 text-slate-500 bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {n.is_published ? 'Live' : 'Hidden'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(n)}
                    className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(n._id)}
                    className="p-2.5 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── CREATE / EDIT MODAL ─────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-teal-600" />
                {modalMode === 'create' ? 'Broadcast Platform Notice' : 'Edit Notice'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="p-6 sm:p-7 space-y-4 sm:space-y-5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scheduled System Maintenance on Sunday Midnight"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notice Content / Body *
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Provide complete details about this platform update or announcement..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm sm:text-base leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Notice Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as NoticeType)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer text-sm sm:text-base"
                  >
                    <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
                    <option value="URGENT">URGENT</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="FEATURE">FEATURE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Badge Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="e.g. NEW, v2.5, CRITICAL"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">Target Audience</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    <input
                      type="radio"
                      name="target_type"
                      checked={targetType === 'ALL'}
                      onChange={() => setTargetType('ALL')}
                      className="w-4 h-4 text-teal-600"
                    />
                    Broadcast to All Restaurants
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    <input
                      type="radio"
                      name="target_type"
                      checked={targetType === 'SPECIFIC'}
                      onChange={() => setTargetType('SPECIFIC')}
                      className="w-4 h-4 text-teal-600"
                    />
                    Target Specific Restaurants
                  </label>
                </div>

                {targetType === 'SPECIFIC' && (
                  <div className="mt-2.5 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-1.5 bg-slate-50 dark:bg-slate-800">
                    {restaurants.map((r) => {
                      const isChecked = targetBusinessIds.includes(r._id);
                      return (
                        <div
                          key={r._id}
                          onClick={() => toggleRestaurantSelection(r._id)}
                          className="flex items-center gap-2.5 p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                        >
                          <input type="checkbox" checked={isChecked} onChange={() => {}} className="w-4 h-4 rounded text-teal-600" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{r.name}</span>
                          <span className="text-xs text-slate-400">({r.owner_name})</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Marquee Banner and Pinning Options */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-2.5 text-sm sm:text-base">
                    <input
                      type="checkbox"
                      checked={showBanner}
                      onChange={(e) => setShowBanner(e.target.checked)}
                      className="w-4.5 h-4.5 text-teal-600 rounded"
                    />
                    Show Top Screen Banner
                  </label>
                  {showBanner && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs sm:text-sm">Duration:</span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={bannerDurationDays}
                        onChange={(e) => setBannerDurationDays(Number(e.target.value))}
                        className="w-18 p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-center font-bold text-sm"
                      />
                      <span className="text-slate-500 text-xs sm:text-sm">Days</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200 text-sm">
                    <input
                      type="checkbox"
                      checked={pinned}
                      onChange={(e) => setPinned(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded"
                    />
                    Pin to Top
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200 text-sm">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    Publish Immediately
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold cursor-pointer shadow-xs text-sm"
                >
                  {modalMode === 'create' ? 'Broadcast Notice' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
