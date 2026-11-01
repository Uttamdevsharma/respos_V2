import { TableService } from './table.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiError } from '../../utils/ApiError.js';
export class TableController {
    static getAll = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const tables = await TableService.getAll(restaurantId);
        ApiResponse.success(res, tables, 'Tables retrieved');
    });
    static getById = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const table = await TableService.getById(req.params.id, restaurantId);
        ApiResponse.success(res, table, 'Table retrieved');
    });
    static create = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const table = await TableService.create(req.body, restaurantId);
        ApiResponse.created(res, table, 'Table created');
    });
    static update = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const table = await TableService.update(req.params.id, req.body, restaurantId);
        ApiResponse.success(res, table, 'Table updated');
    });
    static delete = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        await TableService.delete(req.params.id, restaurantId);
        ApiResponse.success(res, null, 'Table deleted');
    });
    static updateStatus = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const table = await TableService.updateStatus(req.params.id, req.body.status, restaurantId);
        ApiResponse.success(res, table, 'Table status updated');
    });
}
//# sourceMappingURL=table.controller.js.map