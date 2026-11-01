'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Minus,
  Send,
  ThumbsUp,
  Headphones,
  User,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import api from '../../lib/api';
import { socket } from '../../lib/socket';
import {
  LiveChatSession,
  LiveChatMessage,
  LiveChatDepartment,
} from '../../types/support';

const STORAGE_KEY = 'restobiz_live_chat_token';

// Synthesizer chime for incoming agent messages using Web Audio API
function playAgentChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Gentle cheerful two-tone chime (F5 -> C6)
    osc.frequency.setValueAtTime(698.46, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio context may be restricted before user gesture
  }
}

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<LiveChatSession | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Pre-chat form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState<LiveChatDepartment>('SALES');
  const [formError, setFormError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Load existing session from localStorage if present
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
      setLoading(true);
      api
        .get(`/public/live-chat/session/${token}`)
        .then(({ data }) => {
          if (data.success && data.data?.session) {
            setSession(data.data.session);
            setMessages(data.data.messages || []);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        })
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  // Socket connection for live chat room
  useEffect(() => {
    if (!session?.session_token) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('joinChat', session.session_token);

    const handleIncomingMessage = (payload: {
      message: LiveChatMessage;
      session: LiveChatSession;
    }) => {
      const msg = payload.message;
      if (msg) {
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        if (msg.sender_type === 'AGENT') {
          playAgentChime();
          if (!isOpen) {
            setUnreadCount((c) => c + 1);
          }
        }
      }
      if (payload.session) {
        setSession(payload.session);
      }
    };

    const handleStatusChanged = (payload: { session: LiveChatSession }) => {
      if (payload.session) {
        setSession(payload.session);
      }
    };

    socket.on('liveChat:message', handleIncomingMessage);
    socket.on('liveChat:statusChanged', handleStatusChanged);

    return () => {
      socket.emit('leaveChat', session.session_token);
      socket.off('liveChat:message', handleIncomingMessage);
      socket.off('liveChat:statusChanged', handleStatusChanged);
    };
  }, [session?.session_token, isOpen]);

  // Start chat session from pre-chat lead capture form
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError('Please provide your name and email to connect.');
      return;
    }

    setStartingChat(true);
    setFormError('');

    try {
      const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

      const { data } = await api.post('/public/live-chat/session', {
        visitor_name: name.trim(),
        visitor_email: email.trim(),
        visitor_phone: phone.trim(),
        department,
        current_url: currentUrl,
        user_agent: userAgent,
      });

      if (data.success && data.data?.session) {
        setSession(data.data.session);
        localStorage.setItem(STORAGE_KEY, data.data.token);
        if (data.data.initialMessage) {
          setMessages([data.data.initialMessage]);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Unable to connect to live chat. Please try again.');
    } finally {
      setStartingChat(false);
    }
  };

  // Send visitor message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || !session?.session_token) return;

    if (!textToSend) {
      setInputMessage('');
    }

    try {
      const { data } = await api.post(
        `/public/live-chat/session/${session.session_token}/messages`,
        { message: text }
      );

      if (data.success && data.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.data._id)) return prev;
          return [...prev, data.data];
        });
      }
    } catch (err: any) {
      console.error('Failed to send live chat message:', err);
    }
  };

  const handleThumbsUp = () => {
    handleSendMessage('👍');
  };

  const handleEndChat = async () => {
    if (!session?.session_token) return;
    const confirmEnd = window.confirm('Are you sure you want to end this chat session?');
    if (!confirmEnd) return;

    try {
      await api.post(`/public/live-chat/session/${session.session_token}/end`);
    } catch {}

    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setMessages([]);
    setIsOpen(false);
  };

  const handleOpenWidget = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* ── Chat Modal Window ────────────────────────────────────── */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[540px] max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#e11d48] text-white px-4 py-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center relative">
                <Headphones size={18} className="text-white" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#e11d48]" />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-tight leading-tight flex items-center gap-1.5">
                  Restobiz Live Support
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online • Typically replies in seconds</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {session && (
                <button
                  type="button"
                  onClick={handleEndChat}
                  title="End Chat Session"
                  className="px-2 py-1 text-[11px] font-bold bg-white/10 hover:bg-white/20 rounded text-white transition-colors mr-1 cursor-pointer"
                >
                  End Chat
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize"
                className="p-1 hover:bg-white/20 rounded-lg text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                <Minus size={18} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1 hover:bg-white/20 rounded-lg text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body: Pre-chat lead capture vs Chat feed */}
          {!session ? (
            /* ── Pre-Chat Lead Capture Form ────────────────────────── */
            <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center bg-slate-50 dark:bg-slate-900/60">
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-[#e11d48] rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm border border-rose-200 dark:border-rose-900/50">
                  <Sparkles size={24} />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Welcome to Live Support
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Please let us know how to address you so our team can assist you right away.
                </p>
              </div>

              {formError && (
                <div className="mb-4 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleStartChat} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tanvir Hasan"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e11d48]/30 focus:border-[#e11d48]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tanvir@example.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e11d48]/30 focus:border-[#e11d48]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1712 345678"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e11d48]/30 focus:border-[#e11d48]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as LiveChatDepartment)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e11d48]/30 focus:border-[#e11d48]"
                  >
                    <option value="SALES">Sales & Product Inquiries</option>
                    <option value="TECH_SUPPORT">Tech Support & Setup</option>
                    <option value="BILLING">Billing & Subscription</option>
                    <option value="GENERAL">General Support</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={startingChat}
                  className="w-full mt-2 py-3 bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {startingChat ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Start Chat Now</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* ── Live Active Chat Screen ──────────────────────────── */
            <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/40">
              {/* Department & Status Bar */}
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Dept: <strong className="text-slate-800 dark:text-slate-200">{session.department}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {session.status}
                </span>
              </div>

              {/* Messages feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  if (msg.sender_type === 'SYSTEM') {
                    return (
                      <div key={msg._id} className="text-center my-2">
                        <span className="inline-block px-3 py-1 bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] rounded-full">
                          {msg.message}
                        </span>
                      </div>
                    );
                  }

                  const isVisitor = msg.sender_type === 'VISITOR';

                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isVisitor ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-slate-400 mb-1 px-1">
                        {msg.sender_name} •{' '}
                        {new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <div
                        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                          isVisitor
                            ? 'bg-[#e11d48] text-white rounded-br-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-bl-xs'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={handleThumbsUp}
                    title="Send Thumbs Up"
                    className="p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <ThumbsUp size={18} />
                  </button>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e11d48]/30 focus:border-[#e11d48]"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="p-2.5 bg-[#e11d48] hover:bg-[#be123c] text-white rounded-xl shadow transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Persistent Floating Launcher Button ────────────────────── */}
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : handleOpenWidget())}
        className="group relative flex items-center gap-2.5 px-4 sm:px-5 py-3.5 bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-sm rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        aria-label="Open Live Chat"
      >
        {/* Animated Green Online Status Indicator */}
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border border-white" />
        </span>

        <MessageSquare size={19} className="group-hover:rotate-6 transition-transform" />
        <span className="tracking-tight">Live Chat</span>

        {/* Unread badge if incoming replies arrived while minimized */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center shadow-md animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

