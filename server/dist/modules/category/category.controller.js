import { CategoryService } from './category.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiError } from '../../utils/ApiError.js';
export class CategoryController {
    static getAll = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const categories = await CategoryService.getAll(restaurantId);
        ApiResponse.success(res, categories);
    });
    static getById = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const category = await CategoryService.getById(req.params.id, restaurantId);
        ApiResponse.success(res, category);
    });
    static create = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const category = await CategoryService.create(req.body, restaurantId);
        ApiResponse.created(res, category);
    });
    static update = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const category = await CategoryService.update(req.params.id, req.body, restaurantId);
        ApiResponse.success(res, category);
    });
    static delete = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        await CategoryService.delete(req.params.id, restaurantId);
        ApiResponse.success(res, null, 'Category deleted');
    });
}
//# sourceMappingURL=category.controller.js.map