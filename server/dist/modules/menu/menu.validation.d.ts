import { z } from 'zod';
export declare const createMenuItemSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodEffects<z.ZodNumber, number, unknown>;
    category: z.ZodString;
    isAvailable: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>, boolean, unknown>;
    removeImage: z.ZodEffects<z.ZodOptional<z.ZodBoolean>, boolean | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    name: string;
    price: number;
    category: string;
    isAvailable: boolean;
    description?: string | undefined;
    removeImage?: boolean | undefined;
}, {
    name: string;
    category: string;
    description?: string | undefined;
    price?: unknown;
    isAvailable?: unknown;
    removeImage?: unknown;
}>;
export declare const updateMenuItemSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    price: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>;
    category: z.ZodOptional<z.ZodString>;
    isAvailable: z.ZodOptional<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>, boolean, unknown>>;
    removeImage: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodBoolean>, boolean | undefined, unknown>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    price?: number | undefined;
    category?: string | undefined;
    isAvailable?: boolean | undefined;
    removeImage?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    price?: unknown;
    category?: string | undefined;
    isAvailable?: unknown;
    removeImage?: unknown;
}>;
//# sourceMappingURL=menu.validation.d.ts.map