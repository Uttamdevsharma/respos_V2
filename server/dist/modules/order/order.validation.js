import { z } from 'zod';
export const createOrderSchema = z.object({
    table: z.string().optional(),
    seatsOccupied: z.number().int().min(1).max(20).optional(),
    orderType: z.enum(['dine_in', 'takeaway', 'foodpanda', 'pathao', 'foodi', 'delivery']).optional().default('dine_in'),
    paymentMode: z.enum(['pay_first', 'pre_bill']).optional().default('pre_bill'),
    paymentMethod: z.enum(['cash', 'card', 'mobile']).optional(),
    paidAmount: z.number().min(0).optional(),
    discount: z.number().min(0).optional().default(0),
    items: z.array(z.object({
        menuItem: z.string().min(1),
        name: z.string().min(1),
        price: z.number().min(0),
        quantity: z.number().int().min(1),
        notes: z.string().optional(),
    })).min(1, 'At least one item is required'),
});
export const updateOrderStatusSchema = z.object({
    status: z.enum(['pending', 'preparing', 'ready', 'served', 'billing', 'paid', 'completed', 'cancelled']),
});
export const processPaymentSchema = z.object({
    paymentMethod: z.enum(['cash', 'card', 'mobile']),
    paidAmount: z.number().min(0),
    discount: z.number().min(0).optional().default(0),
});
export const partialPaymentSchema = z.object({
    amount: z.number().positive('Amount must be greater than 0'),
    paymentMethod: z.enum(['cash', 'card', 'mobile']),
    note: z.string().optional(),
});
export const splitPaymentSchema = z.object({
    discount: z.number().min(0).optional().default(0),
    splits: z.array(z.object({
        paymentMethod: z.enum(['cash', 'card', 'mobile']),
        amount: z.number().positive(),
        note: z.string().optional(),
    })).min(1, 'At least one payment split is required'),
});
export const addItemsSchema = z.object({
    items: z.array(z.object({
        menuItem: z.string().min(1),
        name: z.string().min(1),
        price: z.number().min(0),
        quantity: z.number().int().min(1),
        notes: z.string().optional(),
    })).min(1, 'At least one item is required'),
});
export const cancelItemSchema = z.object({
    itemIndex: z.number().int().min(0),
    cancelQuantity: z.number().int().min(1).optional(),
});
export const bulkDeleteOrdersSchema = z.object({
    orderIds: z.array(z.string()).min(1, 'Select at least one order to delete'),
});
//# sourceMappingURL=order.validation.js.map