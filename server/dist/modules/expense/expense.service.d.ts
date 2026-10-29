import { CreateExpenseInput } from './expense.validation.js';
export declare class ExpenseService {
    static create(input: CreateExpenseInput): Promise<import("mongoose").Document<unknown, {}, import("../../models/Expense.js").IExpense, {}, {}> & import("../../models/Expense.js").IExpense & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static getAll(filters: {
        startDate?: string;
        endDate?: string;
        category?: string;
    }): Promise<(import("mongoose").Document<unknown, {}, import("../../models/Expense.js").IExpense, {}, {}> & import("../../models/Expense.js").IExpense & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static delete(id: string): Promise<void>;
    static getAccountsSummary(startDateStr: string, endDateStr: string): Promise<{
        totalRevenue: number;
        totalExpense: number;
        netProfit: number;
        breakdown: {
            date: string;
            revenue: number;
            expense: number;
            profit: number;
        }[];
    }>;
}
//# sourceMappingURL=expense.service.d.ts.map