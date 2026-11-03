/**
 * Target recipient or owner entity type
 */
export type RecipientType = 'USER' | 'ADMIN';

/**
 * Notification urgency/priority level
 */
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Supported multi-channel delivery targets
 */
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP';

/**
 * Granular channel delivery states
 */
export type ChannelDeliveryStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'SKIPPED';

/**
 * Top-level grouping categories for notifications & user preference management
 */
export type NotificationCategory =
  | 'ACCOUNT_AND_VERIFICATION'
  | 'LISTING_UPDATES'
  | 'PROPERTY_MATCH'
  | 'CHAT'
  | 'INQUIRIES_AND_REQUESTS'
  | 'REPORTS_AND_REVIEWS'
  | 'ADMINISTRATIVE'
  | 'SYSTEM';

/**
 * Comprehensive business event catalogue
 */
export type NotificationEventType =
  // Account & verification
  | 'USER_REGISTERED'
  | 'EMAIL_VERIFICATION'
  | 'OTP_NOTIFICATION'
  | 'PROFILE_VERIFICATION_UPDATED'
  // Property & listing updates
  | 'LISTING_SUBMITTED'
  | 'LISTING_APPROVED'
  | 'LISTING_REJECTED'
  | 'LISTING_EXPIRY_REMINDER'
  | 'LISTING_EXPIRED'
  | 'LISTING_UNPUBLISHED'
  // Smart property match
  | 'PROPERTY_MATCH_FOUND'
  // Communication & leads
  | 'NEW_CHAT_MESSAGE'
  | 'PROPERTY_INQUIRY_RECEIVED'
  | 'CONTACT_REQUEST_RECEIVED'
  | 'INQUIRY_STATUS_UPDATED'
  | 'CONTACT_US_CONFIRMATION'
  // Reports & reviews
  | 'REPORT_SUBMITTED_CONFIRMATION'
  | 'REPORT_STATUS_UPDATED'
  | 'REVIEW_SUBMITTED_CONFIRMATION'
  | 'REVIEW_APPROVED'
  | 'REVIEW_REJECTED'
  // Administrative alerts & moderation
  | 'ADMIN_NEW_USER_REGISTERED'
  | 'ADMIN_LISTING_AWAITING_MODERATION'
  | 'ADMIN_INQUIRY_RECEIVED'
  | 'ADMIN_CONTACT_US_SUBMITTED'
  | 'ADMIN_REPORT_SUBMITTED'
  | 'ADMIN_USER_DELETED'
  | 'ADMIN_PROFILE_VERIFICATION_REQUESTED'
  | 'ADMIN_REVIEW_AWAITING_MODERATION'
  // System & critical alerts
  | 'ADMIN_SYSTEM_ERROR'
  | 'ADMIN_OPERATIONAL_ALERT';

/**
 * @deprecated Legacy alias for NotificationEventType
 */
export type NotificationType = NotificationEventType;

// Const tuple exports for validation & schemas
export const RECIPIENT_TYPES: [RecipientType, ...RecipientType[]] = ['USER', 'ADMIN'];

export const NOTIFICATION_PRIORITIES: [NotificationPriority, ...NotificationPriority[]] = [
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
];

export const NOTIFICATION_CHANNELS: [NotificationChannel, ...NotificationChannel[]] = [
  'IN_APP',
  'EMAIL',
  'SMS',
  'WHATSAPP',
];

export const CHANNEL_DELIVERY_STATUSES: [ChannelDeliveryStatus, ...ChannelDeliveryStatus[]] = [
  'PENDING',
  'PROCESSING',
  'SENT',
  'DELIVERED',
  'READ',
  'FAILED',
  'SKIPPED',
];

export const NOTIFICATION_CATEGORIES: [NotificationCategory, ...NotificationCategory[]] = [
  'ACCOUNT_AND_VERIFICATION',
  'LISTING_UPDATES',
  'PROPERTY_MATCH',
  'CHAT',
  'INQUIRIES_AND_REQUESTS',
  'REPORTS_AND_REVIEWS',
  'ADMINISTRATIVE',
  'SYSTEM',
];

