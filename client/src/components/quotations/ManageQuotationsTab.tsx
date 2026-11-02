"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Plus,
  Search,
  Printer,
  Mail,
  Edit2,
  Trash2,
  RefreshCw,
  Send,
  Eye,
  CheckCircle,
  Hash,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../lib/api";
import { QuotationPrintSheet } from "./QuotationPrintSheet";

interface ManageQuotationsTabProps {
  onAddClick: () => void;
  onEditClick: (id: string) => void;
  onPrintClick?: (id: string) => void;
}

export function ManageQuotationsTab({
  onAddClick,
  onEditClick,
  onPrintClick,
}: ManageQuotationsTabProps) {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [nextRefNo, setNextRefNo] = useState("");
  const [stats, setStats] = useState({
    totalCount: 0,
    totalAmount: 0,
    emailedCount: 0,
    acceptedCount: 0,
  });

  // Modal preview
  const [previewQuote, setPreviewQuote] = useState<any | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/super-admin/quotations", {
        params: {
          search: search.trim() || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
        },
      });

      if (res.data.success) {
        const items = res.data.data?.items || [];
        setQuotations(items);

        if (res.data.nextRefNo || res.data.data?.nextRefNo) {
          setNextRefNo(res.data.nextRefNo || res.data.data?.nextRefNo);
        }

        const statMap = res.data.data?.stats || {};
        const total = statMap.TOTAL || { count: items.length, amount: 0 };
        const sent = statMap.SENT || { count: 0 };
        const accepted = statMap.ACCEPTED || { count: 0 };

        // Calculate total amount from items if statMap total amount is 0
        const calculatedTotal =
          total.amount ||
          items.reduce((acc: number, q: any) => acc + (Number(q.grand_total) || 0), 0);

        setStats({
          totalCount: total.count || items.length,
          totalAmount: calculatedTotal,
          emailedCount: (sent.count || 0) + (accepted.count || 0),
          acceptedCount: accepted.count || 0,
        });
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuotations();
  };

  // Send Email Action
  const handleSendEmail = async (quote: any) => {
    if (!quote.email) {
      return Swal.fire("No Email", "This quotation has no client email address.", "warning");
    }

    const result = await Swal.fire({
      title: "Send Quotation Proposal?",
      text: `Official PDF proposal will be dispatched to ${quote.email}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Send Proposal",
      confirmButtonColor: "#0d9488", // teal-600
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setSendingEmailId(quote._id);
    try {
      const res = await api.post(`/super-admin/quotations/${quote._id}/send-email`, {
        recipient_email: quote.email,
      });

      if (res.data.success) {
        Swal.fire("Dispatched!", "Quotation proposal has been emailed successfully.", "success");
        fetchQuotations();
      } else {
        Swal.fire("Warning", res.data.message || "Failed to dispatch email", "warning");
      }
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to send email", "error");
    } finally {
      setSendingEmailId(null);
    }
  };

  // Delete Action
  const handleDelete = async (quote: any) => {
    const result = await Swal.fire({
      title: "Delete Quotation?",
      text: `Are you sure you want to permanently delete proposal "${quote.ref_no}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete It",
      confirmButtonColor: "#e11d48",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await api.delete(`/super-admin/quotations/${quote._id}`);
      if (res.data.success) {
        Swal.fire("Deleted!", "The quotation has been deleted.", "success");
        setQuotations((prev) => prev.filter((q) => q._id !== quote._id));
      }
    } catch {
      Swal.fire("Error", "Could not delete the quotation.", "error");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800";
      case "SENT":
        return "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border-teal-300 dark:border-teal-800";
      case "REJECTED":
        return "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800";
      case "DRAFT":
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Stats Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Quotations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Quotations
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalCount}
            </h3>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
              Valued at ৳ {stats.totalAmount.toLocaleString("en-BD")}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-900">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Next Reference Number */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Next Reference Number
            </span>
            <h3 className="text-lg sm:text-xl font-mono font-black text-teal-700 dark:text-teal-400 truncate max-w-[200px]">
              {nextRefNo || "RESTRO/2026/..."}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle className="w-3 h-3" /> Auto-Sequenced
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900">
            <Hash className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Emailed to Clients */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Emailed to Clients
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.emailedCount}
            </h3>
            <p className="text-[11px] text-slate-500">
              {stats.acceptedCount} accepted by restaurant owners
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900">
            <Send className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── Control Header: Search, Filter, & Add Button ─────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Search & Filter */}
        <form onSubmit={handleSearchSubmit} className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ref no, client name, restaurant..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>

        {/* Add Quotation Action Button */}
        <div className="flex items-center gap-2 justify-end shrink-0">
          <button
            type="button"
            onClick={fetchQuotations}
            title="Refresh List"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onAddClick}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Quotation</span>
          </button>
        </div>
      </div>

      {/* ─── Quotations Table ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 text-left">Ref &amp; Date</th>
                <th className="py-3.5 px-4 text-left">Client &amp; Restaurant</th>
                <th className="py-3.5 px-4 text-left">Scope &amp; Package</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                    <span>Loading quotations...</span>
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-1" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No Quotations Found</p>
                    <p className="text-xs text-slate-400">
                      Create your first proposal by clicking &quot;Add Quotation&quot; above.
                    </p>
                  </td>
                </tr>
              ) : (
                quotations.map((quote) => (
                  <tr
                    key={quote._id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Ref & Date */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400 block">
                        {quote.ref_no}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(quote.quote_date || quote.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    {/* Client & Restaurant */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {quote.client_name}
                      </span>
                      {quote.organization_name ? (
                        <span className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold block">
                          {quote.organization_name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">No organization</span>
                      )}
                      {quote.email && (
                        <span className="text-[10px] text-slate-400 truncate block max-w-[180px]">
                          {quote.email}
                        </span>
                      )}
                    </td>

                    {/* Scope & Package */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {quote.plan_name || "Restaurant Growth Plan"}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                        <span>{Array.isArray(quote.software_rows) ? quote.software_rows.length : 0} modules</span>
                        <span>•</span>
                        <span className={quote.has_hardware ? "text-emerald-600 font-bold" : ""}>
                          {quote.has_hardware ? "Includes POS Hardware" : "Software Only"}
                        </span>
                      </div>
                    </td>

                    {/* Grand Total */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white block">
                        ৳ {Number(quote.grand_total || 0).toLocaleString("en-BD")}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {quote.billing_cycle || "Monthly"}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border ${getStatusBadge(
                          quote.status
                        )}`}
                      >
                        {quote.status || "SENT"}
                      </span>
                      {quote.email_sent_at && (
                        <span className="block text-[9px] text-teal-600 dark:text-teal-400 font-bold mt-0.5">
                          Emailed
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        {/* Print / Preview */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onPrintClick) {
                              onPrintClick(quote._id);
                            } else {
                              setPreviewQuote(quote);
                            }
                          }}
                          title="Print / View Official Quotation"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Public Link */}
                        <a
                          href={`/quote/${quote._id}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Client Web View"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>

                        {/* Send Email */}
                        <button
                          type="button"
                          onClick={() => handleSendEmail(quote)}
                          disabled={sendingEmailId === quote._id}
                          title="Send Email Proposal to Client"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {sendingEmailId === quote._id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                          ) : (
                            <Mail className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => onEditClick(quote._id)}
                          title="Edit Quotation"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(quote)}
                          title="Delete Quotation"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Printable Preview Modal ───────────────────────────────── */}
      {previewQuote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-300 dark:border-zinc-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Document Preview ({previewQuote.ref_no})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Now
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewQuote(null)}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-200 dark:bg-zinc-950">
              <QuotationPrintSheet data={previewQuote} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

