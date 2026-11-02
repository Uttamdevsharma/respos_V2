"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Send,
  Eye,
  RefreshCw,
  HardDrive,
  ArrowLeft,
  Printer,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../lib/api";
import { QuotationPrintSheet } from "./QuotationPrintSheet";

export function QuotationForm({
  quotationId,
  isEdit = false,
  onSuccess,
  onCancel,
}: {
  quotationId?: string | number | null;
  isEdit?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  // ─── ১. স্টেট ভেরিয়েবলসমূহ ─────────────────────────────────────────────
  const [refNo, setRefNo] = useState("");
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("SENT");
  const [clientName, setClientName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [subject, setSubject] = useState(
    "Quotation for RestroBiz Restaurant Management & Smart POS System"
  );

  // সফটওয়্যার মডিউল স্কোপ
  const [softwareRows, setSoftwareRows] = useState([
    {
      sl: 1,
      scope: "Restaurant POS & Dine-in Billing",
      particulars:
        "High-speed table layout management, split-billing, KOT generation, parcel charges, barcode scanner and thermal receipt printing",
    },
    {
      sl: 2,
      scope: "Kitchen Display System (KDS)",
      particulars:
        "Real-time chef screen, preparation timer, food station order bump bar routing (Grill, Drinks, Bakery)",
    },
    {
      sl: 3,
      scope: "Recipe BOM & Raw Ingredient Inventory",
      particulars:
        "Auto raw-material stock deduction per dish sale, low stock alerts, supplier purchase order, recipe costing",
    },
    {
      sl: 4,
      scope: "Captain & Waiter Tablet Ordering",
      particulars:
        "Instant table-side order taking on mobile/tablet, real-time wireless KOT push to kitchen and cashier counters",
    },
    {
      sl: 5,
      scope: "QR Code Contactless Menu & Dine-in Ordering",
      particulars:
        "Self-service digital QR table menu with chef specials, guest direct order sync with POS cashier dashboard",
    },
  ]);

  // সাবস্ক্রিপশন ও কমার্শিয়াল
  const [planName, setPlanName] = useState("Restaurant Starter");
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [licenseFeeTitle, setLicenseFeeTitle] = useState("One-time Setup & Onboarding Fee");
  const [licenseFeeAmount, setLicenseFeeAmount] = useState<number>(5000);
  const [subscriptionAmount, setSubscriptionAmount] = useState<number>(1500);
  const [recurringNote, setRecurringNote] = useState(
    "From 2nd month onwards: ৳ 1,500 / month regular subscription fee."
  );

  // হার্ডওয়্যার প্যাকেজ (অপশনাল চেকবক্স)
  const [hasHardware, setHasHardware] = useState(false);
  const [hardwareRows, setHardwareRows] = useState([
    {
      sl: 1,
      product: "POS Thermal Receipt Printer (80mm Auto-Cutter)",
      specifications: "High-speed 250mm/s thermal printing, USB + LAN dual interface for cash counter",
      amount: 7500,
    },
    {
      sl: 2,
      product: "Kitchen KOT Buzzer Thermal Printer",
      specifications: "Splash-proof oil-resistant thermal printer with high-decibel audible alert for chefs",
      amount: 8500,
    },
    {
      sl: 3,
      product: "Heavy-Duty Cash Drawer (Steel Construction)",
      specifications: "5 bill / 8 coin slots with RJ11 auto kick-out interface paired with billing printer",
      amount: 4800,
    },
    {
      sl: 4,
      product: "10.1\" Touch Android KDS Kitchen Terminal",
      specifications: "High-durability IPS display with wall-mount bracket for Chef station order management",
      amount: 14500,
    },
  ]);

  // সিগনেটরি
  const [signatoryName, setSignatoryName] = useState("Md. Sorower Jahan");
  const [signatoryTitle, setSignatoryTitle] = useState("CEO, RestroBiz SaaS");
  const [signatoryPhone, setSignatoryPhone] = useState("+880 1973590937");
  const [sendEmail, setSendEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  // অটো রেফারেন্স নম্বর ফেচ (New Mode)
  useEffect(() => {
    if (!isEdit && !refNo) {
      api
        .get("/super-admin/quotations/next-ref")
        .then(({ data }) => {
          if (data.nextRefNo || data.data?.nextRefNo) {
            setRefNo(data.nextRefNo || data.data?.nextRefNo);
          }
        })
        .catch(() => {
          // Fallback fetch to list
          api.get("/super-admin/quotations").then(({ data }) => {
            if (data.nextRefNo || data.data?.nextRefNo) {
              setRefNo(data.nextRefNo || data.data?.nextRefNo);
            }
          }).catch(() => {});
        });
    }
  }, [isEdit, refNo]);

  // Load existing quotation data when editing
  useEffect(() => {
    if (isEdit && quotationId) {
      setIsLoadingExisting(true);
      api
        .get(`/super-admin/quotations/${quotationId}`)
        .then(({ data }) => {
          if (data.success && data.data) {
            const q = data.data;
            setRefNo(q.ref_no || "");
            if (q.quote_date) {
              setQuoteDate(new Date(q.quote_date).toISOString().split("T")[0]);
            }
            setStatus(q.status || "SENT");
            setClientName(q.client_name || "");
            setOrganizationName(q.organization_name || "");
            setPhone(q.phone || "");
            setEmail(q.email || "");
            setAddress(q.address || "");
            setSubject(q.subject || "Quotation for RestroBiz Restaurant Management & Smart POS System");
            if (Array.isArray(q.software_rows) && q.software_rows.length > 0) {
              setSoftwareRows(q.software_rows);
            }
            setPlanName(q.plan_name || "Restaurant Starter");
            setBillingCycle(q.billing_cycle || "MONTHLY");
            setLicenseFeeTitle(q.license_fee_title || "One-time Setup & Onboarding Fee");
            setLicenseFeeAmount(Number(q.license_fee_amount || 0));
            setSubscriptionAmount(Number(q.subscription_amount || 0));
            setRecurringNote(q.recurring_note || "");
            setHasHardware(Boolean(q.has_hardware));
            if (Array.isArray(q.hardware_rows) && q.hardware_rows.length > 0) {
              setHardwareRows(q.hardware_rows);
            }
            if (q.company_signatory_name) setSignatoryName(q.company_signatory_name);
            if (q.company_signatory_title) setSignatoryTitle(q.company_signatory_title);
            if (q.company_phone) setSignatoryPhone(q.company_phone);
          }
        })
        .catch(() => {
          Swal.fire("Error", "Could not load quotation details for editing.", "error");
        })
        .finally(() => setIsLoadingExisting(false));
    }
  }, [isEdit, quotationId]);

  // ক্যালকুলেশন
  const initialSoftwareTotal = (Number(licenseFeeAmount) || 0) + (Number(subscriptionAmount) || 0);
  const hardwareTotal = hasHardware
    ? hardwareRows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0)
    : 0;
  const grandTotal = initialSoftwareTotal + hardwareTotal;

  // সাবমিট হ্যান্ডলার
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clientName.trim()) {
      return Swal.fire("Required", "Please enter the Client Name.", "warning");
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ref_no: refNo,
        quote_date: quoteDate,
        status,
        client_name: clientName.trim(),
        organization_name: organizationName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        subject: subject.trim(),
        software_rows: softwareRows,
        software_amount: initialSoftwareTotal,
        plan_name: planName,
        billing_cycle: billingCycle,
        license_fee_title: licenseFeeTitle,
        license_fee_amount: licenseFeeAmount,
        subscription_amount: subscriptionAmount,
        recurring_note: recurringNote,
        has_hardware: hasHardware,
        hardware_rows: hardwareRows,
        hardware_amount: hardwareTotal,
        grand_total: grandTotal,
        company_signatory_name: signatoryName,
        company_signatory_title: signatoryTitle,
        company_phone: signatoryPhone,
      };

      let resData: any;
      if (isEdit && quotationId) {
        const res = await api.put(`/super-admin/quotations/${quotationId}`, payload);
        resData = res.data;
      } else {
        const res = await api.post("/super-admin/quotations", payload);
        resData = res.data;
      }

      if (resData.success) {
        // If sendEmail checked and client email is provided, trigger email dispatch
        if (sendEmail && email.trim() && resData.data?._id) {
          try {
            await api.post(`/super-admin/quotations/${resData.data._id}/send-email`, {
              recipient_email: email.trim(),
            });
          } catch {}
        }

        await Swal.fire(
          "Success!",
          isEdit ? "Quotation updated successfully!" : "Quotation generated successfully!",
          "success"
        );
        onSuccess?.();
      } else {
        Swal.fire("Error", resData.message || "Failed to save quotation", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Network connection failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingExisting) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading Quotation Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ─── টপ হেডার বার (স্ক্রিনশটের মতো হুবহু) ────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              {isEdit ? `Edit Quotation (${refNo})` : "Create New Quotation"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize software features, plan tier, POS equipment and corporate terms
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4 text-teal-600" /> Live Preview
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 shadow-sm"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? "Processing..." : isEdit ? "Update Quotation" : "Generate Quotation"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── সেকশন ১: Client & Quotation Identification ──────────── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center text-xs font-black">
                1
              </span>
              Client &amp; Quotation Identification
            </h3>
            <span className="text-[11px] font-mono text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded font-bold">
              Ref: {refNo || "Generating..."}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Quotation Ref No. *
              </label>
              <input
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                placeholder="RESTRO/2026/001"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Date of Issuance *
              </label>
              <input
                type="date"
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Quotation Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold"
              >
                <option value="SENT">Sent</option>
                <option value="DRAFT">Draft</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Client / Contact Person Name *
              </label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                placeholder="e.g. Md. Tanvir Ahmed"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Restaurant / Organization Name
              </label>
              <input
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. Sultans Dine Ltd."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Contact Phone Number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 17XXXXXXXX"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Client Email (For Auto PDF Dispatch)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Premises / Restaurant Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House #12, Road #4, Dhanmondi, Dhaka - 1205"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Quotation Subject Line *
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* ─── সেকশন ২: Software Scope of Work & Functional Modules ─── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center text-xs font-black">
                2
              </span>
              Software Scope of Work &amp; Functional Modules
            </h3>
            <button
              type="button"
              onClick={() =>
                setSoftwareRows([
                  ...softwareRows,
                  { sl: softwareRows.length + 1, scope: "", particulars: "" },
                ])
              }
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Module
            </button>
          </div>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">SL</th>
                  <th className="py-2.5 px-3 w-1/3 text-left">Module / Scope</th>
                  <th className="py-2.5 px-3 text-left">Technical Particulars &amp; Features</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {softwareRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <input
                        value={row.scope}
                        onChange={(e) => {
                          const copy = [...softwareRows];
                          copy[idx].scope = e.target.value;
                          setSoftwareRows(copy);
                        }}
                        placeholder="Module name..."
                        className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold bg-white dark:bg-slate-950"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <textarea
                        value={row.particulars}
                        onChange={(e) => {
                          const copy = [...softwareRows];
                          copy[idx].particulars = e.target.value;
                          setSoftwareRows(copy);
                        }}
                        rows={2}
                        placeholder="Key features..."
                        className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => setSoftwareRows(softwareRows.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── সেকশন ৩: Software Licensing & Subscription Terms ───── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center text-xs font-black">
                3
              </span>
              Software Licensing &amp; Subscription Terms
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Plan Tier Selection
              </label>
              <select
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
              >
                <option value="Restaurant Starter">Restaurant Starter</option>
                <option value="Restaurant Growth">Restaurant Growth</option>
                <option value="Multi-Branch Enterprise">Multi-Branch Enterprise</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Billing Cycle
              </label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
              >
                <option value="MONTHLY">Monthly Billing</option>
                <option value="YEARLY">Yearly Billing (Discounted)</option>
                <option value="ONE_TIME">Lifetime License</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Setup / License Fee Title
              </label>
              <input
                value={licenseFeeTitle}
                onChange={(e) => setLicenseFeeTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                One-Time Setup &amp; Onboarding Fee (BDT)
              </label>
              <input
                type="number"
                value={licenseFeeAmount}
                onChange={(e) => setLicenseFeeAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Initial Subscription Advance Amount (BDT)
              </label>
              <input
                type="number"
                value={subscriptionAmount}
                onChange={(e) => setSubscriptionAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Recurring Subscription Note
            </label>
            <input
              value={recurringNote}
              onChange={(e) => setRecurringNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>
          <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex justify-between items-center text-xs">
            <span className="font-bold text-teal-900 dark:text-teal-200">
              Total Software Onboarding Payable:
            </span>
            <span className="font-mono font-black text-sm text-teal-700 dark:text-teal-400">
              ৳ {initialSoftwareTotal.toLocaleString("en-BD")}
            </span>
          </div>
        </div>

        {/* ─── সেকশন ৪: POS Hardware Package & Equipment ────────────── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasHardware}
                onChange={(e) => setHasHardware(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded cursor-pointer accent-teal-600"
              />
              <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-teal-600" />
                Include POS Hardware Package &amp; Equipment
              </span>
            </label>
            {hasHardware && (
              <button
                type="button"
                onClick={() =>
                  setHardwareRows([
                    ...hardwareRows,
                    { sl: hardwareRows.length + 1, product: "", specifications: "", amount: 0 },
                  ])
                }
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Equipment
              </button>
            )}
          </div>
          {hasHardware && (
            <div className="space-y-3">
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">SL</th>
                      <th className="py-2.5 px-3 w-1/4 text-left">Equipment / Item</th>
                      <th className="py-2.5 px-3 text-left">Specifications</th>
                      <th className="py-2.5 px-3 w-32 text-right">Amount (BDT)</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {hardwareRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <input
                            value={row.product}
                            onChange={(e) => {
                              const copy = [...hardwareRows];
                              copy[idx].product = e.target.value;
                              setHardwareRows(copy);
                            }}
                            placeholder="Item name..."
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold bg-white dark:bg-slate-950"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            value={row.specifications}
                            onChange={(e) => {
                              const copy = [...hardwareRows];
                              copy[idx].specifications = e.target.value;
                              setHardwareRows(copy);
                            }}
                            placeholder="Specifications..."
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={row.amount}
                            onChange={(e) => {
                              const copy = [...hardwareRows];
                              copy[idx].amount = Number(e.target.value);
                              setHardwareRows(copy);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold text-right bg-white dark:bg-slate-950"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setHardwareRows(hardwareRows.filter((_, i) => i !== idx))}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Total Hardware Package:
                </span>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                  ৳ {hardwareTotal.toLocaleString("en-BD")}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ─── সেকশন ৫: Grand Total Summary Card ───────────────────── */}
        <div className="bg-teal-900 text-white rounded-2xl p-6 space-y-3 shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <p className="text-teal-200 text-xs font-bold uppercase tracking-wider">
                Financial Summary &amp; Grand Total
              </p>
              <h2 className="text-3xl font-black mt-1">৳ {grandTotal.toLocaleString("en-BD")}</h2>
            </div>
            <div className="text-right text-xs space-y-1">
              <p className="text-teal-100">
                Software Investment:{" "}
                <strong className="font-mono font-bold">
                  ৳ {initialSoftwareTotal.toLocaleString("en-BD")}
                </strong>
              </p>
              {hasHardware && (
                <p className="text-teal-100">
                  Hardware Equipment:{" "}
                  <strong className="font-mono font-bold">
                    ৳ {hardwareTotal.toLocaleString("en-BD")}
                  </strong>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── সেকশন ৬: Company Signatory & Email Transmission ───────── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center text-xs font-black">
                6
              </span>
              Company Signatory &amp; Client Email Transmission
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Authorized Signatory Name
              </label>
              <input
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Designation &amp; Organization
              </label>
              <input
                value={signatoryTitle}
                onChange={(e) => setSignatoryTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Contact Phone
              </label>
              <input
                value={signatoryPhone}
                onChange={(e) => setSignatoryPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex items-start gap-3 mt-3">
            <input
              type="checkbox"
              id="send_email_check"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-teal-600 rounded cursor-pointer accent-teal-600"
            />
            <label htmlFor="send_email_check" className="cursor-pointer">
              <span className="text-xs font-bold text-teal-950 dark:text-teal-200 block">
                Send official branded Quotation directly to client&apos;s email upon submission
              </span>
              <span className="text-[11px] text-teal-800/80 dark:text-teal-400 block mt-0.5">
                An automated email with quotation summary and printable link will be dispatched to{" "}
                <strong>{email || "(Client email entered above)"}</strong>.
              </span>
            </label>
          </div>
        </div>

        {/* ─── নিচে সাবমিশন বাটনসমূহ ──────────────────────────────── */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4 text-teal-600" /> Live Document Preview
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 shadow-sm"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? "Processing..." : isEdit ? "Update Quotation" : "Submit & Generate Quotation"}
          </button>
        </div>
      </form>

      {/* ─── লাইভ প্রিভিউ ও প্রিন্ট মোডাল ────────────────────────────── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-300 dark:border-zinc-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Document Preview ({refNo || "Draft"})
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
                  onClick={() => setShowPreviewModal(false)}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-200 dark:bg-zinc-950">
              <QuotationPrintSheet
                data={{
                  ref_no: refNo,
                  quote_date: quoteDate,
                  client_name: clientName,
                  organization_name: organizationName,
                  phone,
                  email,
                  address,
                  subject,
                  software_rows: softwareRows,
                  plan_name: planName,
                  billing_cycle: billingCycle,
                  license_fee_title: licenseFeeTitle,
                  license_fee_amount: licenseFeeAmount,
                  subscription_amount: subscriptionAmount,
                  has_hardware: hasHardware,
                  hardware_rows: hardwareRows,
                  hardware_amount: hardwareTotal,
                  grand_total: grandTotal,
                  company_signatory_name: signatoryName,
                  company_signatory_title: signatoryTitle,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

