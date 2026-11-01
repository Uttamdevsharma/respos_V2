import { UserService } from './user.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiError } from '../../utils/ApiError.js';
export class UserController {
    static getAll = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const users = await UserService.getAll(restaurantId);
        ApiResponse.success(res, users);
    });
    static getById = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const user = await UserService.getById(req.params.id, restaurantId);
        ApiResponse.success(res, user);
    });
    static create = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const user = await UserService.create(req.body, restaurantId);
        ApiResponse.created(res, user);
    });
    static update = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const user = await UserService.update(req.params.id, req.body, restaurantId);
        ApiResponse.success(res, user);
    });
    static delete = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        await UserService.delete(req.params.id, restaurantId);
        ApiResponse.success(res, null, 'User deleted');
    });
    static toggleActive = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const user = await UserService.toggleActive(req.params.id, restaurantId);
        ApiResponse.success(res, user, 'User status toggled');
    });
}
//# sourceMappingURL=user.controller.js.map