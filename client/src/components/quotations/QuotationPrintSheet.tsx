"use client";

import React from "react";
import { format } from "date-fns";
import { Phone, Send, Globe, HardDrive } from "lucide-react";
import { convertNumberToWords } from "../../lib/quotation-defaults";

export interface QuotationPrintData {
  id?: number | string;
  ref_no: string;
  quote_date: string | Date;
  client_name: string;
  organization_name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  subject: string;
  software_rows?: { sl: number | string; scope: string; particulars: string }[];
  plan_name?: string | null;
  billing_cycle?: string;
  license_fee_title?: string;
  license_fee_amount?: number | string;
  subscription_amount?: number | string;
  recurring_note?: string | null;
  has_hardware?: boolean;
  hardware_rows?: { sl: number | string; product: string; specifications: string; amount: number | string }[];
  hardware_amount?: number | string;
  grand_total: number | string;
  in_words?: string | null;
  terms_conditions?: string | null;
  company_signatory_name?: string;
  company_signatory_title?: string;
  company_phone?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ১. OFFICIAL OKOBIZ VECTOR LOGO (EXACT SVG GEOMETRY WITH SMILE)
// ─────────────────────────────────────────────────────────────────────────────
const OkobizLogo = ({ className = "w-[130px] sm:w-[155px] h-auto" }: { className?: string }) => (
  <svg viewBox="0 0 170 42" className={`select-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 1st 'o' */}
    <path
      d="M 18,14 C 24.6,14 30,19.4 30,26 C 30,32.6 24.6,38 18,38 C 11.4,38 6,32.6 6,26 C 6,19.4 11.4,14 18,14 Z M 18,20 C 14.7,20 12,22.7 12,26 C 12,29.3 14.7,32 18,32 C 21.3,32 24,29.3 24,26 C 24,22.7 21.3,20 18,20 Z"
      fill="#1E65B8"
      fillRule="evenodd"
    />
    {/* 'k' */}
    <path d="M 37,5 L 43.5,5 L 43.5,23.5 L 54.5,14 L 62.5,14 L 49.5,25 L 63.5,38 L 55,38 L 43.5,27.5 L 43.5,38 L 37,38 Z" fill="#1E65B8" />
    {/* 2nd 'o' with smile */}
    <path
      d="M 77,14 L 67.5,14 C 66.5,14.5 67,16 69,17.2 C 67.5,19.5 66,22.6 66,26 C 66,32.6 71,38 77,38 C 83.6,38 88.5,32.6 88.5,26 C 88.5,19.4 83.6,14 77,14 Z M 77,20 C 73.7,20 71,22.7 71,26 C 71,29.3 73.7,32 77,32 C 80.3,32 83,29.3 83,26 C 83,22.7 80.3,20 77,20 Z"
      fill="#1E65B8"
      fillRule="evenodd"
    />
    <path d="M 73.5,26 C 74.5,29.8 79.5,29.8 80.5,26" stroke="#1E65B8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    {/* 'b' */}
    <path
      d="M 96,5 L 102.5,5 L 102.5,16.5 C 104.2,14.8 106.8,14 110,14 C 116.6,14 122,19.4 122,26 C 122,32.6 116.6,38 110,38 C 106.8,38 104.2,37.2 102.5,35.5 L 102.5,38 L 96,38 Z M 109,20 C 105.7,20 103,22.7 103,26 C 103,29.3 105.7,32 109,32 C 112.3,32 115,29.3 115,26 C 115,22.7 112.3,20 109,20 Z"
      fill="#1E65B8"
      fillRule="evenodd"
    />
    {/* 'i' */}
    <rect x="128.5" y="14" width="6.5" height="24" fill="#1E65B8" />
    <circle cx="131.75" cy="8" r="3.4" fill="#1E65B8" />
    {/* 'z' */}
    <path d="M 142,14 L 161,14 L 161,19.5 L 149.5,32.5 L 161,32.5 L 161,38 L 141.5,38 L 141.5,33 L 153,19.5 L 142,19.5 Z" fill="#1E65B8" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// ২. OFFICIAL OKOBIZ HEADER BANNER (GEOMETRIC MOSAIC & SLOGAN BAR)
// ─────────────────────────────────────────────────────────────────────────────
const OkobizHeaderBanner = () => (
  <div className="relative w-[calc(100%+2.5rem)] sm:w-[calc(100%+4rem)] -mt-5 sm:-mt-8 -mx-5 sm:-mx-8 mb-6 select-none overflow-hidden">
    <svg viewBox="0 0 723 86" className="w-full h-auto block select-none pointer-events-none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="okobiz-tri-clip">
          <rect x="0" y="0" width="723" height="79" />
        </clipPath>
      </defs>
      {/* LEFT BLUE MOSAIC TRIANGLES */}
      <g clipPath="url(#okobiz-tri-clip)">
        <polygon points="68,2 55,24 81,24" fill="#2f6db5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="94,2 81,24 107,24" fill="#7ba3d6" stroke="#fff" strokeWidth="0.5" />
        <polygon points="68,2 94,2 81,24" fill="#d3e0f2" stroke="#fff" strokeWidth="0.5" />
        <polygon points="29,24 16,46 42,46" fill="#a9c3e5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="55,24 42,46 68,46" fill="#4f86c8" stroke="#fff" strokeWidth="0.5" />
        <polygon points="81,24 68,46 94,46" fill="#2f6db5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="29,24 55,24 42,46" fill="#7ba3d6" stroke="#fff" strokeWidth="0.5" />
        <polygon points="55,24 81,24 68,46" fill="#d3e0f2" stroke="#fff" strokeWidth="0.5" />
        <polygon points="81,24 107,24 94,46" fill="#4f86c8" stroke="#fff" strokeWidth="0.5" />
        <polygon points="16,46 3,68 29,68" fill="#2f6db5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="42,46 29,68 55,68" fill="#7ba3d6" stroke="#fff" strokeWidth="0.5" />
        <polygon points="68,46 55,68 81,68" fill="#4f86c8" stroke="#fff" strokeWidth="0.5" />
        <polygon points="94,46 81,68 107,68" fill="#a9c3e5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="16,46 42,46 29,68" fill="#d3e0f2" stroke="#fff" strokeWidth="0.5" />
        <polygon points="42,46 68,46 55,68" fill="#2f6db5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="68,46 94,46 81,68" fill="#a9c3e5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="3,68 -10,90 16,90" fill="#7ba3d6" stroke="#fff" strokeWidth="0.5" />
        <polygon points="29,68 16,90 42,90" fill="#d3e0f2" stroke="#fff" strokeWidth="0.5" />
        <polygon points="55,68 42,90 68,90" fill="#4f86c8" stroke="#fff" strokeWidth="0.5" />
        <polygon points="3,68 29,68 16,90" fill="#2f6db5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="29,68 55,68 42,90" fill="#a9c3e5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="55,68 81,68 68,90" fill="#7ba3d6" stroke="#fff" strokeWidth="0.5" />
      </g>
      {/* RIGHT BLUE MOSAIC TRIANGLES (Mirrored) */}
      <g transform="translate(723,0) scale(-1,1)" clipPath="url(#okobiz-tri-clip)">
        <polygon points="68,2 55,24 81,24" fill="#2f6db5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="94,2 81,24 107,24" fill="#7ba3d6" stroke="#fff" strokeWidth="0.5" />
        <polygon points="68,2 94,2 81,24" fill="#d3e0f2" stroke="#fff" strokeWidth="0.5" />
        <polygon points="29,24 16,46 42,46" fill="#a9c3e5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="55,24 42,46 68,46" fill="#4f86c8" stroke="#fff" strokeWidth="0.5" />
        <polygon points="81,24 68,46 94,46" fill="#2f6db5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="29,24 55,24 42,46" fill="#7ba3d6" stroke="#fff" strokeWidth="0.5" />
        <polygon points="55,24 81,24 68,46" fill="#d3e0f2" stroke="#fff" strokeWidth="0.5" />
        <polygon points="81,24 107,24 94,46" fill="#4f86c8" stroke="#fff" strokeWidth="0.5" />
        <polygon points="16,46 3,68 29,68" fill="#2f6db5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="42,46 29,68 55,68" fill="#7ba3d6" stroke="#fff" strokeWidth="0.5" />
        <polygon points="68,46 55,68 81,68" fill="#4f86c8" stroke="#fff" strokeWidth="0.5" />
        <polygon points="94,46 81,68 107,68" fill="#a9c3e5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="16,46 42,46 29,68" fill="#d3e0f2" stroke="#fff" strokeWidth="0.5" />
        <polygon points="42,46 68,46 55,68" fill="#2f6db5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="68,46 94,46 81,68" fill="#a9c3e5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="3,68 -10,90 16,90" fill="#7ba3d6" stroke="#fff" strokeWidth="0.5" />
        <polygon points="29,68 16,90 42,90" fill="#d3e0f2" stroke="#fff" strokeWidth="0.5" />
        <polygon points="55,68 42,90 68,90" fill="#4f86c8" stroke="#fff" strokeWidth="0.5" />
        <polygon points="3,68 29,68 16,90" fill="#2f6db5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="29,68 55,68 42,90" fill="#a9c3e5" stroke="#fff" strokeWidth="0.5" />
        <polygon points="55,68 81,68 68,90" fill="#7ba3d6" stroke="#fff" strokeWidth="0.5" />
      </g>
      {/* BLUE SLOGAN BAR */}
      <polygon points="78,60 646,60 652,77 70,77" fill="#1E65B8" />
      <text x="361.5" y="72" textAnchor="middle" fill="#ffffff" fontFamily="sans-serif" fontSize="10" fontWeight="bold" letterSpacing="2.5">
        LEADING THE DIGITAL REVOLUTION
      </text>
      <polygon points="88,78 636,78 638,81 86,81" fill="#C5D7EF" />
      <line x1="0" y1="83" x2="723" y2="83" stroke="#B0C8E8" strokeWidth="0.75" />
    </svg>
    {/* OVERLAY OKOBIZ LOGO IN CENTER */}
    <div className="absolute top-2.5 sm:top-3 left-0 right-0 flex justify-center pointer-events-none">
      <OkobizLogo className="w-[130px] sm:w-[155px] h-auto drop-shadow-sm" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ৩. OKOBIZ WATERMARK (CIRCULAR BACKGROUND SMILE)
// ─────────────────────────────────────────────────────────────────────────────
const OkobizWatermark = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] overflow-hidden select-none">
    <svg viewBox="0 0 100 100" className="w-[360px] h-[360px] sm:w-[420px] sm:h-[420px]" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="42" stroke="#1E65B8" strokeWidth="6" />
      <path d="M 32,54 C 36,66 64,66 68,54" stroke="#1E65B8" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ৪. OFFICIAL FOOTER BANNER & COLOR PALETTE STRIP
// ─────────────────────────────────────────────────────────────────────────────
const OkobizFooterBanner = ({
  phone = "+880 1973 590937",
  email = "info@okobiz.com",
  web = "www.okobiz.com",
}: {
  phone?: string;
  email?: string;
  web?: string;
}) => (
  <div className="w-full mt-auto pt-6 select-none">
    <div className="bg-[#1E65B8] text-white py-1 px-4 sm:px-8 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold tracking-wide">
      <div className="flex items-center gap-1.5">
        <Phone className="w-3 h-3 fill-white stroke-none shrink-0" />
        <span>{phone}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Send className="w-3 h-3 fill-white stroke-none shrink-0" />
        <span>{email}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Globe className="w-3 h-3 stroke-white stroke-[2.2] shrink-0" />
        <span>{web}</span>
      </div>
    </div>
    {/* 8-step palette strip */}
    <div className="grid grid-cols-8 h-1.5 w-full">
      <div className="bg-[#E8EEFA]" />
      <div className="bg-[#D4E3F7]" />
      <div className="bg-[#B9D4F4]" />
      <div className="bg-[#93BFF0]" />
      <div className="bg-[#69A5EB]" />
      <div className="bg-[#458BE4]" />
      <div className="bg-[#2A73D4]" />
      <div className="bg-[#1E65B8]" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ৫. MAIN QUOTATION PRINT SHEET COMPONENT (EXACT 1ST IMAGE DESIGN)
// ─────────────────────────────────────────────────────────────────────────────
export const QuotationPrintSheet: React.FC<{ data: QuotationPrintData; className?: string }> = ({
  data,
  className = "",
}) => {
  const formattedDate = data.quote_date
    ? format(new Date(data.quote_date), "d MMMM, yyyy")
    : format(new Date(), "d MMMM, yyyy");

  const softwareRows = data.software_rows || [];
  const hardwareRows = data.hardware_rows || [];
  const licenseAmt = Number(data.license_fee_amount || 0);
  const subAmt = Number(data.subscription_amount || 0);
  const initialSoftwareTotal = licenseAmt + subAmt;
  const hardwareTotal = data.has_hardware
    ? hardwareRows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0)
    : 0;
  const grandTotalNum = Number(data.grand_total || initialSoftwareTotal + hardwareTotal);
  const wordsFormatted = data.in_words || (grandTotalNum > 0 ? convertNumberToWords(grandTotalNum) : "");
  const planDisplay = data.plan_name || "Restaurant Growth Plan";

  // Signatory variables
  const signatoryName = data.company_signatory_name || "Md. Sorower Jahan";
  const signatoryTitle = data.company_signatory_title || "CEO, RestroBiz / okobiz";
  const signatoryPhone = data.company_phone || "+880 1973590937";

  return (
    <div className={`quotation-document font-sans text-zinc-900 bg-white max-w-[850px] mx-auto p-4 sm:p-8 print:p-0 print:max-w-none ${className}`}>
      {/* Print CSS Rules */}
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .quotation-document { width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .quotation-page {
            page-break-after: avoid !important;
            min-height: 282mm !important;
            padding: 10mm 14mm 12mm 14mm !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* ─── COMPLETE A4 PROPOSAL DOCUMENT ────────────────────────────── */}
      <section className="quotation-page relative bg-white border border-zinc-200 print:border-none p-5 sm:p-8 shadow-sm print:shadow-none min-h-[1050px] flex flex-col justify-between overflow-hidden">
        {/* Background Watermark */}
        <OkobizWatermark />

        <div className="flex-1 flex flex-col relative z-10">
          {/* Top Vector Banner */}
          <OkobizHeaderBanner />

          {/* Date & Ref No */}
          <div className="flex justify-between items-start text-xs sm:text-sm font-semibold mb-5">
            <div>{formattedDate}</div>
            <div className="text-right">
              <span>Ref No. </span>
              <span className="font-bold text-[#1E65B8]">{data.ref_no}</span>
            </div>
          </div>

          {/* Client Info */}
          <div className="text-xs sm:text-sm leading-relaxed mb-4">
            <div className="font-semibold mb-0.5">To</div>
            {data.client_name && <div className="font-bold text-zinc-900">{data.client_name}</div>}
            {data.organization_name && <div className="text-zinc-700 font-medium">{data.organization_name}</div>}
            {data.address && <div className="text-zinc-600">{data.address}</div>}
            {data.phone && <div className="text-zinc-600">Cell: {data.phone}</div>}
            {data.email && <div className="text-zinc-600">Email: {data.email}</div>}
          </div>

          {/* Subject Line */}
          <div className="text-xs sm:text-sm font-bold text-zinc-900 mb-4 pb-1">
            <span>Subject: </span>
            <span className="underline">{data.subject}</span>
          </div>

          {/* ─── TABLE 1: SCOPE OF WORK (ROYAL BLUE HEADER) ──────────────── */}
          <div className="mb-4">
            <div className="border border-zinc-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#1E65B8] text-white font-bold border-b border-zinc-800">
                    <th className="py-1.5 px-2.5 w-12 text-center text-xs font-bold uppercase tracking-wider">SL</th>
                    <th className="py-1.5 px-2.5 w-1/3 text-left text-xs font-bold uppercase tracking-wider">SCOPE OF WORK / MODULE</th>
                    <th className="py-1.5 px-2.5 text-left text-xs font-bold uppercase tracking-wider">TECHNICAL PARTICULARS &amp; FEATURES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {softwareRows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-zinc-50/60"}>
                      <td className="py-1.5 px-2.5 text-center font-bold text-zinc-800">{row.sl || idx + 1}</td>
                      <td className="py-1.5 px-2.5 font-semibold text-zinc-900">{row.scope}</td>
                      <td className="py-1.5 px-2.5 text-zinc-700 leading-snug">{row.particulars}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── TABLE 2: SUBSCRIPTION & LICENSING BREAKDOWN ────────────── */}
          <div className="space-y-3 mb-4">
            <div className="border border-zinc-800">
              <div className="bg-[#1E65B8] text-white px-3 py-1.5 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                <span>SOFTWARE SUBSCRIPTION &amp; LICENSING BREAKDOWN</span>
                <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 uppercase tracking-normal">
                  {planDisplay} &bull; {data.billing_cycle === "YEARLY" ? "ANNUAL BILLING" : "MONTHLY BILLING"}
                </span>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-zinc-100 border-b border-zinc-300 text-zinc-700">
                  <tr>
                    <th className="py-1 px-3 text-left font-semibold">Component / Description</th>
                    <th className="py-1 px-3 text-center font-semibold w-36">Billing Type</th>
                    <th className="py-1 px-3 text-right font-semibold w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {licenseAmt > 0 && (
                    <tr className="bg-white">
                      <td className="py-1.5 px-3 font-semibold text-zinc-900">
                        {data.license_fee_title || "One-time Setup & Onboarding Fee"}
                      </td>
                      <td className="py-1.5 px-3 text-center text-zinc-600 font-medium">One-Time</td>
                      <td className="py-1.5 px-3 text-right font-bold text-zinc-900">
                        ৳ {licenseAmt.toLocaleString("en-BD")}/-
                      </td>
                    </tr>
                  )}
                  <tr className="bg-zinc-50/50">
                    <td className="py-1.5 px-3 font-semibold text-zinc-900">
                      RestroBiz Subscription &mdash; <span className="text-[#1E65B8]">{planDisplay}</span>
                    </td>
                    <td className="py-1.5 px-3 text-center text-zinc-600 font-medium">1st Month Advance</td>
                    <td className="py-1.5 px-3 text-right font-bold text-zinc-900">
                      ৳ {subAmt.toLocaleString("en-BD")}/-
                    </td>
                  </tr>
                  <tr className="bg-blue-50/70 font-bold border-t border-zinc-300">
                    <td colSpan={2} className="py-1.5 px-3 text-zinc-900">Total Software Onboarding Payable:</td>
                    <td className="py-1.5 px-3 text-right text-[#1E65B8] font-bold">
                      ৳ {initialSoftwareTotal.toLocaleString("en-BD")}/-
                    </td>
                  </tr>
                </tbody>
              </table>
              {data.recurring_note && (
                <div className="bg-zinc-50/90 border-t border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#1E65B8]">Ongoing Subscription: </span>
                    <span className="font-medium text-zinc-800">{data.recurring_note}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 italic">Auto-renewable</span>
                </div>
              )}
            </div>

            {/* ─── OPTIONAL: RESTAURANT HARDWARE TABLE (IF INCLUDED) ───────── */}
            {data.has_hardware && hardwareRows.length > 0 && (
              <div className="border border-zinc-800">
                <div className="bg-[#1E65B8] text-white px-3 py-1.5 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>POS HARDWARE &amp; EQUIPMENT PACKAGE</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 uppercase tracking-normal">
                    1-Year Warranty Included
                  </span>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-zinc-100 border-b border-zinc-300 text-zinc-700">
                    <tr>
                      <th className="py-1 px-2.5 w-12 text-center font-semibold">SL</th>
                      <th className="py-1 px-3 text-left font-semibold w-1/3">Equipment / Item</th>
                      <th className="py-1 px-3 text-left font-semibold">Technical Specifications</th>
                      <th className="py-1 px-3 text-right font-semibold w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {hardwareRows.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                        <td className="py-1.5 px-2.5 text-center font-bold text-zinc-800">{row.sl || idx + 1}</td>
                        <td className="py-1.5 px-3 font-semibold text-zinc-900">{row.product}</td>
                        <td className="py-1.5 px-3 text-zinc-600 leading-snug">{row.specifications}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-zinc-900">
                          ৳ {Number(row.amount || 0).toLocaleString("en-BD")}/-
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50/70 font-bold border-t border-zinc-300">
                      <td colSpan={3} className="py-1.5 px-3 text-zinc-900">Total Hardware Package:</td>
                      <td className="py-1.5 px-3 text-right text-[#1E65B8] font-bold">
                        ৳ {hardwareTotal.toLocaleString("en-BD")}/-
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* ─── GRAND TOTAL CARD (PAYABLE AT ONBOARDING) ────────────────── */}
            <div className="border border-zinc-900 border-t-2">
              <div className="flex justify-between items-center py-2 px-4 bg-zinc-100 font-bold text-sm sm:text-base text-zinc-900">
                <span>Grand Total (Payable at Onboarding) =</span>
                <span className="text-[#1E65B8]">৳ {grandTotalNum.toLocaleString("en-BD")}/-</span>
              </div>
              {wordsFormatted && (
                <div className="py-1.5 px-4 border-t border-zinc-900 text-xs sm:text-sm font-semibold text-zinc-800 bg-white">
                  In Word: {wordsFormatted}
                </div>
              )}
            </div>
          </div>

          {/* ─── 1ST IMAGE SIGNATURE: THANKS & REGARDS + CLIENT SIGNATURE & SEAL ─── */}
          <div className="mt-8 sm:mt-10 mb-4 flex justify-between items-end">
            {/* Left: Thanks & Regards + Signatory */}
            <div className="space-y-4">
              <div className="font-bold text-xs sm:text-sm text-zinc-900">
                Thanks &amp; Regards
              </div>

              <div className="space-y-0.5 text-xs">
                <div className="font-bold text-zinc-900 text-xs sm:text-sm">
                  {signatoryName} | {signatoryTitle}
                </div>
                <div className="text-zinc-600 font-medium">
                  okobiz / RestroBiz SaaS
                </div>
                <div className="text-zinc-600 font-medium">
                  Contact No: {signatoryPhone}
                </div>
              </div>
            </div>

            {/* Right: Client Signature & Seal with dashed line */}
            <div className="text-center pb-0.5">
              <div className="border-b-2 border-dashed border-zinc-800 w-52 sm:w-60 mb-2 ml-auto" />
              <div className="font-bold text-xs sm:text-sm text-zinc-900 tracking-tight">
                Client Signature &amp; Seal
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Contact & Palette */}
        <OkobizFooterBanner
          phone={data.company_phone || "+880 1973 590937"}
          email="info@okobiz.com"
          web="www.okobiz.com"
        />
      </section>

      {/* ─── OPTIONAL PAGE 2: ONLY IF CUSTOM TERMS EXPLICITLY PROVIDED ─── */}
      {data.terms_conditions && (
        <section className="quotation-page relative bg-white border border-zinc-200 print:border-none p-5 sm:p-8 shadow-sm print:shadow-none min-h-[1050px] flex flex-col justify-between overflow-hidden mt-6 print:mt-0">
          <OkobizWatermark />

          <div className="flex-1 flex flex-col relative z-10">
            <OkobizHeaderBanner />

            <div className="flex justify-between items-center text-xs font-semibold pb-3 mb-4 border-b border-zinc-200">
              <span className="text-zinc-600">Quotation Terms &amp; Conditions</span>
              <span className="font-mono text-[#1E65B8] font-bold">Ref: {data.ref_no}</span>
            </div>

            <div
              className="text-xs text-zinc-800 space-y-4 leading-relaxed prose max-w-none"
              dangerouslySetInnerHTML={{ __html: data.terms_conditions }}
            />

            {/* Same 1st Image Signature layout on Terms Page */}
            <div className="mt-auto pt-8 mb-4 flex justify-between items-end">
              <div className="space-y-4">
                <div className="font-bold text-xs sm:text-sm text-zinc-900">
                  Thanks &amp; Regards
                </div>

                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-zinc-900 text-xs sm:text-sm">
                    {signatoryName} | {signatoryTitle}
                  </div>
                  <div className="text-zinc-600 font-medium">
                    okobiz / RestroBiz SaaS
                  </div>
                  <div className="text-zinc-600 font-medium">
                    Contact No: {signatoryPhone}
                  </div>
                </div>
              </div>

              <div className="text-center pb-0.5">
                <div className="border-b-2 border-dashed border-zinc-800 w-52 sm:w-60 mb-2 ml-auto" />
                <div className="font-bold text-xs sm:text-sm text-zinc-900 tracking-tight">
                  Client Signature &amp; Seal
                </div>
              </div>
            </div>
          </div>

          <OkobizFooterBanner
            phone={data.company_phone || "+880 1973 590937"}
            email="info@okobiz.com"
            web="www.okobiz.com"
          />
        </section>
      )}
    </div>
  );
};
