import { UserService } from './user.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
export class UserController {
    static getAll = catchAsync(async (_req, res) => {
        const users = await UserService.getAll();
        ApiResponse.success(res, users);
    });
    static getById = catchAsync(async (req, res) => {
        const user = await UserService.getById(req.params.id);
        ApiResponse.success(res, user);
    });
    static create = catchAsync(async (req, res) => {
        const user = await UserService.create(req.body);
        ApiResponse.created(res, user);
    });
    static update = catchAsync(async (req, res) => {
        const user = await UserService.update(req.params.id, req.body);
        ApiResponse.success(res, user);
    });
    static delete = catchAsync(async (req, res) => {
        await UserService.delete(req.params.id);
        ApiResponse.success(res, null, 'User deleted');
    });
    static toggleActive = catchAsync(async (req, res) => {
        const user = await UserService.toggleActive(req.params.id);
        ApiResponse.success(res, user, 'User status toggled');
    });
}
//# sourceMappingURL=user.controller.js.map