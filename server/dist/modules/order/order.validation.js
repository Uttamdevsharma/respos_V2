import { z } from 'zod';
export const createOrderSchema = z.object({
    table: z.string().min(1, 'Table is required'),
    seatsOccupied: z.number().int().min(1).max(20).optional(),
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
//# sourceMappingURL=order.validation.js.map