export const NOTIFICATION_EVENT_TYPES: [NotificationEventType, ...NotificationEventType[]] = [
  'USER_REGISTERED',
  'EMAIL_VERIFICATION',
  'OTP_NOTIFICATION',
  'PROFILE_VERIFICATION_UPDATED',
  'LISTING_SUBMITTED',
  'LISTING_APPROVED',
  'LISTING_REJECTED',
  'LISTING_EXPIRY_REMINDER',
  'LISTING_EXPIRED',
  'LISTING_UNPUBLISHED',
  'PROPERTY_MATCH_FOUND',
  'NEW_CHAT_MESSAGE',
  'PROPERTY_INQUIRY_RECEIVED',
  'CONTACT_REQUEST_RECEIVED',
  'INQUIRY_STATUS_UPDATED',
  'CONTACT_US_CONFIRMATION',
  'REPORT_SUBMITTED_CONFIRMATION',
  'REPORT_STATUS_UPDATED',
  'REVIEW_SUBMITTED_CONFIRMATION',
  'REVIEW_APPROVED',
  'REVIEW_REJECTED',
  'ADMIN_NEW_USER_REGISTERED',
  'ADMIN_LISTING_AWAITING_MODERATION',
  'ADMIN_INQUIRY_RECEIVED',
  'ADMIN_CONTACT_US_SUBMITTED',
  'ADMIN_REPORT_SUBMITTED',
  'ADMIN_USER_DELETED',
  'ADMIN_PROFILE_VERIFICATION_REQUESTED',
  'ADMIN_REVIEW_AWAITING_MODERATION',
  'ADMIN_SYSTEM_ERROR',
  'ADMIN_OPERATIONAL_ALERT',
];

/**
 * Map connecting each granular business event to its governing category
 */
export const EVENT_CATEGORY_MAP: Record<NotificationEventType, NotificationCategory> = {
  USER_REGISTERED: 'ACCOUNT_AND_VERIFICATION',
  EMAIL_VERIFICATION: 'ACCOUNT_AND_VERIFICATION',
  OTP_NOTIFICATION: 'ACCOUNT_AND_VERIFICATION',
  PROFILE_VERIFICATION_UPDATED: 'ACCOUNT_AND_VERIFICATION',

  LISTING_SUBMITTED: 'LISTING_UPDATES',
  LISTING_APPROVED: 'LISTING_UPDATES',
  LISTING_REJECTED: 'LISTING_UPDATES',
  LISTING_EXPIRY_REMINDER: 'LISTING_UPDATES',
  LISTING_EXPIRED: 'LISTING_UPDATES',
  LISTING_UNPUBLISHED: 'LISTING_UPDATES',

  PROPERTY_MATCH_FOUND: 'PROPERTY_MATCH',

  NEW_CHAT_MESSAGE: 'CHAT',
  PROPERTY_INQUIRY_RECEIVED: 'INQUIRIES_AND_REQUESTS',
  CONTACT_REQUEST_RECEIVED: 'INQUIRIES_AND_REQUESTS',
  INQUIRY_STATUS_UPDATED: 'INQUIRIES_AND_REQUESTS',
  CONTACT_US_CONFIRMATION: 'INQUIRIES_AND_REQUESTS',

  REPORT_SUBMITTED_CONFIRMATION: 'REPORTS_AND_REVIEWS',
  REPORT_STATUS_UPDATED: 'REPORTS_AND_REVIEWS',
  REVIEW_SUBMITTED_CONFIRMATION: 'REPORTS_AND_REVIEWS',
  REVIEW_APPROVED: 'REPORTS_AND_REVIEWS',
  REVIEW_REJECTED: 'REPORTS_AND_REVIEWS',

  ADMIN_NEW_USER_REGISTERED: 'ADMINISTRATIVE',
  ADMIN_LISTING_AWAITING_MODERATION: 'ADMINISTRATIVE',
  ADMIN_INQUIRY_RECEIVED: 'ADMINISTRATIVE',
  ADMIN_CONTACT_US_SUBMITTED: 'ADMINISTRATIVE',
  ADMIN_REPORT_SUBMITTED: 'ADMINISTRATIVE',
  ADMIN_USER_DELETED: 'ADMINISTRATIVE',
  ADMIN_PROFILE_VERIFICATION_REQUESTED: 'ADMINISTRATIVE',
  ADMIN_REVIEW_AWAITING_MODERATION: 'ADMINISTRATIVE',

  ADMIN_SYSTEM_ERROR: 'SYSTEM',
  ADMIN_OPERATIONAL_ALERT: 'SYSTEM',
};

