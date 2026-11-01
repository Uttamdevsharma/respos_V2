'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Send,
  User,
  Phone,
  Mail,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Headphones,
  Shield,
  ThumbsUp,
  Inbox,
  ArrowRight,
} from 'lucide-react';
import api from '../../../lib/api';
import { socket } from '../../../lib/socket';
import {
  LiveChatSession,
  LiveChatMessage,
  LiveChatDepartment,
  LiveChatStatus,
} from '../../../types/support';
import toast from 'react-hot-toast';

const cannedReplies = [
  'Hello! Welcome to Restobiz. How can I help you today?',
  'Let me check that for you right now.',
  'Could you please share your restaurant or business name?',
  'Our standard setup includes thermal printer support, multi-counter billing, and live kitchen display.',
  'Would you like us to schedule a personalized 1-on-1 demo call?',
  'Thank you for reaching out! Let us know if you need any further assistance.',
];

const departmentTabs: { label: string; value: string }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Sales', value: 'SALES' },
  { label: 'Tech Support', value: 'TECH_SUPPORT' },
  { label: 'Billing', value: 'BILLING' },
  { label: 'General', value: 'GENERAL' },
];

const statusBadgeColors: Record<LiveChatStatus, { bg: string; text: string; dot: string }> = {
  WAITING: { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
  ACTIVE: { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500' },
  RESOLVED: { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-800 dark:text-blue-300', dot: 'bg-blue-500' },
  CLOSED: { bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
};

export default function SuperAdminLiveChatPage() {
  const [sessions, setSessions] = useState<LiveChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<LiveChatSession | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  // Top Metrics
  const [stats, setStats] = useState({
    allChats: 0,
    waitingResponse: 0,
    activeChats: 0,
    resolvedChats: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const { data } = await api.get('/super-admin/live-chat/stats');
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch {}
  };

  // Fetch Sessions list
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (deptFilter !== 'ALL') params.append('department', deptFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const { data } = await api.get(`/super-admin/live-chat/sessions?${params.toString()}`);
      if (data.success) {
        const list: LiveChatSession[] = data.data || [];
        setSessions(list);

        // Auto select first session if none selected
        if (!selectedSessionId && list.length > 0) {
          setSelectedSessionId(list[0]._id);
        }
      }
    } catch (err: any) {
      toast.error('Failed to load chat sessions');
    } finally {
      setLoadingSessions(false);
    }
  }, [search, deptFilter, statusFilter, selectedSessionId]);

  useEffect(() => {
    fetchStats();
    fetchSessions();
  }, [fetchSessions]);

  // Load Selected Session Details & Messages
  useEffect(() => {
    if (!selectedSessionId) return;

    setLoadingMessages(true);
    api
      .get(`/super-admin/live-chat/sessions/${selectedSessionId}`)
      .then(({ data }) => {
        if (data.success && data.data) {
          setSelectedSession(data.data.session);
          setMessages(data.data.messages || []);
        }
      })
      .catch((err) => {
        toast.error('Failed to load conversation history');
      })
      .finally(() => setLoadingMessages(false));
  }, [selectedSessionId]);

  // Socket setup for active session
  useEffect(() => {
    if (!selectedSession?.session_token) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('joinChat', selectedSession.session_token);

    const handleMessage = (payload: { message: LiveChatMessage; session: LiveChatSession }) => {
      if (payload.message) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === payload.message._id)) return prev;
          return [...prev, payload.message];
        });
      }
      if (payload.session) {
        setSelectedSession((s) => (s ? { ...s, ...payload.session } : payload.session));
      }
      // Refresh session list preview
      fetchSessions();
    };

    const handleStatusChanged = (payload: { session: LiveChatSession }) => {
      if (payload.session && payload.session._id === selectedSession._id) {
        setSelectedSession(payload.session);
      }
      fetchSessions();
      fetchStats();
    };

    socket.on('liveChat:message', handleMessage);
    socket.on('liveChat:statusChanged', handleStatusChanged);

    return () => {
      socket.emit('leaveChat', selectedSession.session_token);
      socket.off('liveChat:message', handleMessage);
      socket.off('liveChat:statusChanged', handleStatusChanged);
    };
  }, [selectedSession?.session_token, selectedSession?._id, fetchSessions]);

  // Send Admin message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || !selectedSessionId) return;

    if (!textToSend) {
      setInputMessage('');
    }

    setSendingMessage(true);
    try {
      const { data } = await api.post(
        `/super-admin/live-chat/sessions/${selectedSessionId}/messages`,
        { message: text }
      );

      if (data.success && data.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.data._id)) return prev;
          return [...prev, data.data];
        });
        fetchStats();
        fetchSessions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Change Session Status
  const handleStatusChange = async (newStatus: LiveChatStatus) => {
    if (!selectedSessionId) return;

    try {
      const { data } = await api.patch(
        `/super-admin/live-chat/sessions/${selectedSessionId}/status`,
        { status: newStatus }
      );

      if (data.success) {
        setSelectedSession((prev) => (prev ? { ...prev, status: newStatus } : null));
        toast.success(`Session status marked as ${newStatus}`);
        fetchStats();
        fetchSessions();
      }
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Metrics Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* All Chats Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              All Chats
            </p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats.allChats}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Lifetime visitor chats</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <MessageSquare size={24} />
          </div>
        </div>

        {/* Waiting Response Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Waiting Response
            </p>
            <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {stats.waitingResponse}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Needs immediate attention</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Headphones size={24} />
          </div>
        </div>

        {/* Active Chats Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Active Chats
            </p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats.activeChats}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">In active discussion</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Resolved / Closed Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Resolved / Closed
            </p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats.resolvedChats}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Successfully assisted</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Shield size={24} />
          </div>
        </div>
      </div>

      {/* ── 2-Column Split Workspace ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-280px)] min-h-[600px]">
        {/* ── Left Column: Session Inbox (4 cols) ─────────────────── */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xs">
          {/* Inbox Search & Department Tabs */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search visitor name, phone, email..."
                className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Department Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {departmentTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setDeptFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    deptFilter === tab.value
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loadingSessions && sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-500" />
                <span>Loading chat sessions...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Inbox size={32} className="mx-auto mb-2 opacity-50" />
                <p className="font-bold text-slate-700 dark:text-slate-300">No chat sessions found</p>
                <p className="text-[11px] mt-0.5">When visitors initiate chat from public site, they will appear here.</p>
              </div>
            ) : (
              sessions.map((sess) => {
                const isSelected = sess._id === selectedSessionId;
                const statusMeta = statusBadgeColors[sess.status] || statusBadgeColors.WAITING;

                return (
                  <div
                    key={sess._id}
                    onClick={() => setSelectedSessionId(sess._id)}
                    className={`p-4 transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/30 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${statusMeta.dot}`} />
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {sess.visitor_name}
                        </h4>
                      </div>

                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                        {new Date(sess.last_message_at || sess.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 truncate">
                      <span>{sess.visitor_phone || sess.visitor_email}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {sess.department}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {sess.lastMessagePreview || 'Started chat session'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right Column: Active Chat Pane (8 cols) ──────────────── */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xs">
          {!selectedSession ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <MessageSquare size={32} />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                No active chat selected
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Select a visitor session from the inbox on the left to start live communication.
              </p>
            </div>
          ) : (
            <>
              {/* Header: Visitor Metadata Bar & Status Dropdown */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {selectedSession.visitor_name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        statusBadgeColors[selectedSession.status]?.bg
                      } ${statusBadgeColors[selectedSession.status]?.text}`}
                    >
                      {selectedSession.status}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {selectedSession.department}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Mail size={12} />
                      <a href={`mailto:${selectedSession.visitor_email}`} className="hover:underline">
                        {selectedSession.visitor_email}
                      </a>
                    </span>
                    {selectedSession.visitor_phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        <a href={`tel:${selectedSession.visitor_phone}`} className="hover:underline">
                          {selectedSession.visitor_phone}
                        </a>
                      </span>
                    )}
                    {selectedSession.current_url && (
                      <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 truncate max-w-xs">
                        <Globe size={12} />
                        Visited: {selectedSession.current_url}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                    Status:
                  </span>
                  <select
                    value={selectedSession.status}
                    onChange={(e) => handleStatusChange(e.target.value as LiveChatStatus)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
                  >
                    <option value="WAITING">Mark Waiting</option>
                    <option value="ACTIVE">Mark Active</option>
                    <option value="RESOLVED">Mark Resolved</option>
                    <option value="CLOSED">Mark Closed</option>
                  </select>
                </div>
              </div>

              {/* Canned Quick Replies Bar */}
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-500" />
                  Quick:
                </span>
                {cannedReplies.map((reply, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(reply)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Chat Message History Feed */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/40 dark:bg-slate-950/30">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    <RefreshCw size={20} className="animate-spin text-blue-500" />
                  </div>
                ) : (
                  messages.map((msg) => {
                    if (msg.sender_type === 'SYSTEM') {
                      return (
                        <div key={msg._id} className="text-center my-2">
                          <span className="inline-block px-3 py-1 bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] rounded-full">
                            {msg.message}
                          </span>
                        </div>
                      );
                    }

                    const isAgent = msg.sender_type === 'AGENT';

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1 px-1">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {msg.sender_name} {isAgent ? '(Support)' : '(Visitor)'}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs break-words ${
                            isAgent
                              ? 'bg-blue-600 text-white rounded-br-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-xs'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type an instant reply to the visitor..."
                    className="flex-1 text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || sendingMessage}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send size={15} />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

