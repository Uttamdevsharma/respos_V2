'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { QuotationPrintSheet } from '../../../components/quotations/QuotationPrintSheet';
import { Printer, ArrowLeft, Download, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function PublicQuotationPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchQuotation = async () => {
      try {
        const res = await fetch(`/api/public/quotations/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.message || 'Quotation not found');
        }
      } catch (err: any) {
        setError('Failed to load quotation');
      } finally {
        setLoading(false);
      }
    };
    fetchQuotation();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-700">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent animate-spin rounded-full mx-auto mb-3" />
          <p className="font-bold text-xs uppercase tracking-wider text-slate-500">Loading Official Proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 font-black">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Proposal Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'The requested quotation could not be located.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white text-slate-900 py-8 print:py-0">
      {/* Top Floating Control Bar (Hidden on Print) */}
      <div className="max-w-[210mm] mx-auto px-4 mb-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>RestroBiz Verified Proposal Ref: {data.ref_no}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Main A4 Document Sheet */}
      <div className="print:m-0">
        <QuotationPrintSheet data={data} />
      </div>

      {/* Footer watermark */}
      <div className="text-center mt-6 text-xs text-slate-400 print:hidden">
        RestroBiz Cloud POS Systems &copy; {new Date().getFullYear()} &bull; Confidential Proposal
      </div>
    </div>
  );
}

