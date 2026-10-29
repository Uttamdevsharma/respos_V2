import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { ExpenseService } from './expense.service.js';
import { createExpenseSchema } from './expense.validation.js';
export class ExpenseController {
    static create = catchAsync(async (req, res) => {
        const validated = createExpenseSchema.parse(req.body);
        const expense = await ExpenseService.create(validated);
        ApiResponse.created(res, expense, 'Expense logged successfully');
    });
    static getAll = catchAsync(async (req, res) => {
        const { startDate, endDate, category } = req.query;
        const expenses = await ExpenseService.getAll({
            startDate: startDate ? String(startDate) : undefined,
            endDate: endDate ? String(endDate) : undefined,
            category: category ? String(category) : undefined,
        });
        ApiResponse.success(res, expenses);
    });
    static delete = catchAsync(async (req, res) => {
        const { id } = req.params;
        await ExpenseService.delete(id);
        ApiResponse.success(res, null, 'Expense deleted successfully');
    });
    static getSummary = catchAsync(async (req, res) => {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            throw ApiError.badRequest('startDate and endDate queries are required');
        }
        const summary = await ExpenseService.getAccountsSummary(String(startDate), String(endDate));
        ApiResponse.success(res, summary);
    });
}
//# sourceMappingURL=expense.controller.js.map