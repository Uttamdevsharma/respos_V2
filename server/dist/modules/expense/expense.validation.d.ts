import { z } from 'zod';
export declare const createExpenseSchema: z.ZodObject<{
    title: z.ZodString;
    amount: z.ZodNumber;
    category: z.ZodString;
    date: z.ZodUnion<[z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodOptional<z.ZodString>]>, z.ZodOptional<z.ZodDate>]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    title: string;
    category: string;
    date?: string | Date | undefined;
    note?: string | undefined;
}, {
    amount: number;
    title: string;
    category: string;
    date?: string | Date | undefined;
    note?: string | undefined;
}>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
//# sourceMappingURL=expense.validation.d.ts.map