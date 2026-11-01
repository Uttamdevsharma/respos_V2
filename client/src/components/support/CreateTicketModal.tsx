'use client';

import { useState, useRef, DragEvent } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import api from '../../lib/api';
import { TicketCategory, TicketPriority, TicketAttachment } from '../../types/support';
import toast from 'react-hot-toast';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTicket: any) => void;
}

export function CreateTicketModal({ isOpen, onClose, onSuccess }: CreateTicketModalProps) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('QUERY');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (files: FileList | File[]) => {
    const file = files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size cannot exceed 10MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/support-tickets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success && data.data) {
        setAttachments((prev) => [...prev, data.data]);
        toast.success(`Attached "${file.name}"`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload attachment');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Subject and detailed message are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data } = await api.post('/support-tickets', {
        subject: subject.trim(),
        category,
        priority,
        message: message.trim(),
        attachments,
      });

      if (data.success) {
        toast.success('Support ticket created successfully');
        onSuccess(data.data);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Create Support Ticket
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Submit your query or technical issue to the Restobiz platform team.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Ticket Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Thermal printer disconnected during billing"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="QUERY">General Query</option>
                <option value="BUG">Bug Report</option>
                <option value="FEATURE">Feature Request</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low (Informational)</option>
                <option value="MEDIUM">Medium (Normal)</option>
                <option value="HIGH">High (Urgent Attention)</option>
                <option value="URGENT">Urgent (System Down / Blocker)</option>
              </select>
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue, what actions triggered it, and any error message displayed..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* File Attachment Drag & Drop Zone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Attachments (Screenshots or PDF)
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-950/30'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                accept="image/*,application/pdf"
              />
              <UploadCloud size={28} className="mx-auto text-slate-400 mb-1.5" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Click to browse or drag and drop files here
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PNG, JPG, WEBP, or PDF (Max 10MB)
              </p>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 font-semibold">
                <Loader2 size={14} className="animate-spin" />
                <span>Uploading file...</span>
              </div>
            )}

            {/* Uploaded attachments preview */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={16} className="text-blue-500 shrink-0" />
                      <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                        {att.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAttachment(idx);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors ml-1 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Create Ticket</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

