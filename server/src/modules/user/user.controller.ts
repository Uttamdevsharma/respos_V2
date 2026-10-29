import { Request, Response } from 'express';
import { UserService } from './user.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';

export class UserController {
  static getAll = catchAsync(async (_req: Request, res: Response) => {
    const users = await UserService.getAll();
    ApiResponse.success(res, users);
  });

  static getById = catchAsync(async (req: Request, res: Response) => {
    const user = await UserService.getById(req.params.id as string);
    ApiResponse.success(res, user);
  });

  static create = catchAsync(async (req: Request, res: Response) => {
    const user = await UserService.create(req.body);
    ApiResponse.created(res, user);
  });

  static update = catchAsync(async (req: Request, res: Response) => {
    const user = await UserService.update(req.params.id as string, req.body);
    ApiResponse.success(res, user);
  });

  static delete = catchAsync(async (req: Request, res: Response) => {
    await UserService.delete(req.params.id as string);
    ApiResponse.success(res, null, 'User deleted');
  });

  static toggleActive = catchAsync(async (req: Request, res: Response) => {
    const user = await UserService.toggleActive(req.params.id as string);
    ApiResponse.success(res, user, 'User status toggled');
  });
}
