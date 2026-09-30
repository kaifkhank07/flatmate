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
      budget: z
        .number({ required_error: 'Budget is required' })
        .min(0, 'Budget cannot be negative'),
      occupationPreference: z
        .enum([
          'student',
          'working_professional',
          'self_employed',
          'business_owner',
          'freelancer',
          'any',
        ])
        .optional()
        .default('any'),
      genderPreference: z
        .enum(['male', 'female', 'any'])
        .optional()
        .default('any'),
      lifestylePreferences: z.array(objectIdString).optional(),
      moveInDate: z.string().or(z.date()).refine(
        (val) => !isNaN(Date.parse(val.toString())),
        { message: 'Invalid moveInDate' }
      ),
      peopleCount: z.number().min(1, 'People count must be at least 1').optional(),
      images: z.array(objectIdString).optional(),
      videos: z.array(objectIdString).optional(),
      expiresAt: z.string().or(z.date()).optional(),
      status: z.enum(['draft', 'pending', 'approved', 'rejected', 'blocked', 'closed', 'expired']).optional(),
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
      budget: z.number().min(0, 'Budget cannot be negative').optional(),
      occupationPreference: z
        .enum([
          'student',
          'working_professional',
          'self_employed',
          'business_owner',
          'freelancer',
          'any',
        ])
        .optional(),
      genderPreference: z.enum(['male', 'female', 'any']).optional(),
      lifestylePreferences: z.array(objectIdString).optional(),
      moveInDate: z.string().or(z.date()).optional(),
      peopleCount: z.number().min(1, 'People count must be at least 1').optional(),
      images: z.array(objectIdString).optional(),
      videos: z.array(objectIdString).optional(),
      expiresAt: z.string().or(z.date()).optional(),
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
        'any',
      ])
      .optional(),
    genderPreference: z.enum(['male', 'female', 'any']).optional(),
    budget: z.string().or(z.number()).optional(),
    moveInDate: z.string().optional(),
    lifestylePreferences: z.string().or(z.array(z.string())).optional(),
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
