import { z } from 'zod';

export const createBlogCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Category name is required')
      .max(100, 'Category name cannot exceed 100 characters'),

    isActive: z
      .boolean()
      .optional(),
  }),
});

export const updateBlogCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Category name cannot be empty')
      .max(100, 'Category name cannot exceed 100 characters')
      .optional(),

    isActive: z
      .boolean()
      .optional(),
  }),
});

export const toggleBlogCategoryStatusSchema = z.object({
  body: z.object({
    isActive: z
      .boolean({
        message: 'isActive must be a boolean',
      }),
  }),
});