/**
 * Essential security & transactional events that bypass non-mandatory channel opt-outs
 */
export const MANDATORY_TRANSACTIONAL_EVENTS: readonly NotificationEventType[] = [
  'EMAIL_VERIFICATION',
  'OTP_NOTIFICATION',
  'ADMIN_SYSTEM_ERROR',
];

/**
 * Individual channel delivery record schema
 */
export interface IChannelDelivery {
  channel: NotificationChannel;
  status: ChannelDeliveryStatus;
  attemptCount: number;
  providerMessageId?: string;
  lastAttemptAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  providerMetadata?: Record<string, any>;
}

/**
 * 4-Channel toggles for any given category or global level
 */
export interface IChannelPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

/**
 * Granular category-level preferences
 */
export interface ICategoryPreferences {
  accountAndVerification: IChannelPreferences;
  listingUpdates: IChannelPreferences;
  propertyMatch: IChannelPreferences;
  chat: IChannelPreferences;
  inquiriesAndRequests: IChannelPreferences;
  reportsAndReviews: IChannelPreferences;
  administrative: IChannelPreferences;
  system: IChannelPreferences;
}

/**
 * Default category preferences for super admin
 */
export const DEFAULT_SUPER_ADMIN_CHANNEL_PREFERENCES: IChannelPreferences = {
  inApp: false,
  email: false,
  sms: false,
  whatsapp: false,
};

/**
 * Default category preferences for super admin
 */
export const DEFAULT_SUPER_ADMIN_CATEGORY_PREFERENCES: ICategoryPreferences = {
  accountAndVerification: { inApp: false, email: false, sms: false, whatsapp: false },
  listingUpdates: { inApp: false, email: false, sms: false, whatsapp: false },
  propertyMatch: { inApp: false, email: false, sms: false, whatsapp: false },
  chat: { inApp: false, email: false, sms: false, whatsapp: false },
  inquiriesAndRequests: { inApp: false, email: false, sms: false, whatsapp: false },
  reportsAndReviews: { inApp: false, email: false, sms: false, whatsapp: false },
  administrative: { inApp: false, email: false, sms: false, whatsapp: false },
  system: { inApp: false, email: false, sms: false, whatsapp: false },
};

/**
 * Default global channel preferences
 */
export const DEFAULT_GLOBAL_CHANNEL_PREFERENCES: IChannelPreferences = {
  inApp: true,
  email: false,
  sms: false,
  whatsapp: false,
};

/**
 * Default category preferences for normal users
 */
export const DEFAULT_USER_CATEGORY_PREFERENCES: ICategoryPreferences = {
  accountAndVerification: { inApp: true, email: false, sms: false, whatsapp: false },
  listingUpdates: { inApp: true, email: false, sms: false, whatsapp: false },
  propertyMatch: { inApp: true, email: false, sms: false, whatsapp: false },
  chat: { inApp: true, email: false, sms: false, whatsapp: false },
  inquiriesAndRequests: { inApp: true, email: false, sms: false, whatsapp: false },
  reportsAndReviews: { inApp: true, email: false, sms: false, whatsapp: false },
  administrative: { inApp: true, email: false, sms: false, whatsapp: false },
  system: { inApp: true, email: false, sms: false, whatsapp: false },
};

/**
 * Default category preferences for administrators
 */
export const DEFAULT_ADMIN_CATEGORY_PREFERENCES: ICategoryPreferences = {
  ...DEFAULT_USER_CATEGORY_PREFERENCES,
};
