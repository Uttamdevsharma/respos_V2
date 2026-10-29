import { MenuService } from './menu.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
export class MenuController {
    static getAll = catchAsync(async (req, res) => {
        const categoryId = req.query.category;
        const items = await MenuService.getAll(categoryId);
        ApiResponse.success(res, items);
    });
    static getById = catchAsync(async (req, res) => {
        const item = await MenuService.getById(req.params.id);
        ApiResponse.success(res, item);
    });
    static create = catchAsync(async (req, res) => {
        const input = { ...req.body };
        if (req.file) {
            input.image = `/uploads/${req.file.filename}`;
        }
        const item = await MenuService.create(input);
        ApiResponse.created(res, item);
    });
    static update = catchAsync(async (req, res) => {
        const input = { ...req.body };
        if (req.file) {
            input.image = `/uploads/${req.file.filename}`;
        }
        else if (req.body.removeImage === 'true' || req.body.removeImage === true) {
            input.image = null;
        }
        const item = await MenuService.update(req.params.id, input);
        ApiResponse.success(res, item);
    });
    static delete = catchAsync(async (req, res) => {
        await MenuService.delete(req.params.id);
        ApiResponse.success(res, null, 'Menu item deleted');
    });
    static toggleAvailability = catchAsync(async (req, res) => {
        const item = await MenuService.toggleAvailability(req.params.id);
        ApiResponse.success(res, item, 'Availability toggled');
    });
}
//# sourceMappingURL=menu.controller.js.map