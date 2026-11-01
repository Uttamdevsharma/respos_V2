import { OrderService } from './order.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiError } from '../../utils/ApiError.js';
export class OrderController {
    static getAll = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const filters = {};
        if (req.query.status)
            filters.status = req.query.status;
        if (req.query.table)
            filters.table = req.query.table;
        const orders = await OrderService.getAll(restaurantId, filters);
        ApiResponse.success(res, orders);
    });
    static getById = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const order = await OrderService.getById(req.params.id, restaurantId);
        ApiResponse.success(res, order);
    });
    static create = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const order = await OrderService.create(req.body, req.user._id, restaurantId);
        ApiResponse.created(res, order, 'Order created');
    });
    static updateStatus = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const order = await OrderService.updateStatus(req.params.id, req.body.status, restaurantId);
        ApiResponse.success(res, order, 'Order status updated');
    });
    static getKitchenOrders = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const orders = await OrderService.getKitchenOrders(restaurantId);
        ApiResponse.success(res, orders);
    });
    static getBillingOrders = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const orders = await OrderService.getBillingOrders(restaurantId);
        ApiResponse.success(res, orders);
    });
    static processPayment = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const order = await OrderService.processPayment(req.params.id, req.body, restaurantId);
        ApiResponse.success(res, order, 'Payment processed successfully');
    });
    static addPartialPayment = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const order = await OrderService.addPartialPayment(req.params.id, req.body, restaurantId);
        ApiResponse.success(res, order, 'Partial payment recorded');
    });
    static processSplitPayment = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const order = await OrderService.processSplitPayment(req.params.id, req.body, restaurantId);
        ApiResponse.success(res, order, 'Split payment processed successfully');
    });
    static getWaiterOrders = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const orders = await OrderService.getWaiterOrders(req.user._id, restaurantId);
        ApiResponse.success(res, orders);
    });
    static addItems = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const order = await OrderService.addItems(req.params.id, req.body, restaurantId);
        ApiResponse.success(res, order, 'Items added to order');
    });
    static cancelItem = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const order = await OrderService.cancelItem(req.params.id, req.body, restaurantId);
        ApiResponse.success(res, order, 'Item cancelled from order');
    });
    static delete = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const order = await OrderService.deleteOrder(req.params.id, restaurantId);
        ApiResponse.success(res, order, `Order #${order.token} deleted successfully`);
    });
    static bulkDelete = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const result = await OrderService.bulkDeleteOrders(req.body.orderIds, restaurantId);
        ApiResponse.success(res, result, `${result.count} orders deleted successfully`);
    });
}
//# sourceMappingURL=order.controller.js.map