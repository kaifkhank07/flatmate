import { Types } from 'mongoose';
import {
  Notification,
  INotification,
  NotificationEventType,
  NotificationCategory,
  NotificationPriority,
  RecipientType,
  IChannelDelivery,
  EVENT_CATEGORY_MAP,
  DEFAULT_SUPER_ADMIN_CHANNEL_PREFERENCES,
  DEFAULT_SUPER_ADMIN_CATEGORY_PREFERENCES,
  DEFAULT_SUPER_ADMIN_PROPERTY_MATCH_PREFERENCES,
} from '../../models/notification/notification.model';
import {
  NotificationPreference,
  INotificationPreference,
  IChannelPreferences,
  ICategoryPreferences,
  IPropertyMatchPreferences,
  DEFAULT_GLOBAL_CHANNEL_PREFERENCES,
  DEFAULT_USER_CATEGORY_PREFERENCES,
  DEFAULT_ADMIN_CATEGORY_PREFERENCES,
  DEFAULT_PROPERTY_MATCH_PREFERENCES,
} from '../../models/notification/notificationPreference.model';
import { User } from '../../models/auth/user.model';
import { Admin } from '../../models/auth/admin.model';
import { sendEmail } from '../email/email.service';
import { sendSMS } from '../sms/twilio.service';
import { logger } from '../../utils/logger.util';

export interface CreateNotificationPayload {
  recipientType?: RecipientType;
  recipientId: Types.ObjectId | string;
  eventType: NotificationEventType;
  category?: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  priority?: NotificationPriority;
  channels?: IChannelDelivery[];
  deduplicationKey?: string;
  expiresAt?: Date;
  sendExternalEmail?: boolean;
  sendExternalSMS?: boolean;
  sendExternalWhatsApp?: boolean;
}

export interface GetNotificationsFilters {
  page?: number;
  limit?: number;
  category?: NotificationCategory;
  eventType?: NotificationEventType;
  priority?: NotificationPriority;
  isRead?: boolean;
}

export interface UpdatePreferencesPayload {
  channels?: Partial<IChannelPreferences>;
  categories?: Partial<Record<keyof ICategoryPreferences, Partial<IChannelPreferences>>>;
  propertyMatch?: Partial<IPropertyMatchPreferences>;
}

/**
 * Get or create notification preferences for a user or admin
 */
// export const getOrCreateNotificationPreferences = async (
//   ownerId: Types.ObjectId | string,
//   ownerType: RecipientType = 'USER'
// ): Promise<INotificationPreference> => {
//   const ownerObj = new Types.ObjectId(ownerId.toString());
//   let preferences = await NotificationPreference.findOne({
//     ownerType,
//     ownerId: ownerObj,
//   });

//   if (!preferences) {
//     preferences = await NotificationPreference.create({
//       ownerType,
//       ownerModel: ownerType === 'ADMIN' ? 'Admin' : 'User',
//       ownerId: ownerObj,
//       channels: { ...DEFAULT_GLOBAL_CHANNEL_PREFERENCES },
//       categories:
//         ownerType === 'ADMIN'
//           ? { ...DEFAULT_ADMIN_CATEGORY_PREFERENCES }
//           : { ...DEFAULT_USER_CATEGORY_PREFERENCES },
//       propertyMatch: { ...DEFAULT_PROPERTY_MATCH_PREFERENCES },
//     });
//   }

//   return preferences;
// };
export const getOrCreateNotificationPreferences = async (
  ownerId: Types.ObjectId | string,
  ownerType: RecipientType = 'USER'
): Promise<INotificationPreference> => {
  const ownerObj = new Types.ObjectId(ownerId.toString());

  let preferences = await NotificationPreference.findOne({
    ownerType,
    ownerId: ownerObj,
  });

  if (preferences) return preferences;

  let isSuperAdmin = false;

  if (ownerType === 'ADMIN') {
    const admin = await Admin.findById(ownerObj).select('role').lean();
    isSuperAdmin = admin?.role === 'super_admin';
  }

  const isDisabled = ownerType === 'ADMIN' && isSuperAdmin;

  return NotificationPreference.create({
    ownerType,
    ownerModel: ownerType === 'ADMIN' ? 'Admin' : 'User',
    ownerId: ownerObj,

    channels: isDisabled
      ? DEFAULT_SUPER_ADMIN_CHANNEL_PREFERENCES
      : DEFAULT_GLOBAL_CHANNEL_PREFERENCES,

    categories: isDisabled
      ? DEFAULT_SUPER_ADMIN_CATEGORY_PREFERENCES
      : ownerType === 'ADMIN'
        ? DEFAULT_ADMIN_CATEGORY_PREFERENCES
        : DEFAULT_USER_CATEGORY_PREFERENCES,

    propertyMatch: isDisabled
      ? DEFAULT_SUPER_ADMIN_PROPERTY_MATCH_PREFERENCES
      : DEFAULT_PROPERTY_MATCH_PREFERENCES,
  });
};


