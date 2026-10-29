import { Request, Response } from 'express';
import { OrderService } from './order.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { AuthRequest } from '../../middleware/auth.js';

export class OrderController {
  static getAll = catchAsync(async (req: Request, res: Response) => {
    const filters: Record<string, unknown> = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.table) filters.table = req.query.table;
    const orders = await OrderService.getAll(filters);
    ApiResponse.success(res, orders);
  });

  static getById = catchAsync(async (req: Request, res: Response) => {
    const order = await OrderService.getById(req.params.id as string);
    ApiResponse.success(res, order);
  });

  static create = catchAsync(async (req: AuthRequest, res: Response) => {
    const order = await OrderService.create(req.body, req.user!._id);
    ApiResponse.created(res, order, 'Order created');
  });

  static updateStatus = catchAsync(async (req: Request, res: Response) => {
    const order = await OrderService.updateStatus(req.params.id as string, req.body.status);
    ApiResponse.success(res, order, 'Order status updated');
  });

  static getKitchenOrders = catchAsync(async (_req: Request, res: Response) => {
    try {
      const orders = await OrderService.getKitchenOrders();
      ApiResponse.success(res, orders);
    } catch (error: any) {
      console.error('Kitchen orders error:', error);
      throw error;
    }
  });

  static getBillingOrders = catchAsync(async (_req: Request, res: Response) => {
    try {
      const orders = await OrderService.getBillingOrders();
      ApiResponse.success(res, orders);
    } catch (error: any) {
      console.error('Billing orders error:', error);
      throw error;
    }
  });

  static processPayment = catchAsync(async (req: Request, res: Response) => {
    const order = await OrderService.processPayment(req.params.id as string, req.body);
    ApiResponse.success(res, order, 'Payment processed successfully');
  });

  static addPartialPayment = catchAsync(async (req: Request, res: Response) => {
    const order = await OrderService.addPartialPayment(req.params.id as string, req.body);
    ApiResponse.success(res, order, 'Partial payment recorded');
  });

  static processSplitPayment = catchAsync(async (req: Request, res: Response) => {
    const order = await OrderService.processSplitPayment(req.params.id as string, req.body);
    ApiResponse.success(res, order, 'Split payment processed successfully');
  });

  static getWaiterOrders = catchAsync(async (req: AuthRequest, res: Response) => {
    const orders = await OrderService.getWaiterOrders(req.user!._id);
    ApiResponse.success(res, orders);
  });

  static addItems = catchAsync(async (req: Request, res: Response) => {
    const order = await OrderService.addItems(req.params.id as string, req.body);
    ApiResponse.success(res, order, 'Items added to order');
  });

  static cancelItem = catchAsync(async (req: Request, res: Response) => {
    const order = await OrderService.cancelItem(req.params.id as string, req.body);
    ApiResponse.success(res, order, 'Item cancelled from order');
  });

  static delete = catchAsync(async (req: Request, res: Response) => {
    const order = await OrderService.deleteOrder(req.params.id as string);
    ApiResponse.success(res, order, `Order #${order.token} deleted successfully`);
  });

  static bulkDelete = catchAsync(async (req: Request, res: Response) => {
    const result = await OrderService.bulkDeleteOrders(req.body.orderIds);
    ApiResponse.success(res, result, `${result.count} orders deleted successfully`);
  });
}
