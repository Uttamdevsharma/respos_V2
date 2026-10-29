import { TableService } from './table.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
export class TableController {
    static getAll = catchAsync(async (_req, res) => {
        const tables = await TableService.getAll();
        ApiResponse.success(res, tables, 'Tables retrieved');
    });
    static getById = catchAsync(async (req, res) => {
        const table = await TableService.getById(req.params.id);
        ApiResponse.success(res, table, 'Table retrieved');
    });
    static create = catchAsync(async (req, res) => {
        const table = await TableService.create(req.body);
        ApiResponse.created(res, table, 'Table created');
    });
    static update = catchAsync(async (req, res) => {
        const table = await TableService.update(req.params.id, req.body);
        ApiResponse.success(res, table, 'Table updated');
    });
    static delete = catchAsync(async (req, res) => {
        await TableService.delete(req.params.id);
        ApiResponse.success(res, null, 'Table deleted');
    });
    static updateStatus = catchAsync(async (req, res) => {
        const table = await TableService.updateStatus(req.params.id, req.body.status);
        ApiResponse.success(res, table, 'Table status updated');
    });
}
//# sourceMappingURL=table.controller.js.map