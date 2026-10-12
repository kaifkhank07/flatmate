import { z } from 'zod';
import { Types } from 'mongoose';

const objectIdString = z
  .string({ required_error: 'User ID is required' })
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId',
  });

export const createChatReportSchema = z.object({
  body: z.object({
    reportedUserId: objectIdString,
    reason: z.enum([
      'spam',
      'harassment',
      'inappropriate_content',
      'fraud',
      'fake_profile',
      'scam',
      'other',
    ], {
      required_error: 'Report reason is required',
      invalid_type_error: 'Invalid report reason',
    }),
    description: z
      .string()
      .trim()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional(),
  }),
});

export const getChatReportsSchema = z.object({
  query: z.object({
    page: z.string().or(z.number()).optional(),
    limit: z.string().or(z.number()).optional(),
  }),
});
