import Expense from '../../models/Expense.js';
import Order from '../../models/Order.js';
import { CreateExpenseInput } from './expense.validation.js';
import { ApiError } from '../../utils/ApiError.js';

export class ExpenseService {
  static async create(input: CreateExpenseInput, restaurantId: string) {
    return Expense.create({ ...input, restaurant_id: restaurantId });
  }

  static async getAll(restaurantId: string, filters: { startDate?: string; endDate?: string; category?: string }) {
    const query: any = { restaurant_id: restaurantId };

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (filters.category && filters.category !== 'all') {
      query.category = filters.category;
    }

    return Expense.find(query).sort({ date: -1, createdAt: -1 });
  }

  static async delete(id: string, restaurantId: string) {
    const expense = await Expense.findOne({ _id: id, restaurant_id: restaurantId });
    if (!expense) throw ApiError.notFound('Expense not found');
    await Expense.findOneAndDelete({ _id: id, restaurant_id: restaurantId });
  }

  static async getAccountsSummary(restaurantId: string, startDateStr: string, endDateStr: string) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      restaurant_id: restaurantId,
      status: 'completed',
      createdAt: { $gte: start, $lte: end }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);

    const expenses = await Expense.find({
      restaurant_id: restaurantId,
      date: { $gte: start, $lte: end }
    });

    const totalExpense = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const netProfit = totalRevenue - totalExpense;

    const breakdown: { date: string; revenue: number; expense: number; profit: number }[] = [];
    
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 31) {
      let current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        
        const dayOrders = orders.filter(o => o.createdAt.toISOString().split('T')[0] === dateStr);
        const dayExpenses = expenses.filter(e => e.date.toISOString().split('T')[0] === dateStr);

        const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        const dayExpense = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        breakdown.push({
          date: dateStr,
          revenue: Math.round(dayRevenue * 100) / 100,
          expense: Math.round(dayExpense * 100) / 100,
          profit: Math.round((dayRevenue - dayExpense) * 100) / 100
        });

        current.setDate(current.getDate() + 1);
      }
    } else {
      const monthsMap: Record<string, { revenue: number; expense: number }> = {};
      
      orders.forEach(o => {
        const monthStr = o.createdAt.toISOString().substring(0, 7); // YYYY-MM
        if (!monthsMap[monthStr]) monthsMap[monthStr] = { revenue: 0, expense: 0 };
        monthsMap[monthStr].revenue += o.grandTotal || 0;
      });

      expenses.forEach(e => {
        const monthStr = e.date.toISOString().substring(0, 7); // YYYY-MM
        if (!monthsMap[monthStr]) monthsMap[monthStr] = { revenue: 0, expense: 0 };
        monthsMap[monthStr].expense += e.amount || 0;
      });

      Object.entries(monthsMap).forEach(([monthStr, data]) => {
        breakdown.push({
          date: monthStr,
          revenue: Math.round(data.revenue * 100) / 100,
          expense: Math.round(data.expense * 100) / 100,
          profit: Math.round((data.revenue - data.expense) * 100) / 100
        });
      });
      breakdown.sort((a, b) => a.date.localeCompare(b.date));
    }

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      breakdown
    };
  }
}
