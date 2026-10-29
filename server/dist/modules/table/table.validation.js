import { z } from 'zod';
export const createTableSchema = z.object({
    number: z.number().int().min(1, 'Table number must be at least 1'),
    capacity: z.number().int().min(1).max(20),
    location: z.string().optional().default('Main Hall'),
    status: z.enum(['available', 'occupied', 'reserved']).optional().default('available'),
});
export const updateTableSchema = z.object({
    number: z.number().int().min(1).optional(),
    capacity: z.number().int().min(1).max(20).optional(),
    location: z.string().optional(),
    status: z.enum(['available', 'occupied', 'reserved']).optional(),
});
//# sourceMappingURL=table.validation.js.map