/**
 * Notification Subsystem Frontend TypeScript Definitions
 * Aligned with FlatMate Notification Architecture v2.0
 */

export type RecipientType = 'USER' | 'ADMIN';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP';

export type ChannelDeliveryStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'SKIPPED';

export type NotificationCategory =
  | 'ACCOUNT_AND_VERIFICATION'
  | 'LISTING_UPDATES'
  | 'PROPERTY_MATCH'
  | 'CHAT'
  | 'INQUIRIES_AND_REQUESTS'
  | 'REPORTS_AND_REVIEWS'
  | 'ADMINISTRATIVE'
  | 'SYSTEM';

export type NotificationEventType =
  // Account & Verification
  | 'USER_REGISTERED'
  | 'EMAIL_VERIFICATION'
  | 'OTP_NOTIFICATION'
  | 'PROFILE_VERIFICATION_UPDATED'
  // Property & Listing Updates
  | 'LISTING_SUBMITTED'
  | 'LISTING_APPROVED'
  | 'LISTING_REJECTED'
  | 'LISTING_EXPIRY_REMINDER'
  | 'LISTING_EXPIRED'
  | 'LISTING_UNPUBLISHED'
  // Smart Property Match
  | 'PROPERTY_MATCH_FOUND'
  // Communication & Leads
  | 'NEW_CHAT_MESSAGE'
  | 'PROPERTY_INQUIRY_RECEIVED'
  | 'CONTACT_REQUEST_RECEIVED'
  | 'INQUIRY_STATUS_UPDATED'
  | 'CONTACT_US_CONFIRMATION'
  // Reports & Reviews
  | 'REPORT_SUBMITTED_CONFIRMATION'
  | 'REPORT_STATUS_UPDATED'
  | 'REVIEW_SUBMITTED_CONFIRMATION'
  | 'REVIEW_APPROVED'
  | 'REVIEW_REJECTED'
  // Administrative Alerts
  | 'ADMIN_NEW_USER_REGISTERED'
  | 'ADMIN_LISTING_AWAITING_MODERATION'
  | 'ADMIN_INQUIRY_RECEIVED'
  | 'ADMIN_CONTACT_US_SUBMITTED'
  | 'ADMIN_REPORT_SUBMITTED'
  | 'ADMIN_USER_DELETED'
  | 'ADMIN_PROFILE_VERIFICATION_REQUESTED'
  | 'ADMIN_REVIEW_AWAITING_MODERATION'
  // System Alerts
  | 'ADMIN_SYSTEM_ERROR'
  | 'ADMIN_OPERATIONAL_ALERT';

/**
 * Individual channel delivery tracking entry
 */
export interface IChannelDelivery {
  channel: NotificationChannel;
  status: ChannelDeliveryStatus;
  attemptCount: number;
  providerMessageId?: string;
  lastAttemptAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
  providerMetadata?: Record<string, any>;
}

/**
 * Single in-app notification item received from backend
 */
