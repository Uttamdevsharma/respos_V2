import { Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { ExpenseService } from './expense.service.js';
import { createExpenseSchema } from './expense.validation.js';
import { AuthRequest } from '../../middleware/auth.js';

export class ExpenseController {
  static create = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    const validated = createExpenseSchema.parse(req.body);
    const expense = await ExpenseService.create(validated, restaurantId);
    ApiResponse.created(res, expense, 'Expense logged successfully');
  });

  static getAll = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    const { startDate, endDate, category } = req.query;
    const expenses = await ExpenseService.getAll(restaurantId, {
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      category: category ? String(category) : undefined,
    });
    ApiResponse.success(res, expenses);
  });

  static delete = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    const { id } = req.params;
    await ExpenseService.delete(id as string, restaurantId);
    ApiResponse.success(res, null, 'Expense deleted successfully');
  });

  static getSummary = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      throw ApiError.badRequest('startDate and endDate queries are required');
    }
    const summary = await ExpenseService.getAccountsSummary(restaurantId, String(startDate), String(endDate));
    ApiResponse.success(res, summary);
  });
}
