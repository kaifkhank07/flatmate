import { z } from 'zod';

export const createImageSchema = z.object({
  body: z.object({
    url: z
      .string({ required_error: 'Image URL is required' })
      .trim()
      .min(1, 'Image URL is required'),
    key: z
      .string({ required_error: 'Image key is required' })
      .trim()
      .min(1, 'Image key is required'),
  }),
});

export const updateImageSchema = z.object({
  body: z.object({
    url: z.string().trim().min(1, 'Image URL cannot be empty').optional(),
    key: z.string().trim().min(1, 'Image key cannot be empty').optional(),
  }),
});

