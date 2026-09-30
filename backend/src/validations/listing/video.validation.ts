import { z } from 'zod';

export const createVideoSchema = z.object({
  body: z.object({
    url: z
      .string({ required_error: 'Video URL is required' })
      .trim()
      .min(1, 'Video URL is required'),
    key: z
      .string({ required_error: 'Video key is required' })
      .trim()
      .min(1, 'Video key is required'),
  }),
});

export const updateVideoSchema = z.object({
  body: z.object({
    url: z.string().trim().min(1, 'Video URL cannot be empty').optional(),
    key: z.string().trim().min(1, 'Video key cannot be empty').optional(),
  }),
});

