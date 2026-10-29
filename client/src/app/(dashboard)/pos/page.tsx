'use client';

import { useEffect, useState } from 'react';
import Topbar from '../../../components/layout/topbar';
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
  CreditCard, Utensils, Ticket, FileText, ArrowRight, Wallet, CheckCircle
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
  let optionGroupTitle = rawOptionGroup?.title || 'Size (Required)';
  let options = rawOptionGroup?.options || [];

  if (options.length === 0) {
    const lname = item.name.toLowerCase();
    if (lname.includes('pizza')) {
      optionGroupTitle = 'Size (Required)';
      options = [
        { name: 'small', price: item.price },
        { name: 'medium', price: Math.round(item.price * 1.4) },
        { name: 'large', price: Math.round(item.price * 1.8) },
      ];
    } else if (lname.includes('naan') || lname.includes('tandoori')) {
      optionGroupTitle = 'Naan (Required)';
      options = [
        { name: 'Regular Naan', price: item.price },
        { name: 'garlic Naan', price: item.price + 10 },
        { name: 'Butter Naan', price: item.price + 20 },
      ];
    } else if (lname.includes('crab') || lname.includes('fry') || lname.includes('chicken')) {
      optionGroupTitle = 'Size (Required)';
      options = [
        { name: '1 pcs', price: item.price },
        { name: '2 pcs', price: Math.round(item.price * 1.8) },
      ];
    } else if (lname.includes('lacchi') || lname.includes('coffee') || lname.includes('tea') || lname.includes('juice') || lname.includes('drink')) {
      optionGroupTitle = 'Size (Required)';
      options = [
        { name: 'R', price: item.price },
        { name: 'M', price: item.price + 50 },
      ];
    } else if (lname.includes('burger')) {
      optionGroupTitle = 'Size (Required)';
      options = [
        { name: 'Single Patty', price: item.price },
        { name: 'Double Patty', price: item.price + 80 },
      ];
    } else {
      optionGroupTitle = 'Size (Required)';
      options = [
        { name: 'Regular', price: item.price },
        { name: 'Special / Large', price: item.price + 50 },
      ];
    }
  }

  const selectedOption = options[selectedOptionIndex] || options[0];
  const unitPrice = getItemOptionUnitPrice(item.price, selectedOption);
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
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
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
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs transition-all press-effect ${
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
                className="w-8 h-8 rounded-lg bg-surface border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container transition-all press-effect"
              >
                <Minus size={13} />
              </button>
              <span className="w-6 text-center text-sm font-black text-on-surface">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-surface border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container transition-all press-effect"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 max-w-xs py-3.5 px-5 bg-on-surface text-surface rounded-2xl font-bold text-xs flex items-center justify-between shadow-xl hover:opacity-95 press-effect transition-all"
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
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('pay_first');

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
    updateQuantity, updateNote, setTable, clearOrder, getSubtotal
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
          quantity: i.quantity,
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
          quantity: i.quantity,
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
      <Topbar title="Point of Sale" subtitle="Create and manage orders" />

      <div className="flex-1 flex overflow-hidden relative">

        {/* ══ LEFT: Menu Catalog ══════════════════════════════════════════ */}
        <section className="w-full lg:w-[68%] flex flex-col overflow-hidden bg-background">

          {/* Search + category strip */}
          <div className="px-4 pt-4 pb-0 space-y-3 shrink-0">
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-surface border border-outline-variant/40 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-3 scroll-hide">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all press-effect whitespace-nowrap ${selectedCategory === 'all' ? 'bg-primary text-on-primary shadow-md shadow-primary/20' : 'bg-surface text-on-surface-variant border border-outline-variant/40 hover:border-primary/40 hover:text-primary'}`}
              >✦ All Menu</button>
              {categories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all press-effect whitespace-nowrap ${selectedCategory === cat._id ? 'bg-primary text-on-primary shadow-md shadow-primary/20' : 'bg-surface text-on-surface-variant border border-outline-variant/40 hover:border-primary/40 hover:text-primary'}`}
                >{cat.name}</button>
              ))}
            </div>
          </div>

          {/* Menu grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {filteredMenu.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/30 gap-3 py-24">
                <Search size={52} strokeWidth={1} />
                <p className="text-sm font-semibold">No items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredMenu.map((item) => {
                  const inCart = orderItems.find(o => o.menuItem === item._id);
                  const displayPrice = getDisplayCardPrice(item);
                  return (
                    <div
                      key={item._id}
                      onClick={() => setModalItem(item)}
                      className={`group relative bg-surface rounded-2xl border cursor-pointer overflow-hidden transition-all duration-200 press-effect hover:shadow-lg hover:-translate-y-0.5 ${inCart ? 'border-primary/50 shadow-md shadow-primary/10' : 'border-outline-variant/30 hover:border-primary/30'}`}
                    >
                      <div className="relative w-full aspect-[4/3] bg-surface-container-low overflow-hidden">
                        {item.image ? (
                          <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed size={28} className="text-outline-variant" /></div>
                        )}
                        {typeof item.category !== 'string' && item.category.name && (
                          <span className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{item.category.name}</span>
                        )}
                        {inCart && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center text-[10px] font-black shadow-md">{inCart.quantity}</div>
                        )}
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all shadow-lg"><Plus size={20} /></div>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-on-surface leading-snug line-clamp-2">{item.name}</p>
                        <p className="text-xs font-black text-primary mt-1">{formatCurrency(displayPrice)}</p>
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

        {/* ══ RIGHT: Clean Single Order Panel ══════════════════════════════ */}
        <section className={`
          fixed inset-y-0 right-0 z-40 w-full max-w-[390px] flex flex-col shadow-2xl transition-transform duration-300
          lg:static lg:w-[32%] lg:h-full lg:shadow-none lg:translate-x-0
          ${cartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          bg-surface border-l border-outline-variant/20
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
              <div className="grid grid-cols-3 gap-1.5">
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
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all press-effect border ${
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

            {/* Table selector (Optional) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                <UtensilsCrossed size={10} /> Table Assignment <span className="text-[9px] font-medium text-on-surface-variant/60">(Optional)</span>
              </label>
              <div className="relative">
                <select
                  value={selectedTableId || ''}
                  onChange={(e) => setTable(e.target.value || null)}
                  className="w-full appearance-none bg-surface-container-low border border-outline-variant/50 rounded-xl px-3 py-2.5 text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-8"
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
                <div className="flex items-center justify-between bg-primary-container/30 border border-primary/20 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Users size={11} className="text-primary-dark" />
                    <span className="text-[10px] font-bold text-primary-dark">Seats to book</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setSeatsToBook(Math.max(1, seatsToBook - 1))} className="w-6 h-6 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center"><Minus size={10} /></button>
                    <span className="w-5 text-center text-sm font-black text-primary-dark">{seatsToBook}</span>
                    <button onClick={() => { const max = selectedTable.capacity - (selectedTable.occupiedSeats || 0); setSeatsToBook(Math.min(max, seatsToBook + 1)); }} className="w-6 h-6 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center"><Plus size={10} /></button>
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
                  onClick={() => setPaymentMode('pay_first')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${paymentMode === 'pay_first' ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/20' : 'bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:border-primary/40'}`}
                >
                  <CreditCard size={12} />
                  Pay First
                </button>
                <button
                  onClick={() => setPaymentMode('pre_bill')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${paymentMode === 'pre_bill' ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/20' : 'bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:border-primary/40'}`}
                >
                  <Utensils size={12} />
                  Eat First
                </button>
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
              orderItems.map((item, idx) => (
                <div key={`${item.menuItem}-${idx}`} className="bg-surface-container-low/60 border border-outline-variant/20 rounded-xl p-3 space-y-2 animate-slide-up">
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-on-primary text-[10px] font-black">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-on-surface leading-tight truncate">{item.name}</p>
                      <p className="text-xs text-primary font-black mt-0.5">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-surface border border-outline-variant/30 rounded-lg p-0.5 shrink-0">
                      <button onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors"><Minus size={11} /></button>
                      <button onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors"><Plus size={11} /></button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Special notes..." value={item.notes || ''} onChange={(e) => updateNote(idx, e.target.value)} className="flex-1 bg-surface border border-outline-variant/20 rounded-lg px-2.5 py-1.5 text-[10px] outline-none focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40" />
                    <button onClick={() => removeItem(idx)} className="w-7 h-7 flex items-center justify-center bg-error-container/40 hover:bg-error-container text-error rounded-lg transition-colors shrink-0"><Trash2 size={11} /></button>
                  </div>
                </div>
              ))
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
                  className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 press-effect shadow-lg shadow-primary/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CreditCard size={16} />
                  Pay & Place Order
                  <span className="text-xs opacity-80">· {formatCurrency(grandTotal)}</span>
                </button>
              ) : (
                <button
                  onClick={handlePlaceEatFirstOrder}
                  disabled={orderItems.length === 0 || isSubmitting}
                  className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 press-effect shadow-lg shadow-primary/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
        onAddToCart={(payload) => addItem(payload)}
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
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
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
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
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
                className="px-4 py-3 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayFirstOrder}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md disabled:opacity-50"
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
