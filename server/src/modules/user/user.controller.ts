import { Response } from 'express';
import { UserService } from './user.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { AuthRequest } from '../../middleware/auth.js';
import { ApiError } from '../../utils/ApiError.js';

export class UserController {
  static getAll = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    const users = await UserService.getAll(restaurantId);
    ApiResponse.success(res, users);
  });

  static getById = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    const user = await UserService.getById(req.params.id as string, restaurantId);
    ApiResponse.success(res, user);
  });

  static create = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    const user = await UserService.create(req.body, restaurantId);
    ApiResponse.created(res, user);
  });

  static update = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    const user = await UserService.update(req.params.id as string, req.body, restaurantId);
    ApiResponse.success(res, user);
  });

  static delete = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    await UserService.delete(req.params.id as string, restaurantId);
    ApiResponse.success(res, null, 'User deleted');
  });

  static toggleActive = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');
    const user = await UserService.toggleActive(req.params.id as string, restaurantId);
    ApiResponse.success(res, user, 'User status toggled');
  });
}
