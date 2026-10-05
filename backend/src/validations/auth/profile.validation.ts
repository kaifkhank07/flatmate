import { z } from 'zod';

const preprocessJsonOrArray = (val: unknown) => {
  if (typeof val === 'string') {
    if (!val.trim() || val === 'null' || val === 'undefined') return undefined;
    try {
      return JSON.parse(val);
    } catch {
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return val;
};

const preprocessImage = (val: unknown) => {
  if (typeof val === 'string') {
    if (!val.trim() || val === 'null' || val === 'undefined') return null;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

const preprocessDate = (val: unknown) => {
  if (val === '' || val === 'null' || val === 'undefined') return null;
  return val;
};

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    dateOfBirth: z.preprocess(preprocessDate, z.string().datetime().or(z.date()).nullable().optional()),
    gender: z.enum(['male', 'female', 'other', 'any']).optional(),
    occupation: z.string().optional(),
    languagesKnown: z.preprocess(preprocessJsonOrArray, z.array(z.string()).optional()),
    aboutMe: z.string().max(1000).optional(),
    image: z.preprocess(
      preprocessImage,
      z
        .object({
          url: z.string().url('Invalid image URL').optional(),
          key: z.string().optional(),
        })
        .nullable()
        .optional()
    ),
    avatar: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid avatar ID')
      .nullable()
      .optional(),
    preferences: z.preprocess(
      preprocessJsonOrArray,
      z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid preference ID')).optional()
    ),
  }),
});

export const updateUserProfileByAdminSchema = z.object({
  body: z.object({
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    dateOfBirth: z.preprocess(preprocessDate, z.string().datetime().or(z.date()).nullable().optional()),
    gender: z.enum(['male', 'female', 'other', 'any']).optional(),
    occupation: z.string().optional(),
    languagesKnown: z.preprocess(preprocessJsonOrArray, z.array(z.string()).optional()),
    aboutMe: z.string().max(1000).optional(),
    image: z.preprocess(
      preprocessImage,
      z
        .object({
          url: z.string().url('Invalid image URL').optional(),
          key: z.string().optional(),
        })
        .nullable()
        .optional()
    ),
    avatar: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid avatar ID')
      .nullable()
      .optional(),
    preferences: z.preprocess(
      preprocessJsonOrArray,
      z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid preference ID')).optional()
    ),
  }),
});

export const updatePreferenceSchema = z.object({
  body: z.object({
    budget: z
      .object({
        min: z.number().min(0),
        max: z.number().min(0),
      })
      .optional(),
    preferredLocations: z
      .array(
        z.object({
          cityId: z.string().optional(),
          localityId: z.string().optional(),
          cityName: z.string().optional(),
          localityName: z.string().optional(),
        })
      )
      .optional(),
    lifestyle: z
      .object({
        cleanliness: z.string().optional(),
        socialLevel: z.string().optional(),
        sleepSchedule: z.string().optional(),
        guests: z.string().optional(),
      })
      .optional(),
    foodPreference: z.string().optional(),
    smokingPreference: z.string().optional(),
    drinkingPreference: z.string().optional(),
    genderPreference: z.enum(['male', 'female', 'other', 'any']).optional(),
    petsPreference: z.string().optional(),
    selectedOptions: z
      .array(
        z.object({
          category: z.string(),
          key: z.string(),
        })
      )
      .optional(),
  }),
});
