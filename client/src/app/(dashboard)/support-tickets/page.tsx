'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import api from '../../../lib/api';
import { SupportTicket, TicketStatus, TicketCategory, TicketPriority } from '../../../types/support';
import { CreateTicketModal } from '../../../components/support/CreateTicketModal';
import { TicketChatDrawer } from '../../../components/support/TicketChatDrawer';
import toast from 'react-hot-toast';

const statusBadgeColors: Record<TicketStatus, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300' },
  CHECKING: { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-800 dark:text-blue-300' },
  WORKING: { bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-800 dark:text-purple-300' },
  TESTING: { bg: 'bg-cyan-100 dark:bg-cyan-950/60', text: 'text-cyan-800 dark:text-cyan-300' },
  SOLVED: { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300' },
  CLOSED: { bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-300' },
};

const priorityBadgeColors: Record<TicketPriority, { bg: string; text: string }> = {
  LOW: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
  MEDIUM: { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300' },
  HIGH: { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300' },
  URGENT: { bg: 'bg-rose-50 dark:bg-rose-950', text: 'text-rose-700 dark:text-rose-300' },
};

export default function TenantSupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals & Drawer
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);

      const { data } = await api.get(`/support-tickets?${params.toString()}`);
      if (data.success) {
        setTickets(data.data || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch support tickets');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const openTicketDrawer = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setDrawerOpen(true);
  };

  // Metrics
  const totalCount = tickets.length;
  const pendingCount = tickets.filter((t) => ['PENDING', 'CHECKING', 'WORKING', 'TESTING'].includes(t.status)).length;
  const solvedCount = tickets.filter((t) => ['SOLVED', 'CLOSED'].includes(t.status)).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <LifeBuoy size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Support Tickets
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct helpdesk communication with the Restobiz platform team.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Create New Ticket</span>
        </button>
      </div>

      {/* ── Summary Stats Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-outline-variant shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Tickets</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</h3>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-outline-variant shadow-xs">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">In Progress / Pending</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pendingCount}</h3>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-outline-variant shadow-xs">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Resolved & Solved</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{solvedCount}</h3>
        </div>
      </div>

      {/* ── Filter Toolbar ────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-surface border border-outline-variant shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets by number, subject..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CHECKING">Checking</option>
            <option value="WORKING">Working</option>
            <option value="TESTING">Testing</option>
            <option value="SOLVED">Solved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="BUG">Bug Report</option>
            <option value="FEATURE">Feature Request</option>
            <option value="QUERY">General Query</option>
          </select>

          <button
            type="button"
            onClick={fetchTickets}
            title="Refresh List"
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl border border-outline-variant transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Tickets Table ─────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-4">Ticket No</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-xs">
              {loading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-primary" />
                    <span>Loading support tickets...</span>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <LifeBuoy size={36} className="mx-auto mb-2 opacity-40 text-primary" />
                    <p className="font-bold text-sm text-on-surface">No tickets found</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Have a question or encounter an issue? Click "+ Create New Ticket" above.
                    </p>
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => openTicketDrawer(t._id)}
                    className="hover:bg-surface-container cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {t.ticket_no}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="max-w-xs sm:max-w-sm truncate font-bold text-on-surface group-hover:text-primary transition-colors">
                        {t.subject}
                      </div>
                      <div className="text-[11px] text-on-surface-variant truncate max-w-xs sm:max-w-sm mt-0.5">
                        {t.message}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface-container-high text-on-surface">
                        {t.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          priorityBadgeColors[t.priority]?.bg
                        } ${priorityBadgeColors[t.priority]?.text}`}
                      >
                        {t.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          statusBadgeColors[t.status]?.bg
                        } ${statusBadgeColors[t.status]?.text}`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-on-surface-variant text-[11px] whitespace-nowrap">
                      {new Date(t.updated_at || t.created_at || Date.now()).toLocaleDateString()}{' '}
                      {new Date(t.updated_at || t.created_at || Date.now()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTicketDrawer(t._id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <MessageSquare size={14} />
                        <span>View / Reply</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Ticket Modal ───────────────────────────────── */}
      <CreateTicketModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          fetchTickets();
        }}
      />

      {/* ── Ticket Chat Slide-Over Drawer ─────────────────────── */}
      <TicketChatDrawer
        ticketId={selectedTicketId}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTicketId(null);
        }}
        isSuperAdmin={false}
        onTicketUpdated={fetchTickets}
      />
    </div>
  );
}

