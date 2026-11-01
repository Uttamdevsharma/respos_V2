'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  RefreshCw,
  Building2,
  User,
  Clock,
  MessageSquare,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import api from '../../../lib/api';
import {
  SupportTicket,
  TicketStatus,
  TicketCategory,
  TicketPriority,
} from '../../../types/support';
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

export default function SuperAdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [restaurants, setRestaurants] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Top Metrics
  const [stats, setStats] = useState({
    totalTickets: 0,
    pending: 0,
    inProgress: 0,
    solved: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Selected Ticket Drawer
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const { data } = await api.get('/super-admin/support-tickets/stats');
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch {}
  };

  // Fetch Restaurants for dropdown filter
  const fetchRestaurants = async () => {
    try {
      const { data } = await api.get('/super-admin/support-tickets/restaurants');
      if (data.success && data.data) {
        setRestaurants(data.data);
      }
    } catch {}
  };

  // Fetch Tickets list
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (restaurantFilter !== 'ALL') params.append('restaurant_id', restaurantFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);

      const { data } = await api.get(`/super-admin/support-tickets?${params.toString()}`);
      if (data.success) {
        setTickets(data.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, [search, restaurantFilter, statusFilter, categoryFilter, priorityFilter]);

  useEffect(() => {
    fetchStats();
    fetchRestaurants();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const resetFilters = () => {
    setSearch('');
    setRestaurantFilter('ALL');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setPriorityFilter('ALL');
  };

  // Quick inline dropdown status switcher
  const handleInlineStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const { data } = await api.patch(`/super-admin/support-tickets/${ticketId}/status`, {
        status: newStatus,
      });

      if (data.success) {
        toast.success(`Ticket status updated to ${newStatus}`);
        setTickets((prev) =>
          prev.map((t) => (t._id === ticketId ? { ...t, status: newStatus } : t))
        );
        fetchStats();
      }
    } catch (err: any) {
      toast.error('Failed to update ticket status');
    }
  };

  const openTicketDrawer = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Metric Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Tickets
            </p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats.totalTickets}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Across all tenants</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <LifeBuoy size={24} />
          </div>
        </div>

        {/* Pending */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending
            </p>
            <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {stats.pending}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting initial action</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>

        {/* In Progress */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              In Progress
            </p>
            <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {stats.inProgress}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Checking / Working / Testing</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <RefreshCw size={24} />
          </div>
        </div>

        {/* Solved */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Solved & Closed
            </p>
            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.solved}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Resolved successfully</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* ── Filters Toolbar ──────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search bar */}
          <div className="lg:col-span-2 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket no, subject, keywords..."
              className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Restaurant / Tenant dropdown */}
          <div>
            <select
              value={restaurantFilter}
              onChange={(e) => setRestaurantFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Restaurants</option>
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CHECKING">Checking</option>
              <option value="WORKING">Working</option>
              <option value="TESTING">Testing</option>
              <option value="SOLVED">Solved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="BUG">Bug Report</option>
              <option value="FEATURE">Feature Request</option>
              <option value="QUERY">General Query</option>
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Action bar: Reset filters */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <p className="text-xs text-slate-500">
            Showing <strong className="text-slate-800 dark:text-slate-200">{tickets.length}</strong> tickets
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>

            <button
              type="button"
              onClick={fetchTickets}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Comprehensive Tickets Table ──────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Ticket No</th>
                <th className="py-3.5 px-4">Restaurant Name</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Loading tickets...</span>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <LifeBuoy size={36} className="mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No support tickets found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const restObj = typeof t.restaurant_id === 'object' ? t.restaurant_id : null;
                  const userObj = typeof t.user_id === 'object' ? t.user_id : null;

                  return (
                    <tr
                      key={t._id}
                      onClick={() => openTicketDrawer(t._id)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                    >
                      {/* Ticket No */}
                      <td className="py-4 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {!t.is_admin_read && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Unread by Admin" />
                          )}
                          <span>{t.ticket_no}</span>
                        </div>
                      </td>

                      {/* Restaurant Name */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Building2 size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px] sm:max-w-[180px]">
                            {restObj?.name || 'Unknown Restaurant'}
                          </span>
                        </div>
                        {restObj?.contact_number && (
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {restObj.contact_number}
                          </div>
                        )}
                      </td>

                      {/* User */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <User size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{userObj?.name || 'Staff'}</span>
                        </div>
                        {userObj?.email && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                            {userObj.email}
                          </div>
                        )}
                      </td>

                      {/* Subject & Preview */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate group-hover:text-blue-600 transition-colors">
                          {t.subject}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate mt-0.5">
                          {t.message}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {t.category}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            priorityBadgeColors[t.priority]?.bg
                          } ${priorityBadgeColors[t.priority]?.text}`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      {/* Status with Quick Inline Dropdown */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={t.status}
                          onChange={(e) => handleInlineStatusChange(t._id, e.target.value as TicketStatus)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                            statusBadgeColors[t.status]?.bg
                          } ${statusBadgeColors[t.status]?.text}`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CHECKING">Checking</option>
                          <option value="WORKING">Working</option>
                          <option value="TESTING">Testing</option>
                          <option value="SOLVED">Solved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </td>

                      {/* Last Updated */}
                      <td className="py-4 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(t.updated_at || t.created_at || Date.now()).toLocaleDateString()}{' '}
                        {new Date(t.updated_at || t.created_at || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTicketDrawer(t._id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <MessageSquare size={14} />
                          <span>View / Reply</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Slide-Over Right Sheet / Drawer ──────────────────────── */}
      <TicketChatDrawer
        ticketId={selectedTicketId}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTicketId(null);
        }}
        isSuperAdmin={true}
        onTicketUpdated={() => {
          fetchTickets();
          fetchStats();
        }}
      />
    </div>
  );
}

