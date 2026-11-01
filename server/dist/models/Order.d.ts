import mongoose, { Document } from 'mongoose';
export interface IOrderItem {
    menuItem: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
    isAddon?: boolean;
    addonBatch?: number;
}
export interface IPartialPayment {
    amount: number;
    paymentMethod: 'cash' | 'card' | 'mobile';
    note?: string;
    paidAt: Date;
}
export interface ISplitPaymentEntry {
    paymentMethod: 'cash' | 'card' | 'mobile';
    amount: number;
    note?: string;
}
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'billing' | 'paid' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'mobile';
export type OrderType = 'dine_in' | 'takeaway' | 'foodpanda' | 'pathao' | 'foodi' | 'delivery';
export interface IOrder extends Document {
    restaurant_id: mongoose.Types.ObjectId;
    token: string;
    table?: mongoose.Types.ObjectId | null;
    waiter: mongoose.Types.ObjectId;
    items: IOrderItem[];
    status: OrderStatus;
    orderType?: OrderType;
    subtotal: number;
    tax: number;
    discount: number;
    serviceCharge: number;
    grandTotal: number;
    seatsOccupied?: number;
    latestAddonBatch?: number;
    partialPayments: IPartialPayment[];
    amountPaid: number;
    amountDue: number;
    splitPayments: ISplitPaymentEntry[];
    paymentMethod?: PaymentMethod;
    paidAmount?: number;
    returnAmount?: number;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const Order: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Order;
//# sourceMappingURL=Order.d.ts.map