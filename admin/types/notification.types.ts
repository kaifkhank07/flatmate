/**
 * Admin Notification Subsystem TypeScript Definitions
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

export interface IChannelPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

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

export interface INotificationPreferences {
  _id: string;
  ownerType: RecipientType;
  ownerModel?: 'User' | 'Admin';
  ownerId: string;
  channels: IChannelPreferences;
  categories: ICategoryPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetNotificationsResponseData {
  notifications: INotificationItem[];
  pagination: NotificationPagination;
  unreadCount: number;
}

export interface GetNotificationsFilters {
  page?: number;
  limit?: number;
  category?: NotificationCategory;
  eventType?: NotificationEventType;
  priority?: NotificationPriority;
  isRead?: boolean;
}

export interface UpdateNotificationPreferencesPayload {
  channels?: Partial<IChannelPreferences>;
  categories?: Partial<Record<keyof ICategoryPreferences, Partial<IChannelPreferences>>>;
}

export const ADMIN_NOTIFICATION_CATEGORIES_META: Record<
  NotificationCategory,
  {
    label: string;
    description: string;
    key: keyof ICategoryPreferences;
    colorTone: string;
    icon: string;
  }
> = {
  ADMINISTRATIVE: {
    label: 'Administrative Alerts',
    description: 'Staff notices, review queues, moderation assignments, and verification requests.',
    key: 'administrative',
    colorTone: 'iris',
    icon: 'head',
  },
  LISTING_UPDATES: {
    label: 'Listings & Moderation',
    description: 'Property & flatmate listing submissions, pending approvals, and status changes.',
    key: 'listingUpdates',
    colorTone: 'mint',
    icon: 'home',
  },
  REPORTS_AND_REVIEWS: {
    label: 'Reports & Moderation',
    description: 'User reports, content flagging, and reviews awaiting staff moderation.',
    key: 'reportsAndReviews',
    colorTone: 'rose',
    icon: 'flag',
  },
  INQUIRIES_AND_REQUESTS: {
    label: 'Inquiries & Contact Requests',
    description: 'Contact us submissions, platform inquiries, and tenant leads.',
    key: 'inquiriesAndRequests',
    colorTone: 'amber',
    icon: 'mail',
  },
  ACCOUNT_AND_VERIFICATION: {
    label: 'User Accounts & KYC',
    description: 'New user registrations, profile verification submissions, and KYC updates.',
    key: 'accountAndVerification',
    colorTone: 'sea',
    icon: 'users',
  },
  SYSTEM: {
    label: 'System & Operational',
    description: 'Critical server notices, background jobs, downtime warnings, and operational health.',
    key: 'system',
    colorTone: 'ember',
    icon: 'cog',
  },
  CHAT: {
    label: 'Chat & Communications',
    description: 'Direct messaging alerts and conversation activity.',
    key: 'chat',
    colorTone: 'iris',
    icon: 'chat',
  },
  PROPERTY_MATCH: {
    label: 'Property Match Alerts',
    description: 'Listing match events across platform seekers.',
    key: 'propertyMatch',
    colorTone: 'mint',
    icon: 'grid',
  },
};

export const NOTIFICATION_CHANNELS_META: Record<
  NotificationChannel,
  {
    label: string;
    description: string;
    channelKey: keyof IChannelPreferences;
  }
> = {
  IN_APP: {
    label: 'In-App Alerts',
    description: 'Notification bell popover, live unread counters, and panel notification feed.',
    channelKey: 'inApp',
  },
  EMAIL: {
    label: 'Email Notifications',
    description: 'Direct transactional and alert emails delivered to your admin address.',
    channelKey: 'email',
  },
  SMS: {
    label: 'SMS Text Messages',
    description: 'Time-critical mobile SMS notifications sent to staff mobile numbers.',
    channelKey: 'sms',
  },
  WHATSAPP: {
    label: 'WhatsApp Alerts',
    description: 'Instant WhatsApp message alerts for urgent platform operational notices.',
    channelKey: 'whatsapp',
  },
};
