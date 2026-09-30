import { z } from 'zod';
import { Types } from 'mongoose';

const objectIdString = z
  .string({ required_error: 'ID is required' })
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId',
  });

export const blockUserSchema = z.object({
  body: z.object({
    blockedUserId: objectIdString,
    reason: z.string().trim().max(500, 'Reason cannot exceed 500 characters').optional(),
  }),
});

export const unblockUserSchema = z.object({
  params: z.object({
    userId: objectIdString,
  }),
});

export const getBlockedUsersSchema = z.object({
  query: z.object({
    page: z.string().or(z.number()).optional(),
    limit: z.string().or(z.number()).optional(),
  }),
});
