import { z } from 'zod';

const preprocessImage = (val: unknown) => {
  if (typeof val === 'string') {
    if (!val.trim() || val === 'null' || val === 'undefined') return undefined;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

export const createAvatarSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Avatar name is required' }).trim().min(1, 'Avatar name cannot be empty'),
    image: z.preprocess(
      preprocessImage,
      z
        .object({
          url: z.string({ required_error: 'Avatar image URL is required' }).url('Invalid image URL'),
          key: z.string({ required_error: 'Avatar image key is required' }).min(1),
        })
        .optional()
    ),
    isActive: z.union([z.boolean(), z.string()]).optional(),
  }),
});

export const updateAvatarSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid avatar ID'),
  }),
  body: z.object({
    name: z.string().trim().min(1, 'Avatar name cannot be empty').optional(),
    image: z.preprocess(
      preprocessImage,
      z
        .object({
          url: z.string().url('Invalid image URL').optional(),
          key: z.string().optional(),
        })
        .optional()
    ),
    isActive: z.union([z.boolean(), z.string()]).optional(),
  }),
});

export const toggleAvatarStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid avatar ID'),
  }),
  body: z.object({
    isActive: z.union([z.boolean(), z.string()]),
  }),
});
