'use client';

import { useEffect, useState } from 'react';
import Topbar from '../../../components/layout/topbar';
import api, { BASE_URL } from '../../../lib/api';
import { Order, Settings, MenuItem, Category } from '../../../types';
import { formatCurrency, formatTime, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../../lib/constants';
import toast from 'react-hot-toast';
import {
  RotateCw,
  Search,
  Eye,
  X,
  Utensils,
  Check,
  Receipt,
  User,
  Clock,
  Printer,
  Download,
  Plus,
  Minus,
  Trash2,
  PlusCircle,
  UtensilsCrossed,
  ArrowRight, ArrowLeft,
  Ban,
  AlertCircle,
  Monitor,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { printInvoice, downloadTxtInvoice } from '../../../lib/printInvoice';
import { socket } from '../../../lib/socket';
import { playSound } from '../../../lib/sound';
import { useAuthStore } from '../../../store/auth.store';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const { user } = useAuthStore();

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Dedicated Modals
  const [isAddonPickerOpen, setIsAddonPickerOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Add-on Menu Picker State
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [addonSearch, setAddonSearch] = useState('');
  const [addonCategory, setAddonCategory] = useState('all');
  const [selectedAddonItems, setSelectedAddonItems] = useState<Array<{ menuItem: string; name: string; price: number; quantity: number; notes?: string }>>([]);

  // Selection state for Multiple Bulk Delete
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Channel filter state
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const fetchOrders = async () => {
    try {
      const endpoint = '/orders';
      const { data } = await api.get(endpoint);
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      toast.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettingsAndMenu = async () => {
    try {
      const [sRes, cRes, mRes] = await Promise.all([
        api.get('/settings'),
        api.get('/categories'),
        api.get('/menu'),
      ]);
      if (sRes.data.success) setSettings(sRes.data.data);
      if (cRes.data.success) setCategories(cRes.data.data);
      if (mRes.data.success) setMenuItems(mRes.data.data);
    } catch (error) {
      console.error('Failed to load settings or menu:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSettingsAndMenu();

    // Listen to real-time events
    const handleOrderCreated = (order: Order) => {
      setOrders((prev) => [order, ...prev.filter((o) => o._id !== order._id)]);
      playSound.playChime();
      const qty = order.items.reduce((sum, i) => sum + i.quantity, 0);
      toast(`New Order #${order.token} (${qty} Item${qty !== 1 ? 's' : ''}) received!`, { icon: '🔔' });
    };

    const handleOrderUpdated = (order: Order) => {
      setOrders((prev) => {
        const filtered = prev.filter((o) => o._id !== order._id);
        return [order, ...filtered];
      });

      // Update selected modal details if open
      setSelectedOrder((curr) => {
        if (curr?._id === order._id) {
          return order;
        }
        return curr;
      });

      playSound.playBeep();
      const qty = order.items.reduce((sum, i) => sum + i.quantity, 0);
      if (order.status === 'ready') {
        toast.success(`🍽️ Order #${order.token} is READY to be served!`, { duration: 5000, icon: '🛎️' });
      } else {
        toast(`Order #${order.token} (${qty} Item${qty !== 1 ? 's' : ''}) updated to ${order.status.toUpperCase()}`, { icon: '📢' });
      }
    };

    const handleOrderDeleted = (data: { _id: string; token: string }) => {
      setOrders((prev) => prev.filter((o) => o._id !== data._id));
      setSelectedOrder((curr) => (curr?._id === data._id ? null : curr));
      toast(`Order #${data.token} was deleted`, { icon: '🗑️' });
    };

    socket.on('orderCreated', handleOrderCreated);
    socket.on('orderUpdated', handleOrderUpdated);
    socket.on('orderDeleted', handleOrderDeleted);

    return () => {
      socket.off('orderCreated', handleOrderCreated);
      socket.off('orderUpdated', handleOrderUpdated);
      socket.off('orderDeleted', handleOrderDeleted);
    };
  }, [user]);

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleOpenAddons = (order: Order) => {
    setSelectedOrder(order);
    setSelectedAddonItems([]);
    setIsAddonPickerOpen(true);
  };

  const handleOpenCancelModal = (order: Order) => {
    setSelectedOrder(order);
    setIsCancelModalOpen(true);
  };

  const handleServeOrder = async (orderId: string) => {
    try {
      const { data } = await api.patch(`/orders/${orderId}/status`, { status: 'served' });
      if (data.success) {
        toast.success('Order served to table');
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.data);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to serve order');
    }
  };

  const handleCancelEntireOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this entire order ticket?')) return;
    try {
      const { data } = await api.patch(`/orders/${orderId}/status`, { status: 'cancelled' });
      if (data.success) {
        toast.success('Entire order ticket cancelled');
        setIsCancelModalOpen(false);
        fetchOrders();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleDeleteOrder = async (orderId: string, token: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete Order #${token}?`)) return;
    try {
      const { data } = await api.delete(`/orders/${orderId}`);
      if (data.success) {
        toast.success(`Order #${token} deleted successfully`);
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
        setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
        if (selectedOrder?._id === orderId) {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete order');
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === sortedOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(sortedOrders.map((o) => o._id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete all ${selectedOrderIds.length} selected orders?`)) return;

    try {
      const { data } = await api.post('/orders/bulk-delete', { orderIds: selectedOrderIds });
      if (data.success) {
        toast.success(`${data.data?.count || selectedOrderIds.length} orders deleted successfully`);
        setOrders((prev) => prev.filter((o) => !selectedOrderIds.includes(o._id)));
        setSelectedOrderIds([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete selected orders');
    }
  };

  // ── Item modification handlers ─────────────────────────────────────────────
  const handleReduceItemQty = async (itemIndex: number, cancelQty: number = 1) => {
    if (!selectedOrder) return;
    try {
      const { data } = await api.patch(`/orders/${selectedOrder._id}/cancel-item`, {
        itemIndex,
        cancelQuantity: cancelQty,
      });
      if (data.success) {
        setSelectedOrder(data.data);
        fetchOrders();
        toast.success('Order item updated');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel item');
    }
  };

  const handleAddItemQty = async (item: Order['items'][0]) => {
    if (!selectedOrder) return;
    try {
      const { data } = await api.patch(`/orders/${selectedOrder._id}/add-items`, {
        items: [
          {
            menuItem: (item as any).menuItem?._id || (item as any).menuItem || item.name,
            name: item.name,
            price: item.price,
            quantity: 1,
            notes: item.notes || '',
          },
        ],
      });
      if (data.success) {
        setSelectedOrder(data.data);
        fetchOrders();
        toast.success(`Added 1 more "${item.name}"`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add item');
    }
  };

  // ── Add-on Menu Picker Logic ────────────────────────────────────────────────
  const handleToggleAddonItem = (menuItem: MenuItem) => {
    setSelectedAddonItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.menuItem === menuItem._id);
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          menuItem: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateAddonQty = (index: number, delta: number) => {
    setSelectedAddonItems((prev) => {
      const copy = [...prev];
      const newQty = copy[index].quantity + delta;
      if (newQty <= 0) {
        copy.splice(index, 1);
      } else {
        copy[index].quantity = newQty;
      }
      return copy;
    });
  };

  const handleSaveAddonsToOrder = async () => {
    if (!selectedOrder) return;
    if (selectedAddonItems.length === 0) {
      toast.error('Select at least one food item');
      return;
    }

    try {
      const { data } = await api.patch(`/orders/${selectedOrder._id}/add-items`, {
        items: selectedAddonItems,
      });
      if (data.success) {
        setSelectedOrder(data.data);
        fetchOrders();
        setSelectedAddonItems([]);
        setIsAddonPickerOpen(false);
        toast.success(`Add-ons added to Order #${data.data.token}!`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add items');
    }
  };

  // Channel order counts
  const channelCounts = {
    all: orders.length,
    dine_in: orders.filter((o) => !o.orderType || o.orderType === 'dine_in').length,
    takeaway: orders.filter((o) => o.orderType === 'takeaway').length,
    foodpanda: orders.filter((o) => o.orderType === 'foodpanda').length,
    pathao: orders.filter((o) => o.orderType === 'pathao').length,
    foodi: orders.filter((o) => o.orderType === 'foodi').length,
    delivery: orders.filter((o) => o.orderType === 'delivery').length,
  };

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    const statusMatch = filter === 'all' || order.status === filter;
    const typeMatch =
      channelFilter === 'all' ||
      (channelFilter === 'dine_in' ? (!order.orderType || order.orderType === 'dine_in') : order.orderType === channelFilter);

    const tableNum = ((order.table as any)?.number || '').toString();
    const token = order.token.toLowerCase();
    const searchMatch =
      token.includes(search.toLowerCase()) ||
      tableNum.includes(search);

    return statusMatch && typeMatch && searchMatch;
  });

  // Always sort newest orders FIRST
  const sortedOrders = [...filteredOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredAddonMenu = menuItems.filter((item) => {
    const catOk = addonCategory === 'all' || (typeof item.category === 'string' ? item.category === addonCategory : item.category._id === addonCategory);
    const srchOk = item.name.toLowerCase().includes(addonSearch.toLowerCase());
    return catOk && srchOk && item.isAvailable;
  });

  const isOrderEditable = selectedOrder && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled';

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <Topbar title="Orders Audit Log" subtitle="Track live and historical guest tickets" />

      <main className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Quick Action Bar: Jump to POS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3.5 sm:p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              onClick={() => {
                if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 rounded-xl text-xs sm:text-sm font-bold text-on-surface transition-all press-effect shadow-sm shrink-0"
              title="Back to Dashboard (Show sidebar menu)"
            >
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </Link>
            <div className="hidden sm:block">
              <span className="text-sm font-black text-on-surface">Live Orders Audit</span>
              <span className="text-[11px] text-on-surface-variant font-medium ml-2">• Track kitchen prep & serve guests</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 rounded-xl text-xs font-bold text-on-surface transition-all press-effect shadow-sm shrink-0"
              title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen (Hide browser tabs)'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Full Screen'}</span>
            </button>
            <Link
              href="/pos"
              onClick={() => {
                if (typeof document !== 'undefined' && !document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
              }}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-primary text-on-primary hover:brightness-110 rounded-xl text-xs font-black shadow-md shadow-primary/20 transition-all press-effect"
            >
              <Monitor size={15} />
              <span>⚡ Open Full POS / New Order</span>
            </Link>
          </div>
        </div>
        {/* Channel Breakdown Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
          {[
            { id: 'all', label: 'All Orders', icon: '📦', count: channelCounts.all, activeBg: 'bg-primary text-on-primary border-primary' },
            { id: 'dine_in', label: 'Dine In', icon: '🍽️', count: channelCounts.dine_in, activeBg: 'bg-emerald-600 text-white border-emerald-600' },
            { id: 'takeaway', label: 'Takeaway', icon: '🛍️', count: channelCounts.takeaway, activeBg: 'bg-blue-600 text-white border-blue-600' },
            { id: 'foodpanda', label: 'Foodpanda', icon: '🐼', count: channelCounts.foodpanda, activeBg: 'bg-[#D70F64] text-white border-[#D70F64]' },
            { id: 'pathao', label: 'Pathao', icon: '🛵', count: channelCounts.pathao, activeBg: 'bg-[#E21B23] text-white border-[#E21B23]' },
            { id: 'foodi', label: 'Foodi', icon: '🍔', count: channelCounts.foodi, activeBg: 'bg-[#FF5722] text-white border-[#FF5722]' },
            { id: 'delivery', label: 'Delivery', icon: '🚚', count: channelCounts.delivery, activeBg: 'bg-purple-600 text-white border-purple-600' },
          ].map((item) => {
            const isActive = channelFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setChannelFilter(item.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all press-effect shadow-sm ${
                  isActive
                    ? `${item.activeBg} font-black shadow-md ring-2 ring-primary/20 scale-[1.02]`
                    : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-sm">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface'}`}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
        {/* Controls Layout */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
          {/* Status filters */}
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'].map((status) => {
              const count = status === 'all' ? orders.length : orders.filter((o) => o.status === status).length;
              const isReadyAlert = status === 'ready' && count > 0;
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all press-effect flex items-center gap-1.5 ${filter === status
                      ? 'bg-primary text-on-primary shadow-sm'
                      : isReadyAlert
                      ? 'bg-purple-600/15 text-purple-700 dark:text-purple-300 border border-purple-500/50 animate-pulse'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                >
                  <span>{status.toUpperCase()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    filter === status
                      ? 'bg-white/20 text-white'
                      : isReadyAlert
                      ? 'bg-purple-600 text-white'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 w-full md:w-auto items-center">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search token # or Table..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            {(user?.role === 'admin' || user?.role === 'cashier') && selectedOrderIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3.5 py-2 bg-error text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-error/90 transition-all press-effect shadow-md shrink-0 animate-scale-in"
                title="Delete all selected orders"
              >
                <Trash2 size={14} />
                Delete ({selectedOrderIds.length})
              </button>
            )}

            <button
              onClick={() => { setLoading(true); fetchOrders(); }}
              className="p-2 bg-surface hover:bg-surface-container-high rounded-xl border border-outline-variant/30 transition-all press-effect shrink-0"
              title="Refresh orders list"
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Orders Table */}
        {loading && orders.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-on-surface-variant text-sm font-medium">Syncing orders cache...</p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto scroll-hide">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-wider border-b border-outline-variant/30">
                    {(user?.role === 'admin' || user?.role === 'cashier') && (
                      <th className="px-4 py-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={sortedOrders.length > 0 && selectedOrderIds.length === sortedOrders.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                          title="Select all orders"
                        />
                      </th>
                    )}
                    <th className="px-6 py-4">Token #</th>
                    <th className="px-6 py-4">Table</th>
                    <th className="px-6 py-4">Waiter</th>
                    <th className="px-6 py-4">Items count</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm font-medium">
                  {sortedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={user?.role === 'admin' || user?.role === 'cashier' ? 8 : 7} className="px-6 py-10 text-center text-on-surface-variant">
                        No matching orders found.
                      </td>
                    </tr>
                  ) : (
                    sortedOrders.map((order) => {
                      const canModify = order.status !== 'completed' && order.status !== 'cancelled';
                      const isSelected = selectedOrderIds.includes(order._id);
                      return (
                        <tr key={order._id} className={`hover:bg-surface-container-low/50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                          {(user?.role === 'admin' || user?.role === 'cashier') && (
                            <td className="px-4 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectOrder(order._id)}
                                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 font-black text-primary">
                            <div className="flex items-center gap-2">
                              <span>{order.token}</span>
                              {order.orderType && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 ${
                                  order.orderType === 'foodpanda' ? 'bg-pink-500/10 text-pink-600 border-pink-500/30' :
                                  order.orderType === 'pathao' ? 'bg-red-500/10 text-red-600 border-red-500/30' :
                                  order.orderType === 'foodi' ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
                                  order.orderType === 'takeaway' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' :
                                  order.orderType === 'delivery' ? 'bg-purple-500/10 text-purple-600 border-purple-500/30' :
                                  'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                }`}>
                                  {order.orderType === 'foodpanda' ? '🐼 Foodpanda' :
                                   order.orderType === 'pathao' ? '🛵 Pathao' :
                                   order.orderType === 'foodi' ? '🍔 Foodi' :
                                   order.orderType === 'takeaway' ? '🛍️ Takeaway' :
                                   order.orderType === 'delivery' ? '🚚 Delivery' :
                                   '🍽️ Dine In'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">Table {((order.table as any)?.number || 'N/A')}</td>
                          <td className="px-6 py-4">{(order.waiter as any)?.name || 'System'}</td>
                          <td className="px-6 py-4">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                          </td>
                          <td className="px-6 py-4 font-black text-on-surface">{formatCurrency(order.grandTotal)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ORDER_STATUS_COLORS[order.status]}`}>
                              {ORDER_STATUS_LABELS[order.status]}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end items-center gap-1.5">
                            {/* Two Dedicated Action Buttons: Add-ons & Cancel */}
                            {canModify && (user?.role === 'admin' || user?.role === 'waiter' || user?.role === 'cashier') && (
                              <>
                                <button
                                  onClick={() => handleOpenAddons(order)}
                                  className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold flex items-center gap-1 hover:brightness-110 transition-all press-effect shadow-sm"
                                  title="Add extra food items to this order"
                                >
                                  <PlusCircle size={12} />
                                  Add-ons
                                </button>
                                <button
                                  onClick={() => handleOpenCancelModal(order)}
                                  className="px-3 py-1.5 bg-error-container text-error rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-error/20 transition-all press-effect border border-error/30"
                                  title="Cancel items or reduce quantities"
                                >
                                  <Ban size={12} />
                                  Cancel
                                </button>
                              </>
                            )}

                            {order.status === 'ready' && (
                              <button
                                onClick={() => handleServeOrder(order._id)}
                                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-all press-effect shadow-md shadow-purple-600/25 animate-pulse"
                                title="Food is ready in kitchen! Click to serve to table"
                              >
                                <Utensils size={13} />
                                Serve Table
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenDetails(order)}
                              className="p-2 hover:bg-surface-container-high rounded-xl text-on-surface-variant hover:text-primary transition-all press-effect border border-outline-variant/20"
                              title="View full order details"
                            >
                              <Eye size={14} />
                            </button>
                            {(user?.role === 'admin' || user?.role === 'cashier') && (
                              <button
                                onClick={() => handleDeleteOrder(order._id, order.token)}
                                className="p-2 hover:bg-red-500/20 text-on-surface-variant hover:text-error rounded-xl transition-all press-effect border border-outline-variant/20"
                                title="Permanently delete order"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 1. Order Details Dialog ────────────────────────────────────────── */}
        {isModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-outline-variant/30 animate-scale-in">
              <div className="flex justify-between items-center mb-4 border-b border-outline-variant/20 pb-3">
                <div>
                  <h3 className="text-lg font-black text-primary-dark">Order ticket details</h3>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">
                    Token: {selectedOrder.token} • Placed {formatTime(selectedOrder.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Items Summary list */}
              <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider block">Dish catalog</span>
                    {isOrderEditable && (
                      <button
                        onClick={() => {
                          setIsModalOpen(false);
                          handleOpenAddons(selectedOrder);
                        }}
                        className="px-2.5 py-1 bg-primary text-on-primary rounded-lg text-[10px] font-bold flex items-center gap-1 hover:brightness-110 transition-all press-effect"
                      >
                        <PlusCircle size={11} />
                        + Add Food / Add-ons
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-outline-variant/10">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2.5 text-xs">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-on-surface leading-snug">{item.name}</p>
                          <p className="text-[10px] text-on-surface-variant">
                            {formatCurrency(item.price)} each
                          </p>
                          {item.notes && <p className="text-[10px] text-error font-semibold italic mt-0.5">* {item.notes}</p>}
                        </div>

                        {/* Interactive Item Stepper / Cancel Controls */}
                        <div className="flex items-center gap-3 shrink-0">
                          {isOrderEditable ? (
                            <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant/30 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => handleReduceItemQty(idx, 1)}
                                title="Reduce quantity by 1"
                                className="w-6 h-6 rounded bg-surface border border-outline-variant/20 text-on-surface hover:bg-surface-container flex items-center justify-center transition-all press-effect"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="w-6 text-center text-xs font-black text-on-surface">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddItemQty(item)}
                                title="Add 1 more"
                                className="w-6 h-6 rounded bg-surface border border-outline-variant/20 text-on-surface hover:bg-surface-container flex items-center justify-center transition-all press-effect"
                              >
                                <Plus size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReduceItemQty(idx, item.quantity)}
                                title="Remove entire item line"
                                className="w-6 h-6 rounded bg-error-container/40 hover:bg-error-container text-error flex items-center justify-center transition-all press-effect ml-1"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ) : (
                            <span className="font-bold text-on-surface px-2">x{item.quantity}</span>
                          )}

                          <span className="font-black text-on-surface-variant min-w-[60px] text-right">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit details */}
                <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-3 rounded-xl text-xs font-semibold text-on-surface-variant">
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5">
                      <User size={12} />
                      <span>Waiter: <span className="text-on-surface">{(selectedOrder.waiter as any)?.name || 'System'}</span></span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Utensils size={12} />
                      <span>Dining unit: <span className="text-on-surface">Table {((selectedOrder.table as any)?.number || 'N/A')}</span></span>
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5">
                      <Clock size={12} />
                      <span>Order status: <span className="font-bold text-primary uppercase">{selectedOrder.status}</span></span>
                    </p>
                    {selectedOrder.paymentMethod && (
                      <p className="flex items-center gap-1.5">
                        <Receipt size={12} />
                        <span>Paid via: <span className="font-bold text-tertiary uppercase">{selectedOrder.paymentMethod}</span></span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="border-t border-outline-variant/20 pt-3 text-xs space-y-1 text-on-surface-variant font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-on-surface font-bold">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-tertiary font-bold">
                      <span>Discount (Fixed)</span>
                      <span>-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>VAT ({settings ? settings.taxRate : 15}%)</span>
                    <span className="text-on-surface font-bold">{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Charge ({settings ? settings.serviceChargeRate : 5}%)</span>
                    <span className="text-on-surface font-bold">{formatCurrency(selectedOrder.serviceCharge)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-on-surface border-t border-outline-variant/10 pt-2">
                    <span>Grand Total</span>
                    <span className="text-primary">{formatCurrency(selectedOrder.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons inside details modal */}
              <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-outline-variant/20">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (settings) {
                        printInvoice(selectedOrder, settings);
                      } else {
                        toast.error('Settings not loaded');
                      }
                    }}
                    className="flex-1 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:brightness-110 transition-all press-effect shadow-sm"
                  >
                    <Printer size={14} />
                    Print Receipt
                  </button>
                  <button
                    onClick={() => {
                      if (settings) {
                        downloadTxtInvoice(selectedOrder, settings);
                      } else {
                        toast.error('Settings not loaded');
                      }
                    }}
                    className="flex-1 py-2.5 bg-surface border border-outline-variant text-on-surface text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-all press-effect"
                  >
                    <Download size={14} />
                    Download TXT
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-surface-container hover:bg-surface-container-high text-xs font-bold rounded-xl transition-all press-effect"
                  >
                    Close
                  </button>
                  {(user?.role === 'admin' || user?.role === 'cashier') && (
                    <button
                      onClick={() => handleDeleteOrder(selectedOrder._id, selectedOrder.token)}
                      className="py-2.5 px-4 bg-error-container text-error hover:bg-error/20 text-xs font-bold rounded-xl border border-error/30 flex items-center justify-center gap-1.5 transition-all press-effect"
                      title="Permanently delete order"
                    >
                      <Trash2 size={14} />
                      Delete Order
                    </button>
                  )}
                  {selectedOrder.status === 'ready' && (user?.role === 'admin' || user?.role === 'waiter') && (
                    <button
                      onClick={() => handleServeOrder(selectedOrder._id)}
                      className="flex-1 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl transition-all press-effect shadow-md flex items-center justify-center gap-2 hover:brightness-110"
                    >
                      <Check size={16} />
                      Mark served
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. Dedicated Cancel Items Modal ────────────────────────────────── */}
        {isCancelModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-outline-variant/30 animate-scale-in">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-error-container/50 text-error flex items-center justify-center">
                    <Ban size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-on-surface">Cancel Items for Order #{selectedOrder.token}</h3>
                    <p className="text-xs text-on-surface-variant">Table {((selectedOrder.table as any)?.number || 'N/A')} • Tap to reduce quantity or remove item</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Items List for Cancel */}
              <div className="py-4 space-y-3 max-h-72 overflow-y-auto pr-1">
                {selectedOrder.items.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant text-xs font-medium">
                    No active items left in this order.
                  </div>
                ) : (
                  selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-surface-container-low border border-outline-variant/30 rounded-2xl flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-on-surface truncate">{item.name}</span>
                          <span className="px-2 py-0.5 bg-primary-container text-primary rounded-full text-[10px] font-black">
                            x{item.quantity}
                          </span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          {formatCurrency(item.price)} each · Total: <span className="font-bold text-on-surface">{formatCurrency(item.price * item.quantity)}</span>
                        </p>
                      </div>

                      {/* Quick Cancel Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReduceItemQty(idx, 1)}
                          className="px-2.5 py-1.5 bg-surface border border-outline-variant/40 hover:bg-surface-container rounded-xl text-xs font-bold text-on-surface flex items-center gap-1 transition-all press-effect"
                          title="Cancel 1 item from quantity"
                        >
                          <Minus size={11} />
                          -1 Qty
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReduceItemQty(idx, item.quantity)}
                          className="px-2.5 py-1.5 bg-error-container text-error hover:bg-error/20 rounded-xl text-xs font-bold flex items-center gap-1 transition-all press-effect border border-error/20"
                          title="Cancel/remove entire item line"
                        >
                          <Trash2 size={11} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleCancelEntireOrder(selectedOrder._id)}
                  className="px-3.5 py-2.5 bg-error/10 hover:bg-error/20 text-error rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all press-effect"
                >
                  <AlertCircle size={14} />
                  Cancel Ticket
                </button>

                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. Add-on Menu Items Picker Modal ─────────────────────────────────── */}
        {isAddonPickerOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[85vh] animate-scale-in">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div>
                  <h3 className="text-base font-black text-on-surface">Add-ons to Order #{selectedOrder.token}</h3>
                  <p className="text-xs text-on-surface-variant">Select menu items to add directly to this order</p>
                </div>
                <button
                  onClick={() => setIsAddonPickerOpen(false)}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search + Category Tabs */}
              <div className="py-3 space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={addonSearch}
                    onChange={(e) => setAddonSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scroll-hide">
                  <button
                    onClick={() => setAddonCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${addonCategory === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
                  >
                    All Menu
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => setAddonCategory(cat._id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${addonCategory === cat._id ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Grid */}
              <div className="flex-1 overflow-y-auto pr-1 my-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredAddonMenu.map((item) => {
                    const selected = selectedAddonItems.find((i) => i.menuItem === item._id);
                    return (
                      <div
                        key={item._id}
                        onClick={() => handleToggleAddonItem(item)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${selected ? 'border-primary bg-primary-container/20 shadow-sm' : 'border-outline-variant/30 bg-surface hover:border-primary/40'}`}
                      >
                        <div className="space-y-1">
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-on-surface leading-tight line-clamp-2">{item.name}</p>
                            {selected && (
                              <span className="w-5 h-5 bg-primary text-on-primary rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ml-1">
                                {selected.quantity}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-black text-primary">{formatCurrency(item.price)}</p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAddonItem(item);
                          }}
                          className="mt-2 w-full py-1.5 bg-surface-container-high hover:bg-primary hover:text-on-primary rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                        >
                          <Plus size={12} />
                          Add
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Items Tray & CTA */}
              <div className="pt-3 border-t border-outline-variant/20 space-y-3">
                {selectedAddonItems.length > 0 && (
                  <div className="max-h-24 overflow-y-auto space-y-1.5 bg-surface-container-low p-2.5 rounded-xl text-xs">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Selected Add-ons</span>
                    {selectedAddonItems.map((st, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-on-surface truncate max-w-[200px]">{st.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 border border-outline-variant/30 rounded-lg p-0.5 bg-surface">
                            <button onClick={() => handleUpdateAddonQty(i, -1)} className="w-5 h-5 flex items-center justify-center hover:bg-surface-container rounded"><Minus size={10} /></button>
                            <span className="w-4 text-center font-bold">{st.quantity}</span>
                            <button onClick={() => handleUpdateAddonQty(i, 1)} className="w-5 h-5 flex items-center justify-center hover:bg-surface-container rounded"><Plus size={10} /></button>
                          </div>
                          <span className="font-bold text-on-surface">{formatCurrency(st.price * st.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setIsAddonPickerOpen(false)}
                    className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSaveAddonsToOrder}
                    disabled={selectedAddonItems.length === 0}
                    className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-40"
                  >
                    <PlusCircle size={14} />
                    Confirm Add-ons to Order #{selectedOrder.token}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