/**
 * Update notification preferences for a user or admin
 */
export const updateNotificationPreferences = async (
  ownerId: Types.ObjectId | string,
  updateData: UpdatePreferencesPayload,
  ownerType: RecipientType = 'USER'
): Promise<INotificationPreference> => {
  const ownerObj = new Types.ObjectId(ownerId.toString());
  const existing = await getOrCreateNotificationPreferences(ownerObj, ownerType);

  if (updateData.channels) {
    existing.channels = {
      ...existing.channels,
      ...updateData.channels,
    };
  }

  if (updateData.categories) {
    for (const [catKey, catVal] of Object.entries(updateData.categories)) {
      if (catVal && (existing.categories as any)[catKey]) {
        (existing.categories as any)[catKey] = {
          ...(existing.categories as any)[catKey],
          ...catVal,
        };
      }
    }
  }

  if (updateData.propertyMatch) {
    existing.propertyMatch = {
      ...existing.propertyMatch,
      ...updateData.propertyMatch,
    };
  }

  await existing.save();
  return existing;
};

/**
 * Dedicated helper to update smart property-matching criteria
 */
export const updatePropertyMatchPreferences = async (
  userId: Types.ObjectId | string,
  matchData: Partial<IPropertyMatchPreferences>
): Promise<INotificationPreference> => {
  const userObj = new Types.ObjectId(userId.toString());
  const existing = await getOrCreateNotificationPreferences(userObj, 'USER');

  existing.propertyMatch = {
    ...existing.propertyMatch,
    ...matchData,
  };

  await existing.save();
  return existing;
};

/**
 * Create a new notification, evaluate channel preferences, persist to MongoDB, and dispatch external channels
 */
