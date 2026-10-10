import { z } from 'zod';

const imageSchema = z
  .object({
    url: z.string().trim().optional(),
    key: z.string().trim().optional(),
  })
  .or(z.string().trim())
  .optional();

const booleanField = z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional();

export const createUserPreferenceSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Preference name is required' })
      .trim()
      .min(1, 'Preference name is required'),
    image: imageSchema,
    isActive: booleanField,
  }),
});

export const updateUserPreferenceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Preference name cannot be empty').optional(),
    image: imageSchema,
    isActive: booleanField,
  }),
});

