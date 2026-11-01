import { IOrder, OrderStatus } from '../../models/Order.js';
import { CreateOrderInput, ProcessPaymentInput, PartialPaymentInput, SplitPaymentInput, AddItemsInput, CancelItemInput } from './order.validation.js';
export declare class OrderService {
    static getAll(restaurantId: string, filters?: Record<string, unknown>): Promise<IOrder[]>;
    static getById(id: string, restaurantId?: string): Promise<IOrder>;
    static create(input: CreateOrderInput, waiterId: string, restaurantId: string): Promise<IOrder>;
    /** Append new items to an existing active order and recalculate totals */
    static addItems(id: string, input: AddItemsInput, restaurantId?: string): Promise<IOrder>;
    /** Cancel (remove or reduce qty of) a specific item in an order */
    static cancelItem(id: string, input: CancelItemInput, restaurantId?: string): Promise<IOrder>;
    static updateStatus(id: string, status: OrderStatus, restaurantId?: string): Promise<IOrder>;
    static getKitchenOrders(restaurantId: string): Promise<IOrder[]>;
    static getBillingOrders(restaurantId: string): Promise<IOrder[]>;
    static addPartialPayment(id: string, input: PartialPaymentInput, restaurantId?: string): Promise<IOrder>;
    static processPayment(id: string, input: ProcessPaymentInput, restaurantId?: string): Promise<IOrder>;
    static processSplitPayment(id: string, input: SplitPaymentInput, restaurantId?: string): Promise<IOrder>;
    static getWaiterOrders(waiterId: string, restaurantId: string): Promise<IOrder[]>;
    static updateTableOccupancyStatus(tableId: any): Promise<void>;
    static deleteOrder(id: string, restaurantId?: string): Promise<IOrder>;
    static bulkDeleteOrders(orderIds: string[], restaurantId?: string): Promise<{
        count: number;
    }>;
}
//# sourceMappingURL=order.service.d.ts.map