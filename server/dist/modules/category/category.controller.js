import { CategoryService } from './category.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
export class CategoryController {
    static getAll = catchAsync(async (_req, res) => {
        const categories = await CategoryService.getAll();
        ApiResponse.success(res, categories);
    });
    static getById = catchAsync(async (req, res) => {
        const category = await CategoryService.getById(req.params.id);
        ApiResponse.success(res, category);
    });
    static create = catchAsync(async (req, res) => {
        const category = await CategoryService.create(req.body);
        ApiResponse.created(res, category);
    });
    static update = catchAsync(async (req, res) => {
        const category = await CategoryService.update(req.params.id, req.body);
        ApiResponse.success(res, category);
    });
    static delete = catchAsync(async (req, res) => {
        await CategoryService.delete(req.params.id);
        ApiResponse.success(res, null, 'Category deleted');
    });
}
//# sourceMappingURL=category.controller.js.map