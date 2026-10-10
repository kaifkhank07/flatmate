import { z } from 'zod';
import { Types } from 'mongoose';

const objectIdString = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId string',
  });

export const createFlatmateRequirementSchema = z.object({
  body: z
    .object({
      userId: objectIdString.optional(),
      title: z
        .string({ required_error: 'Title is required' })
        .trim()
        .min(1, 'Title cannot be empty')
        .max(200, 'Title cannot exceed 200 characters'),
      slug: z.string().trim().optional(),
      description: z.string().trim().optional(),
      postType: z.enum(['property', 'partner'], {
        required_error: 'Post type is required',
      }),
      propertyType: z
        .enum(['room', 'flat', 'pg', 'shared_apartment'])
        .optional(),
      partnerType: z
        .enum(['roommate', 'flatmate'])
        .optional(),
      location: objectIdString,
      area: z.number().min(0, 'Area cannot be negative').optional().default(0),
      rent: z
        .number({ required_error: 'Rent is required' })
        .min(0, 'Rent cannot be negative'),
      securityDeposit: z
        .number()
        .min(0, 'Security deposit cannot be negative')
        .optional()
        .default(0),
      maintenanceCharges: z
        .object({
          amount: z.number().min(0, 'Maintenance amount cannot be negative').default(0),
          frequency: z
            .enum(['monthly', 'yearly', 'included', 'one_time'])
            .default('yearly'),
        })
        .optional()
        .default({ amount: 0, frequency: 'yearly' }),
      furnishing: z
        .enum(['fully_furnished', 'semi_furnished', 'unfurnished'])
        .optional()
        .default('semi_furnished'),
      parking: z.boolean().optional().default(false),
      availableFrom: z.string().or(z.date()).refine(
        (val) => !isNaN(Date.parse(val.toString())),
        { message: 'Invalid availableFrom date' }
      ),
      genderPreference: z
        .enum(['male', 'female', 'other', 'any'])
        .optional()
        .default('any'),
      occupationPreference: z
        .enum([
          'student',
          'working_professional',
          'self_employed',
          'business_owner',
          'freelancer',
          'other',
          'any',
        ])
        .optional()
        .default('any'),
      userPreferences: z.array(objectIdString).optional().default([]),
      amenities: z.array(objectIdString).optional().default([]),
      images: z.array(objectIdString).optional().default([]),
      videos: z.array(objectIdString).optional().default([]),
      status: z
        .enum(['draft', 'pending', 'approved', 'rejected', 'blocked', 'closed', 'expired'])
        .optional(),
    })
    .superRefine((data, ctx) => {
      // Conditional postType validations
      if (data.postType === 'property') {
        if (!data.propertyType) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'propertyType is required when postType is property',
            path: ['propertyType'],
          });
        }
        if (data.partnerType !== undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'partnerType should not be provided when postType is property',
            path: ['partnerType'],
          });
        }
      }

      if (data.postType === 'partner') {
        if (!data.partnerType) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'partnerType is required when postType is partner',
            path: ['partnerType'],
          });
        }
        if (data.propertyType !== undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'propertyType should not be provided when postType is partner',
            path: ['propertyType'],
          });
        }
      }
    }),
});

