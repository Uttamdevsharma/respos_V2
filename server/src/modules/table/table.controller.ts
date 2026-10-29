import { Request, Response } from 'express';
import { TableService } from './table.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';

export class TableController {
  static getAll = catchAsync(async (_req: Request, res: Response) => {
    const tables = await TableService.getAll();
    ApiResponse.success(res, tables, 'Tables retrieved');
  });

  static getById = catchAsync(async (req: Request, res: Response) => {
    const table = await TableService.getById(req.params.id as string);
    ApiResponse.success(res, table, 'Table retrieved');
  });

  static create = catchAsync(async (req: Request, res: Response) => {
    const table = await TableService.create(req.body);
    ApiResponse.created(res, table, 'Table created');
  });

  static update = catchAsync(async (req: Request, res: Response) => {
    const table = await TableService.update(req.params.id as string, req.body);
    ApiResponse.success(res, table, 'Table updated');
  });

  static delete = catchAsync(async (req: Request, res: Response) => {
    await TableService.delete(req.params.id as string);
    ApiResponse.success(res, null, 'Table deleted');
  });

  static updateStatus = catchAsync(async (req: Request, res: Response) => {
    const table = await TableService.updateStatus(req.params.id as string, req.body.status);
    ApiResponse.success(res, table, 'Table status updated');
  });
}
