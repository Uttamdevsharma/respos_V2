'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUIStore } from '../../../store/ui.store';
import { useBadgeStore } from '../../../store/badge.store';
import { useAuthStore } from '../../../store/auth.store';
import { ThemeToggle } from '../../../components/common/ThemeToggle';
import api, { BASE_URL, getImageUrl } from '../../../lib/api';
import { Table, Category, MenuItem, Settings, OrderType } from '../../../types';
import { useOrderStore } from '../../../store/order.store';
import { formatCurrency } from '../../../lib/constants';
import toast from 'react-hot-toast';
import { socket } from '../../../lib/socket';
import { playSound } from '../../../lib/sound';
import {
  Plus, Minus, Trash2, Save, ShoppingBag, X,
  Search, UtensilsCrossed, ChevronDown, ChevronUp, Users,
  CreditCard, Utensils, Ticket, FileText, ArrowRight, ArrowLeft, Wallet, CheckCircle,
  Menu, ClipboardList
} from 'lucide-react';
import { printPayFirstSlips } from '../../../lib/printInvoice';

// ── Types ────────────────────────────────────────────────────────────────────
type PaymentMode = 'pay_first' | 'pre_bill';
type PaymentMethod = 'cash' | 'card' | 'mobile';

// ── Helper: clean token display ──────────────────────────────────────────────
function formatToken(token?: string): string {
  if (!token) return '';
  return token.replace(/^#+/, '#');
}

// ── Helper: calculate unit price for size option ──────────────────────────────
function getItemOptionUnitPrice(basePrice: number, option?: { name: string; price: number } | null): number {
  if (!option) return basePrice;
  if (option.price === 0) return basePrice;
  if (option.price >= basePrice) return option.price;
  return basePrice + option.price;
}

// ── Helper: get display price for card ────────────────────────────────────────
function getDisplayCardPrice(item: MenuItem): number {
  if (item.optionGroups && item.optionGroups.length > 0 && item.optionGroups[0].options?.length > 0) {
    return getItemOptionUnitPrice(item.price, item.optionGroups[0].options[0]);
  }
  return item.price;
}

// ── Food Details Modal ───────────────────────────────────────────────────────
function FoodDetailsModal({
  item,
  onClose,
  onAddToCart,
}: {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (payload: { menuItem: string; name: string; price: number; quantity: number; notes?: string }) => void;
}) {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    setSelectedOptionIndex(0);
    setQuantity(1);
    setNotes('');
  }, [item]);

  if (!item) return null;

  const rawOptionGroup = item.optionGroups && item.optionGroups.length > 0 ? item.optionGroups[0] : null;
  const optionGroupTitle = rawOptionGroup?.title || 'Size';
  const options = rawOptionGroup?.options || [];

  const hasOptions = options.length > 0;
  const selectedOption = hasOptions ? (options[selectedOptionIndex] || options[0]) : null;
  const unitPrice = selectedOption ? getItemOptionUnitPrice(item.price, selectedOption) : item.price;
  const totalAmount = unitPrice * quantity;

  const handleAdd = () => {
    let finalName = item.name;
    if (selectedOption) {
      finalName = `${item.name} (${selectedOption.name})`;
    }
    onAddToCart({
      menuItem: item._id,
      name: finalName,
      price: unitPrice,
      quantity,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-3xl w-full max-w-lg shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col animate-scale-in">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface">
              <FileText size={16} />
            </div>
            <h3 className="text-sm font-black text-on-surface">Food Details</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Product Header Card */}
          <div className="flex items-start gap-4">
            {item.image ? (
              <img
                src={getImageUrl(item.image)}
                alt={item.name}
                className="w-16 h-16 rounded-2xl object-cover border border-outline-variant/30 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-center shrink-0">
                <UtensilsCrossed size={24} className="text-outline-variant" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h4 className="text-base font-black text-on-surface leading-tight">{item.name}</h4>
                <span className="text-xs font-black text-on-surface shrink-0">TK {unitPrice}</span>
              </div>
              {item.description && (
                <p className="text-xs text-on-surface-variant mt-1 line-clamp-2 leading-relaxed opacity-80">
                  {item.description}
                </p>
              )}
            </div>
          </div>

          {/* Option Group Section */}
          {options.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">{optionGroupTitle}</span>
                <ChevronUp size={14} className="text-on-surface-variant/60" />
              </div>

              <div className="flex flex-wrap gap-2.5">
                {options.map((opt, idx) => {
                  const isSelected = selectedOptionIndex === idx;
                  const optUnitPrice = getItemOptionUnitPrice(item.price, opt);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedOptionIndex(idx)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs transition-all press-effect cursor-pointer ${
                        isSelected
                          ? 'border-2 border-on-surface bg-surface shadow-sm font-bold text-on-surface'
                          : 'border border-outline-variant/40 bg-surface text-on-surface-variant hover:border-outline-variant'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? 'border-on-surface bg-on-surface' : 'border-outline-variant bg-surface'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-surface" />}
                      </div>

                      <span>{opt.name}</span>
                      <span className="text-xs font-black text-on-surface">
                        TK {optUnitPrice}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen Note Textarea */}
          <div className="pt-1">
            <textarea
              rows={3}
              placeholder="Note for kitchen"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-2xl border border-outline-variant/50 p-3.5 text-xs outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-on-surface-variant/40 bg-surface resize-none transition-all"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-outline-variant/20 flex items-center justify-between gap-4 bg-surface">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant">Qty</span>
            <div className="flex items-center gap-1.5 bg-surface-container-low rounded-xl p-1 border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-surface border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container transition-all press-effect cursor-pointer"
              >
                <Minus size={13} />
              </button>
              <span className="w-6 text-center text-sm font-black text-on-surface">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-surface border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container transition-all press-effect cursor-pointer"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 max-w-xs py-3.5 px-5 bg-on-surface text-surface rounded-2xl font-bold text-xs flex items-center justify-between shadow-xl hover:opacity-95 press-effect transition-all cursor-pointer"
          >
            <span>Total TK {totalAmount.toFixed(2)}</span>
            <span className="flex items-center gap-1 opacity-90">
              Add to Cart
              <ArrowRight size={14} />
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Main POS Page ─────────────────────────────────────────────────────────────
export default function POSPage() {
  // Data
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  // UI states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [seatsToBook, setSeatsToBook] = useState<number>(1);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const { openSidebarDrawer } = useUIStore();
  const { ordersCount } = useBadgeStore();
  const { user } = useAuthStore();
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('pre_bill');

  // Food details modal state
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);

  // Pay-First Payment Modal state
  const [isPayFirstModalOpen, setIsPayFirstModalOpen] = useState<boolean>(false);
  const [payFirstMethod, setPayFirstMethod] = useState<PaymentMethod>('cash');
  const [payFirstDiscount, setPayFirstDiscount] = useState<number>(0);
  const [payFirstPaidAmount, setPayFirstPaidAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Order Channel / Service Type State
  const [orderType, setOrderType] = useState<OrderType>('dine_in');

  // Zustand order store (draft order)
  const {
    items: orderItems, selectedTableId, addItem, removeItem,
    updateQuantity, setQuantity, updateNote, setTable, clearOrder, getSubtotal
  } = useOrderStore();

  // ── Data loading ────────────────────────────────────────────────────────────
  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      if (res.data.success) setTables(res.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [t, c, m, s] = await Promise.all([
          api.get('/tables'), api.get('/categories'), api.get('/menu'), api.get('/settings')
        ]);
        if (t.data.success) setTables(t.data.data);
        if (c.data.success) setCategories(c.data.data);
        if (m.data.success) setMenuItems(m.data.data);
        if (s.data.success) setSettings(s.data.data);
      } catch (err: any) {
        if (!err.response?.status || err.response?.status !== 401)
          toast.error('Failed to load POS data.');
      }
    };
    load();

    const onCreated = () => fetchTables();
    const onUpdated = () => fetchTables();
    socket.on('orderCreated', onCreated);
    socket.on('orderUpdated', onUpdated);
    return () => { socket.off('orderCreated', onCreated); socket.off('orderUpdated', onUpdated); };
  }, []);

  useEffect(() => {
    if (selectedTableId) {
      const tbl = tables.find(t => t._id === selectedTableId);
      if (tbl) {
        const rem = tbl.capacity - (tbl.occupiedSeats || 0);
        setSeatsToBook(rem > 0 ? rem : 1);
      }
    } else setSeatsToBook(1);
  }, [selectedTableId, tables]);

  // ── Calculations ────────────────────────────────────────────────────────────
  const subtotal = getSubtotal();
  const taxRate = settings ? settings.taxRate / 100 : 0.15;
  const serviceRate = settings ? settings.serviceChargeRate / 100 : 0.05;

  const taxableAmount = Math.max(0, subtotal - payFirstDiscount);
  const tax = Math.round(taxableAmount * taxRate * 100) / 100;
  const svc = Math.round(taxableAmount * serviceRate * 100) / 100;
  const grandTotal = Math.round((taxableAmount + tax + svc) * 100) / 100;

  const totalItems = orderItems.reduce((s, i) => s + i.quantity, 0);
  const selectedTable = tables.find(t => t._id === selectedTableId);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  // Open Payment Modal for Pay First
  const handleOpenPayFirstModal = () => {
    if (orderItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }
    setPayFirstDiscount(0);
    setPayFirstMethod('cash');
    setPayFirstPaidAmount(grandTotal.toString());
    setIsPayFirstModalOpen(true);
  };

  // Submit Pay First Order (Creates Paid/Completed Order + Prints Payslips + Sent to Kitchen)
  const handleConfirmPayFirstOrder = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const paidNum = parseFloat(payFirstPaidAmount) || grandTotal;
      const payload: any = {
        seatsOccupied: selectedTableId ? seatsToBook : 1,
        paymentMode: 'pay_first',
        orderType,
        paymentMethod: payFirstMethod,
        discount: payFirstDiscount,
        paidAmount: paidNum,
        items: orderItems.map(i => ({
          menuItem: i.menuItem,
          name: i.name,
          price: i.price,
          quantity: Math.max(1, i.quantity || 1),
          notes: i.notes || ''
        }))
      };

      if (selectedTableId) {
        payload.table = selectedTableId;
      }

      const { data } = await api.post('/orders', payload);
      if (data.success) {
        const order = data.data;
        toast.success(`Order ${formatToken(order.token)} Paid & Placed! Sent to Kitchen.`, { duration: 4000 });

        // Print Pay First slips
        if (settings) {
          printPayFirstSlips(order, settings);
        }

        // Reset state & clear cart
        clearOrder();
        setTable(null);
        setIsPayFirstModalOpen(false);
        fetchTables();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place Pay First order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Eat First Order (Creates Pending Order -> Kitchen -> Orders Log -> Billing)
  const handlePlaceEatFirstOrder = async () => {
    if (orderItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload: any = {
        seatsOccupied: selectedTableId ? seatsToBook : 1,
        paymentMode: 'pre_bill',
        orderType,
        items: orderItems.map(i => ({
          menuItem: i.menuItem,
          name: i.name,
          price: i.price,
          quantity: Math.max(1, i.quantity || 1),
          notes: i.notes || ''
        }))
      };

      if (selectedTableId) {
        payload.table = selectedTableId;
      }

      const { data } = await api.post('/orders', payload);
      if (data.success) {
        const order = data.data;
        toast.success(`Order ${formatToken(order.token)} placed (Eat First)! Sent to Kitchen.`, { duration: 4000 });

        clearOrder();
        setTable(null);
        fetchTables();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place Eat First order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Menu filter ──────────────────────────────────────────────────────────────
  const filteredMenu = menuItems.filter(item => {
    const catOk = selectedCategory === 'all' || (typeof item.category === 'string' ? item.category === selectedCategory : item.category._id === selectedCategory);
    const srchOk = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return catOk && srchOk && item.isAvailable;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* ── Zen POS Header Bar (Full Window responsive across 22", 16", Tablets, Mobile) ── */}
      <header className="h-14 sm:h-16 bg-surface border-b border-outline-variant/30 px-3 sm:px-5 flex items-center justify-between shrink-0 z-20 shadow-sm gap-2">
        {/* Left: Back to Dashboard Button + Restaurant Branding */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 rounded-xl text-xs sm:text-sm font-bold text-on-surface transition-all press-effect shadow-sm shrink-0 cursor-pointer"
            title="Back to Dashboard (Show sidebar menu)"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>

          <div className="flex items-center gap-2.5 min-w-0">
            {settings?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo.startsWith('http') ? settings.logo : `${BASE_URL}${settings.logo}`}
                alt={settings?.restaurantName || 'Logo'}
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-xl border border-outline-variant/40 bg-surface shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary-container rounded-xl flex items-center justify-center shrink-0">
                <span className="text-primary-dark font-black text-xs sm:text-sm">
                  {(settings?.restaurantName || 'G').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0 hidden md:block">
              <h1 className="text-xs sm:text-sm font-black text-on-surface truncate">
                {settings?.restaurantName || 'Point of Sale'}
              </h1>
              <p className="text-[10px] text-on-surface-variant/70 font-semibold truncate">
                Zen Terminal • Active: {user?.name || 'Waiter'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Switch to Orders + Theme + Mobile Cart Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Switch to Orders Button */}
          <Link
            href="/orders"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 rounded-xl text-xs font-black text-on-surface transition-all press-effect shadow-sm cursor-pointer"
            title="Switch to Kitchen Orders to serve guests"
          >
            <ClipboardList size={16} className="text-primary shrink-0" />
            <span className="hidden sm:inline">Orders</span>
            {ordersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary text-on-primary shadow-sm animate-pulse">
                {ordersCount}
              </span>
            )}
          </Link>

          {/* Mobile / Tablet Cart Drawer Trigger */}
          <button
            onClick={() => setCartOpen(true)}
            className="lg:hidden relative p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all press-effect shrink-0 cursor-pointer"
            title="Open Order Ticket"
          >
            <ShoppingBag size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-on-primary rounded-full text-[10px] font-black flex items-center justify-center shadow-md animate-scale-in">
                {totalItems}
              </span>
            )}
          </button>

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container font-black text-xs flex items-center justify-center shrink-0">
            {user?.name?.[0] || 'W'}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">

        {/* ══ LEFT: Menu Catalog ══════════════════════════════════════════ */}
        <section className="w-full lg:w-[42%] xl:w-[40%] 2xl:w-[38%] shrink-0 flex flex-col overflow-hidden bg-background border-r border-outline-variant/30">

          {/* Search bar above categories */}
          <div className="px-3 sm:px-4 pt-3 pb-1 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-surface border border-outline-variant/40 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/25 rounded-xl text-xs sm:text-sm outline-none transition-all placeholder:text-on-surface-variant/40 shadow-2xs text-on-surface"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Strip */}
          <div className="px-3 sm:px-4 pt-1.5 pb-2 flex gap-1.5 sm:gap-2 overflow-x-auto scroll-hide shrink-0">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all press-effect whitespace-nowrap cursor-pointer ${selectedCategory === 'all' ? 'bg-primary text-on-primary shadow-md shadow-primary/20' : 'bg-surface text-on-surface-variant border border-outline-variant/40 hover:border-primary/40 hover:text-primary'}`}
              >✦ All Menu</button>
              {categories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all press-effect whitespace-nowrap cursor-pointer ${selectedCategory === cat._id ? 'bg-primary text-on-primary shadow-md shadow-primary/20' : 'bg-surface text-on-surface-variant border border-outline-variant/40 hover:border-primary/40 hover:text-primary'}`}
                >{cat.name}</button>
              ))}
          </div>

          {/* Menu grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {filteredMenu.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/30 gap-3 py-24">
                <Search size={52} strokeWidth={1} />
                <p className="text-sm font-semibold">No items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3">
                {filteredMenu.map((item) => {
                  const inCart = orderItems.find((o) => o.menuItem === item._id);
                  const displayPrice = getDisplayCardPrice(item);
                  const hasSizes = Boolean(
                    item.optionGroups &&
                    item.optionGroups.length > 0 &&
                    item.optionGroups[0]?.options &&
                    item.optionGroups[0].options.length > 0
                  );

                  return (
                    <div
                      key={item._id}
                      onClick={() => {
                        if (hasSizes) {
                          setModalItem(item);
                        } else {
                          addItem({
                            menuItem: item._id,
                            name: item.name,
                            price: item.price,
                            quantity: 1,
                          });
                          playSound.playBeep();
                          toast.success(`Added ${item.name}`);
                        }
                      }}
                      className={`group relative bg-surface rounded-2xl border cursor-pointer overflow-hidden transition-all duration-200 press-effect hover:shadow-lg hover:-translate-y-0.5 flex flex-col ${
                        inCart
                          ? 'border-primary shadow-md shadow-primary/10 ring-1 ring-primary/40'
                          : 'border-outline-variant/30 hover:border-primary/40'
                      }`}
                    >
                      {/* Compact Image */}
                      <div className="relative w-full h-24 sm:h-28 bg-surface-container-low overflow-hidden">
                        {item.image ? (
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UtensilsCrossed size={24} className="text-outline-variant/50" />
                          </div>
                        )}

                        {typeof item.category !== 'string' && item.category?.name && (
                          <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                            {item.category.name}
                          </span>
                        )}

                        {inCart && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center text-[11px] font-black shadow-md">
                            {inCart.quantity}
                          </div>
                        )}
                      </div>

                      {/* Clean Item Title and Price (No long description clutter) */}
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                            {item.name}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-outline-variant/15">
                          <span className="text-xs font-black text-primary">
                            {formatCurrency(displayPrice)}
                          </span>
                          {hasSizes && (
                            <span className="text-[9px] font-extrabold text-on-surface-variant/70 bg-surface-container px-1.5 py-0.5 rounded">
                              Sizes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Mobile backdrop */}
        {cartOpen && <div onClick={() => setCartOpen(false)} className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" />}

        {/* ══ RIGHT: Spacious Order Panel (More space on laptop, desktop, and tablet) ══════════════════════════════ */}
        <section className={`
          fixed inset-y-0 right-0 z-40 w-full max-w-[420px] lg:max-w-none flex flex-col shadow-2xl transition-transform duration-300
          lg:static lg:flex-1 lg:h-full lg:shadow-none lg:translate-x-0
          ${cartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          bg-surface flex flex-col overflow-hidden min-w-0
        `}>

          {/* Panel Header */}
          <div className="px-4 py-3.5 border-b border-outline-variant/20 flex items-center justify-between shrink-0 bg-surface-container-low/40">
            <div className="flex items-center gap-2">
              <Ticket size={16} className="text-primary" />
              <span className="text-sm font-black text-on-surface">Order Ticket</span>
              {orderItems.length > 0 && (
                <span className="px-2 py-0.5 bg-primary text-on-primary rounded-full text-[10px] font-black">{totalItems}</span>
              )}
            </div>
            <button onClick={() => setCartOpen(false)} className="lg:hidden p-1 hover:bg-surface-container rounded-xl text-on-surface-variant">
              <X size={16} />
            </button>
          </div>

          {/* Controls: Order Channel + Table (Optional) + Payment Mode */}
          <div className="px-4 pt-3 pb-3 border-b border-outline-variant/20 space-y-3 shrink-0">

            {/* Order Channel Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
                <span>Order Channel / Type</span>
                <span className="text-[9px] font-extrabold text-primary capitalize bg-primary/10 px-2 py-0.5 rounded-full">
                  {orderType.replace('_', ' ')}
                </span>
              </label>
              <div className="grid grid-cols-3 xl:grid-cols-6 gap-1.5">
                {[
                  { id: 'dine_in' as OrderType, label: 'Dine In', icon: '🍽️', activeStyle: 'bg-emerald-600 text-white border-emerald-600 shadow-sm' },
                  { id: 'takeaway' as OrderType, label: 'Takeaway', icon: '🛍️', activeStyle: 'bg-blue-600 text-white border-blue-600 shadow-sm' },
                  { id: 'foodpanda' as OrderType, label: 'Foodpanda', icon: '🐼', activeStyle: 'bg-[#D70F64] text-white border-[#D70F64] shadow-sm' },
                  { id: 'pathao' as OrderType, label: 'Pathao', icon: '🛵', activeStyle: 'bg-[#E21B23] text-white border-[#E21B23] shadow-sm' },
                  { id: 'foodi' as OrderType, label: 'Foodi', icon: '🍔', activeStyle: 'bg-[#FF5722] text-white border-[#FF5722] shadow-sm' },
                  { id: 'delivery' as OrderType, label: 'Delivery', icon: '🚚', activeStyle: 'bg-purple-600 text-white border-purple-600 shadow-sm' },
                ].map((ch) => {
                  const isActive = orderType === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        setOrderType(ch.id);
                        if (ch.id !== 'dine_in') {
                          setTable(null);
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all press-effect border cursor-pointer ${
                        isActive
                          ? `${ch.activeStyle} font-black ring-2 ring-primary/20 scale-[1.02]`
                          : 'bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:bg-surface-container'
                      }`}
                    >
                      <span className="text-sm">{ch.icon}</span>
                      <span className="truncate">{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Table selector (Optional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <UtensilsCrossed size={10} /> Table Assignment <span className="text-[9px] font-medium text-on-surface-variant/60">(Optional)</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedTableId || ''}
                    onChange={(e) => setTable(e.target.value || null)}
                    className="w-full appearance-none bg-surface-container-low border border-outline-variant/50 rounded-xl px-3 py-2 text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-8 cursor-pointer"
                  >
                    <option value="">— No Table / Takeaway —</option>
                    {tables.map(t => {
                      const rem = t.capacity - (t.occupiedSeats || 0);
                      return (
                        <option key={t._id} value={t._id} disabled={rem <= 0 && t._id !== selectedTableId}>
                          Table {t.number.toString().padStart(2, '0')} · {t.location}
                          {t.occupiedSeats && t.occupiedSeats > 0 ? ` [${t.occupiedSeats}/${t.capacity}]` : ''}
                          {rem <= 0 && t._id !== selectedTableId ? ' — FULL' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                </div>

                {selectedTable && (
                  <div className="flex items-center justify-between bg-primary-container/30 border border-primary/20 rounded-xl px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <Users size={11} className="text-primary-dark" />
                      <span className="text-[10px] font-bold text-primary-dark">Seats to book</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setSeatsToBook(Math.max(1, seatsToBook - 1))} className="w-5 h-5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center cursor-pointer"><Minus size={10} /></button>
                      <span className="w-4 text-center text-xs font-black text-primary-dark">{seatsToBook}</span>
                      <button onClick={() => { const max = selectedTable.capacity - (selectedTable.occupiedSeats || 0); setSeatsToBook(Math.min(max, seatsToBook + 1)); }} className="w-5 h-5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center cursor-pointer"><Plus size={10} /></button>
                      <span className="text-[9px] text-on-surface-variant ml-1">/{selectedTable.capacity - (selectedTable.occupiedSeats || 0)} free</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Mode toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <CreditCard size={10} /> Payment Mode
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentMode('pre_bill')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${paymentMode === 'pre_bill' ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:border-primary/40'}`}
                  >
                    <Utensils size={12} />
                    Eat First
                  </button>
                  <button
                    onClick={() => setPaymentMode('pay_first')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${paymentMode === 'pay_first' ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:border-primary/40'}`}
                  >
                    <CreditCard size={12} />
                    Pay First
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {orderItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/30 gap-3 py-20">
                <ShoppingBag size={52} strokeWidth={1} />
                <div className="text-center">
                  <p className="text-sm font-bold">Cart is empty</p>
                  <p className="text-xs mt-1 opacity-70">Tap any menu item to add</p>
                </div>
              </div>
            ) : (
              <>
                {/* Column Headings (Highlighted) */}
                <div className="sticky top-0 z-10 grid grid-cols-12 gap-2 px-3.5 py-2.5 bg-primary/10 dark:bg-primary/20 backdrop-blur-md rounded-xl text-[11px] font-black text-primary uppercase tracking-wider border border-primary/30 shadow-xs mb-2.5">
                  <div className="col-span-5 font-black">Item & Note</div>
                  <div className="col-span-3 text-center font-black">Quantity</div>
                  <div className="col-span-2 text-right font-black">Total</div>
                  <div className="col-span-2 text-center font-black">Action</div>
                </div>

                {orderItems.map((item, idx) => (
                  <div
                    key={`${item.menuItem}-${idx}`}
                    className="grid grid-cols-12 gap-2 items-center bg-surface-container-low/70 border border-outline-variant/30 rounded-xl p-3 hover:border-primary/40 transition-all shadow-sm"
                  >
                    {/* Col 1: Item & Note (col-span-5) */}
                    <div className="col-span-5 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-on-surface leading-tight truncate" title={item.name}>
                        {item.name}
                      </p>
                      <input
                        type="text"
                        placeholder="Add kitchen note..."
                        value={item.notes || ''}
                        onChange={(e) => updateNote(idx, e.target.value)}
                        className="w-full mt-1 bg-surface border border-outline-variant/80 hover:border-primary/60 focus:border-primary focus:ring-1 focus:ring-primary/25 rounded-lg px-2.5 py-1 text-[11px] font-medium outline-none text-on-surface placeholder:text-on-surface-variant/40 transition-colors shadow-2xs"
                      />
                    </div>

                    {/* Col 2: Quantity [- 1 +] (col-span-3) */}
                    <div className="col-span-3 flex justify-center">
                      <div className="flex items-center gap-1 bg-surface border border-outline-variant/40 rounded-xl p-0.5 shadow-sm">
                        <button
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors press-effect cursor-pointer"
                          title="Decrease quantity"
                        >
                          <Minus size={11} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              setQuantity(idx, val);
                            } else if (e.target.value === '') {
                              setQuantity(idx, 0);
                            }
                          }}
                          onBlur={() => {
                            if (!item.quantity || item.quantity < 1) {
                              setQuantity(idx, 1);
                            }
                          }}
                          className="w-8 sm:w-10 text-center text-xs font-black text-on-surface bg-transparent outline-none p-0 hover:bg-surface-container/60 focus:bg-surface-container focus:ring-1 focus:ring-primary/40 rounded transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
                          title="Click to type quantity directly (e.g. 15)"
                        />
                        <button
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors press-effect cursor-pointer"
                          title="Increase quantity"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Col 3: Total Price (col-span-2) */}
                    <div className="col-span-2 text-right">
                      <p className="text-xs sm:text-sm font-black text-primary leading-tight">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-on-surface-variant/60 font-semibold mt-0.5">
                        {formatCurrency(item.price)} each
                      </p>
                    </div>

                    {/* Col 4: Action Delete (col-span-2) */}
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => removeItem(idx)}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-error-container/30 hover:bg-error-container text-error rounded-xl transition-all press-effect shadow-2xs cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Bill + CTAs */}
          <div className="shrink-0 border-t border-outline-variant/20 bg-surface">
            <div className="px-4 py-3 space-y-1">
              <div className="flex justify-between text-xs text-on-surface-variant"><span>Subtotal</span><span className="font-bold text-on-surface">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-xs text-on-surface-variant"><span>VAT ({settings?.taxRate ?? 15}%)</span><span className="font-bold text-on-surface">{formatCurrency(tax)}</span></div>
              <div className="flex justify-between text-xs text-on-surface-variant"><span>Service ({settings?.serviceChargeRate ?? 5}%)</span><span className="font-bold text-on-surface">{formatCurrency(svc)}</span></div>
              <div className="flex justify-between items-center pt-2 border-t border-outline-variant/20">
                <span className="text-sm font-black text-on-surface">Grand Total</span>
                <span className="text-lg font-black text-primary">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="px-4 pb-4 space-y-2">
              {paymentMode === 'pay_first' ? (
                <button
                  onClick={handleOpenPayFirstModal}
                  disabled={orderItems.length === 0 || isSubmitting}
                  className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 press-effect shadow-lg shadow-primary/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CreditCard size={16} />
                  Pay & Place Order
                  <span className="text-xs opacity-80">· {formatCurrency(grandTotal)}</span>
                </button>
              ) : (
                <button
                  onClick={handlePlaceEatFirstOrder}
                  disabled={orderItems.length === 0 || isSubmitting}
                  className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 press-effect shadow-lg shadow-primary/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  Place Order (Eat First)
                  <span className="text-xs opacity-80">· {formatCurrency(grandTotal)}</span>
                </button>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* ── Food Details Modal ────────────────────────────────────────────── */}
      <FoodDetailsModal
        item={modalItem}
        onClose={() => setModalItem(null)}
        onAddToCart={(payload) => {
          addItem(payload);
          playSound.playBeep();
          toast.success(`Added ${payload.name}`);
        }}
      />

      {/* ── Pay First Payment Popup Modal ──────────────────────────────────── */}
      {isPayFirstModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/30 animate-scale-in space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-container text-primary flex items-center justify-center">
                  <Wallet size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-on-surface">Pay First Settlement</h3>
                  <p className="text-xs text-on-surface-variant">Collect payment & print token slips</p>
                </div>
              </div>
              <button
                onClick={() => setIsPayFirstModalOpen(false)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Bill Calculation Summary */}
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 space-y-2 text-xs">
              <div className="flex justify-between text-on-surface-variant">
                <span>Items Subtotal</span>
                <span className="font-bold text-on-surface">{formatCurrency(subtotal)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-on-surface-variant">Discount (TK)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={payFirstDiscount || ''}
                  onChange={(e) => setPayFirstDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-24 px-2.5 py-1 text-right bg-surface border border-outline-variant/40 rounded-lg text-xs font-bold outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-between text-on-surface-variant">
                <span>VAT ({settings?.taxRate ?? 15}%)</span>
                <span className="font-bold text-on-surface">{formatCurrency(tax)}</span>
              </div>

              <div className="flex justify-between text-on-surface-variant">
                <span>Service Charge ({settings?.serviceChargeRate ?? 5}%)</span>
                <span className="font-bold text-on-surface">{formatCurrency(svc)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-outline-variant/20 text-sm">
                <span className="font-black text-on-surface">Grand Total</span>
                <span className="font-black text-primary text-base">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface block">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', name: 'Hand Cash', icon: Wallet },
                  { id: 'card', name: 'Card / POS', icon: CreditCard },
                  { id: 'mobile', name: 'bKash / MFS', icon: CheckCircle },
                ].map((m) => {
                  const Icon = m.icon;
                  const selected = payFirstMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayFirstMethod(m.id as PaymentMethod)}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        selected
                          ? 'border-2 border-primary bg-primary-container/20 text-primary font-bold shadow-sm'
                          : 'border-outline-variant/40 bg-surface text-on-surface-variant hover:border-outline-variant'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-[11px] leading-tight">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Given Amount & Change Calculator (For Cash) */}
            {payFirstMethod === 'cash' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface">Given Amount (TK)</label>
                  {parseFloat(payFirstPaidAmount) > grandTotal && (
                    <span className="text-xs font-black text-tertiary">
                      Return: TK {(parseFloat(payFirstPaidAmount) - grandTotal).toFixed(2)}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  value={payFirstPaidAmount}
                  onChange={(e) => setPayFirstPaidAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/40 rounded-xl text-sm font-bold outline-none focus:border-primary"
                  placeholder={`Min TK ${grandTotal}`}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsPayFirstModalOpen(false)}
                className="px-4 py-3 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayFirstOrder}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={16} />
                {isSubmitting ? 'Processing...' : 'Confirm & Print Payslips'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
