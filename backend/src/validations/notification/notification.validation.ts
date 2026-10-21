import { z } from 'zod';
import {
  RECIPIENT_TYPES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_CHANNELS,
  CHANNEL_DELIVERY_STATUSES,
} from '../../models/notification/notification.types';

const booleanCoerce = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((val) => val === true || val === 'true')
  .optional();

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const channelDeliveryInputSchema = z.object({
  channel: z.enum(NOTIFICATION_CHANNELS),
  status: z.enum(CHANNEL_DELIVERY_STATUSES).optional().default('PENDING'),
  attemptCount: z.number().int().min(0).optional().default(0),
  providerMessageId: z.string().trim().optional(),
  lastAttemptAt: z.coerce.date().optional(),
  sentAt: z.coerce.date().optional(),
  deliveredAt: z.coerce.date().optional(),
  readAt: z.coerce.date().optional(),
  errorMessage: z.string().trim().optional(),
  providerMetadata: z.record(z.any()).optional(),
});

const channelPreferencesInputSchema = z.object({
  inApp: z.boolean().optional(),
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  whatsapp: z.boolean().optional(),
});

const propertyMatchPreferencesInputSchema = z.object({
  enabled: z.boolean().optional(),
  cities: z.array(z.string().trim()).optional(),
  localities: z.array(z.string().trim()).optional(),
  budget: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    })
    .optional(),
  propertyTypes: z
    .array(z.enum(['flat', 'room', 'pg', 'shared_apartment', 'entire_property']))
    .optional(),
  furnishing: z
    .array(z.enum(['fully_furnished', 'semi_furnished', 'unfurnished']))
    .optional(),
  availableFrom: z.coerce.date().optional(),
  immediateOnly: z.boolean().optional(),
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
  amenities: z.array(z.string().regex(objectIdRegex, 'Invalid Amenity ID')).optional(),
  postType: z.enum(['property', 'partner', 'both']).optional(),
});

/**
 * Validation schema for creating a notification
 */
export const createNotificationSchema = z.object({
  body: z.object({
    recipientType: z.enum(RECIPIENT_TYPES, {
      required_error: 'Recipient type (USER or ADMIN) is required',
    }),
    recipientId: z
      .string({ required_error: 'Recipient ID is required' })
      .regex(objectIdRegex, 'Invalid Recipient ID format'),
    eventType: z.enum(NOTIFICATION_EVENT_TYPES, {
      required_error: 'Notification event type is required',
    }),
    category: z.enum(NOTIFICATION_CATEGORIES).optional(),
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(1, 'Title cannot be empty')
      .max(250, 'Title cannot exceed 250 characters'),
    message: z
      .string({ required_error: 'Message is required' })
      .trim()
      .min(1, 'Message cannot be empty')
      .max(2000, 'Message cannot exceed 2000 characters'),
    data: z.record(z.any()).optional().default({}),
    actionUrl: z.string().trim().optional(),
    priority: z.enum(NOTIFICATION_PRIORITIES).optional().default('NORMAL'),
    channels: z.array(channelDeliveryInputSchema).optional(),
    deduplicationKey: z.string().trim().optional(),
    expiresAt: z.coerce.date().optional(),
  }),
});

/**
 * Validation schema for querying notifications
 */
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
    category: z.enum(NOTIFICATION_CATEGORIES).optional(),
    eventType: z.enum(NOTIFICATION_EVENT_TYPES).optional(),
    priority: z.enum(NOTIFICATION_PRIORITIES).optional(),
    isRead: booleanCoerce,
  }),
});

/**
 * Validation schema for marking a notification as read
 */
export const markAsReadSchema = z.object({
  params: z.object({
    notificationId: z
      .string({ required_error: 'Notification ID is required' })
      .regex(objectIdRegex, 'Invalid Notification ID format'),
  }),
});

/**
 * Validation schema for updating user / admin notification preferences
 */
export const updateNotificationPreferencesSchema = z.object({
  body: z.object({
    channels: channelPreferencesInputSchema.optional(),
    categories: z
      .object({
        accountAndVerification: channelPreferencesInputSchema.optional(),
        listingUpdates: channelPreferencesInputSchema.optional(),
        propertyMatch: channelPreferencesInputSchema.optional(),
        chat: channelPreferencesInputSchema.optional(),
        inquiriesAndRequests: channelPreferencesInputSchema.optional(),
        reportsAndReviews: channelPreferencesInputSchema.optional(),
        administrative: channelPreferencesInputSchema.optional(),
        system: channelPreferencesInputSchema.optional(),
      })
      .optional(),
    propertyMatch: propertyMatchPreferencesInputSchema.optional(),
  }),
});

/**
 * Dedicated schema for updating smart property match criteria
 */
export const updatePropertyMatchPreferencesSchema = z.object({
  body: propertyMatchPreferencesInputSchema,
});
