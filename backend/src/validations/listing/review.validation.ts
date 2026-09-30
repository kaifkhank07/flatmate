import { z } from 'zod';
import { Types } from 'mongoose';

const objectIdString = z
  .string({ required_error: 'Target ID is required' })
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid Mongo ObjectId format',
  });

export const createReviewSchema = z.object({
  body: z.object({
    targetType: z.enum(['user', 'property', 'flatmaterequirement'], {
      required_error: 'targetType is required',
      invalid_type_error: 'targetType must be user, property, or flatmaterequirement',
    }),
    targetId: objectIdString,
    rating: z
      .number({ required_error: 'Rating is required' })
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5'),
    title: z
      .string()
      .trim()
      .max(150, 'Title cannot exceed 150 characters')
      .optional(),
    comment: z
      .string()
      .trim()
      .max(2000, 'Comment cannot exceed 2000 characters')
      .optional(),
  }),
});

export const updateReviewSchema = z.object({
  body: z.object({
    rating: z
      .number()
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5')
      .optional(),
    title: z
      .string()
      .trim()
      .max(150, 'Title cannot exceed 150 characters')
      .optional(),
    comment: z
      .string()
      .trim()
      .max(2000, 'Comment cannot exceed 2000 characters')
      .optional(),
  }),
});

export const updateReviewStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'published', 'hidden', 'rejected'], {
      required_error: 'Status is required',
      invalid_type_error: 'Invalid review status',
    }),
  }),
});

export const getReviewsQuerySchema = z.object({
  query: z.object({
    targetType: z.enum(['user', 'property', 'flatmaterequirement']).optional(),
    targetId: z
      .string()
      .optional()
      .refine((val) => !val || Types.ObjectId.isValid(val), {
        message: 'Invalid targetId format',
      }),
    rating: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    status: z.enum(['pending', 'published', 'hidden', 'rejected']).optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20)),
    search: z.string().trim().optional(),
  }),
});
