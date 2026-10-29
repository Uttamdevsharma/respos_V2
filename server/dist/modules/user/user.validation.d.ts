import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodEnum<["admin", "waiter", "cashier", "kitchen"]>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    role: "admin" | "waiter" | "cashier" | "kitchen";
    phone?: string | undefined;
}, {
    name: string;
    email: string;
    password: string;
    role: "admin" | "waiter" | "cashier" | "kitchen";
    phone?: string | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["admin", "waiter", "cashier", "kitchen"]>>;
    phone: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
    password?: string | undefined;
    role?: "admin" | "waiter" | "cashier" | "kitchen" | undefined;
    phone?: string | undefined;
    isActive?: boolean | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
    password?: string | undefined;
    role?: "admin" | "waiter" | "cashier" | "kitchen" | undefined;
    phone?: string | undefined;
    isActive?: boolean | undefined;
}>;
//# sourceMappingURL=user.validation.d.ts.map