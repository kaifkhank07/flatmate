import { z } from 'zod';
import { Types } from 'mongoose';

const objectIdString = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid Mongo ObjectId string',
  });

export const createReportSchema = z.object({
  body: z.object({
    targetType: z.enum(['property', 'flatmaterequirement'], {
      required_error: 'targetType is required',
      invalid_type_error: 'targetType must be property or flatmaterequirement',
    }),
    targetId: objectIdString,
    reason: z.enum(['spam', 'fraud', 'inappropriate', 'misleading', 'other'], {
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

export const updateReportStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'reviewed', 'resolved', 'dismissed'], {
      required_error: 'Status is required',
      invalid_type_error: 'Invalid report status',
    }),
    resolutionNotes: z.string().trim().optional(),
  }),
});