export const createNotification = async (
  payload: CreateNotificationPayload
): Promise<INotification | null> => {
  const recipientType = payload.recipientType || 'USER';
  const recipientId = new Types.ObjectId(payload.recipientId.toString());
  const eventType = payload.eventType;
  const category = payload.category || EVENT_CATEGORY_MAP[eventType];

  // Skip all notifications for super admins
  if (recipientType === 'ADMIN') {
    const recipientAdmin = await Admin.findById(recipientId)
      .select('role')
      .lean();

    if (recipientAdmin?.role === 'super_admin') {
      logger.info(
        `[Notification Service] Notification skipped for super admin ${recipientId}`
      );
      return null;
    }
  }

  // 1. Scoped idempotency / deduplication check
  if (payload.deduplicationKey) {
    const existing = await Notification.findOne({
      recipientType,
      recipientId,
      deduplicationKey: payload.deduplicationKey,
    });
    if (existing) {
      logger.info(
        `[Notification Service] Duplicate notification suppressed for ${recipientType} ${recipientId} (key: ${payload.deduplicationKey})`
      );
      return existing;
    }
  }

  // 2. Preference evaluation
  const preferences = await getOrCreateNotificationPreferences(recipientId, recipientType);

  const inAppEnabled = preferences.isChannelEnabled(category, 'IN_APP', eventType);
  const emailEnabled =
    payload.sendExternalEmail || preferences.isChannelEnabled(category, 'EMAIL', eventType);
  const smsEnabled =
    payload.sendExternalSMS || preferences.isChannelEnabled(category, 'SMS', eventType);
  const whatsappEnabled =
    payload.sendExternalWhatsApp || preferences.isChannelEnabled(category, 'WHATSAPP', eventType);

  // 3. Build channel delivery tracking records
  const channelDeliveries: IChannelDelivery[] = [];

  channelDeliveries.push({
    channel: 'IN_APP',
    status: inAppEnabled ? 'DELIVERED' : 'SKIPPED',
    attemptCount: inAppEnabled ? 1 : 0,
    deliveredAt: inAppEnabled ? new Date() : undefined,
    errorMessage: inAppEnabled ? undefined : 'In-app notification disabled by user preference',
  });

  if (emailEnabled) {
    channelDeliveries.push({
      channel: 'EMAIL',
      status: 'PENDING',
      attemptCount: 0,
    });
  }

  if (smsEnabled) {
    channelDeliveries.push({
      channel: 'SMS',
      status: 'PENDING',
      attemptCount: 0,
    });
  }

  if (whatsappEnabled) {
    channelDeliveries.push({
      channel: 'WHATSAPP',
      status: 'PENDING',
      attemptCount: 0,
    });
  }

  // Merge any explicit channel overrides from caller payload
  if (payload.channels && payload.channels.length > 0) {
    for (const customChannel of payload.channels) {
      const idx = channelDeliveries.findIndex((c) => c.channel === customChannel.channel);
      if (idx >= 0) {
        channelDeliveries[idx] = { ...channelDeliveries[idx], ...customChannel };
      } else {
        channelDeliveries.push(customChannel);
      }
    }
  }

  // 4. Persist Notification Document
  const notification = await Notification.create({
    recipientType,
    recipientModel: recipientType === 'ADMIN' ? 'Admin' : 'User',
    recipientId,
    eventType,
    category,
    title: payload.title,
    message: payload.message,
    data: payload.data || {},
    actionUrl: payload.actionUrl,
    priority: payload.priority || 'NORMAL',
    channels: channelDeliveries,
    isRead: false,
    deduplicationKey: payload.deduplicationKey,
    expiresAt: payload.expiresAt,
  });

  // 5. Asynchronously dispatch external channels (if recipient is User)
  if (recipientType === 'USER') {
    User.findById(recipientId)
      .then(async (recipientUser) => {
        if (!recipientUser || recipientUser.isDeleted) return;

        // Email Dispatch
        const emailDelivery = notification.channels.find(
          (c) => c.channel === 'EMAIL' && c.status === 'PENDING'
        );
        if (emailDelivery && recipientUser.email) {
          try {
            await sendEmail({
              to: recipientUser.email,
              subject: payload.title,
              text: payload.message,
              html: `<div style="font-family: sans-serif; padding: 20px;">
                <h2>${payload.title}</h2>
                <p>${payload.message}</p>
              </div>`,
            });
            emailDelivery.status = 'SENT';
            emailDelivery.sentAt = new Date();
            emailDelivery.attemptCount = (emailDelivery.attemptCount || 0) + 1;
            await notification.save();
          } catch (err: any) {
            logger.error(`[Notification Service] Email dispatch failed for user ${recipientId}:`, err);
            emailDelivery.status = 'FAILED';
            emailDelivery.attemptCount = (emailDelivery.attemptCount || 0) + 1;
            emailDelivery.errorMessage = err?.message || 'Email dispatch failed';
            emailDelivery.lastAttemptAt = new Date();
            await notification.save();
          }
        }

        // SMS Dispatch
        const smsDelivery = notification.channels.find(
          (c) => c.channel === 'SMS' && c.status === 'PENDING'
        );
        if (smsDelivery && recipientUser.mobile) {
          try {
            await sendSMS(recipientUser.mobile, `${payload.title}: ${payload.message}`);
            smsDelivery.status = 'SENT';
            smsDelivery.sentAt = new Date();
            smsDelivery.attemptCount = (smsDelivery.attemptCount || 0) + 1;
            await notification.save();
          } catch (err: any) {
            logger.error(`[Notification Service] SMS dispatch failed for user ${recipientId}:`, err);
            smsDelivery.status = 'FAILED';
            smsDelivery.attemptCount = (smsDelivery.attemptCount || 0) + 1;
            smsDelivery.errorMessage = err?.message || 'SMS dispatch failed';
            smsDelivery.lastAttemptAt = new Date();
            await notification.save();
          }
        }

        // WhatsApp Dispatch Stub
        const waDelivery = notification.channels.find(
          (c) => c.channel === 'WHATSAPP' && c.status === 'PENDING'
        );
        if (waDelivery && recipientUser.mobile) {
          logger.info(`[Notification Service] WhatsApp alert queued for ${recipientUser.mobile}: ${payload.title}`);
          waDelivery.status = 'SENT';
          waDelivery.sentAt = new Date();
          waDelivery.attemptCount = 1;
          await notification.save();
        }
      })
      .catch((err) => {
        logger.error(`[Notification Service] Error resolving user for external dispatch:`, err);
      });
  } else if (recipientType === 'ADMIN') {
    Admin.findById(recipientId)
      .then(async (recipientAdmin) => {
        if (!recipientAdmin || recipientAdmin.isDeleted || recipientAdmin.status !== 'active') return;

        // Admin Email Dispatch
        const emailDelivery = notification.channels.find(
          (c) => c.channel === 'EMAIL' && c.status === 'PENDING'
        );
        if (emailDelivery && recipientAdmin.email) {
          try {
            await sendEmail({
              to: recipientAdmin.email,
              subject: `[Admin Alert] ${payload.title}`,
              text: payload.message,
              html: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                <h2 style="color: #0f172a;">${payload.title}</h2>
                <p style="font-size: 14px; line-height: 1.6;">${payload.message}</p>
                ${payload.actionUrl
                  ? `<div style="margin-top: 20px;">
                        <a href="${payload.actionUrl}" style="background-color: #0066F9; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                          View in Admin Panel
                        </a>
                      </div>`
                  : ''
                }
              </div>`,
            });
            emailDelivery.status = 'SENT';
            emailDelivery.sentAt = new Date();
            emailDelivery.attemptCount = (emailDelivery.attemptCount || 0) + 1;
            await notification.save();
          } catch (err: any) {
            logger.error(`[Notification Service] Email dispatch failed for admin ${recipientId}:`, err);
            emailDelivery.status = 'FAILED';
            emailDelivery.attemptCount = (emailDelivery.attemptCount || 0) + 1;
            emailDelivery.errorMessage = err?.message || 'Email dispatch failed';
            emailDelivery.lastAttemptAt = new Date();
            await notification.save();
          }
        }
      })
      .catch((err) => {
        logger.error(`[Notification Service] Error resolving admin for external dispatch:`, err);
      });
  }

  return notification;
};

/**
 * Dispatch an administrative alert notification to all active platform admins or super admins
 */
export const notifyAdmins = async (payload: {
  eventType: NotificationEventType;
  category?: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  priority?: NotificationPriority;
  superAdminOnly?: boolean;
}): Promise<INotification[]> => {
  try {
    const query: any = { status: 'active', isDeleted: false };
    if (payload.superAdminOnly) {
      query.role = 'super_admin';
    }
    const admins = await Admin.find(query);
    const notifications = await Promise.all(
      admins.map((admin) =>
        createNotification({
          ...payload,
          recipientType: 'ADMIN',
          recipientId: admin._id,
        })
      )
    );
    return notifications.filter((n): n is INotification => n !== null);
  } catch (err) {
    logger.error('[Notification Service] notifyAdmins error:', err);
    return [];
  }
};

/**
 * Get paginated notifications for a user or admin
 */
export const getUserNotifications = async (
  recipientId: Types.ObjectId | string,
  filters: GetNotificationsFilters = {},
  recipientType: RecipientType = 'USER'
) => {
  const recipientObj = new Types.ObjectId(recipientId.toString());
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(100, filters.limit || 20));
  const skip = (page - 1) * limit;

  const query: any = {
    recipientType,
    recipientId: recipientObj,
  };

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.eventType) {
    query.eventType = filters.eventType;
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  if (typeof filters.isRead === 'boolean') {
    query.isRead = filters.isRead;
  }

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    recipientType,
    recipientId: recipientObj,
    isRead: false,
  });

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    unreadCount,
  };
};

/**
 * Get count of unread notifications for a user or admin
 */
export const getUnreadNotificationCount = async (
  recipientId: Types.ObjectId | string,
  recipientType: RecipientType = 'USER'
): Promise<number> => {
  const recipientObj = new Types.ObjectId(recipientId.toString());
  return Notification.countDocuments({
    recipientType,
    recipientId: recipientObj,
    isRead: false,
  });
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (
  recipientId: Types.ObjectId | string,
  notificationId: Types.ObjectId | string,
  recipientType: RecipientType = 'USER'
): Promise<INotification> => {
  const recipientObj = new Types.ObjectId(recipientId.toString());
  const notifObj = new Types.ObjectId(notificationId.toString());

  const notification = await Notification.findOne({
    _id: notifObj,
    recipientType,
    recipientId: recipientObj,
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  return notification.markAsRead();
};

/**
 * Mark all notifications as read for a user or admin
 */
export const markAllNotificationsAsRead = async (
  recipientId: Types.ObjectId | string,
  recipientType: RecipientType = 'USER'
) => {
  const recipientObj = new Types.ObjectId(recipientId.toString());
  const readAt = new Date();

  const result = await Notification.updateMany(
    {
      recipientType,
      recipientId: recipientObj,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt,
      },
    }
  );

  // Synchronize in-app delivery channel status
  await Notification.updateMany(
    {
      recipientType,
      recipientId: recipientObj,
      'channels.channel': 'IN_APP',
      'channels.status': { $ne: 'READ' },
    },
    {
      $set: {
        'channels.$[elem].status': 'READ',
        'channels.$[elem].readAt': readAt,
      },
    },
    {
      arrayFilters: [{ 'elem.channel': 'IN_APP' }],
    }
  );

  return {
    updatedCount: result.modifiedCount,
    readAt,
  };
};

/**
 * Delete a single notification
 */
export const deleteNotification = async (
  recipientId: Types.ObjectId | string,
  notificationId: Types.ObjectId | string,
  recipientType: RecipientType = 'USER'
): Promise<boolean> => {
  const recipientObj = new Types.ObjectId(recipientId.toString());
  const notifObj = new Types.ObjectId(notificationId.toString());

  const result = await Notification.deleteOne({
    _id: notifObj,
    recipientType,
    recipientId: recipientObj,
  });

  if (result.deletedCount === 0) {
    throw new Error('Notification not found');
  }

  return true;
};
