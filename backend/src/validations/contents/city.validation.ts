import { z } from 'zod';

const booleanCoerce = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((val) => val === true || val === 'true')
  .optional();

export const createCitySchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'City name is required' })
      .trim()
      .min(2, 'City name must be at least 2 characters'),
    slug: z
      .string()
      .trim()
      .min(1, 'Slug cannot be empty')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .optional(),
    state: z
      .string({ required_error: 'State name is required' })
      .trim()
      .min(1, 'State name is required'),
    country: z.string().trim().optional(),
    isPopular: booleanCoerce,
    isActive: booleanCoerce,
    seo: z
      .object({
        title: z.string().trim().optional(),
        description: z.string().trim().optional(),
        keywords: z.array(z.string().trim()).optional(),
      })
      .optional(),
  }),
});

export const updateCitySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'City name must be at least 2 characters').optional(),
    slug: z
      .string()
      .trim()
      .min(1, 'Slug cannot be empty')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .optional(),
    state: z.string().trim().min(1, 'State name cannot be empty').optional(),
    country: z.string().trim().optional(),
    isPopular: booleanCoerce,
    isActive: booleanCoerce,
    seo: z
      .object({
        title: z.string().trim().optional(),
        description: z.string().trim().optional(),
        keywords: z.array(z.string().trim()).optional(),
      })
      .optional(),
  }),
});

export const toggleCityStatusSchema = z.object({
  body: z.object({
    isActive: z.union([z.boolean(), z.enum(['true', 'false'])]).transform((val) => val === true || val === 'true'),
  }),
});
