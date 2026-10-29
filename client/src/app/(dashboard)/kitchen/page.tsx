'use client';

import { useEffect, useState } from 'react';
import Topbar from '../../../components/layout/topbar';
import api from '../../../lib/api';
import { Order, OrderStatus } from '../../../types';
import { formatTime, timeAgo } from '../../../lib/constants';
import toast from 'react-hot-toast';
import { socket } from '../../../lib/socket';
import { playSound } from '../../../lib/sound';
import {
  RotateCw,
  Clock,
  Flame,
  Check,
  Coffee,
  Utensils,
  Maximize2
} from 'lucide-react';

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchKitchenOrders = async () => {
    try {
      const { data } = await api.get('/orders/kitchen');
      if (data.success) {
        setOrders(data.data);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        console.error('Kitchen orders response not successful:', data);
        toast.error(data.message || 'Failed to load kitchen orders');
      }
    } catch (error: any) {
      console.error('Kitchen orders fetch error:', error);
      if (!error.response?.status || error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Failed to load kitchen orders');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();

    const handleOrderCreated = (order: Order) => {
      if (['pending', 'preparing', 'ready'].includes(order.status)) {
        setOrders((prev) => {
          if (prev.some((o) => o._id === order._id)) return prev;
          const updated = [...prev, order];
          // sort by createdAt ascending (FIFO kitchen queue)
          return updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
        playSound.playChime();
        const qty = order.items.reduce((sum, i) => sum + i.quantity, 0);
        toast(`New Order #${order.token} (${qty} Item${qty !== 1 ? 's' : ''}) submitted!`, { icon: '🔔' });
      }
    };

    const handleOrderUpdated = (order: Order) => {
      if (['pending', 'preparing', 'ready'].includes(order.status)) {
        setOrders((prev) => {
          const index = prev.findIndex((o) => o._id === order._id);
          if (index !== -1) {
            const next = [...prev];
            next[index] = order;
            return next;
          } else {
            const updated = [...prev, order];
            return updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          }
        });
      } else {
        // Remove orders that moved out of kitchen statuses (e.g. served, cancelled)
        setOrders((prev) => prev.filter((o) => o._id !== order._id));
      }
      playSound.playBeep();
      const qty = order.items.reduce((sum, i) => sum + i.quantity, 0);
      toast(`Order #${order.token} (${qty} Item${qty !== 1 ? 's' : ''}) updated to ${order.status.toUpperCase()}`, { icon: '📢' });
    };

    const handleOrderDeleted = (data: { _id: string }) => {
      setOrders((prev) => prev.filter((o) => o._id !== data._id));
    };

    socket.on('orderCreated', handleOrderCreated);
    socket.on('orderUpdated', handleOrderUpdated);
    socket.on('orderDeleted', handleOrderDeleted);

    return () => {
      socket.off('orderCreated', handleOrderCreated);
      socket.off('orderUpdated', handleOrderUpdated);
      socket.off('orderDeleted', handleOrderDeleted);
    };
  }, []);


  const handleUpdateStatus = async (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus;
    if (currentStatus === 'pending') {
      nextStatus = 'preparing';
    } else if (currentStatus === 'preparing') {
      nextStatus = 'ready';
    } else {
      return;
    }

    try {
      const { data } = await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
      if (data.success) {
        toast.success(`Ticket status updated to ${nextStatus.toUpperCase()}`);
        fetchKitchenOrders();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  // Stat calculations
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title="Kitchen Display System" subtitle="Active preparation line tickets" />

      {/* KDS Stats Header */}
      <div className="p-3 sm:p-4 bg-surface-container-low border-b border-outline-variant/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 shrink-0">
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pending</span>
            <span className="text-lg sm:text-xl font-black text-error">{pendingCount}</span>
          </div>
          <div className="w-[1px] bg-outline-variant/30 h-8 hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Preparing</span>
            <span className="text-lg sm:text-xl font-black text-secondary">{preparingCount}</span>
          </div>
          <div className="w-[1px] bg-outline-variant/30 h-8 hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Ready</span>
            <span className="text-lg sm:text-xl font-black text-tertiary">{readyCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-surface-container border border-outline-variant/20 px-3 py-1.5 rounded-xl gap-2 text-xs font-bold">
            <Clock size={14} className="text-on-surface-variant" />
            <span className="hidden sm:inline">KDS Queue Live</span>
            <span className="sm:hidden">Live</span>
          </div>
          <button
            onClick={() => { setLoading(true); fetchKitchenOrders(); }}
            className="p-2 bg-surface hover:bg-surface-container-high rounded-xl border border-outline-variant/30 transition-all press-effect"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Ticket Grid Table Layout */}
      <div className="flex-1 overflow-auto flex flex-col bg-surface">
        {/* Desktop Table Layout (md+) */}
        <div className="hidden md:flex flex-1 flex-col">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-1 border-b-2 border-outline-variant/50 bg-surface-container-high py-3 px-6 text-xs font-black uppercase tracking-wider text-on-surface-variant shrink-0">
            <div className="col-span-2 text-center">Token</div>
            <div className="col-span-2 text-center">Table</div>
            <div className="col-span-2 text-center">Placed Time</div>
            <div className="col-span-4">Items & Modifiers</div>
            <div className="col-span-2 text-center">Action</div>
          </div>

          {/* Tickets Scroll Queue */}
          <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/20">
            {loading && orders.length === 0 ? (
              <div className="py-40 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-on-surface-variant text-sm font-medium">Syncing kitchen queue...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-40 flex flex-col items-center justify-center text-on-surface-variant/40 gap-2">
                <Coffee size={48} strokeWidth={1.5} />
                <p className="text-xs font-bold uppercase tracking-wider">All Clear! No pending orders.</p>
              </div>
            ) : (
              orders.map((order) => {
                let rowBg = 'bg-surface';
                let borderCol = 'border-outline-variant';
                let statusLabel = 'PENDING';
                let btnClass = 'border-2 border-primary text-primary hover:bg-primary-container/20';

                if (order.status === 'preparing') {
                  rowBg = 'bg-secondary/5';
                  borderCol = 'border-secondary';
                  statusLabel = 'PREPARING';
                  btnClass = 'bg-secondary text-on-secondary shadow-md hover:brightness-110';
                } else if (order.status === 'ready') {
                  rowBg = 'bg-tertiary-container/5';
                  borderCol = 'border-tertiary';
                  statusLabel = 'READY';
                  btnClass = 'bg-tertiary text-on-tertiary cursor-not-allowed opacity-80';
                }

                const orderTime = new Date(order.createdAt).getTime();
                const diffMins = Math.floor((Date.now() - orderTime) / 60000);
                const isLate = diffMins >= 15 && order.status !== 'ready';

                // Kitchen Filter: If order has add-ons, display ONLY the newly added Add-On items
                const hasAddons = order.items.some((i) => i.isAddon);
                const maxBatch = order.latestAddonBatch || Math.max(0, ...order.items.map((i) => i.addonBatch || 0));
                const addonItems = hasAddons
                  ? order.items.filter((i) => i.isAddon && (maxBatch > 0 ? i.addonBatch === maxBatch : true))
                  : [];
                const kitchenItems = hasAddons
                  ? (addonItems.length > 0 ? addonItems : order.items.filter((i) => i.isAddon))
                  : order.items;

                return (
                  <div
                    key={order._id}
                    className={`grid grid-cols-12 gap-1 items-center py-4 px-6 transition-all hover:bg-surface-container-low/30 border-l-4 ${borderCol} ${rowBg}`}
                  >
                    <div className="col-span-2 text-center flex flex-col items-center gap-1">
                      <span className="text-lg font-black text-on-surface">{order.token}</span>
                      {order.orderType && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
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
                      {hasAddons && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-md text-[9px] font-black uppercase tracking-wider animate-pulse">
                          🔥 Add-on Ticket
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-black bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/30">
                        T-{((order.table as any)?.number || 'N/A').toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="col-span-2 text-center flex flex-col justify-center gap-0.5">
                      <span className="text-xs font-bold text-on-surface">{formatTime(order.createdAt)}</span>
                      <span className={`text-[10px] font-bold ${isLate ? 'text-error animate-pulse' : 'text-on-surface-variant'}`}>
                        {timeAgo(order.createdAt)}
                      </span>
                    </div>
                    <div className="col-span-4 pr-4">
                      <ul className="space-y-2">
                        {kitchenItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="bg-primary/10 text-primary w-5 h-5 flex items-center justify-center rounded-md font-black text-xs shrink-0 mt-0.5">
                              {item.quantity}
                            </span>
                            <div className="flex-1">
                              <span className="text-sm font-black text-on-surface leading-tight">{item.name}</span>
                              {item.isAddon && (
                                <span className="ml-2 text-[9px] font-extrabold text-amber-600 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">
                                  NEW ADD-ON
                                </span>
                              )}
                              {item.notes && (
                                <p className="text-[10px] text-error font-semibold italic mt-0.5">
                                  * MOD: {item.notes}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="col-span-2 text-center">
                      <button
                        onClick={() => handleUpdateStatus(order._id, order.status)}
                        disabled={order.status === 'ready'}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all press-effect ${btnClass}`}
                      >
                        {statusLabel}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Mobile Card Layout (<md) */}
        <div className="md:hidden flex-1 overflow-y-auto p-3 space-y-3">
          {loading && orders.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-on-surface-variant text-sm font-medium">Syncing kitchen queue...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant/40 gap-2">
              <Coffee size={48} strokeWidth={1.5} />
              <p className="text-xs font-bold uppercase tracking-wider">All Clear! No pending orders.</p>
            </div>
          ) : (
            orders.map((order) => {
              let borderCol = 'border-outline-variant';
              let statusLabel = 'PENDING';
              let btnClass = 'border-2 border-primary text-primary hover:bg-primary-container/20';
              let statusBg = 'bg-surface';

              if (order.status === 'preparing') {
                borderCol = 'border-secondary';
                statusLabel = 'PREPARING';
                btnClass = 'bg-secondary text-on-secondary shadow-md hover:brightness-110';
                statusBg = 'bg-secondary/5';
              } else if (order.status === 'ready') {
                borderCol = 'border-tertiary';
                statusLabel = 'READY';
                btnClass = 'bg-tertiary text-on-tertiary cursor-not-allowed opacity-80';
                statusBg = 'bg-tertiary-container/5';
              }

              const orderTime = new Date(order.createdAt).getTime();
              const diffMins = Math.floor((Date.now() - orderTime) / 60000);
              const isLate = diffMins >= 15 && order.status !== 'ready';

              // Kitchen Filter Mobile
              const hasAddons = order.items.some((i) => i.isAddon);
              const maxBatch = order.latestAddonBatch || Math.max(0, ...order.items.map((i) => i.addonBatch || 0));
              const addonItems = hasAddons
                ? order.items.filter((i) => i.isAddon && (maxBatch > 0 ? i.addonBatch === maxBatch : true))
                : [];
              const kitchenItems = hasAddons
                ? (addonItems.length > 0 ? addonItems : order.items.filter((i) => i.isAddon))
                : order.items;

              return (
                <div
                  key={order._id}
                  className={`${statusBg} rounded-xl border-l-4 ${borderCol} border border-outline-variant/30 p-4 space-y-3 shadow-sm`}
                >
                  {/* Header: Token, Table, Time */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-on-surface">{order.token}</span>
                      <span className="text-xs font-black bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant/30">
                        T-{((order.table as any)?.number || 'N/A').toString().padStart(2, '0')}
                      </span>
                      {hasAddons && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-md text-[9px] font-black uppercase tracking-wider">
                          🔥 Add-on Ticket
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-on-surface block">{formatTime(order.createdAt)}</span>
                      <span className={`text-[10px] font-bold ${isLate ? 'text-error animate-pulse' : 'text-on-surface-variant'}`}>
                        {timeAgo(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <ul className="space-y-1.5">
                    {kitchenItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="bg-primary/10 text-primary w-5 h-5 flex items-center justify-center rounded-md font-black text-xs shrink-0 mt-0.5">
                          {item.quantity}
                        </span>
                        <div className="flex-1">
                          <span className="text-sm font-black text-on-surface">{item.name}</span>
                          {item.isAddon && (
                            <span className="ml-2 text-[9px] font-extrabold text-amber-600 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">
                              NEW ADD-ON
                            </span>
                          )}
                          {item.notes && (
                            <p className="text-[10px] text-error font-semibold italic">* {item.notes}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <button
                    onClick={() => handleUpdateStatus(order._id, order.status)}
                    disabled={order.status === 'ready'}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all press-effect ${btnClass}`}
                  >
                    {statusLabel}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Live footer details */}
      <footer className="h-10 bg-surface-container px-3 sm:px-6 flex items-center justify-between border-t border-outline-variant/30 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider shrink-0">
        <div className="flex gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-outline"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
            <span>Preparing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-tertiary"></div>
            <span>Ready</span>
          </div>
        </div>
        <div className="hidden sm:block">Last Updated: {lastUpdated || 'Never'}</div>
      </footer>
    </div>
  );
}
