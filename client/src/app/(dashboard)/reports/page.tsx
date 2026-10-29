'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '../../../lib/api';
import { ReportType, SalesReportData } from '../../../types';
import { formatCurrency } from '../../../lib/constants';
import toast from 'react-hot-toast';
import {
  BarChart2,
  TrendingUp,
  ShoppingBag,
  Coins,
  RefreshCw,
  CalendarDays,
  CalendarRange,
  Calendar,
  CalendarSearch,
  CreditCard,
  Banknote,
  Smartphone,
  Trophy,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ─── Tab definitions ───────────────────────────────────────────────────────────
const REPORT_TABS: {
  id: ReportType;
  label: string;
  icon: React.ElementType;
  shortLabel: string;
}[] = [
    { id: 'daily', label: 'Day Wise', shortLabel: 'Today', icon: CalendarDays },
    { id: 'date', label: 'Date Wise', shortLabel: 'Date', icon: CalendarSearch },
    { id: 'weekly', label: 'Weekly', shortLabel: 'Week', icon: CalendarRange },
    { id: 'monthly', label: 'Monthly', shortLabel: 'Month', icon: Calendar },
    { id: 'yearly', label: 'Yearly', shortLabel: 'Year', icon: BarChart2 },
  ];

const PAYMENT_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; bar: string }> = {
  cash: { label: 'Cash', icon: Banknote, color: 'text-emerald-400', bg: 'bg-emerald-400/10', bar: 'bg-emerald-400' },
  card: { label: 'Card', icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-400/10', bar: 'bg-blue-400' },
  mobile: { label: 'Mobile', icon: Smartphone, color: 'text-violet-400', bg: 'bg-violet-400/10', bar: 'bg-violet-400' },
};

const TROPHY_COLORS = [
  'text-yellow-400',
  'text-slate-300',
  'text-amber-600',
  'text-on-surface-variant',
  'text-on-surface-variant',
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [data, setData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Filter States ──────────────────────────────────────────────────────────
  const [dailyMode, setDailyMode] = useState<'today' | 'yesterday'>('today');
  const [dateRangeStart, setDateRangeStart] = useState<string>(() => {
    // Default start date: 1st of current month
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [dateRangeEnd, setDateRangeEnd] = useState<string>(todayISO());
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => {
    // Default to Monday of current week
    const now = new Date();
    const dow = now.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff);
    return mon.toISOString().split('T')[0];
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      let params = `type=${reportType}`;
      
      if (reportType === 'daily') {
        if (dailyMode === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          params += `&date=${yesterdayStr}`;
        } else {
          params += `&date=${todayISO()}`;
        }
      } else if (reportType === 'date') {
        params += `&startDate=${dateRangeStart}&endDate=${dateRangeEnd}`;
      } else if (reportType === 'weekly') {
        params += `&weekStart=${selectedWeekStart}`;
      } else if (reportType === 'monthly') {
        params += `&year=${selectedYear}&month=${selectedMonth}`;
      } else if (reportType === 'yearly') {
        params += `&year=${selectedYear}`;
      }

      const { data: res } = await api.get(`/dashboard/reports?${params}`);
      if (res.success) {
        setData(res.data);
      } else {
        toast.error(res.message || 'Failed to load report');
      }
    } catch (err: any) {
      if (err.response?.status !== 401) {
        toast.error(err.response?.data?.message || 'Failed to load report');
      }
    } finally {
      setLoading(false);
    }
  }, [reportType, dailyMode, dateRangeStart, dateRangeEnd, selectedWeekStart, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchReport();
    const interval = setInterval(() => fetchReport(), 60000);
    return () => clearInterval(interval);
  }, [fetchReport]);

  const getDynamicChartTitle = () => {
    switch (reportType) {
      case 'daily':
        return dailyMode === 'today'
          ? "Today's Hourly Sales"
          : "Yesterday's Hourly Sales";
      case 'date':
        return `Sales: ${new Date(dateRangeStart + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${new Date(dateRangeEnd + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'weekly':
        const end = new Date(selectedWeekStart + 'T00:00:00');
        end.setDate(end.getDate() + 6);
        return `Week: ${new Date(selectedWeekStart + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'monthly':
        const dummyDate = new Date(selectedYear, selectedMonth - 1, 1);
        return `${dummyDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} — Daily`;
      case 'yearly':
        return `${selectedYear} — Monthly`;
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const maxSales = data ? Math.max(...data.chartData.map((d) => d.sales), 1) : 1;
  
  // Find a nice step value to keep Y-axis grid labels as round numbers (e.g. 5,000, 10,000)
  const NICE_STEPS = [
    5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000
  ];
  const targetMax = maxSales * 1.10; // at least 10% headroom
  const niceStep = NICE_STEPS.find((step) => step * 4 >= targetMax) || 1000000;
  const chartMax = niceStep * 4;

  const totalTopQty = data ? data.topItems.reduce((s, i) => s + i.quantity, 0) || 1 : 1;
  const totalPayCount = data ? data.paymentBreakdown.reduce((s, p) => s + p.count, 0) || 1 : 1;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-background">

      {/* ── Header ── */}
      <div className="bg-surface border-b border-outline-variant/30 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
            <BarChart2 size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-on-surface tracking-tight">Sales Reports</h1>
            <p className="text-xs text-on-surface-variant font-medium">Performance analytics &amp; trends</p>
          </div>
        </div>
        <button
          onClick={() => fetchReport()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-surface text-on-surface border border-outline-variant hover:bg-surface-container-high rounded-xl text-sm font-semibold transition-all press-effect shrink-0 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Sort / Filter Bar ── */}
      <div className="bg-surface/60 border-b border-outline-variant/20 px-4 sm:px-8 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Tab pills */}
          <div className="flex gap-1.5 bg-surface-container-low p-1 rounded-2xl border border-outline-variant/20 overflow-x-auto scroll-hide">
            {REPORT_TABS.map(({ id, label, icon: Icon }) => {
              const isActive = reportType === id;
              return (
                <button
                  key={id}
                  onClick={() => setReportType(id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all press-effect whitespace-nowrap shrink-0 ${isActive
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Day Wise Options */}
          {reportType === 'daily' && (
            <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/20 shrink-0">
              <button
                onClick={() => setDailyMode('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dailyMode === 'today'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDailyMode('yesterday')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dailyMode === 'yesterday'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Yesterday
              </button>
            </div>
          )}

          {/* Date Wise (Range Picker) */}
          {reportType === 'date' && (
            <div className="flex flex-wrap items-center gap-3 shrink-0 bg-surface-container-low/50 px-3 py-1.5 rounded-xl border border-outline-variant/20">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">From:</span>
                <input
                  type="date"
                  value={dateRangeStart}
                  max={todayISO()}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">To:</span>
                <input
                  type="date"
                  value={dateRangeEnd}
                  min={dateRangeStart}
                  max={todayISO()}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Weekly Options */}
          {reportType === 'weekly' && (
            <div className="flex items-center gap-2 bg-surface-container-low/50 px-3 py-1.5 rounded-xl border border-outline-variant/20 shrink-0">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Week Start:</span>
              <input
                type="date"
                value={selectedWeekStart}
                max={todayISO()}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  const dow = date.getDay();
                  const diff = dow === 0 ? -6 : 1 - dow;
                  date.setDate(date.getDate() + diff);
                  setSelectedWeekStart(date.toISOString().split('T')[0]);
                }}
                className="px-2.5 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              />
            </div>
          )}

          {/* Monthly Options */}
          {reportType === 'monthly' && (
            <div className="flex items-center gap-2 bg-surface-container-low/50 px-3 py-1.5 rounded-xl border border-outline-variant/20 shrink-0">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="px-2 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const mStr = String(i + 1).padStart(2, '0');
                  const date = new Date(2026, i, 1);
                  const monthName = date.toLocaleDateString('en-US', { month: 'long' });
                  return (
                    <option key={i + 1} value={i + 1}>
                      {monthName}
                    </option>
                  );
                })}
              </select>

              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="px-2 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const y = new Date().getFullYear() - 3 + i;
                  return (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Yearly Options */}
          {reportType === 'yearly' && (
            <div className="flex items-center gap-2 bg-surface-container-low/50 px-3 py-1.5 rounded-xl border border-outline-variant/20 shrink-0">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="px-2 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const y = new Date().getFullYear() - 3 + i;
                  return (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Period Label Info */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium shrink-0 ml-auto bg-surface px-3 py-1.5 rounded-xl border border-outline-variant/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
          <span>
            {reportType === 'daily' && `Day: ${dailyMode === 'today' ? 'Today' : 'Yesterday'} (${new Date(new Date().setDate(new Date().getDate() - (dailyMode === 'yesterday' ? 1 : 0))).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})`}
            {reportType === 'date' && `Range: ${new Date(dateRangeStart + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(dateRangeEnd + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            {reportType === 'weekly' && `Week starting: ${new Date(selectedWeekStart + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            {reportType === 'monthly' && `Month: ${new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
            {reportType === 'yearly' && `Year: ${selectedYear}`}
          </span>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="p-4 sm:p-8 space-y-6">
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <BarChart2 size={20} className="text-primary" />
              </div>
            </div>
            <p className="text-on-surface-variant text-sm font-medium">Crunching the numbers...</p>
          </div>
        ) : data ? (
          <>
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Sales */}
              <div className="relative bg-surface rounded-2xl border border-outline-variant/50 p-6 overflow-hidden group hover:border-primary transition-all duration-300 card-hover">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/8 rounded-full group-hover:scale-125 transition-transform duration-500" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary/5 rounded-full" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Total Sales</p>
                    <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-primary">{formatCurrency(data.totalSales)}</h2>
                  <p className="text-xs text-on-surface-variant font-medium mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-pulse" />
                    Live data
                  </p>
                </div>
              </div>

              {/* Total Orders */}
              <div className="relative bg-surface rounded-2xl border border-outline-variant/50 p-6 overflow-hidden group hover:border-secondary transition-all duration-300 card-hover">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-secondary/8 rounded-full group-hover:scale-125 transition-transform duration-500" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-secondary/5 rounded-full" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Total Orders</p>
                    <div className="w-10 h-10 rounded-xl bg-secondary-light flex items-center justify-center text-secondary">
                      <ShoppingBag size={18} />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-secondary">{data.totalOrders}</h2>
                  <p className="text-xs text-on-surface-variant font-medium mt-2">Completed orders</p>
                </div>
              </div>

              {/* Avg Order Value */}
              <div className="relative bg-surface rounded-2xl border border-outline-variant/50 p-6 overflow-hidden group hover:border-tertiary transition-all duration-300 card-hover">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-tertiary/8 rounded-full group-hover:scale-125 transition-transform duration-500" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-tertiary/5 rounded-full" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Avg Order Value</p>
                    <div className="w-10 h-10 rounded-xl bg-tertiary-light flex items-center justify-center text-tertiary">
                      <Coins size={18} />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-tertiary">{formatCurrency(data.avgOrderValue)}</h2>
                  <p className="text-xs text-on-surface-variant font-medium mt-2">Per completed order</p>
                </div>
              </div>
            </div>

            {/* ── Bar Chart ── */}
            <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm p-6 card-hover">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
                <div>
                  <h3 className="text-base font-black text-on-surface tracking-tight">
                    {getDynamicChartTitle()}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Hover bars to see details</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-on-surface-variant shrink-0">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-primary inline-block" />Sales
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-secondary inline-block" />Orders
                  </span>
                </div>
              </div>

              {/* Chart area */}
              <div className={`relative ${data.chartData.length > 15 ? 'overflow-x-auto' : ''}`}>
                <div
                  className="flex items-end h-56 sm:h-72 gap-1 sm:gap-1.5 pb-7 pl-10 relative"
                  style={{ minWidth: data.chartData.length > 15 ? `${data.chartData.length * 38}px` : 'auto' }}
                >
                  {/* Y-axis grid lines (absolute over the chart area) */}
                  <div className="absolute inset-x-0 bottom-7 top-0 pl-10 flex flex-col justify-between pointer-events-none pr-2">
                    {[100, 75, 50, 25, 0].map((pct) => (
                      <div key={pct} className="flex items-center gap-2">
                        <span className="text-[9px] text-on-surface-variant/50 font-medium w-8 shrink-0 text-right">
                          {pct === 0 ? '0' : formatCurrency((chartMax * pct) / 100).replace(/\.00$/, '')}
                        </span>
                        <div className="flex-1 border-t border-dashed border-outline-variant/15" />
                      </div>
                    ))}
                  </div>

                  {/* Bars */}
                  {data.chartData.map((point, idx) => {
                    const pct = (point.sales / chartMax) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-0.5 group relative h-full justify-end"
                        style={{ minWidth: '28px' }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 bg-on-surface text-surface text-[10px] font-black py-2 px-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-30 text-center whitespace-nowrap">
                          <p className="text-primary text-xs">{formatCurrency(point.sales)}</p>
                          <p className="font-medium opacity-70 mt-0.5">{point.orders} order{point.orders !== 1 ? 's' : ''}</p>
                          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-on-surface rotate-45" />
                        </div>

                        {/* Price label on top of bar */}
                        {point.sales > 0 && (
                          <span className="text-[8px] sm:text-[9px] font-black text-primary pointer-events-none mb-1 text-center whitespace-nowrap z-10 select-none animate-fade-in">
                            ৳{Math.round(point.sales).toLocaleString()}
                          </span>
                        )}

                        {/* Bar fill */}
                        <div
                          className="w-full rounded-t-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200 relative overflow-hidden cursor-pointer"
                          style={{ height: `${Math.max(pct, 2)}%`, minHeight: '4px' }}
                        >
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-primary to-primary/70 rounded-t-lg"
                            style={{ height: '100%', opacity: pct > 0 ? 1 : 0.12 }}
                          />
                          {/* Orders mini bar on top */}
                          {point.orders > 0 && (
                            <div
                              className="absolute top-0 left-0 right-0 bg-secondary/40 rounded-t-lg"
                              style={{ height: '3px' }}
                            />
                          )}
                        </div>

                        {/* X Label */}
                        <span className="text-[9px] sm:text-[10px] font-semibold text-on-surface-variant group-hover:text-primary transition-colors text-center leading-tight mt-1 truncate w-full px-0.5">
                          {point.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary strip below chart */}
              <div className="mt-4 flex items-center justify-between px-2 pt-4 border-t border-outline-variant/20 text-xs font-semibold text-on-surface-variant">
                <span>
                  {data.chartData.filter((d) => d.sales > 0).length} of {data.chartData.length} periods had sales
                </span>
                <span>
                  Peak: <span className="text-primary font-black">
                    {formatCurrency(Math.max(...data.chartData.map((d) => d.sales)))}
                  </span>
                </span>
              </div>
            </div>

            {/* ── Bottom Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Top Items */}
              <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm p-6 card-hover">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-on-surface">Top Selling Items</h3>
                    <p className="text-[11px] text-on-surface-variant">By quantity sold</p>
                  </div>
                </div>

                {data.topItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-on-surface-variant">
                    <Package size={32} className="opacity-25" />
                    <p className="text-sm font-medium opacity-50">No sales data for this period</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.topItems.map((item, idx) => {
                      const pct = (item.quantity / totalTopQty) * 100;
                      return (
                        <div key={item._id}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-sm font-black shrink-0 w-5 ${TROPHY_COLORS[idx]}`}>
                                #{idx + 1}
                              </span>
                              <span className="text-sm font-semibold text-on-surface truncate">{item._id}</span>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="text-xs font-black text-primary">{formatCurrency(item.revenue)}</p>
                              <p className="text-[10px] text-on-surface-variant">{item.quantity} sold</p>
                            </div>
                          </div>
                          <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className="h-full bg-linear-to-r from-primary to-primary/50 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order Channel Breakdown */}
              <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm p-6 card-hover">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <ShoppingBag size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-on-surface">Channel Sales</h3>
                    <p className="text-[11px] text-on-surface-variant">By platform / order type</p>
                  </div>
                </div>

                {!data.channelBreakdown || data.channelBreakdown.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-on-surface-variant">
                    <ShoppingBag size={32} className="opacity-25" />
                    <p className="text-sm font-medium opacity-50">No channel data for this period</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { id: 'dine_in', label: 'Dine In', icon: '🍽️', bar: 'bg-emerald-500' },
                      { id: 'takeaway', label: 'Takeaway', icon: '🛍️', bar: 'bg-blue-500' },
                      { id: 'foodpanda', label: 'Foodpanda', icon: '🐼', bar: 'bg-[#D70F64]' },
                      { id: 'pathao', label: 'Pathao', icon: '🛵', bar: 'bg-[#E21B23]' },
                      { id: 'foodi', label: 'Foodi', icon: '🍔', bar: 'bg-[#FF5722]' },
                      { id: 'delivery', label: 'Delivery', icon: '🚚', bar: 'bg-purple-500' },
                    ].map((ch) => {
                      const entry = data.channelBreakdown?.find((c) => c._id === ch.id);
                      if (!entry && data.channelBreakdown?.some((c) => c._id === ch.id)) return null;
                      const count = entry?.count || 0;
                      const totalSales = entry?.totalSales || 0;
                      const pct = data.totalSales > 0 ? (totalSales / data.totalSales) * 100 : 0;
                      return (
                        <div key={ch.id}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{ch.icon}</span>
                              <span className="text-xs font-bold text-on-surface">{ch.label}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-primary leading-none block">
                                {formatCurrency(totalSales)}
                              </span>
                              <span className="text-[9px] text-on-surface-variant font-medium">
                                {count} order{count !== 1 ? 's' : ''} ({pct.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className={`h-full ${ch.bar} rounded-full transition-all duration-700`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Channel Total</span>
                      <span className="text-sm font-black text-primary">{formatCurrency(data.totalSales)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Breakdown */}
              <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm p-6 card-hover">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-secondary-light flex items-center justify-center text-secondary">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-on-surface">Payment Breakdown</h3>
                    <p className="text-[11px] text-on-surface-variant">By method used</p>
                  </div>
                </div>

                {data.paymentBreakdown.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-on-surface-variant">
                    <CreditCard size={32} className="opacity-25" />
                    <p className="text-sm font-medium opacity-50">No payment data for this period</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {(['cash', 'card', 'mobile'] as const).map((method) => {
                      const entry = data.paymentBreakdown.find((p) => p._id === method);
                      const meta = PAYMENT_META[method];
                      const Icon = meta.icon;
                      const count = entry?.count || 0;
                      const total = entry?.total || 0;
                      const pct = totalPayCount > 0 ? (count / totalPayCount) * 100 : 0;
                      return (
                        <div key={method}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                              <Icon size={15} className={meta.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-on-surface">{meta.label}</span>
                                <span className="text-xs font-black text-primary">{formatCurrency(total)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-on-surface-variant">
                                  {count} transaction{count !== 1 ? 's' : ''}
                                </span>
                                <span className="text-[10px] font-bold text-on-surface-variant">
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden ml-11">
                            <div
                              className={`h-full ${meta.bar} rounded-full transition-all duration-700`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Grand Total</span>
                      <span className="text-sm font-black text-primary">{formatCurrency(data.totalSales)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 gap-3 text-on-surface-variant">
            <BarChart2 size={48} className="opacity-20" />
            <p className="text-sm font-medium opacity-50">Could not load report data</p>
            <button
              onClick={() => fetchReport()}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
