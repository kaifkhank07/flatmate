import { z } from 'zod';

const objectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID');

const imageSchema = z
    .object({
        url: z.string().trim().nullable().optional(),
        key: z.string().trim().nullable().optional(),
    })
    .nullable()
    .optional();

const seoSchema = z
    .object({
        metaTitle: z.string().trim().nullable().optional(),
        metaDescription: z.string().trim().nullable().optional(),
        keywords: z
            .array(z.string().trim())
            .nullable()
            .optional(),
    })
    .nullable()
    .optional();

export const createRentalGuideSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(1, 'Title is required')
            .max(200, 'Title cannot exceed 200 characters'),

        description: z
            .string()
            .trim()
            .max(500, 'Description cannot exceed 500 characters')
            .nullable()
            .optional(),

        content: z
            .string()
            .trim()
            .min(1, 'Content is required'),

        image: imageSchema,

        isActive: z.boolean().optional(),

        seo: seoSchema,
    }),
});

export const updateRentalGuideSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(1, 'Title is required')
            .max(200, 'Title cannot exceed 200 characters')
            .optional(),

        description: z
            .string()
            .trim()
            .max(500, 'Description cannot exceed 500 characters')
            .nullable()
            .optional(),

        content: z
            .string()
            .trim()
            .min(1, 'Content is required')
            .optional(),

        image: imageSchema,

        isActive: z.boolean().optional(),

        seo: seoSchema,
    }),
});

export const rentalGuideIdParamSchema = z.object({
    params: z.object({
        rentalGuideId: objectId,
    }),
});

export const getRentalGuidesSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),

        limit: z
            .coerce
            .number()
            .int()
            .min(1)
            .max(100)
            .default(20),

        search: z.string().trim().optional(),

        isActive: z
            .enum(['true', 'false'])
            .optional(),
    }),
});