'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Paperclip,
  Download,
  Maximize2,
  FileText,
  Clock,
  ShieldCheck,
  Building2,
  User,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import api, { BASE_URL } from '../../lib/api';
import { socket } from '../../lib/socket';
import {
  SupportTicket,
  TicketReply,
  TicketStatus,
  TicketPriority,
  TicketAttachment,
} from '../../types/support';
import toast from 'react-hot-toast';

interface TicketChatDrawerProps {
  ticketId: string | null;
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin?: boolean;
  onTicketUpdated?: () => void;
}

const statusOptions: { value: TicketStatus; label: string; color: string }[] = [
  { value: 'PENDING', label: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300' },
  { value: 'CHECKING', label: 'Checking', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300' },
  { value: 'WORKING', label: 'Working', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300' },
  { value: 'TESTING', label: 'Testing', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300' },
  { value: 'SOLVED', label: 'Solved', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300' },
  { value: 'CLOSED', label: 'Closed', color: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
];

const priorityBadges: Record<TicketPriority, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  HIGH: { label: 'High', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  URGENT: { label: 'Urgent', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
};

function formatFileUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
}

export function TicketChatDrawer({
  ticketId,
  isOpen,
  onClose,
  isSuperAdmin = false,
  onTicketUpdated,
}: TicketChatDrawerProps) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Attachment upload state
  const [pendingAttachments, setPendingAttachments] = useState<TicketAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Full-screen image zoom modal state
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [replies, isOpen]);

  // Fetch ticket details & replies
  useEffect(() => {
    if (!isOpen || !ticketId) return;

    setLoading(true);
    const endpoint = isSuperAdmin
      ? `/super-admin/support-tickets/${ticketId}`
      : `/support-tickets/${ticketId}`;

    api
      .get(endpoint)
      .then(({ data }) => {
        if (data.success && data.data?.ticket) {
          setTicket(data.data.ticket);
          setReplies(data.data.replies || []);
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load ticket details');
      })
      .finally(() => setLoading(false));
  }, [isOpen, ticketId, isSuperAdmin]);

  // Real-time socket updates for this ticket room
  useEffect(() => {
    if (!isOpen || !ticketId) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('joinTicket', ticketId);

    const handleNewReply = (payload: { reply: TicketReply; ticket: SupportTicket }) => {
      if (payload.reply) {
        setReplies((prev) => {
          if (prev.some((r) => r._id === payload.reply._id)) return prev;
          return [...prev, payload.reply];
        });
      }
      if (payload.ticket) {
        setTicket((t) => (t ? { ...t, status: payload.ticket.status, updated_at: payload.ticket.updated_at } : payload.ticket));
      }
    };

    const handleStatusChanged = (payload: { ticket: SupportTicket }) => {
      if (payload.ticket && payload.ticket._id === ticketId) {
        setTicket((t) => (t ? { ...t, status: payload.ticket.status } : payload.ticket));
        if (onTicketUpdated) onTicketUpdated();
      }
    };

    socket.on('supportTicket:reply', handleNewReply);
    socket.on('supportTicket:statusChanged', handleStatusChanged);

    return () => {
      socket.emit('leaveTicket', ticketId);
      socket.off('supportTicket:reply', handleNewReply);
      socket.off('supportTicket:statusChanged', handleStatusChanged);
    };
  }, [isOpen, ticketId, onTicketUpdated]);

  // Status Switcher
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticketId || !ticket) return;

    setUpdatingStatus(true);
    try {
      const endpoint = isSuperAdmin
        ? `/super-admin/support-tickets/${ticketId}/status`
        : `/support-tickets/${ticketId}/status`;

      const { data } = await api.patch(endpoint, { status: newStatus });
      if (data.success) {
        setTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
        toast.success(`Ticket status updated to ${newStatus}`);
        if (onTicketUpdated) onTicketUpdated();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Upload file attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size cannot exceed 10MB');
      return;
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/support-tickets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success && data.data) {
        setPendingAttachments((prev) => [...prev, data.data]);
        toast.success('File attached successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload attachment');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit reply
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ticketId || (!replyMessage.trim() && pendingAttachments.length === 0)) return;

    setSubmittingReply(true);
    try {
      const endpoint = isSuperAdmin
        ? `/super-admin/support-tickets/${ticketId}/replies`
        : `/support-tickets/${ticketId}/replies`;

      const { data } = await api.post(endpoint, {
        message: replyMessage.trim(),
        attachments: pendingAttachments,
      });

      if (data.success && data.data) {
        setReplies((prev) => {
          if (prev.some((r) => r._id === data.data._id)) return prev;
          return [...prev, data.data];
        });
        setReplyMessage('');
        setPendingAttachments([]);
        if (onTicketUpdated) onTicketUpdated();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  if (!isOpen) return null;

  const restaurantName =
    typeof ticket?.restaurant_id === 'object' && ticket?.restaurant_id?.name
      ? ticket.restaurant_id.name
      : 'Restaurant Tenant';

  const creatorName =
    typeof ticket?.user_id === 'object' && ticket?.user_id?.name
      ? ticket.user_id.name
      : 'User';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Slide-over Drawer Pane */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* ── Top Header ────────────────────────────────────────── */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
                    {ticket?.ticket_no || '...'}
                  </span>
                  {ticket?.priority && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        priorityBadges[ticket.priority]?.color
                      }`}
                    >
                      {priorityBadges[ticket.priority]?.label}
                    </span>
                  )}
                  {ticket?.category && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {ticket.category}
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight break-words">
                  {ticket?.subject || 'Loading ticket...'}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Building2 size={13} />
                    <strong>{restaurantName}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User size={13} />
                    {creatorName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Status Switcher Dropdown */}
                {ticket && (
                  <select
                    value={ticket.status}
                    disabled={updatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Middle Chat Feed ─────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {/* Original Ticket Description Card */}
                {ticket && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/50 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {creatorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {creatorName} (Original Issue)
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(ticket.created_at || Date.now()).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {ticket.message}
                    </p>

                    {/* Original attachments */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50 space-y-2">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Attachments ({ticket.attachments.length})
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {ticket.attachments.map((att, idx) => {
                            const isImg =
                              att.type?.startsWith('image/') ||
                              /\.(png|jpe?g|webp|gif|svg)$/i.test(att.url);
                            return (
                              <div
                                key={idx}
                                className="group relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900 p-2 flex flex-col justify-between"
                              >
                                {isImg ? (
                                  <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 mb-1.5 cursor-pointer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={formatFileUrl(att.url)}
                                      alt={att.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      onClick={() => setZoomImage(formatFileUrl(att.url))}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setZoomImage(formatFileUrl(att.url))}
                                      title="Zoom image"
                                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Maximize2 size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 mb-1.5 py-2 px-1 text-slate-600 dark:text-slate-300">
                                    <FileText size={20} className="text-blue-500 shrink-0" />
                                    <span className="text-xs truncate">{att.name}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                  <span className="truncate max-w-[120px]">{att.name}</span>
                                  <a
                                    href={formatFileUrl(att.url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    download
                                    className="p-1 hover:text-blue-500 transition-colors"
                                  >
                                    <Download size={13} />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Conversation Replies Feed */}
                {replies.map((reply) => {
                  const isAgent = reply.sender_type === 'SUPER_ADMIN';
                  const senderName =
                    typeof reply.sender_id === 'object' && reply.sender_id?.name
                      ? reply.sender_id.name
                      : isAgent
                      ? 'Support Specialist'
                      : 'Restaurant Staff';

                  return (
                    <div
                      key={reply._id}
                      className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {isAgent ? (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                            <ShieldCheck size={13} />
                            {senderName} (Super Admin)
                          </span>
                        ) : (
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {senderName} (Tenant)
                          </span>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(reply.created_at || Date.now()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs space-y-2 ${
                          isAgent
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-slate-800 dark:text-slate-100 border border-blue-200 dark:border-blue-900/60 rounded-tl-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tr-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{reply.message}</p>

                        {/* Reply attachments */}
                        {reply.attachments && reply.attachments.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                            {reply.attachments.map((att, idx) => {
                              const isImg =
                                att.type?.startsWith('image/') ||
                                /\.(png|jpe?g|webp|gif|svg)$/i.test(att.url);
                              return (
                                <div
                                  key={idx}
                                  className="group relative rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 p-2 overflow-hidden"
                                >
                                  {isImg ? (
                                    <div className="relative aspect-video rounded overflow-hidden bg-slate-100 dark:bg-slate-800 mb-1 cursor-pointer">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={formatFileUrl(att.url)}
                                        alt={att.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        onClick={() => setZoomImage(formatFileUrl(att.url))}
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-xs py-1">
                                      <FileText size={16} className="text-blue-500" />
                                      <span className="truncate">{att.name}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                                    <span className="truncate max-w-[100px]">{att.name}</span>
                                    <a
                                      href={formatFileUrl(att.url)}
                                      target="_blank"
                                      rel="noreferrer"
                                      download
                                      className="p-1 hover:text-blue-500 transition-colors"
                                    >
                                      <Download size={12} />
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* ── Bottom Reply Form ─────────────────────────────────── */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            {/* Attachment preview pills */}
            {pendingAttachments.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {pendingAttachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <FileText size={13} className="text-blue-500" />
                    <span className="max-w-[140px] truncate text-slate-700 dark:text-slate-300 font-medium">
                      {att.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePendingAttachment(idx)}
                      className="text-slate-400 hover:text-rose-500 transition-colors ml-1 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendReply} className="space-y-2">
              <textarea
                rows={3}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your response to this ticket..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,application/pdf"
                  />
                  <button
                    type="button"
                    disabled={uploadingFile}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {uploadingFile ? (
                      <Loader2 size={14} className="animate-spin text-blue-500" />
                    ) : (
                      <Paperclip size={14} />
                    )}
                    <span>Attach Screenshot / PDF</span>
                  </button>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">Up to 10MB</span>
                </div>

                <button
                  type="submit"
                  disabled={submittingReply || (!replyMessage.trim() && pendingAttachments.length === 0)}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReply ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  <span>Send Reply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── Full Screen Image Zoom Preview Modal ────────────────────── */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomImage}
              alt="Zoomed attachment"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

