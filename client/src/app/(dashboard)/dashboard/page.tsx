'use client';

import { useEffect, useState } from 'react';
import Topbar from '../../../components/layout/topbar';
import api from '../../../lib/api';
import { DashboardStats } from '../../../types';
import { formatCurrency, formatTime, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../../lib/constants';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  ShoppingCart,
  Activity,
  Hourglass,
  Flame,
  CheckCircle,
  Sparkles,
  RotateCw,
  Eye,
  Receipt,
  BarChart2
} from 'lucide-react';
import Link from 'next/link';

import POSPage from '../pos/page';
import KitchenPage from '../kitchen/page';
import BillingPage from '../billing/page';
import OrdersPage from '../orders/page';
import ReportsPage from '../reports/page';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'pos' | 'kitchen' | 'billing' | 'orders' | 'reports'>('overview');

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      if (data.success) {
        setStats(data.data);
      } else {
        console.error('Dashboard stats response not successful:', data);
        toast.error(data.message || 'Failed to load dashboard statistics');
      }
    } catch (error: any) {
      console.error('Dashboard stats fetch error:', error);
      // Do not show session-expired notification; user can logout manually.
      if (!error.response?.status || error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Failed to load dashboard statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex-1 flex flex-col ${activeTab === 'overview' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      {/* Dashboard command center tabs */}
      <div className="bg-surface border-b border-outline-variant/30 px-3 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-2xl border border-outline-variant/20 overflow-x-auto scroll-hide">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'pos', label: 'POS Terminal', icon: Sparkles },
            { id: 'kitchen', label: 'Kitchen Display', icon: Flame },
            { id: 'orders', label: 'Orders Log', icon: Eye },
            { id: 'billing', label: 'Billing Settle', icon: Receipt },
            { id: 'reports', label: 'Reports', icon: BarChart2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all press-effect whitespace-nowrap shrink-0 ${isActive
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && (
          <button
            onClick={() => { setLoading(true); fetchStats(); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-surface text-on-surface border border-outline-variant hover:bg-surface-container-high rounded-xl text-sm font-semibold transition-all press-effect shrink-0"
          >
            <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh Stats</span>
          </button>
        )}
      </div>

      {activeTab === 'overview' ? (
        <>
          <Topbar title="Service Overview" subtitle="Real-time performance metrics" />

          <main className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Actions bar */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold tracking-tight">Today's Summary</h2>
            </div>

            {loading && !stats ? (
              <div className="flex-1 py-40 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-on-surface-variant text-sm font-medium">Crunching live analytics...</p>
              </div>
            ) : (
              stats && (
                <>
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Today's Sales */}
                    <div className="bg-surface p-6 rounded-2xl border border-outline-variant/50 shadow-sm relative overflow-hidden group hover:border-primary transition-all duration-300 card-hover">
                      <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-primary/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Today's Sales</p>
                          <h2 className="text-3xl font-black text-primary mt-2">{formatCurrency(stats.todaySales)}</h2>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
                          <TrendingUp size={24} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-tertiary text-xs font-semibold">
                        <Sparkles size={14} />
                        <span>Updated Live</span>
                      </div>
                    </div>

                    {/* Today's Orders */}
                    <div className="bg-surface p-6 rounded-2xl border border-outline-variant/50 shadow-sm relative overflow-hidden group hover:border-secondary transition-all duration-300 card-hover">
                      <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-secondary/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Orders</p>
                          <h2 className="text-3xl font-black text-secondary mt-2">{stats.todayOrders}</h2>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-secondary-light flex items-center justify-center text-secondary">
                          <ShoppingCart size={24} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-tertiary text-xs font-semibold">
                        <CheckCircle size={14} />
                        <span>In service workflow</span>
                      </div>
                    </div>

                    {/* Active Tables */}
                    <div className="bg-surface p-6 rounded-2xl border border-outline-variant/50 shadow-sm relative overflow-hidden group hover:border-tertiary transition-all duration-300 card-hover">
                      <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-tertiary/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Active Tables</p>
                          <h2 className="text-3xl font-black text-tertiary mt-2">
                            {stats.activeTables}/{stats.totalTables}
                          </h2>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-tertiary-light flex items-center justify-center text-tertiary">
                          <Activity size={24} />
                        </div>
                      </div>
                      <div className="mt-4 w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-tertiary h-full transition-all duration-500"
                          style={{ width: `${(stats.activeTables / (stats.totalTables || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Status Breakdown Grid */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-on-surface">Live Order Status</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Pending */}
                      <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4 border-l-4 border-error">
                        <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-error">
                          <Hourglass size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface-variant">Pending</p>
                          <p className="text-2xl font-black text-on-surface">{stats.orderStatus.pending}</p>
                        </div>
                      </div>

                      {/* Preparing */}
                      <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4 border-l-4 border-primary">
                        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary">
                          <Flame size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface-variant">Preparing</p>
                          <p className="text-2xl font-black text-on-surface">{stats.orderStatus.preparing}</p>
                        </div>
                      </div>

                      {/* Ready */}
                      <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4 border-l-4 border-tertiary">
                        <div className="w-10 h-10 rounded-full bg-tertiary-light flex items-center justify-center text-tertiary">
                          <CheckCircle size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface-variant">Ready</p>
                          <p className="text-2xl font-black text-on-surface">{stats.orderStatus.ready}</p>
                        </div>
                      </div>

                      {/* Completed */}
                      <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4 border-l-4 border-secondary">
                        <div className="w-10 h-10 rounded-full bg-secondary-light flex items-center justify-center text-secondary">
                          <ShoppingCart size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface-variant">Completed (Today)</p>
                          <p className="text-2xl font-black text-on-surface">{stats.orderStatus.completed}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sales Performance (Last 7 Days) */}
                  {stats.dailySales && stats.dailySales.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Chart (2 Columns) */}
                      <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-outline-variant/50 shadow-sm flex flex-col justify-between gap-4 card-hover">
                        <div>
                          <h3 className="text-lg font-black text-on-surface tracking-tight">Sales Performance (Last 7 Days)</h3>
                          <p className="text-xs text-on-surface-variant">Daily sales breakdown and volume</p>
                        </div>

                        {/* Pure CSS Bar Chart */}
                        <div className="h-48 sm:h-64 flex items-end justify-between gap-1.5 sm:gap-4 pt-8 pb-2 px-1 sm:px-4 border-b border-outline-variant/20 relative">
                          {/* Grid Lines */}
                          <div className="absolute inset-x-0 bottom-2 top-8 flex flex-col justify-between pointer-events-none">
                            <div className="w-full border-t border-dashed border-outline-variant/15"></div>
                            <div className="w-full border-t border-dashed border-outline-variant/15"></div>
                            <div className="w-full border-t border-dashed border-outline-variant/15"></div>
                          </div>

                          {(() => {
                            const maxSales = Math.max(...stats.dailySales.map(d => d.sales), 1);
                            return stats.dailySales.map((day) => {
                              const percentage = (day.sales / maxSales) * 100;
                              return (
                                <div key={day._id} className="flex-1 flex flex-col items-center gap-2 group relative z-10 h-full justify-end">
                                  {/* Hover Tooltip */}
                                  <div className="absolute bottom-full mb-2 bg-on-surface text-surface text-[10px] font-black py-1.5 px-3.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none text-center min-w-[100px] border border-outline-variant/10">
                                    <p className="text-primary">{formatCurrency(day.sales)}</p>
                                    <p className="text-[8px] text-surface-dim font-bold mt-0.5">{day.orders} Orders</p>
                                  </div>

                                  {/* Vertical Bar */}
                                  <div
                                    className="w-full bg-primary/10 group-hover:bg-primary/25 rounded-t-xl transition-all duration-300 relative flex items-end overflow-hidden"
                                    style={{ height: `${Math.max(percentage, 3)}%`, minHeight: '6px' }}
                                  >
                                    <div
                                      className="w-full bg-primary rounded-t-xl transition-all duration-500"
                                      style={{ height: '100%', opacity: percentage > 0 ? 1 : 0 }}
                                    ></div>
                                  </div>

                                  {/* Label */}
                                  <span className="text-[10px] font-bold text-on-surface-variant group-hover:text-primary transition-colors text-center mt-1">
                                    {new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' })}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Summary Table (1 Column) */}
                      <div className="bg-surface p-6 rounded-2xl border border-outline-variant/50 shadow-sm flex flex-col gap-4 card-hover overflow-hidden">
                        <div>
                          <h3 className="text-lg font-black text-on-surface tracking-tight">Sales Logs</h3>
                          <p className="text-xs text-on-surface-variant">Detailed daily transactions</p>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1">
                          <div className="divide-y divide-outline-variant/20">
                            {stats.dailySales.slice().reverse().map((day) => (
                              <div key={day._id} className="flex justify-between items-center py-3.5 text-xs">
                                <div>
                                  <p className="font-black text-on-surface">
                                    {new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                                    {day.orders} Completed {day.orders === 1 ? 'order' : 'orders'}
                                  </p>
                                </div>
                                <span className="font-black text-primary text-sm">{formatCurrency(day.sales)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Orders Table */}
                  <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-on-surface">Recent Orders</h3>
                      <Link href="/orders" className="text-primary font-bold hover:underline text-sm transition-all">
                        View All Orders
                      </Link>
                    </div>
                    <div className="overflow-x-auto scroll-hide">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                            <th className="px-6 py-4">Token #</th>
                            <th className="px-6 py-4">Table</th>
                            <th className="px-6 py-4">Items</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20 text-sm font-medium">
                          {stats.recentOrders.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant">
                                No orders placed yet today.
                              </td>
                            </tr>
                          ) : (
                            stats.recentOrders.map((order) => (
                              <tr key={order._id} className="hover:bg-surface-container-low/50 transition-colors">
                                <td className="px-6 py-4 font-black text-primary">{order.token}</td>
                                <td className="px-6 py-4">
                                  Table {(order.table as any)?.number || 'N/A'}
                                </td>
                                <td className="px-6 py-4 max-w-xs truncate">
                                  {order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ORDER_STATUS_COLORS[order.status]}`}>
                                    {ORDER_STATUS_LABELS[order.status]}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-on-surface-variant">
                                  {formatTime(order.createdAt)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Link
                                    href="/orders"
                                    className="p-2 hover:bg-surface-container-high rounded-lg inline-block text-on-surface-variant hover:text-primary transition-all press-effect"
                                  >
                                    <Eye size={16} />
                                  </Link>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )
            )}
          </main>
        </>
      ) : activeTab === 'pos' ? (
        <POSPage />
      ) : activeTab === 'kitchen' ? (
        <KitchenPage />
      ) : activeTab === 'orders' ? (
        <OrdersPage />
      ) : activeTab === 'billing' ? (
        <BillingPage />
      ) : activeTab === 'reports' ? (
        <ReportsPage />
      ) : null}
    </div>
  );
}