export const updateFlatmateRequirementSchema = z.object({
  body: z
    .object({
      userId: objectIdString.optional(),
      title: z
        .string()
        .trim()
        .min(1, 'Title cannot be empty')
        .max(200, 'Title cannot exceed 200 characters')
        .optional(),
      slug: z.string().trim().optional(),
      description: z.string().trim().optional(),
      postType: z.enum(['property', 'partner']).optional(),
      propertyType: z
        .enum(['room', 'flat', 'pg', 'shared_apartment'])
        .optional(),
      partnerType: z
        .enum(['roommate', 'flatmate'])
        .optional(),
      location: objectIdString.optional(),
      area: z.number().min(0, 'Area cannot be negative').optional(),
      rent: z.number().min(0, 'Rent cannot be negative').optional(),
      securityDeposit: z.number().min(0, 'Security deposit cannot be negative').optional(),
      maintenanceCharges: z
        .object({
          amount: z.number().min(0, 'Maintenance amount cannot be negative').optional(),
          frequency: z
            .enum(['monthly', 'yearly', 'included', 'one_time'])
            .optional(),
        })
        .optional(),
      furnishing: z
        .enum(['fully_furnished', 'semi_furnished', 'unfurnished'])
        .optional(),
      parking: z.boolean().optional(),
      availableFrom: z.string().or(z.date()).optional(),
      genderPreference: z.enum(['male', 'female', 'other', 'any']).optional(),
      occupationPreference: z
        .enum([
          'student',
          'working_professional',
          'self_employed',
          'business_owner',
          'freelancer',
          'other',
          'any',
        ])
        .optional(),
      userPreferences: z.array(objectIdString).optional(),
      amenities: z.array(objectIdString).optional(),
      images: z.array(objectIdString).optional(),
      videos: z.array(objectIdString).optional(),
      status: z
        .enum([
          'draft',
          'pending',
          'approved',
          'rejected',
          'blocked',
          'closed',
          'expired',
        ])
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (data.postType === 'property') {
        if (!data.propertyType) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'propertyType is required when updating postType to property',
            path: ['propertyType'],
          });
        }
        if (data.partnerType !== undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'partnerType should not be provided when postType is property',
            path: ['partnerType'],
          });
        }
      }

      if (data.postType === 'partner') {
        if (!data.partnerType) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'partnerType is required when updating postType to partner',
            path: ['partnerType'],
          });
        }
        if (data.propertyType !== undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'propertyType should not be provided when postType is partner',
            path: ['propertyType'],
          });
        }
      }
    }),
});

export const getPublicFlatmateRequirementsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    postType: z.enum(['property', 'partner']).optional(),
    propertyType: z.enum(['room', 'flat', 'pg', 'shared_apartment']).optional(),
    partnerType: z.enum(['roommate', 'flatmate']).optional(),
    location: objectIdString.optional(),
    occupationPreference: z
      .enum([
        'student',
        'working_professional',
        'self_employed',
        'business_owner',
        'freelancer',
        'other',
        'any',
      ])
      .optional(),
    genderPreference: z.enum(['male', 'female', 'other', 'any']).optional(),
    furnishing: z.enum(['fully_furnished', 'semi_furnished', 'unfurnished']).optional(),
    rent: z.string().or(z.number()).optional(),
    budget: z.string().or(z.number()).optional(),
    availableFrom: z.string().optional(),
    moveInDate: z.string().optional(),
    userPreferences: z.string().or(z.array(z.string())).optional(),
    lifestylePreferences: z.string().or(z.array(z.string())).optional(),
    amenities: z.string().or(z.array(z.string())).optional(),
    page: z.string().or(z.number()).optional(),
    limit: z.string().or(z.number()).optional(),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc', '1', '-1']).optional(),
  }),
});

export const getMyFlatmateRequirementsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    status: z.enum(['draft', 'pending', 'approved', 'rejected', 'blocked', 'closed', 'expired']).optional(),
    postType: z.enum(['property', 'partner']).optional(),
    propertyType: z.enum(['room', 'flat', 'pg', 'shared_apartment']).optional(),
    partnerType: z.enum(['roommate', 'flatmate']).optional(),
    page: z.string().or(z.number()).optional(),
    limit: z.string().or(z.number()).optional(),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc', '1', '-1']).optional(),
  }),
});

export const updateFlatmateRequirementStatusSchema = z.object({
  body: z.object({
    status: z.enum(['draft', 'pending', 'approved', 'rejected', 'blocked', 'closed', 'expired'], {
      required_error: 'Status is required',
    }),
    rejectionReason: z.string().trim().optional(),
  }),
});
