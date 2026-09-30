import { z } from 'zod';
import { Types } from 'mongoose';

const objectIdString = z
  .string({ required_error: 'ID is required' })
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId',
  });

const attachmentSchema = z.object({
  url: z.string({ required_error: 'Attachment URL is required' }).trim().url('Invalid attachment URL'),
  key: z.string().trim().optional(),
  name: z.string().trim().optional(),
  size: z.number().min(0).optional(),
  mimeType: z.string().trim().optional(),
});

const propertySchema = z.object({
  propertyId: objectIdString,
  title: z.string({ required_error: 'Property title is required' }).trim().min(1, 'Property title cannot be empty'),
  slug: z.string({ required_error: 'Property slug is required' }).trim().min(1, 'Property slug cannot be empty'),
  image: z.string().trim().optional(),
  rent: z.number().min(0).optional(),
});

const flatmateSchema = z.object({
  flatmatePostId: objectIdString,
  title: z.string({ required_error: 'Flatmate post title is required' }).trim().min(1, 'Flatmate post title cannot be empty'),
  slug: z.string({ required_error: 'Flatmate post slug is required' }).trim().min(1, 'Flatmate post slug cannot be empty'),
  image: z.string().trim().optional(),
  budget: z
    .object({
      min: z.number().min(0, 'Minimum budget cannot be negative'),
      max: z.number().min(0, 'Maximum budget cannot be negative'),
    })
    .optional(),
});

export const sendMessageSchema = z.object({
  params: z.object({
    conversationId: objectIdString,
  }),
  body: z
    .object({
      type: z.enum(['text', 'image', 'property', 'flatmate-post'], {
        required_error: 'Message type is required',
      }),
      text: z.string().trim().max(5000, 'Text message cannot exceed 5000 characters').optional(),
      attachment: attachmentSchema.optional(),
      property: propertySchema.optional(),
      flatmate: flatmateSchema.optional(),
    })
    .superRefine((data, ctx) => {
      if (data.type === 'text') {
        if (!data.text || data.text.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Text content is required for text messages',
            path: ['text'],
          });
        }
      } else if (data.type === 'image') {
        if (!data.attachment || !data.attachment.url) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Attachment payload is required for image messages',
            path: ['attachment'],
          });
        }
      } else if (data.type === 'property') {
        if (!data.property || !data.property.propertyId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Property payload is required for property messages',
            path: ['property'],
          });
        }
      } else if (data.type === 'flatmate-post') {
        if (!data.flatmate || !data.flatmate.flatmatePostId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Flatmate post payload is required for flatmate-post messages',
            path: ['flatmate'],
          });
        }
      }
    }),
});

export const getMessagesSchema = z.object({
  params: z.object({
    conversationId: objectIdString,
  }),
  query: z.object({
    page: z.string().or(z.number()).optional(),
    limit: z.string().or(z.number()).optional(),
    before: z.string().optional(),
  }),
});

export const markDeliveredSchema = z.object({
  params: z.object({
    messageId: objectIdString,
  }),
});

export const markReadSchema = z.object({
  params: z.object({
    conversationId: objectIdString,
  }),
});

export const deleteMessageSchema = z.object({
  params: z.object({
    messageId: objectIdString,
  }),
});
