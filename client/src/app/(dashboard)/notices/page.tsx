'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { SystemNotice } from '../../../types';
import toast from 'react-hot-toast';
import {
  Megaphone,
  Pin,
  CheckCheck,
  Clock,
  AlertTriangle,
  Sparkles,
  Info,
  Wrench,
  ChevronDown,
  ChevronUp,
  Inbox,
  Filter,
} from 'lucide-react';

export default function TenantNoticesPage() {
  const [notices, setNotices] = useState<SystemNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenant/notices');
      if (res.data.success && res.data.data) {
        setNotices(res.data.data.notices || []);
      }
    } catch (err) {
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleMarkRead = async (notice: SystemNotice) => {
    if (notice.is_read) return;
    try {
      await api.post(`/tenant/notices/${notice._id}/read`);
      setNotices((prev) =>
        prev.map((n) =>
          n._id === notice._id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
    } catch (err) {
      // silent
    }
  };

  const handleToggleExpand = (notice: SystemNotice) => {
    if (expandedId === notice._id) {
      setExpandedId(null);
    } else {
      setExpandedId(notice._id);
      if (!notice.is_read) {
        handleMarkRead(notice);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.post('/tenant/notices/read-all');
      if (res.data.success) {
        toast.success('All notices marked as read');
        setNotices((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
      }
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const filteredNotices = notices.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read;
    return true;
  });

  const unreadCount = notices.filter((n) => !n.is_read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'URGENT':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'MAINTENANCE':
        return <Wrench className="w-4 h-4 text-amber-500" />;
      case 'FEATURE':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'UPDATE':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Megaphone className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'URGENT':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      case 'MAINTENANCE':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'FEATURE':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="text-xl font-black text-on-surface flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-primary" />
            System Notices & Platform Announcements
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Stay updated with major feature releases, maintenance alerts, and official platform news.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-bold transition-all cursor-pointer border border-outline-variant/30"
            >
              <CheckCheck className="w-4 h-4 text-primary" />
              Mark all as read
            </button>
          )}

          <div className="flex bg-surface-container rounded-xl p-1 border border-outline-variant/30 text-xs font-bold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'ALL' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              All ({notices.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'UNREAD' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="p-16 text-center text-on-surface-variant text-xs">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent animate-spin rounded-full mx-auto mb-3" />
          Fetching notices and announcements...
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="p-16 text-center text-on-surface-variant bg-surface rounded-2xl border border-outline-variant/30">
          <Inbox className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-3" />
          <h3 className="font-bold text-sm text-on-surface">No notices to show</h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {filter === 'UNREAD'
              ? 'You are all caught up! No unread announcements.'
              : 'There are currently no platform announcements broadcasted.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotices.map((n) => {
            const isExpanded = expandedId === n._id;
            return (
              <div
                key={n._id}
                onClick={() => handleToggleExpand(n)}
                className={`bg-surface border rounded-2xl p-4 sm:p-5 transition-all cursor-pointer shadow-sm ${
                  !n.is_read
                    ? 'border-primary/50 bg-primary/5 shadow-primary/5'
                    : 'border-outline-variant/30 hover:border-outline-variant'
                } ${n.pinned ? 'ring-1 ring-amber-500/30' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-surface-container shrink-0 mt-0.5">
                      {getTypeIcon(n.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {n.pinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded border border-amber-500/30">
                            <Pin className="w-2.5 h-2.5" /> Pinned
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getTypeBadgeClass(
                            n.type
                          )}`}
                        >
                          {n.type}
                        </span>
                        {n.badge_text && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-surface-container text-on-surface font-mono">
                            {n.badge_text}
                          </span>
                        )}
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        )}
                      </div>

                      <h3
                        className={`text-sm mt-1.5 ${
                          !n.is_read ? 'font-black text-on-surface' : 'font-bold text-on-surface/90'
                        }`}
                      >
                        {n.title}
                      </h3>

                      <p className="text-[11px] text-on-surface-variant/70 mt-0.5">
                        Published{' '}
                        {new Date(n.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-on-surface-variant text-xs">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Content body */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-outline-variant/30 text-xs leading-relaxed text-on-surface whitespace-pre-wrap">
                    {n.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

