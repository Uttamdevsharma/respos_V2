import { IOrder, OrderStatus } from '../../models/Order.js';
import { CreateOrderInput, ProcessPaymentInput, PartialPaymentInput, SplitPaymentInput } from './order.validation.js';
export declare class OrderService {
    static getAll(filters?: Record<string, unknown>): Promise<IOrder[]>;
    static getById(id: string): Promise<IOrder>;
    static create(input: CreateOrderInput, waiterId: string): Promise<IOrder>;
    static updateStatus(id: string, status: OrderStatus): Promise<IOrder>;
    static getKitchenOrders(): Promise<IOrder[]>;
    static getBillingOrders(): Promise<IOrder[]>;
    static addPartialPayment(id: string, input: PartialPaymentInput): Promise<IOrder>;
    static processPayment(id: string, input: ProcessPaymentInput): Promise<IOrder>;
    static processSplitPayment(id: string, input: SplitPaymentInput): Promise<IOrder>;
    static getWaiterOrders(waiterId: string): Promise<IOrder[]>;
    static updateTableOccupancyStatus(tableId: any): Promise<void>;
}
//# sourceMappingURL=order.service.d.ts.map