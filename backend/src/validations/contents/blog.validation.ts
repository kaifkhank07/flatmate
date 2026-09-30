import { z } from 'zod';

/**
 * Safely parse JSON strings sent via multipart/form-data.
 */
const parseJsonIfNeeded = (val: unknown) => {
    if (typeof val === 'string' && val.trim().length > 0) {
        try {
            return JSON.parse(val);
        } catch {
            return val;
        }
    }
    return val;
};

/**
 * Preprocess boolean inputs to handle boolean values,
 * numbers (0, 1), and string representation ("true", "false").
 */
const booleanSchema = z
    .preprocess((val) => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') {
            const lower = val.trim().toLowerCase();
            if (lower === 'true' || lower === '1') return true;
            if (lower === 'false' || lower === '0') return false;
        }
        if (typeof val === 'number') {
            if (val === 1) return true;
            if (val === 0) return false;
        }
        return val;
    }, z.boolean())
    .optional();

const seoSchema = z
    .preprocess(
        parseJsonIfNeeded,
        z
            .object({
                title: z
                    .string()
                    .trim()
                    .max(200, 'SEO title cannot exceed 200 characters')
                    .optional(),

                description: z
                    .string()
                    .trim()
                    .max(500, 'SEO description cannot exceed 500 characters')
                    .optional(),

                keywords: z
                    .array(
                        z
                            .string()
                            .trim()
                            .min(1, 'SEO keyword cannot be empty')
                    )
                    .optional(),
            })
            .optional()
    )
    .optional();

const faqSchema = z.object({
    question: z
        .string()
        .trim()
        .min(1, 'Question is required')
        .max(500, 'Question cannot exceed 500 characters'),
    answer: z
        .string()
        .trim()
        .min(1, 'Answer is required'),
});

const faqsSchema = z
    .preprocess(
        parseJsonIfNeeded,
        z.array(faqSchema).optional()
    )
    .optional();

const imageSchema = z
    .preprocess(
        parseJsonIfNeeded,
        z
            .object({
                url: z
                    .string()
                    .url('Invalid image URL')
                    .optional(),

                key: z
                    .string()
                    .trim()
                    .optional(),
            })
            .nullable()
            .optional()
    )
    .optional();

export const createBlogSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(1, 'Title is required')
            .max(200, 'Title cannot exceed 200 characters'),

        content: z
            .string()
            .trim()
            .min(1, 'Content is required'),

        categoryId: z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),

        image: imageSchema,

        isActive: booleanSchema,

        seo: seoSchema,

        faqs: faqsSchema,
    }),
});

export const updateBlogSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(1, 'Title cannot be empty')
            .max(200, 'Title cannot exceed 200 characters')
            .optional(),

        content: z
            .string()
            .trim()
            .min(1, 'Content cannot be empty')
            .optional(),

        categoryId: z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')
            .optional(),

        image: imageSchema,

        isActive: booleanSchema,

        seo: seoSchema,

        faqs: faqsSchema,
    }),
});