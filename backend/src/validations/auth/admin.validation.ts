import { z } from 'zod';

export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const createAdminSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'super_admin']),
  }),
});

export const updateAdminSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).optional(),
    role: z.enum(['admin', 'super_admin']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

