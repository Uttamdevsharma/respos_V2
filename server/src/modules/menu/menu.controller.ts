import { Request, Response } from 'express';
import { MenuService } from './menu.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../../config/cloudinary.js';

export class MenuController {
  static getAll = catchAsync(async (req: Request, res: Response) => {
    const categoryId = req.query.category as string | undefined;
    const items = await MenuService.getAll(categoryId);
    ApiResponse.success(res, items);
  });

  static getById = catchAsync(async (req: Request, res: Response) => {
    const item = await MenuService.getById(req.params.id as string);
    ApiResponse.success(res, item);
  });

  static create = catchAsync(async (req: Request, res: Response) => {
    const input = { ...req.body };
    if (req.file) {
      const uploadRes = await uploadBufferToCloudinary(req.file, 'menu');
      input.image = uploadRes.secure_url;
    }
    if (typeof input.optionGroups === 'string') {
      try {
        input.optionGroups = JSON.parse(input.optionGroups);
      } catch {
        input.optionGroups = [];
      }
    }
    const item = await MenuService.create(input);
    ApiResponse.created(res, item);
  });

  static update = catchAsync(async (req: Request, res: Response) => {
    const input = { ...req.body };
    const existing = await MenuService.getById(req.params.id as string);

    if (req.file) {
      const uploadRes = await uploadBufferToCloudinary(req.file, 'menu');
      input.image = uploadRes.secure_url;
      if (existing?.image) {
        deleteFromCloudinary(existing.image).catch(() => {});
      }
    } else if (req.body.removeImage === 'true' || req.body.removeImage === true) {
      input.image = null;
      if (existing?.image) {
        deleteFromCloudinary(existing.image).catch(() => {});
      }
    }
    if (typeof input.optionGroups === 'string') {
      try {
        input.optionGroups = JSON.parse(input.optionGroups);
      } catch {
        input.optionGroups = [];
      }
    }
    const item = await MenuService.update(req.params.id as string, input);
    ApiResponse.success(res, item);
  });

  static delete = catchAsync(async (req: Request, res: Response) => {
    const existing = await MenuService.getById(req.params.id as string);
    await MenuService.delete(req.params.id as string);
    if (existing?.image) {
      deleteFromCloudinary(existing.image).catch(() => {});
    }
    ApiResponse.success(res, null, 'Menu item deleted');
  });

  static toggleAvailability = catchAsync(async (req: Request, res: Response) => {
    const item = await MenuService.toggleAvailability(req.params.id as string);
    ApiResponse.success(res, item, 'Availability toggled');
  });
}
