import { z } from 'zod';

export const createUserSchema = z.object({
  body: z
    .object({
      email: z.string().email('Invalid email address').optional(),
      mobile: z
        .string()
        .regex(/^[0-9+\s-]{8,15}$/, 'Invalid mobile number')
        .optional(),
      password: z.string().min(6, 'Password must be at least 6 characters'),
    })
    .refine((data) => data.email || data.mobile, {
      message: 'Either email or mobile number must be provided',
      path: ['email'],
    }),
});

export const loginUserSchema = z.object({
  body: z
    .object({
      email: z.string().email('Invalid email address').optional(),
      mobile: z
        .string()
        .regex(/^[0-9+\s-]{8,15}$/, 'Invalid mobile number')
        .optional(),
      password: z.string().min(1, 'Password is required'),
    })
    .refine((data) => data.email || data.mobile, {
      message: 'Either email or mobile number must be provided',
      path: ['email'],
    }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    mobile: z
      .string()
      .regex(/^[0-9+\s-]{8,15}$/, 'Invalid mobile number')
      .optional(),
  }),
});

export const updateUserByAdminSchema = z.object({
  body: z.object({
    accountStatus: z.enum(['active', 'inactive']).optional(),
    profileVerified: z.boolean().optional(),
    verificationStatus: z
      .enum(['not_submitted', 'pending', 'approved', 'rejected'])
      .optional(),
  }),
});
