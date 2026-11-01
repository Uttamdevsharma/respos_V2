import { Response } from 'express';
import { TableService } from './table.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { AuthRequest } from '../../middleware/auth.js';
import { ApiError } from '../../utils/ApiError.js';

export class TableController {
  static getAll = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    const tables = await TableService.getAll(restaurantId);
    ApiResponse.success(res, tables, 'Tables retrieved');
  });

  static getById = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    const table = await TableService.getById(req.params.id as string, restaurantId);
    ApiResponse.success(res, table, 'Table retrieved');
  });

  static create = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    const table = await TableService.create(req.body, restaurantId);
    ApiResponse.created(res, table, 'Table created');
  });

  static update = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    const table = await TableService.update(req.params.id as string, req.body, restaurantId);
    ApiResponse.success(res, table, 'Table updated');
  });

  static delete = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    await TableService.delete(req.params.id as string, restaurantId);
    ApiResponse.success(res, null, 'Table deleted');
  });

  static updateStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    const table = await TableService.updateStatus(req.params.id as string, req.body.status, restaurantId);
    ApiResponse.success(res, table, 'Table status updated');
  });
}
