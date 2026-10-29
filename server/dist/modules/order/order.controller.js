import { OrderService } from './order.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
export class OrderController {
    static getAll = catchAsync(async (req, res) => {
        const filters = {};
        if (req.query.status)
            filters.status = req.query.status;
        if (req.query.table)
            filters.table = req.query.table;
        const orders = await OrderService.getAll(filters);
        ApiResponse.success(res, orders);
    });
    static getById = catchAsync(async (req, res) => {
        const order = await OrderService.getById(req.params.id);
        ApiResponse.success(res, order);
    });
    static create = catchAsync(async (req, res) => {
        const order = await OrderService.create(req.body, req.user._id);
        ApiResponse.created(res, order, 'Order created');
    });
    static updateStatus = catchAsync(async (req, res) => {
        const order = await OrderService.updateStatus(req.params.id, req.body.status);
        ApiResponse.success(res, order, 'Order status updated');
    });
    static getKitchenOrders = catchAsync(async (_req, res) => {
        try {
            const orders = await OrderService.getKitchenOrders();
            ApiResponse.success(res, orders);
        }
        catch (error) {
            console.error('Kitchen orders error:', error);
            throw error;
        }
    });
    static getBillingOrders = catchAsync(async (_req, res) => {
        try {
            const orders = await OrderService.getBillingOrders();
            ApiResponse.success(res, orders);
        }
        catch (error) {
            console.error('Billing orders error:', error);
            throw error;
        }
    });
    static processPayment = catchAsync(async (req, res) => {
        const order = await OrderService.processPayment(req.params.id, req.body);
        ApiResponse.success(res, order, 'Payment processed successfully');
    });
    static addPartialPayment = catchAsync(async (req, res) => {
        const order = await OrderService.addPartialPayment(req.params.id, req.body);
        ApiResponse.success(res, order, 'Partial payment recorded');
    });
    static processSplitPayment = catchAsync(async (req, res) => {
        const order = await OrderService.processSplitPayment(req.params.id, req.body);
        ApiResponse.success(res, order, 'Split payment processed successfully');
    });
    static getWaiterOrders = catchAsync(async (req, res) => {
        const orders = await OrderService.getWaiterOrders(req.user._id);
        ApiResponse.success(res, orders);
    });
}
//# sourceMappingURL=order.controller.js.map