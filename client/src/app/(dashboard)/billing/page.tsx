'use client';

import { useEffect, useState } from 'react';
import Topbar from '../../../components/layout/topbar';
import api from '../../../lib/api';
import { Order, PaymentMethod, Settings, SplitPaymentEntry } from '../../../types';
import { formatCurrency, formatTime } from '../../../lib/constants';
import toast from 'react-hot-toast';
import { printInvoice, downloadTxtInvoice } from '../../../lib/printInvoice';
import { socket } from '../../../lib/socket';
import { playSound } from '../../../lib/sound';
import {
  RotateCw,
  CreditCard,
  Coins,
  Smartphone,
  CheckCircle,
  Receipt,
  FileText,
  Printer,
  PlusCircle,
  SplitSquareVertical,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Trash2,
  Clock,
  Layers,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAYMENT_ICONS: Record<PaymentMethod, React.ElementType> = {
  cash: Coins,
  card: CreditCard,
  mobile: Smartphone,
};
const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Hand Cash',
  card: 'Card / POS',
  mobile: 'bKash / MFS',
};
const PAYMENT_COLORS: Record<PaymentMethod, { text: string; bg: string; border: string; active: string }> = {
  cash:   { text: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-300', active: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
  card:   { text: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-300',    active: 'border-blue-500 bg-blue-50 text-blue-700'           },
  mobile: { text: 'text-violet-600',  bg: 'bg-violet-50',   border: 'border-violet-300',  active: 'border-violet-500 bg-violet-50 text-violet-700'     },
};

type BillingMode = 'full' | 'split' | 'partial';

// ─── Component ────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const [orders, setOrders]               = useState<Order[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [settings, setSettings]           = useState<Settings | null>(null);
  const [mode, setMode]                   = useState<BillingMode>('full');
  const [showPartialLedger, setShowPartialLedger] = useState(true);

  // Full payment
  const [discount, setDiscount]         = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount]     = useState(0);

  // Split payment — list of { method, amount, note }
  const [splits, setSplits] = useState<{ method: PaymentMethod; amount: number; note: string }[]>([
    { method: 'mobile', amount: 0, note: '' },
    { method: 'cash',   amount: 0, note: '' },
  ]);

  // Partial (collect-over-time)
  const [partialAmount, setPartialAmount] = useState(0);
  const [partialMethod, setPartialMethod] = useState<PaymentMethod>('mobile');
  const [partialNote, setPartialNote]     = useState('');
  const [partialLoading, setPartialLoading] = useState(false);

  // Success modal
  const [successModalData, setSuccessModalData] = useState<{ order: Order; returnAmount: number } | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBillingOrders = async () => {
    try {
      const { data } = await api.get('/orders/billing');
      if (data.success) {
        setOrders(data.data);
        if (data.data.length > 0 && !selectedOrder) {
          setSelectedOrder(data.data[0]);
          resetForms();
        }
      } else {
        toast.error(data.message || 'Failed to load billing orders');
      }
    } catch (err: any) {
      if (!err.response?.status || err.response?.status !== 401) {
        toast.error(err.response?.data?.message || 'Failed to load billing orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      if (data.success) setSettings(data.data);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchBillingOrders();
    fetchSettings();

    const handleOrderUpdated = (order: Order) => {
      const isServedOrBilling = ['served', 'billing'].includes(order.status);

      setOrders((prev) => {
        const exists = prev.some((o) => o._id === order._id);
        if (isServedOrBilling) {
          if (exists) {
            return prev.map((o) => (o._id === order._id ? order : o));
          } else {
            setTimeout(() => {
              playSound.playChime();
              const qty = order.items.reduce((sum, i) => sum + i.quantity, 0);
              toast(`Table T-${((order.table as any)?.number || 0).toString().padStart(2, '0')} ready for billing (${qty} Item${qty !== 1 ? 's' : ''})!`, { icon: '🔔' });
            }, 0);
            return [order, ...prev];
          }
        } else {
          // If status changed to completed/paid or cancelled, remove from billing queue
          if (exists) {
            if (['completed', 'paid'].includes(order.status)) {
              setTimeout(() => {
                playSound.playSuccess();
                const qty = order.items.reduce((sum, i) => sum + i.quantity, 0);
                toast(`Order #${order.token} (${qty} Item${qty !== 1 ? 's' : ''}) payment settled!`, { icon: '🎉' });
              }, 0);
            }
            return prev.filter((o) => o._id !== order._id);
          }
          return prev;
        }
      });

      if (!isServedOrBilling) {
        setSelectedOrder((curr) => {
          if (curr?._id === order._id) {
            return null;
          }
          return curr;
        });
      }
    };

    const handleOrderDeleted = (data: { _id: string }) => {
      setOrders((prev) => prev.filter((o) => o._id !== data._id));
      setSelectedOrder((curr) => (curr?._id === data._id ? null : curr));
    };

    socket.on('orderUpdated', handleOrderUpdated);
    socket.on('orderDeleted', handleOrderDeleted);

    return () => {
      socket.off('orderUpdated', handleOrderUpdated);
      socket.off('orderDeleted', handleOrderDeleted);
    };
  }, []);


  // Keep selected order fresh when list refreshes
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find((o) => o._id === selectedOrder._id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders]);

  const resetForms = () => {
    setDiscount(0); setPaidAmount(0); setPaymentMethod('cash');
    setSplits([{ method: 'mobile', amount: 0, note: '' }, { method: 'cash', amount: 0, note: '' }]);
    setPartialAmount(0); setPartialMethod('mobile'); setPartialNote('');
    setMode('full');
  };
  const handleSelectOrder = (order: Order) => { setSelectedOrder(order); resetForms(); };

  // ── Calculators ────────────────────────────────────────────────────────────
  const subtotal       = selectedOrder?.subtotal || 0;
  const taxableAmt     = Math.max(0, subtotal - discount);
  const taxRate        = settings ? settings.taxRate / 100 : 0.15;
  const serviceRate    = settings ? settings.serviceChargeRate / 100 : 0.05;
  const vat            = Math.round(taxableAmt * taxRate * 100) / 100;
  const serviceCh      = Math.round(taxableAmt * serviceRate * 100) / 100;
  const grandTotal     = Math.round((taxableAmt + vat + serviceCh) * 100) / 100;
  const alreadyPaid    = selectedOrder?.amountPaid || 0;
  const remainingDue   = Math.max(0, Math.round((grandTotal - alreadyPaid) * 100) / 100);
  const returnAmount   = Math.max(0, paidAmount - remainingDue);
  const partialLedger  = selectedOrder?.partialPayments || [];

  // Split totals
  const splitsTotal    = Math.round(splits.reduce((s, e) => s + (e.amount || 0), 0) * 100) / 100;
  const splitShortfall = Math.max(0, Math.round((remainingDue - splitsTotal) * 100) / 100);
  const splitReturn    = Math.max(0, Math.round((splitsTotal - remainingDue) * 100) / 100);

  // ── Split helpers ──────────────────────────────────────────────────────────
  const addSplitRow = () =>
    setSplits((prev) => [...prev, { method: 'cash', amount: 0, note: '' }]);
  const removeSplitRow = (idx: number) =>
    setSplits((prev) => prev.filter((_, i) => i !== idx));
  const updateSplit = (idx: number, field: keyof typeof splits[0], val: any) =>
    setSplits((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  const autoFillLastSplit = () => {
    // Fill the last row with the shortfall
    if (splits.length === 0) return;
    setSplits((prev) => {
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], amount: splitShortfall };
      return next;
    });
  };

  // ── Full Payment ───────────────────────────────────────────────────────────
  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;
    if (paymentMethod === 'cash' && paidAmount < remainingDue) {
      toast.error(`Paid amount must be at least ${formatCurrency(remainingDue)}`);
      return;
    }
    try {
      const { data } = await api.post(`/orders/${selectedOrder._id}/payment`, {
        paymentMethod,
        paidAmount: paymentMethod === 'cash' ? paidAmount : remainingDue,
        discount,
      });
      if (data.success) {
        setSuccessModalData({ order: data.data, returnAmount: data.data.returnAmount || 0 });
        setSelectedOrder(null);
        fetchBillingOrders();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error processing payment');
    }
  };

  // ── Split Payment ──────────────────────────────────────────────────────────
  const handleConfirmSplit = async () => {
    if (!selectedOrder) return;
    const validSplits = splits.filter((s) => s.amount > 0);
    if (validSplits.length === 0) { toast.error('Add at least one payment amount'); return; }
    if (splitsTotal < remainingDue - 0.01) {
      toast.error(`Shortfall of ${formatCurrency(splitShortfall)} — adjust amounts`);
      return;
    }
    try {
      const { data } = await api.post(`/orders/${selectedOrder._id}/split-payment`, {
        discount,
        splits: validSplits.map((s) => ({
          paymentMethod: s.method,
          amount: s.amount,
          note: s.note || undefined,
        })),
      });
      if (data.success) {
        setSuccessModalData({ order: data.data, returnAmount: data.data.returnAmount || 0 });
        setSelectedOrder(null);
        fetchBillingOrders();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error processing split payment');
    }
  };

  // ── Partial (collect over time) ────────────────────────────────────────────
  const handleAddPartialPayment = async () => {
    if (!selectedOrder) return;
    if (partialAmount <= 0) { toast.error('Enter a valid amount'); return; }
    if (partialAmount > remainingDue + 0.01) {
      toast.error(`Amount exceeds remaining balance of ${formatCurrency(remainingDue)}`);
      return;
    }
    setPartialLoading(true);
    try {
      const { data } = await api.post(`/orders/${selectedOrder._id}/partial-payment`, {
        amount: partialAmount,
        paymentMethod: partialMethod,
        note: partialNote || undefined,
      });
      if (data.success) {
        toast.success(`${formatCurrency(partialAmount)} recorded ✓`);
        setSelectedOrder(data.data);
        setOrders((prev) => prev.map((o) => (o._id === data.data._id ? data.data : o)));
        setPartialAmount(0); setPartialNote('');
        if (data.data.amountDue <= 0) {
          setMode('full');
          toast('All amounts collected! Confirm final checkout.', { icon: '🎉' });
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error recording payment');
    } finally { setPartialLoading(false); }
  };

  const handlePrintInvoice = () => {
    if (!selectedOrder || !settings) { toast.error('Settings not loaded'); return; }
    printInvoice(selectedOrder, settings);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title="Billing Terminal" subtitle="Cashier checkout & settlement" />

      <div className="flex-1 p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 overflow-y-auto lg:overflow-hidden bg-background">

        {/* ── LEFT: Order List ── */}
        <section className="col-span-1 lg:col-span-7 flex flex-col gap-4 h-full overflow-y-auto pr-2">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-on-surface">Ready for Billing</h2>
            <button
              onClick={() => { setLoading(true); fetchBillingOrders(); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-outline-variant rounded-xl text-xs font-bold transition-all press-effect"
            >
              <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
              Reload
            </button>
          </div>

          {loading && orders.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-on-surface-variant text-sm font-medium">Syncing billing tickets...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant/40 gap-2 border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface">
              <Receipt size={48} strokeWidth={1.5} />
              <p className="text-xs font-bold uppercase tracking-wider">No tables ready for checkout.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {orders.map((order) => {
                const isSelected = selectedOrder?._id === order._id;
                const hasPartials = (order.partialPayments || []).length > 0;
                const amtPaid = order.amountPaid || 0;
                const due = Math.max(0, order.grandTotal - amtPaid);
                return (
                  <button
                    key={order._id}
                    onClick={() => handleSelectOrder(order)}
                    className={`relative flex flex-col p-4 bg-surface border rounded-2xl hover:border-primary hover:shadow-md transition-all text-left press-effect ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-outline-variant/30'}`}
                  >
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-secondary rounded-r-full" />
                    <div className="flex justify-between items-start mb-2 ml-2">
                      <span className="text-lg font-black">Table {((order.table as any)?.number || 0).toString().padStart(2, '0')}</span>
                      <div className="flex items-center gap-1">
                        {hasPartials && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold flex items-center gap-0.5">
                            <Clock size={8} />Partial
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-secondary-light text-secondary rounded text-[9px] font-bold uppercase">{order.status}</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <p className="text-[10px] text-on-surface-variant/70">Token: <span className="font-bold">{order.token}</span></p>
                      <p className="text-base font-black text-primary mt-1">{formatCurrency(order.grandTotal)}</p>
                      {hasPartials && <p className="text-[10px] text-amber-600 font-bold">Remaining: {formatCurrency(due)}</p>}
                    </div>
                    <div className="mt-2 ml-2 flex gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded text-[9px] font-bold">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} Items
                      </span>
                      {hasPartials && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-bold">
                          {order.partialPayments.length} partial{order.partialPayments.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── RIGHT: Checkout Panel ── */}
        <section className="col-span-1 lg:col-span-5 bg-surface border border-outline-variant/30 rounded-2xl flex flex-col shadow-lg overflow-hidden h-full">
          {selectedOrder ? (
            <>
              {/* Panel Header + Mode Selector */}
              <div className="p-4 bg-surface-container-high border-b border-outline-variant/30">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-black text-on-surface">Checkout Terminal</h2>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">
                      Table {((selectedOrder.table as any)?.number || 0).toString().padStart(2, '0')} • {selectedOrder.token}
                    </p>
                  </div>
                  {/* 3-way mode toggle */}
                  <div className="flex bg-surface-container p-0.5 rounded-xl border border-outline-variant/20 gap-0.5 shrink-0">
                    {([
                      { id: 'full'    as BillingMode, label: 'Full',  icon: CheckCircle        },
                      { id: 'split'   as BillingMode, label: 'Split', icon: Layers              },
                      { id: 'partial' as BillingMode, label: 'Later', icon: Clock              },
                    ] as const).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setMode(id)}
                        title={id === 'full' ? 'Single method' : id === 'split' ? 'Multiple methods at once' : 'Collect in instalments'}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                          mode === id
                            ? id === 'split'   ? 'bg-violet-500 text-white shadow-sm'
                            : id === 'partial' ? 'bg-amber-500 text-white shadow-sm'
                            :                    'bg-primary text-on-primary shadow-sm'
                            : 'text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        <Icon size={10} />{label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Mode description */}
                <p className="text-[10px] text-on-surface-variant mt-2">
                  {mode === 'full'    && '💳 Collect full amount with one payment method'}
                  {mode === 'split'   && '🔀 Collect with multiple methods (e.g. bKash + Hand Cash)'}
                  {mode === 'partial' && '⏳ Record instalments — customer pays in parts over time'}
                </p>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">

                {/* Order Items */}
                <div className="space-y-1 border-b border-outline-variant/20 pb-3">
                  <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-wider mb-2">Order Items</h3>
                  <div className="divide-y divide-outline-variant/10 max-h-36 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1.5 text-xs">
                        <div>
                          <p className="font-bold">{item.name} <span className="text-on-surface-variant font-normal">×{item.quantity}</span></p>
                          {item.notes && <p className="text-[9px] text-error italic">* {item.notes}</p>}
                        </div>
                        <span className="font-black text-on-surface-variant">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-on-surface-variant">Subtotal</span><span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-xs font-bold text-on-surface-variant">Discount (৳)</span>
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-on-surface-variant">৳</span>
                      <input
                        type="number" value={discount || ''}
                        onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full pl-6 pr-2 py-1 bg-surface-container-low border border-outline-variant/60 rounded-xl text-right text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-on-surface-variant">VAT ({settings ? settings.taxRate : 15}%)</span><span>{formatCurrency(vat)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-on-surface-variant">Service Charge ({settings ? settings.serviceChargeRate : 5}%)</span><span>{formatCurrency(serviceCh)}</span>
                  </div>
                  <div className="pt-2 border-t border-outline-variant/20 flex justify-between items-center">
                    <span className="text-sm font-black">Grand Total</span>
                    <span className="text-xl font-black text-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                {/* ── Partial Payment Ledger ── */}
                {partialLedger.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/40 overflow-hidden">
                    <button
                      onClick={() => setShowPartialLedger((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-black text-amber-700"
                    >
                      <span className="flex items-center gap-1.5"><Clock size={12} />Collected So Far ({partialLedger.length} entry)</span>
                      {showPartialLedger ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {showPartialLedger && (
                      <div className="px-3 pb-2 divide-y divide-amber-100">
                        {partialLedger.map((p, idx) => {
                          const Icon = PAYMENT_ICONS[p.paymentMethod];
                          return (
                            <div key={idx} className="flex items-center justify-between py-1.5 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Icon size={11} className={PAYMENT_COLORS[p.paymentMethod].text} />
                                <span className="font-semibold capitalize">{PAYMENT_LABELS[p.paymentMethod]}</span>
                                {p.note && <span className="text-[9px] text-on-surface-variant italic">"{p.note}"</span>}
                              </div>
                              <div className="text-right">
                                <p className="font-black text-amber-700">{formatCurrency(p.amount)}</p>
                                <p className="text-[9px] text-on-surface-variant">{formatTime(p.paidAt)}</p>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex justify-between pt-1.5 mt-1 border-t border-amber-200">
                          <span className="text-xs font-black text-amber-700">Already Collected</span>
                          <span className="font-black text-amber-700">{formatCurrency(alreadyPaid)}</span>
                        </div>
                        <div className="flex justify-between pt-1 items-center">
                          <span className="text-xs font-black flex items-center gap-1"><AlertCircle size={10} className="text-error" />Remaining</span>
                          <span className="font-black text-primary">{formatCurrency(remainingDue)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    MODE: FULL PAYMENT
                ══════════════════════════════════════════════════════════════ */}
                {mode === 'full' && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-wider">Payment Channel</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {(['cash', 'card', 'mobile'] as PaymentMethod[]).map((m) => {
                        const Icon = PAYMENT_ICONS[m];
                        const c = PAYMENT_COLORS[m];
                        const active = paymentMethod === m;
                        return (
                          <button key={m} onClick={() => setPaymentMethod(m)}
                            className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all press-effect gap-1 ${active ? c.active : `border-outline-variant/30 text-on-surface-variant`}`}
                          >
                            <Icon size={18} />
                            <span className="text-[10px] font-bold leading-tight text-center">{PAYMENT_LABELS[m]}</span>
                          </button>
                        );
                      })}
                    </div>
                    {alreadyPaid > 0 && (
                      <div className="flex justify-between items-center bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                        <span className="text-xs font-bold text-on-surface-variant">Remaining to Collect</span>
                        <span className="text-base font-black text-primary">{formatCurrency(remainingDue)}</span>
                      </div>
                    )}
                    {paymentMethod === 'cash' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider block">Paid Amount</label>
                          <input type="number" placeholder={`Min ${formatCurrency(remainingDue)}`}
                            value={paidAmount || ''} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider block">Return Change</label>
                          <div className="w-full px-3 py-2 bg-surface-container border border-outline-variant/50 rounded-xl text-sm font-black text-secondary h-[38px] flex items-center">
                            {formatCurrency(returnAmount)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    MODE: SPLIT PAYMENT (multiple methods at once)
                ══════════════════════════════════════════════════════════════ */}
                {mode === 'split' && (
                  <div className="space-y-3">
                    {/* Remaining balance banner */}
                    <div className="flex justify-between items-center bg-violet-50 border border-violet-200 rounded-xl px-3 py-2">
                      <span className="text-xs font-bold text-violet-700">Total to Collect</span>
                      <span className="text-base font-black text-violet-700">{formatCurrency(remainingDue)}</span>
                    </div>

                    {/* Split rows */}
                    <div className="space-y-2">
                      {splits.map((split, idx) => {
                        const Icon = PAYMENT_ICONS[split.method];
                        const c = PAYMENT_COLORS[split.method];
                        return (
                          <div key={idx} className={`rounded-xl border-2 ${c.border} ${c.bg} p-3 space-y-2`}>
                            {/* Method selector + delete */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex gap-1.5">
                                {(['cash', 'card', 'mobile'] as PaymentMethod[]).map((m) => {
                                  const MI = PAYMENT_ICONS[m];
                                  const mc = PAYMENT_COLORS[m];
                                  const isActive = split.method === m;
                                  return (
                                    <button key={m} onClick={() => updateSplit(idx, 'method', m)}
                                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border transition-all ${isActive ? `${mc.active} border-current` : 'bg-white border-outline-variant/30 text-on-surface-variant'}`}
                                    >
                                      <MI size={11} />{PAYMENT_LABELS[m]}
                                    </button>
                                  );
                                })}
                              </div>
                              {splits.length > 1 && (
                                <button onClick={() => removeSplitRow(idx)} className="p-1 rounded-lg hover:bg-error-container text-on-surface-variant hover:text-error transition-all">
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>

                            {/* Amount + note */}
                            <div className="flex gap-2 items-center">
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-on-surface-variant">৳</span>
                                <input type="number" min={0} value={split.amount || ''}
                                  onChange={(e) => updateSplit(idx, 'amount', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-full pl-7 pr-2 py-1.5 bg-white border border-outline-variant/40 rounded-xl text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
                                />
                              </div>
                              <input type="text" value={split.note}
                                onChange={(e) => updateSplit(idx, 'note', e.target.value)}
                                placeholder="Note (optional)"
                                className="flex-1 px-2 py-1.5 bg-white border border-outline-variant/40 rounded-xl text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add row + auto-fill */}
                    <div className="flex gap-2">
                      <button onClick={addSplitRow}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-xl text-[10px] font-black transition-all press-effect"
                      >
                        <PlusCircle size={12} />Add Method
                      </button>
                      {splitShortfall > 0 && (
                        <button onClick={autoFillLastSplit}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-[10px] font-black transition-all press-effect"
                        >
                          Fill Remaining ({formatCurrency(splitShortfall)})
                        </button>
                      )}
                    </div>

                    {/* Running tally */}
                    <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 px-3 py-2 space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-on-surface-variant">Total Entered</span>
                        <span className={splitsTotal >= remainingDue ? 'text-emerald-600 font-black' : 'text-error font-black'}>{formatCurrency(splitsTotal)}</span>
                      </div>
                      {splitShortfall > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-error font-bold">Still Needed</span>
                          <span className="text-error font-black">{formatCurrency(splitShortfall)}</span>
                        </div>
                      )}
                      {splitReturn > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-secondary font-bold">Return Change</span>
                          <span className="text-secondary font-black">{formatCurrency(splitReturn)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    MODE: PARTIAL (instalment — collect over time)
                ══════════════════════════════════════════════════════════════ */}
                {mode === 'partial' && (
                  <div className="rounded-xl border-2 border-amber-400/50 bg-amber-50/30 p-4 space-y-3">
                    <h3 className="text-xs font-black text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={12} />Record Instalment Payment
                    </h3>
                    <div className="flex justify-between items-center bg-amber-100/60 rounded-lg px-3 py-2">
                      <span className="text-xs font-bold text-amber-700">Still Owed</span>
                      <span className="text-base font-black text-amber-800">{formatCurrency(remainingDue)}</span>
                    </div>

                    {/* Partial method */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['cash', 'card', 'mobile'] as PaymentMethod[]).map((m) => {
                        const Icon = PAYMENT_ICONS[m];
                        const c = PAYMENT_COLORS[m];
                        return (
                          <button key={m} onClick={() => setPartialMethod(m)}
                            className={`flex flex-col items-center justify-center p-2 border-2 rounded-xl transition-all press-effect gap-0.5 ${partialMethod === m ? c.active : 'border-outline-variant/30 text-on-surface-variant'}`}
                          >
                            <Icon size={15} />
                            <span className="text-[9px] font-bold text-center leading-tight">{PAYMENT_LABELS[m]}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider block">Amount to Collect Now</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-on-surface-variant">৳</span>
                        <input type="number" min={0} max={remainingDue} value={partialAmount || ''}
                          onChange={(e) => setPartialAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                          placeholder={`Max ${formatCurrency(remainingDue)}`}
                          className="w-full pl-8 pr-3 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-400 outline-none"
                        />
                      </div>
                      {/* Quick picks */}
                      <div className="flex gap-1.5 flex-wrap">
                        {[25, 50, 75, 100].map((pct) => {
                          const q = Math.round((remainingDue * pct) / 100);
                          return (
                            <button key={pct} onClick={() => setPartialAmount(q)}
                              className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-[10px] font-black transition-all press-effect"
                            >
                              {pct}% ({formatCurrency(q)})
                            </button>
                          );
                        })}
                        <button onClick={() => setPartialAmount(remainingDue)}
                          className="px-2 py-0.5 bg-amber-500 text-white rounded-lg text-[10px] font-black press-effect"
                        >
                          Full
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider block mb-1">Note (optional)</label>
                      <input type="text" value={partialNote} onChange={(e) => setPartialNote(e.target.value)}
                        placeholder="e.g. advance from Table 5 guest..."
                        className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs focus:ring-1 focus:ring-amber-400 outline-none"
                      />
                    </div>

                    <button
                      onClick={handleAddPartialPayment}
                      disabled={partialLoading || partialAmount <= 0 || partialAmount > remainingDue + 0.01}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all press-effect disabled:opacity-50"
                    >
                      {partialLoading
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <PlusCircle size={14} />}
                      RECORD {formatCurrency(partialAmount || 0)}
                    </button>
                  </div>
                )}
              </div>

              {/* ── Footer Actions ── */}
              <div className="p-4 bg-background border-t border-outline-variant/30 space-y-2">
                {mode === 'full' && (
                  <>
                    <button onClick={handleConfirmPayment}
                      className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 press-effect shadow-md"
                    >
                      <CheckCircle size={16} />
                      {alreadyPaid > 0 ? `COLLECT ${formatCurrency(remainingDue)} & CLOSE` : 'CONFIRM CHECKOUT'}
                    </button>
                    <button onClick={handlePrintInvoice}
                      className="w-full py-3 border border-outline-variant text-on-surface rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-surface-container-high press-effect"
                    >
                      <Printer size={16} />PRINT INVOICE
                    </button>
                  </>
                )}
                {mode === 'split' && (
                  <button onClick={handleConfirmSplit}
                    disabled={splitsTotal < remainingDue - 0.01 || splits.every((s) => s.amount <= 0)}
                    className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 press-effect shadow-md disabled:opacity-50"
                  >
                    <Layers size={16} />
                    CONFIRM SPLIT PAYMENT {splitsTotal > 0 ? `(${formatCurrency(splitsTotal)})` : ''}
                  </button>
                )}
                {mode === 'partial' && (
                  <button onClick={() => setMode('full')}
                    className="w-full py-3 border border-primary text-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/5 press-effect"
                  >
                    <CheckCircle size={14} />Switch to Full Checkout
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-on-surface-variant/40 gap-2">
              <Receipt size={48} strokeWidth={1.5} />
              <p className="text-xs font-bold uppercase tracking-wider text-center">Select a table ready for billing.</p>
            </div>
          )}
        </section>
      </div>

      {/* ── Success Modal ── */}
      {successModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl border border-outline-variant/30">
            <div className="w-16 h-16 bg-tertiary-container text-tertiary rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={36} />
            </div>
            <h3 className="text-xl font-black text-on-surface">Payment Settled!</h3>
            <p className="text-xs text-on-surface-variant font-medium mt-1 leading-relaxed">
              Order {successModalData.order.token} cleared.<br />
              Table <span className="font-bold text-primary">T-{((successModalData.order.table as any)?.number || 0).toString().padStart(2, '0')}</span> is now free.
            </p>

            {/* Show split breakdown if applicable */}
            {(successModalData.order.splitPayments || []).length > 0 && (
              <div className="w-full bg-violet-50 border border-violet-200 rounded-xl p-3 my-3 space-y-1 text-xs text-left">
                <p className="font-black text-violet-700 mb-1 flex items-center gap-1"><Layers size={12} />Split Payment Breakdown</p>
                {successModalData.order.splitPayments.map((s, i) => {
                  const Icon = PAYMENT_ICONS[s.paymentMethod];
                  const c = PAYMENT_COLORS[s.paymentMethod];
                  return (
                    <div key={i} className="flex justify-between items-center">
                      <span className={`flex items-center gap-1 font-semibold ${c.text}`}><Icon size={11} />{PAYMENT_LABELS[s.paymentMethod]}</span>
                      <span className="font-black">{formatCurrency(s.amount)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {successModalData.returnAmount > 0 && (
              <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-3 my-2 w-full flex justify-between items-center text-xs">
                <span className="font-bold text-on-surface-variant">Return Change:</span>
                <span className="text-base font-black text-secondary">{formatCurrency(successModalData.returnAmount)}</span>
              </div>
            )}

            <div className="w-full grid grid-cols-2 gap-2.5 my-3">
              <button
                onClick={() => { if (settings) printInvoice(successModalData.order, settings); else toast.error('Settings not loaded'); }}
                className="py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 press-effect shadow-sm"
              >
                <Printer size={14} />Print
              </button>
              <button
                onClick={() => { if (settings) downloadTxtInvoice(successModalData.order, settings); else toast.error('Settings not loaded'); }}
                className="py-2.5 bg-surface border border-outline-variant text-on-surface rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-surface-container-high press-effect"
              >
                <FileText size={14} />Download
              </button>
            </div>
            <button onClick={() => setSuccessModalData(null)}
              className="w-full py-3.5 bg-on-surface text-surface rounded-xl font-bold text-sm hover:opacity-95 press-effect"
            >
              Close &amp; New Settlement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
