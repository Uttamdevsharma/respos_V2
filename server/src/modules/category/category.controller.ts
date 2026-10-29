import { Request, Response } from 'express';
import { CategoryService } from './category.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';

export class CategoryController {
  static getAll = catchAsync(async (_req: Request, res: Response) => {
    const categories = await CategoryService.getAll();
    ApiResponse.success(res, categories);
  });

  static getById = catchAsync(async (req: Request, res: Response) => {
    const category = await CategoryService.getById(req.params.id as string);
    ApiResponse.success(res, category);
  });

  static create = catchAsync(async (req: Request, res: Response) => {
    const category = await CategoryService.create(req.body);
    ApiResponse.created(res, category);
  });

  static update = catchAsync(async (req: Request, res: Response) => {
    const category = await CategoryService.update(req.params.id as string, req.body);
    ApiResponse.success(res, category);
  });

  static delete = catchAsync(async (req: Request, res: Response) => {
    await CategoryService.delete(req.params.id as string);
    ApiResponse.success(res, null, 'Category deleted');
  });
}
