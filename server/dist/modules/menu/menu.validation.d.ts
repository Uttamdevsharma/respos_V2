import { z } from 'zod';
export declare const createMenuItemSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodEffects<z.ZodNumber, number, unknown>;
    category: z.ZodString;
    isAvailable: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>, boolean, unknown>;
    removeImage: z.ZodEffects<z.ZodOptional<z.ZodBoolean>, boolean | undefined, unknown>;
    optionGroups: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        required: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        options: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            price: z.ZodEffects<z.ZodNumber, number, unknown>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            price: number;
        }, {
            name: string;
            price?: unknown;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        required: boolean;
        options: {
            name: string;
            price: number;
        }[];
        title: string;
    }, {
        options: {
            name: string;
            price?: unknown;
        }[];
        required?: boolean | undefined;
        title?: string | undefined;
    }>, "many">>, {
        required: boolean;
        options: {
            name: string;
            price: number;
        }[];
        title: string;
    }[] | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    name: string;
    price: number;
    category: string;
    isAvailable: boolean;
    description?: string | undefined;
    optionGroups?: {
        required: boolean;
        options: {
            name: string;
            price: number;
        }[];
        title: string;
    }[] | undefined;
    removeImage?: boolean | undefined;
}, {
    name: string;
    category: string;
    description?: string | undefined;
    price?: unknown;
    isAvailable?: unknown;
    optionGroups?: unknown;
    removeImage?: unknown;
}>;
export declare const updateMenuItemSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    price: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>;
    category: z.ZodOptional<z.ZodString>;
    isAvailable: z.ZodOptional<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>, boolean, unknown>>;
    removeImage: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodBoolean>, boolean | undefined, unknown>>;
    optionGroups: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        required: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        options: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            price: z.ZodEffects<z.ZodNumber, number, unknown>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            price: number;
        }, {
            name: string;
            price?: unknown;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        required: boolean;
        options: {
            name: string;
            price: number;
        }[];
        title: string;
    }, {
        options: {
            name: string;
            price?: unknown;
        }[];
        required?: boolean | undefined;
        title?: string | undefined;
    }>, "many">>, {
        required: boolean;
        options: {
            name: string;
            price: number;
        }[];
        title: string;
    }[] | undefined, unknown>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    price?: number | undefined;
    category?: string | undefined;
    isAvailable?: boolean | undefined;
    optionGroups?: {
        required: boolean;
        options: {
            name: string;
            price: number;
        }[];
        title: string;
    }[] | undefined;
    removeImage?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    price?: unknown;
    category?: string | undefined;
    isAvailable?: unknown;
    optionGroups?: unknown;
    removeImage?: unknown;
}>;
//# sourceMappingURL=menu.validation.d.ts.map