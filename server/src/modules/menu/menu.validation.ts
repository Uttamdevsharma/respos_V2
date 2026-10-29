import { z } from 'zod';

export const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  price: z.preprocess((val) => {
    const num = Number(val);
    return isNaN(num) ? val : num;
  }, z.number().min(0, 'Price cannot be negative')),
  category: z.string().min(1, 'Category is required'),
  isAvailable: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return val;
  }, z.boolean().optional().default(true)),
  removeImage: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return val;
  }, z.boolean().optional()),
  optionGroups: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(z.object({
    title: z.string().optional().default('Size'),
    required: z.boolean().optional().default(true),
    options: z.array(z.object({
      name: z.string().min(1),
      price: z.preprocess((v) => Number(v) || 0, z.number().min(0)),
    })),
  })).optional()),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();
