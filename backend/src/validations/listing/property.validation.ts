import { z } from 'zod';
import { Types } from 'mongoose';

const objectIdString = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid Mongo ObjectId string',
  });

export const propertyTypeSchema = z.enum(
  [
    'flats_apartments',
    'houses_villas',
    'office_spaces',
    'shops_commercial',
  ],
  {
    required_error: 'Property type is required',
    invalid_type_error:
      'Property type must be one of: flats_apartments, houses_villas, office_spaces, shops_commercial',
  }
);

export const propertyDetailsSchema = z
  .object({
    floor: z
      .number({ invalid_type_error: 'Floor must be a number' })
      .int('Floor must be an integer')
      .min(0, 'Floor cannot be negative')
      .optional(),
    totalFloors: z
      .number({ invalid_type_error: 'Total floors must be a number' })
      .int('Total floors must be an integer')
      .min(0, 'Total floors cannot be negative')
      .optional(),
    facing: z
      .enum([
        'east',
        'west',
        'north',
        'south',
        'north_east',
        'north_west',
        'south_east',
        'south_west',
      ])
      .optional(),
    bedrooms: z
      .enum([
        '1_rk',
        '1_bhk',
        '2_bhk',
        '3_bhk',
        '4_bhk',
        '5_bhk',
        '5_plus_bhk',
      ])
      .optional(),
  })
  .refine(
    (val) => {
      if (val.floor !== undefined && val.totalFloors !== undefined) {
        return val.floor <= val.totalFloors;
      }
      return true;
    },
    {
      message: 'Floor cannot exceed total floors',
      path: ['floor'],
    }
  )
  .optional();

export const brokerageDetailsSchema = z
  .object({
    applicable: z.boolean({
      required_error: 'Brokerage applicable is required',
    }),
    type: z.enum(['fixed', 'percentage']).optional(),
    value: z.number().optional(),
  })
  .refine(
    (val) => {
      if (val.applicable) {
        if (!val.type) return false;
        if (val.value === undefined || val.value <= 0) return false;
        if (val.type === 'percentage' && val.value > 100) return false;
      }
      return true;
    },
    {
      message:
        'When brokerage is applicable, type and value (> 0, and <= 100 for percentage) are required',
      path: ['value'],
    }
  )
  .optional();

export const postedBySchema = z
  .enum(['owner', 'flatmate', 'agent', 'builder'])
  .optional();

export const createPropertySchema = z.object({
  body: z.object({
    userId: objectIdString.optional(),
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(1, 'Title is required')
      .max(200, 'Title cannot exceed 200 characters'),
    slug: z.string().trim().optional(),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(1, 'Description is required'),
    propertyType: propertyTypeSchema,
    propertyDetails: propertyDetailsSchema,
    brokerageDetails: brokerageDetailsSchema,
    postedBy: postedBySchema,
    location: z.union([
      z.string().min(1, 'Location is required'),
      z.object({
        placeId: z.string().optional(),
        location: z.string().optional(),
        _id: z.string().optional(),
      }),
    ]),
    area: z
      .number({ required_error: 'Area is required' })
      .min(0, 'Area cannot be negative'),
    rent: z
      .number({ required_error: 'Rent amount is required' })
      .min(0, 'Rent amount cannot be negative'),
    securityDeposit: z.number().min(0, 'Security deposit cannot be negative').optional(),
    maintenanceCharges: z
      .object({
        amount: z.number().min(0, 'Maintenance amount cannot be negative').optional(),
        frequency: z
          .enum(['monthly', 'yearly', 'included', 'one_time'], {
            invalid_type_error:
              'Maintenance frequency must be one of: monthly, yearly, included, one_time',
          })
          .optional(),
      })
      .optional(),
    furnishing: z
      .enum(['fully_furnished', 'semi_furnished', 'unfurnished'], {
        invalid_type_error:
          'Furnishing must be one of: fully_furnished, semi_furnished, unfurnished',
      })
      .optional(),
    parking: z.boolean().optional(),
    availableFrom: z.string().or(z.date()),
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
    amenities: z.array(z.string().or(z.object({ _id: z.string() }))).optional(),
    houseRules: z.array(z.string().trim()).optional(),
    images: z.array(z.string().or(z.object({ _id: z.string().optional(), url: z.string().optional(), key: z.string().optional() }))).optional(),
    videos: z.array(z.string().or(z.object({ _id: z.string().optional(), url: z.string().optional(), key: z.string().optional() }))).optional(),
    status: z
      .enum(['draft', 'pending', 'approved', 'rejected', 'blocked', 'closed', 'expired'])
      .optional(),
    rejectionReason: z.string().trim().nullable().optional(),
  }),
});

export const updatePropertySchema = z.object({
  body: createPropertySchema.shape.body.partial(),
});

export const updatePropertyStatusSchema = z.object({
  body: z
    .object({
      status: z.enum([
        'draft',
        'pending',
        'approved',
        'rejected',
        'blocked',
        'closed',
        'expired',
      ], {
        required_error: 'Status is required',
      }),
      rejectionReason: z.string().trim().optional(),
    })
    .refine(
      (data) => {
        if (data.status === 'rejected') {
          return Boolean(data.rejectionReason && data.rejectionReason.trim().length > 0);
        }
        return true;
      },
      {
        message: 'Rejection reason is required when status is rejected',
        path: ['rejectionReason'],
      }
    ),
});

export const rejectPropertySchema = z.object({
  body: z.object({
    rejectionReason: z
      .string({ required_error: 'Rejection reason is required' })
      .trim()
      .min(1, 'Rejection reason cannot be empty'),
  }),
});

export const attachImageSchema = z.object({
  body: z.object({
    imageId: objectIdString,
  }),
});

export const attachVideoSchema = z.object({
  body: z.object({
    videoId: objectIdString,
  }),
});

export const bulkUpdatePropertyStatusSchema = z.object({
  body: z
    .object({
      ids: z
        .array(objectIdString, { required_error: 'Listing IDs array is required' })
        .min(1, 'Listing IDs array cannot be empty')
        .refine((items) => new Set(items).size === items.length, {
          message: 'Listing IDs must not contain duplicate values',
        }),
      status: z.enum(
        [
          'draft',
          'pending',
          'approved',
          'rejected',
          'blocked',
          'closed',
          'expired',
        ],
        {
          required_error: 'Status is required',
        }
      ),
      rejectionReason: z.string().trim().optional(),
    })
    .refine(
      (data) => {
        if (data.status === 'rejected') {
          return Boolean(data.rejectionReason && data.rejectionReason.trim().length > 0);
        }
        return true;
      },
      {
        message: 'Rejection reason is required when status is rejected',
        path: ['rejectionReason'],
      }
    ),
});
