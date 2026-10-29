'use client';

import { useState, useEffect } from 'react';
import Topbar from '../../../components/layout/topbar';
import api from '../../../lib/api';
import { toast } from 'react-hot-toast';
import {
  Plus, Trash2, Calendar, ArrowUpRight, ArrowDownRight,
  Wallet, Info, Search, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { Expense, AccountsSummary } from '../../../types/expense';

const EXPENSE_CATEGORIES = [
  { id: 'inventory', label: 'Inventory / Ingredients', color: 'bg-primary/10 text-primary' },
  { id: 'utilities', label: 'Utilities (Gas/Water/Electricity)', color: 'bg-blue-500/10 text-blue-500' },
  { id: 'salary', label: 'Staff Salaries / Wages', color: 'bg-purple-500/10 text-purple-500' },
  { id: 'rent', label: 'Rent / Leasing', color: 'bg-amber-500/10 text-amber-500' },
  { id: 'marketing', label: 'Marketing & Adverts', color: 'bg-pink-500/10 text-pink-500' },
  { id: 'other', label: 'Other Expenses', color: 'bg-on-surface-variant/10 text-on-surface-variant' },
];

export default function AccountsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<AccountsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Filters state
  const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // New Expense form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('inventory');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const formatCurrency = (val: number) => {
    return `৳${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  // Helper to get date strings
  const getFilterDates = (type: 'today' | 'week' | 'month' | 'custom') => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'week') {
      start.setDate(today.getDate() - 7);
    } else if (type === 'month') {
      start.setDate(today.getDate() - 30);
    } else if (type === 'custom') {
      if (startDate) start = new Date(startDate);
      if (endDate) end = new Date(endDate);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  // Set default filter dates on load
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const pastMonth = new Date();
    pastMonth.setDate(pastMonth.getDate() - 30);
    const pastMonthStr = pastMonth.toISOString().split('T')[0];

    setStartDate(pastMonthStr);
    setEndDate(todayStr);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { start, end } = getFilterDates(filterType);

      // 1. Fetch expenses
      const expensesRes = await api.get(`/expenses?startDate=${start}&endDate=${end}`);
      if (expensesRes.data?.success) {
        setExpenses(expensesRes.data.data);
      }

      // 2. Fetch Accounts summary (Revenue vs Expenses)
      const summaryRes = await api.get(`/expenses/summary?startDate=${start}&endDate=${end}`);
      if (summaryRes.data?.success) {
        setSummary(summaryRes.data.data);
      }
    } catch (error: any) {
      toast.error('Failed to load accounts ledger data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on filter updates
  useEffect(() => {
    if (filterType !== 'custom' || (startDate && endDate)) {
      fetchData();
    }
  }, [filterType, startDate, endDate]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Expense title is required');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid expense amount');
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        title,
        amount: val,
        category,
        date: expenseDate,
        note: note.trim() || undefined,
      };

      const res = await api.post('/expenses', payload);
      if (res.data?.success) {
        toast.success('Expense logged successfully!');
        setShowAddForm(false);
        setTitle('');
        setAmount('');
        setCategory('inventory');
        setNote('');
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to log expense');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;

    try {
      setActionLoading(true);
      const res = await api.delete(`/expenses/${id}`);
      if (res.data?.success) {
        toast.success('Expense record deleted');
        fetchData();
      }
    } catch (error: any) {
      toast.error('Failed to delete expense record');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered expense list based on search query
  const filteredExpenses = expenses.filter(
    (exp) =>
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.note && exp.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Grouped expenses by category for cost breakdown visual
  const getCategoryBreakdown = () => {
    const initialMap: Record<string, number> = {};
    expenses.forEach((exp) => {
      initialMap[exp.category] = (initialMap[exp.category] || 0) + exp.amount;
    });

    const total = Object.values(initialMap).reduce((sum, v) => sum + v, 0);

    return EXPENSE_CATEGORIES.map((cat) => {
      const amt = initialMap[cat.id] || 0;
      const pct = total > 0 ? (amt / total) * 100 : 0;
      return { ...cat, amount: amt, percent: pct };
    }).sort((a, b) => b.amount - a.amount);
  };

  const categoryBreakdown = getCategoryBreakdown();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <Topbar title="Accounts Ledger" subtitle="Daily costs log & Profit-Loss analyses" />

      {/* Main Workspace Scroll Wrapper */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Header Filter Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-3xl border border-outline-variant/30 shadow-sm">
          {/* Tabs Filter */}
          <div className="flex bg-surface-container-low p-1 rounded-2xl border border-outline-variant/20">
            {(['today', 'week', 'month', 'custom'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all capitalize ${
                  filterType === type
                    ? 'bg-primary text-on-primary shadow-md'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {type === 'week' ? 'Weekly' : type === 'month' ? 'Monthly' : type}
              </button>
            ))}
          </div>

          {/* Date Picker (only visible if Custom is selected) */}
          {filterType === 'custom' && (
            <div className="flex items-center gap-2 animate-fade-in">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-1.5 text-xs font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs font-bold text-on-surface-variant/60">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-1.5 text-xs font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Log Cost Trigger Button */}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-2xl hover:brightness-110 shadow-lg shadow-primary/10 transition-all press-effect ml-auto sm:ml-0"
          >
            <Plus size={16} />
            Log Cost / Expense
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && !summary ? (
          <div className="h-96 flex flex-col items-center justify-center text-on-surface-variant/60">
            <Loader2 size={36} className="animate-spin text-primary mb-3" />
            <span className="text-xs font-bold">Consolidating Ledger Data...</span>
          </div>
        ) : (
          <>
            {/* Accounts Summary Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Revenue Card */}
              <div className="bg-surface relative overflow-hidden rounded-3xl border border-outline-variant/30 p-6 flex items-center justify-between shadow-sm card-hover">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">Total Sales Revenue</span>
                  <span className="text-3xl font-black text-on-surface">
                    {formatCurrency(summary?.totalRevenue || 0)}
                  </span>
                  <span className="text-[10px] text-primary font-semibold flex items-center gap-1">
                    <Sparkles size={12} /> From settled kitchen orders
                  </span>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <ArrowUpRight size={24} />
                </div>
              </div>

              {/* Expense Card */}
              <div className="bg-surface relative overflow-hidden rounded-3xl border border-outline-variant/30 p-6 flex items-center justify-between shadow-sm card-hover">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">Total Expenditures</span>
                  <span className="text-3xl font-black text-error">
                    {formatCurrency(summary?.totalExpense || 0)}
                  </span>
                  <span className="text-[10px] text-error font-semibold flex items-center gap-1">
                    <AlertCircle size={12} /> Total logged raw costs
                  </span>
                </div>
                <div className="w-12 h-12 bg-error/10 rounded-2xl flex items-center justify-center text-error">
                  <ArrowDownRight size={24} />
                </div>
              </div>

              {/* Net Profit Card */}
              <div className={`relative overflow-hidden rounded-3xl border p-6 flex items-center justify-between shadow-sm card-hover transition-colors ${
                (summary?.netProfit || 0) >= 0 
                  ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20' 
                  : 'bg-gradient-to-br from-error/10 to-error/5 border-error/20'
              }`}>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">Net Profit / Loss</span>
                  <span className={`text-3xl font-black ${
                    (summary?.netProfit || 0) >= 0 ? 'text-primary' : 'text-error'
                  }`}>
                    {formatCurrency(summary?.netProfit || 0)}
                  </span>
                  <span className={`text-[10px] font-semibold ${
                    (summary?.netProfit || 0) >= 0 ? 'text-primary' : 'text-error'
                  }`}>
                    {(summary?.netProfit || 0) >= 0 ? '🎉 Positive Net Surplus' : '⚠️ Deficit / Loss Margin'}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  (summary?.netProfit || 0) >= 0 ? 'bg-primary/20 text-primary' : 'bg-error/20 text-error'
                }`}>
                  <Wallet size={24} />
                </div>
              </div>
            </div>

            {/* Split View Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Ledger Expense List & Search (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col gap-6 bg-surface p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="text-base font-black text-on-surface">Expenditure Ledger</h3>
                  
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-60">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                    <input
                      type="text"
                      placeholder="Search logged costs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="overflow-x-auto rounded-2xl border border-outline-variant/20">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/20 uppercase tracking-wider text-[10px]">
                        <th className="p-4">Title / Description</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                      {filteredExpenses.map((exp) => {
                        const catInfo = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                        return (
                          <tr key={exp._id} className="hover:bg-surface-container-low/50 transition-colors">
                            <td className="p-4">
                              <div>
                                <span className="font-bold text-on-surface block">{exp.title}</span>
                                {exp.note && <span className="text-[10px] text-on-surface-variant font-medium block mt-0.5">{exp.note}</span>}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide uppercase ${catInfo?.color || 'bg-outline-variant/20 text-on-surface'}`}>
                                {catInfo?.label.split(' ')[0] || exp.category}
                              </span>
                            </td>
                            <td className="p-4 text-on-surface-variant/80 font-medium whitespace-nowrap">
                              {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                            </td>
                            <td className="p-4 text-right font-black whitespace-nowrap">
                              {formatCurrency(exp.amount)}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteExpense(exp._id)}
                                disabled={actionLoading}
                                className="p-1.5 hover:bg-error-container/30 text-on-surface-variant hover:text-error rounded-lg transition-colors inline-flex items-center justify-center disabled:opacity-50"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredExpenses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-20 text-center text-on-surface-variant font-medium">
                            No logged expenses found for this duration.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Visual Aggregates & Profit margins (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Cost Distribution Chart Card */}
                <div className="bg-surface p-6 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col gap-4">
                  <h3 className="text-base font-black text-on-surface">Category Cost Distributions</h3>
                  
                  <div className="space-y-4">
                    {categoryBreakdown.map((cat) => (
                      <div key={cat.id} className="space-y-1.5 text-xs font-semibold text-on-surface">
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant font-medium">{cat.label}</span>
                          <span className="font-bold">{formatCurrency(cat.amount)} ({cat.percent.toFixed(1)}%)</span>
                        </div>
                        {/* Progress Bar container */}
                        <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden border border-outline-variant/10">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              cat.id === 'inventory' ? 'bg-primary' :
                              cat.id === 'utilities' ? 'bg-blue-500' :
                              cat.id === 'salary' ? 'bg-purple-500' :
                              cat.id === 'rent' ? 'bg-amber-500' :
                              cat.id === 'marketing' ? 'bg-pink-500' : 'bg-on-surface-variant'
                            }`}
                            style={{ width: `${cat.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {expenses.length === 0 && (
                      <div className="py-10 text-center text-xs font-bold text-on-surface-variant/40">
                        Log costs to visualize allocation breakdown.
                      </div>
                    )}
                  </div>
                </div>

                {/* Profit Loss Comparison Visual */}
                <div className="bg-surface p-6 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col gap-4">
                  <h3 className="text-base font-black text-on-surface">Revenue vs Cost Analysis</h3>

                  {summary?.breakdown && summary.breakdown.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-between text-[10px] text-on-surface-variant uppercase tracking-wider font-bold border-b border-outline-variant/20 pb-2">
                        <span>Timeline Date</span>
                        <div className="flex gap-4">
                          <span className="text-primary text-right w-16">Sales</span>
                          <span className="text-error text-right w-16">Cost</span>
                          <span className="text-right w-16">Margin</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {summary.breakdown.map((item) => (
                          <div key={item.date} className="flex justify-between items-center text-xs font-bold text-on-surface">
                            <span className="text-on-surface-variant font-semibold text-[11px]">
                              {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                            </span>
                            <div className="flex gap-4 text-[11px] font-black">
                              <span className="text-primary text-right w-16">{formatCurrency(item.revenue)}</span>
                              <span className="text-error text-right w-16">{formatCurrency(item.expense)}</span>
                              <span className={`text-right w-16 ${item.profit >= 0 ? 'text-primary' : 'text-error'}`}>
                                {formatCurrency(item.profit)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center text-xs font-bold text-on-surface-variant/40">
                      No matching records found.
                    </div>
                  )}
                </div>

              </div>

            </div>
          </>
        )}

      </div>

      {/* Log Cost Modal Overlay Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/30 animate-scale-in">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-on-surface">Log Cost / Daily Expense</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 hover:bg-surface-container-high rounded-lg text-on-surface-variant"
              >
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              
              {/* Title Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Expense Title</label>
                <input
                  type="text"
                  placeholder="e.g. Purchased Onion 20kg"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Amount Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Amount (৳)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Category Select */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Cost Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expense Date Picker */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Date of Expense</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Notes TextArea */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Notes / Remarks (Optional)</label>
                <textarea
                  placeholder="Add details, receipt reference, or waiter remark..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Submit Panel */}
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-primary text-on-primary font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:brightness-110 press-effect transition-all disabled:opacity-50 mt-2"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Log Expenditure
              </button>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Small helper inline icon component to close modal
function XIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
