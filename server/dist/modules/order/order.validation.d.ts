import { z } from 'zod';
export declare const createOrderSchema: z.ZodObject<{
    table: z.ZodOptional<z.ZodString>;
    seatsOccupied: z.ZodOptional<z.ZodNumber>;
    orderType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["dine_in", "takeaway", "foodpanda", "pathao", "foodi", "delivery"]>>>;
    paymentMode: z.ZodDefault<z.ZodOptional<z.ZodEnum<["pay_first", "pre_bill"]>>>;
    paymentMethod: z.ZodOptional<z.ZodEnum<["cash", "card", "mobile"]>>;
    paidAmount: z.ZodOptional<z.ZodNumber>;
    discount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    items: z.ZodArray<z.ZodObject<{
        menuItem: z.ZodString;
        name: z.ZodString;
        price: z.ZodNumber;
        quantity: z.ZodNumber;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        menuItem: string;
        price: number;
        quantity: number;
        notes?: string | undefined;
    }, {
        name: string;
        menuItem: string;
        price: number;
        quantity: number;
        notes?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        name: string;
        menuItem: string;
        price: number;
        quantity: number;
        notes?: string | undefined;
    }[];
    orderType: "dine_in" | "takeaway" | "foodpanda" | "pathao" | "foodi" | "delivery";
    discount: number;
    paymentMode: "pay_first" | "pre_bill";
    paymentMethod?: "cash" | "card" | "mobile" | undefined;
    table?: string | undefined;
    seatsOccupied?: number | undefined;
    paidAmount?: number | undefined;
}, {
    items: {
        name: string;
        menuItem: string;
        price: number;
        quantity: number;
        notes?: string | undefined;
    }[];
    paymentMethod?: "cash" | "card" | "mobile" | undefined;
    table?: string | undefined;
    orderType?: "dine_in" | "takeaway" | "foodpanda" | "pathao" | "foodi" | "delivery" | undefined;
    discount?: number | undefined;
    seatsOccupied?: number | undefined;
    paidAmount?: number | undefined;
    paymentMode?: "pay_first" | "pre_bill" | undefined;
}>;
export declare const updateOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["pending", "preparing", "ready", "served", "billing", "paid", "completed", "cancelled"]>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "preparing" | "ready" | "served" | "billing" | "paid" | "completed" | "cancelled";
}, {
    status: "pending" | "preparing" | "ready" | "served" | "billing" | "paid" | "completed" | "cancelled";
}>;
export declare const processPaymentSchema: z.ZodObject<{
    paymentMethod: z.ZodEnum<["cash", "card", "mobile"]>;
    paidAmount: z.ZodNumber;
    discount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    paymentMethod: "cash" | "card" | "mobile";
    discount: number;
    paidAmount: number;
}, {
    paymentMethod: "cash" | "card" | "mobile";
    paidAmount: number;
    discount?: number | undefined;
}>;
export declare const partialPaymentSchema: z.ZodObject<{
    amount: z.ZodNumber;
    paymentMethod: z.ZodEnum<["cash", "card", "mobile"]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    paymentMethod: "cash" | "card" | "mobile";
    amount: number;
    note?: string | undefined;
}, {
    paymentMethod: "cash" | "card" | "mobile";
    amount: number;
    note?: string | undefined;
}>;
export declare const splitPaymentSchema: z.ZodObject<{
    discount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    splits: z.ZodArray<z.ZodObject<{
        paymentMethod: z.ZodEnum<["cash", "card", "mobile"]>;
        amount: z.ZodNumber;
        note: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        paymentMethod: "cash" | "card" | "mobile";
        amount: number;
        note?: string | undefined;
    }, {
        paymentMethod: "cash" | "card" | "mobile";
        amount: number;
        note?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    discount: number;
    splits: {
        paymentMethod: "cash" | "card" | "mobile";
        amount: number;
        note?: string | undefined;
    }[];
}, {
    splits: {
        paymentMethod: "cash" | "card" | "mobile";
        amount: number;
        note?: string | undefined;
    }[];
    discount?: number | undefined;
}>;
export declare const addItemsSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        menuItem: z.ZodString;
        name: z.ZodString;
        price: z.ZodNumber;
        quantity: z.ZodNumber;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        menuItem: string;
        price: number;
        quantity: number;
        notes?: string | undefined;
    }, {
        name: string;
        menuItem: string;
        price: number;
        quantity: number;
        notes?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        name: string;
        menuItem: string;
        price: number;
        quantity: number;
        notes?: string | undefined;
    }[];
}, {
    items: {
        name: string;
        menuItem: string;
        price: number;
        quantity: number;
        notes?: string | undefined;
    }[];
}>;
export declare const cancelItemSchema: z.ZodObject<{
    itemIndex: z.ZodNumber;
    cancelQuantity: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    itemIndex: number;
    cancelQuantity?: number | undefined;
}, {
    itemIndex: number;
    cancelQuantity?: number | undefined;
}>;
export declare const bulkDeleteOrdersSchema: z.ZodObject<{
    orderIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    orderIds: string[];
}, {
    orderIds: string[];
}>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type PartialPaymentInput = z.infer<typeof partialPaymentSchema>;
export type SplitPaymentInput = z.infer<typeof splitPaymentSchema>;
export type AddItemsInput = z.infer<typeof addItemsSchema>;
export type CancelItemInput = z.infer<typeof cancelItemSchema>;
export type BulkDeleteOrdersInput = z.infer<typeof bulkDeleteOrdersSchema>;
//# sourceMappingURL=order.validation.d.ts.map