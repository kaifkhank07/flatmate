import { z } from 'zod';
import { Types } from 'mongoose';

export const getListingsQuerySchema = z.object({
  query: z
    .object({
      page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .pipe(z.number().int().min(1, 'Page must be greater than or equal to 1')),

      limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10))
        .pipe(
          z
            .number()
            .int()
            .min(1, 'Limit must be greater than or equal to 1')
            .max(100, 'Limit cannot exceed 100')
        ),

      q: z.string().optional(),
      search: z.string().optional(),

      sourceType: z
        .enum(['all', 'property', 'flatmate_requirement'], {
          invalid_type_error:
            'sourceType must be one of: all, property, flatmate_requirement',
        })
        .optional()
        .default('all'),

      location: z
        .string()
        .optional()
        .refine((val) => !val || val === 'all' || Types.ObjectId.isValid(val), {
          message: 'Invalid location ObjectId format',
        }),

      locationPlaceId: z.string().optional(),

      latitude: z
        .string()
        .optional()
        .transform((val) =>
          val !== undefined && val !== '' ? parseFloat(val) : undefined
        )
        .pipe(
          z
            .number()
            .min(-90, 'Latitude must be >= -90')
            .max(90, 'Latitude must be <= 90')
            .optional()
        ),

      longitude: z
        .string()
        .optional()
        .transform((val) =>
          val !== undefined && val !== '' ? parseFloat(val) : undefined
        )
        .pipe(
          z
            .number()
            .min(-180, 'Longitude must be >= -180')
            .max(180, 'Longitude must be <= 180')
            .optional()
        ),

      radius: z
        .string()
        .optional()
        .transform((val) =>
          val !== undefined && val !== '' ? parseFloat(val) : 25
        )
        .pipe(
          z
            .number()
            .min(1, 'Radius must be at least 1 km')
            .max(200, 'Radius cannot exceed 200 km')
            .optional()
        ),

      budget: z
        .string()
        .optional()
        .transform((val) =>
          val !== undefined && val !== '' ? parseFloat(val) : undefined
        )
        .pipe(z.number().min(0, 'budget cannot be negative').optional()),

      genderPreference: z
        .enum(['male', 'female', 'other', 'any', 'all'])
        .optional(),

      occupationPreference: z
        .enum([
          'student',
          'working_professional',
          'self_employed',
          'business_owner',
          'freelancer',
          'any',
          'all',
        ])
        .optional(),

      moveInDate: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: 'Invalid moveInDate date format',
        }),

      availableFrom: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: 'Invalid availableFrom date format',
        }),

      listingType: z
        .enum([
          'flat',
          'room',
          'pg',
          'shared_apartment',
          'entire_property',
          'all',
        ])
        .optional(),

      furnishing: z
        .enum(['fully_furnished', 'semi_furnished', 'unfurnished', 'all'])
        .optional(),

      postType: z.enum(['property', 'partner', 'all']).optional(),

      propertyType: z
        .enum(['room', 'flat', 'pg', 'shared_apartment', 'all'])
        .optional(),

      partnerType: z.enum(['roommate', 'flatmate', 'all']).optional(),

      peopleCount: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : undefined))
        .pipe(z.number().int().min(1).optional()),

      sortBy: z.string().optional().default('createdAt'),

      order: z.enum(['asc', 'desc', '1', '-1']).optional().default('desc'),
    })
    .refine(
      (data) => {
        const hasLat = data.latitude !== undefined;
        const hasLng = data.longitude !== undefined;
        return (hasLat && hasLng) || (!hasLat && !hasLng);
      },
      {
        message: 'Both latitude and longitude must be provided for geographic search',
        path: ['latitude'],
      }
    ),
});