export interface INotificationItem {
  _id: string;
  recipientType: RecipientType;
  recipientModel?: 'User' | 'Admin';
  recipientId: string;
  eventType: NotificationEventType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  priority: NotificationPriority;
  channels: IChannelDelivery[];
  isRead: boolean;
  readAt?: string | null;
  deduplicationKey?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 4-Channel toggles
 */
export interface IChannelPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

/**
 * Granular per-category channel switches
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
 * Smart property-matching criteria filters
 */
export interface IPropertyMatchPreferences {
  enabled: boolean;
  cities: string[];
  localities: string[];
  budget?: {
    min?: number;
    max?: number;
  };
  propertyTypes: Array<'flat' | 'room' | 'pg' | 'shared_apartment' | 'entire_property'>;
  furnishing: Array<'fully_furnished' | 'semi_furnished' | 'unfurnished'>;
  availableFrom?: string;
  immediateOnly?: boolean;
  genderPreference?: 'male' | 'female' | 'other' | 'any';
  occupationPreference?:
    | 'student'
    | 'working_professional'
    | 'self_employed'
    | 'business_owner'
    | 'freelancer'
    | 'other'
    | 'any';
  amenities?: string[];
  postType?: 'property' | 'partner' | 'both';
}

/**
 * Full Notification Preference Document for User or Admin
 */
export interface INotificationPreferences {
  _id: string;
  ownerType: RecipientType;
  ownerModel?: 'User' | 'Admin';
  ownerId: string;
  channels: IChannelPreferences;
  categories: ICategoryPreferences;
  propertyMatch: IPropertyMatchPreferences;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pagination metadata
 */
export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated API response structure for GET /api/notifications
 */
export interface GetNotificationsResponseData {
  notifications: INotificationItem[];
  pagination: NotificationPagination;
  unreadCount: number;
}

/**
 * Query filter params for GET /api/notifications
 */
export interface GetNotificationsFilters {
  page?: number;
  limit?: number;
  category?: NotificationCategory;
  eventType?: NotificationEventType;
  priority?: NotificationPriority;
  isRead?: boolean;
}

/**
 * Update Preferences Request Payload
 */
export interface UpdateNotificationPreferencesPayload {
  channels?: Partial<IChannelPreferences>;
  categories?: Partial<Record<keyof ICategoryPreferences, Partial<IChannelPreferences>>>;
  propertyMatch?: Partial<IPropertyMatchPreferences>;
}

/**
 * Generic API wrapper standard across FlatMate
 */
export interface NotificationApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Metadata & UI Configuration mapping for Categories
 */
export const NOTIFICATION_CATEGORY_META: Record<
  NotificationCategory,
  {
    label: string;
    description: string;
    key: keyof ICategoryPreferences;
  }
> = {
  ACCOUNT_AND_VERIFICATION: {
    label: 'Account & Security',
    description: 'Login alerts, email verification, and profile verification status updates.',
    key: 'accountAndVerification',
  },
  LISTING_UPDATES: {
    label: 'Listings & Moderation',
    description: 'Post approvals, rejections, expiry warnings, and listing changes.',
    key: 'listingUpdates',
  },
  PROPERTY_MATCH: {
    label: 'Smart Property Matches',
    description: 'Instant alerts when newly approved properties match your criteria.',
    key: 'propertyMatch',
  },
  CHAT: {
    label: 'Chat Messages',
    description: 'Real-time messages and conversations with potential flatmates and hosts.',
    key: 'chat',
  },
  INQUIRIES_AND_REQUESTS: {
    label: 'Inquiries & Contact Requests',
    description: 'Lead requests, inquiries on your listings, and status responses.',
    key: 'inquiriesAndRequests',
  },
  REPORTS_AND_REVIEWS: {
    label: 'Reports & Reviews',
    description: 'Feedback confirmations, review approvals, and moderation status updates.',
    key: 'reportsAndReviews',
  },
  ADMINISTRATIVE: {
    label: 'Administrative Alerts',
    description: 'Staff notices, review queues, and moderator task assignments.',
    key: 'administrative',
  },
  SYSTEM: {
    label: 'System & Operational',
    description: 'Critical service notices, maintenance windows, and system health alerts.',
    key: 'system',
  },
};

/**
 * Metadata for Supported Delivery Channels
 */
export const NOTIFICATION_CHANNELS_META: Record<
  NotificationChannel,
  {
    label: string;
    description: string;
    iconName: string;
  }
> = {
  IN_APP: {
    label: 'In-App Alerts',
    description: 'Alerts shown in your dashboard notification feed and navbar bell.',
    iconName: 'Bell',
  },
  EMAIL: {
    label: 'Email Notifications',
    description: 'Deliveries to your verified email inbox.',
    iconName: 'Mail',
  },
  SMS: {
    label: 'SMS Text Messages',
    description: 'Instant text alerts sent to your verified mobile number.',
    iconName: 'Smartphone',
  },
  WHATSAPP: {
    label: 'WhatsApp Alerts',
    description: 'Direct WhatsApp messages for instant conversational updates.',
    iconName: 'MessageSquare',
  },
};
