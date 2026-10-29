import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'waiter', 'cashier', 'kitchen']),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'waiter', 'cashier', 'kitchen']).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});
