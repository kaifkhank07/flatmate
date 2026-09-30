import { z } from 'zod';

const imageSchema = z
  .object({
    url: z.string().trim().optional(),
    key: z.string().trim().optional(),
  })
  .or(z.string().trim())
  .optional();

export const createPropertyAmenitySchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Amenity name is required' })
      .trim()
      .min(1, 'Amenity name is required'),
    category: z
      .enum(['basic', 'security', 'parking', 'fitness', 'recreation', 'utilities', 'other'], {
        invalid_type_error:
          'Category must be one of: basic, security, parking, fitness, recreation, utilities, other',
      })
      .optional(),
    image: imageSchema,
    isActive: z.boolean().optional(),
  }),
});

export const updatePropertyAmenitySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Amenity name cannot be empty').optional(),
    category: z
      .enum(['basic', 'security', 'parking', 'fitness', 'recreation', 'utilities', 'other'], {
        invalid_type_error:
          'Category must be one of: basic, security, parking, fitness, recreation, utilities, other',
      })
      .optional(),
    image: imageSchema,
    isActive: z.boolean().optional(),
  }),
});

export const togglePropertyAmenityStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive status is required' }),
  }),
});
