import { z } from 'zod';
export declare const createOrderSchema: z.ZodObject<{
    table: z.ZodString;
    seatsOccupied: z.ZodOptional<z.ZodNumber>;
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
    table: string;
    items: {
        name: string;
        menuItem: string;
        price: number;
        quantity: number;
        notes?: string | undefined;
    }[];
    seatsOccupied?: number | undefined;
}, {
    table: string;
    items: {
        name: string;
        menuItem: string;
        price: number;
        quantity: number;
        notes?: string | undefined;
    }[];
    seatsOccupied?: number | undefined;
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
    amount: number;
    paymentMethod: "cash" | "card" | "mobile";
    note?: string | undefined;
}, {
    amount: number;
    paymentMethod: "cash" | "card" | "mobile";
    note?: string | undefined;
}>;
export declare const splitPaymentSchema: z.ZodObject<{
    discount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    splits: z.ZodArray<z.ZodObject<{
        paymentMethod: z.ZodEnum<["cash", "card", "mobile"]>;
        amount: z.ZodNumber;
        note: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        paymentMethod: "cash" | "card" | "mobile";
        note?: string | undefined;
    }, {
        amount: number;
        paymentMethod: "cash" | "card" | "mobile";
        note?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    discount: number;
    splits: {
        amount: number;
        paymentMethod: "cash" | "card" | "mobile";
        note?: string | undefined;
    }[];
}, {
    splits: {
        amount: number;
        paymentMethod: "cash" | "card" | "mobile";
        note?: string | undefined;
    }[];
    discount?: number | undefined;
}>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type PartialPaymentInput = z.infer<typeof partialPaymentSchema>;
export type SplitPaymentInput = z.infer<typeof splitPaymentSchema>;
//# sourceMappingURL=order.validation.d.ts.map