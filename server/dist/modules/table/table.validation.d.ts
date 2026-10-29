import { z } from 'zod';
export declare const createTableSchema: z.ZodObject<{
    number: z.ZodNumber;
    capacity: z.ZodNumber;
    location: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["available", "occupied", "reserved"]>>>;
}, "strip", z.ZodTypeAny, {
    number: number;
    status: "available" | "occupied" | "reserved";
    capacity: number;
    location: string;
}, {
    number: number;
    capacity: number;
    status?: "available" | "occupied" | "reserved" | undefined;
    location?: string | undefined;
}>;
export declare const updateTableSchema: z.ZodObject<{
    number: z.ZodOptional<z.ZodNumber>;
    capacity: z.ZodOptional<z.ZodNumber>;
    location: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["available", "occupied", "reserved"]>>;
}, "strip", z.ZodTypeAny, {
    number?: number | undefined;
    status?: "available" | "occupied" | "reserved" | undefined;
    capacity?: number | undefined;
    location?: string | undefined;
}, {
    number?: number | undefined;
    status?: "available" | "occupied" | "reserved" | undefined;
    capacity?: number | undefined;
    location?: string | undefined;
}>;
export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
//# sourceMappingURL=table.validation.d.ts.map