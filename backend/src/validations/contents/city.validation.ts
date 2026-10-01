import { z } from 'zod';

const booleanCoerce = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((val) => val === true || val === 'true')
  .optional();

const seoSchema = z
  .preprocess((val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;
      try {
        return JSON.parse(trimmed);
      } catch {
        return val;
      }
    }
    return val;
  }, z.object({
    title: z.string().trim().optional(),
    description: z.string().trim().optional(),
    keywords: z.array(z.string().trim()).optional(),
  }).optional().nullable())
  .optional();

export const createCitySchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'City name is required' })
      .trim()
      .min(2, 'City name must be at least 2 characters'),

    state: z
      .string({ required_error: 'State name is required' })
      .trim()
      .min(1, 'State name is required'),

    country: z
      .string()
      .trim()
      .optional(),

    isPopular: booleanCoerce,

    isActive: booleanCoerce,

    seo: seoSchema,
  }),
});

export const updateCitySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'City name must be at least 2 characters')
      .optional(),

    state: z
      .string()
      .trim()
      .min(1, 'State name cannot be empty')
      .optional(),

    country: z
      .string()
      .trim()
      .optional(),

    isPopular: booleanCoerce,

    isActive: booleanCoerce,

    seo: seoSchema,

    removeImage: booleanCoerce,
  }),
});

export const toggleCityStatusSchema = z.object({
  body: z.object({
    isActive: z
      .union([z.boolean(), z.enum(['true', 'false'])])
      .transform((val) => val === true || val === 'true'),
  }),
});

