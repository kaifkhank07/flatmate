import { z } from 'zod';

const objectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID');

export const faqPageEnum = z.enum([
    'home',
    'property',
    'flatmate',
    'rental',
    'contact',
]);

export const createFAQSchema = z.object({
    body: z.object({
        question: z
            .string()
            .trim()
            .min(1, 'Question is required')
            .max(500, 'Question cannot exceed 500 characters'),

        answer: z
            .string()
            .trim()
            .min(1, 'Answer is required'),

        page: faqPageEnum,

        isActive: z.boolean().optional(),
    }),
});

export const updateFAQSchema = z.object({
    body: z.object({
        question: z
            .string()
            .trim()
            .min(1, 'Question is required')
            .max(500, 'Question cannot exceed 500 characters')
            .optional(),

        answer: z
            .string()
            .trim()
            .min(1, 'Answer is required')
            .optional(),

        page: faqPageEnum.optional(),

        isActive: z.boolean().optional(),
    }),
});

export const faqIdParamSchema = z.object({
    params: z.object({
        faqId: objectId,
    }),
});

export const faqPageParamSchema = z.object({
    params: z.object({
        page: faqPageEnum,
    }),
});

export const getFAQsSchema = z.object({
    query: z.object({
        page: z.union([z.coerce.number().int().min(1), faqPageEnum, z.string()]).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        search: z.string().trim().optional(),
        faqPage: faqPageEnum.optional(),
        isActive: z
            .enum(['true', 'false'])
            .optional(),
    }),
});