import { z } from 'zod';

const booleanCoerce = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((val) => val === true || val === 'true')
  .optional();

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createNotificationSchema = z.object({
  body: z.object({
    user: z
      .string({ required_error: 'User ID is required' })
      .regex(objectIdRegex, 'Invalid User ID format'),
    type: z.enum(['SMS', 'EMAIL', 'CHAT', 'PROPERTY_ALERT', 'FLATMATE_ALERT', 'CONTACT_REQUEST'], {
      required_error: 'Notification type is required',
    }),
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(1, 'Title cannot be empty'),
    message: z
      .string({ required_error: 'Message is required' })
      .trim()
      .min(1, 'Message cannot be empty'),
    data: z.record(z.any()).optional(),
  }),
});

export const getNotificationsQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().min(1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .pipe(z.number().min(1).max(100)),
    type: z.enum(['SMS', 'EMAIL', 'CHAT', 'PROPERTY_ALERT', 'FLATMATE_ALERT', 'CONTACT_REQUEST']).optional(),
    isRead: booleanCoerce,
  }),
});

export const markAsReadSchema = z.object({
  params: z.object({
    notificationId: z
      .string({ required_error: 'Notification ID is required' })
      .regex(objectIdRegex, 'Invalid Notification ID format'),
  }),
});

export const updateNotificationPreferencesSchema = z.object({
  body: z.object({
    sms: z.boolean().optional(),
    email: z.boolean().optional(),
    chat: z.boolean().optional(),
    propertyAlert: z.boolean().optional(),
    flatmateAlert: z.boolean().optional(),
    contactRequest: z.boolean().optional(),
  }),
});
