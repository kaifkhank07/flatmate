import { Types } from 'mongoose';
import {
  Notification,
  INotification,
  NotificationType,
} from '../../models/notification/notification.model';
import {
  NotificationPreference,
  INotificationPreference,
} from '../../models/notification/notificationPreference.model';
import { User } from '../../models/auth/user.model';
import { sendEmail } from '../email/email.service';
import { sendSMS } from '../sms/twilio.service';
import { logger } from '../../utils/logger.util';

export interface CreateNotificationPayload {
  user: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  sendExternalEmail?: boolean;
  sendExternalSMS?: boolean;
}

export interface GetNotificationsFilters {
  page?: number;
  limit?: number;
  type?: NotificationType;
  isRead?: boolean;
}

/**
 * Get or create notification preferences for a user
 */
export const getOrCreateNotificationPreferences = async (
  userId: Types.ObjectId | string
): Promise<INotificationPreference> => {
  const userObj = new Types.ObjectId(userId.toString());
  let preferences = await NotificationPreference.findOne({ user: userObj });

  if (!preferences) {
    preferences = await NotificationPreference.create({
      user: userObj,
      sms: true,
      email: true,
      chat: true,
      propertyAlert: true,
      flatmateAlert: true,
      contactRequest: true,
    });
  }

  return preferences;
};

/**
 * Update notification preferences for a user
 */
export const updateNotificationPreferences = async (
  userId: Types.ObjectId | string,
  updateData: Partial<{
    sms: boolean;
    email: boolean;
    chat: boolean;
    propertyAlert: boolean;
    flatmateAlert: boolean;
    contactRequest: boolean;
  }>
): Promise<INotificationPreference> => {
  const userObj = new Types.ObjectId(userId.toString());

  const preferences = await NotificationPreference.findOneAndUpdate(
    { user: userObj },
    { $set: updateData },
    { new: true, upsert: true, runValidators: true }
  );

  return preferences;
};

/**
 * Check if a notification type is enabled in user preferences
 */
const isTypeEnabledInPreferences = (
  preferences: INotificationPreference,
  type: NotificationType
): boolean => {
  switch (type) {
    case 'SMS':
      return preferences.sms;
    case 'EMAIL':
      return preferences.email;
    case 'CHAT':
      return preferences.chat;
    case 'PROPERTY_ALERT':
      return preferences.propertyAlert;
    case 'FLATMATE_ALERT':
      return preferences.flatmateAlert;
    case 'CONTACT_REQUEST':
      return preferences.contactRequest;
    default:
      return true;
  }
};

/**
 * Create a new notification and optionally dispatch email/SMS based on preferences
 */
export const createNotification = async (
  payload: CreateNotificationPayload
): Promise<INotification | null> => {
  const recipientId = new Types.ObjectId(payload.user.toString());

  // Check recipient preferences
  const preferences = await getOrCreateNotificationPreferences(recipientId);
  if (!isTypeEnabledInPreferences(preferences, payload.type)) {
    logger.info(
      `[Notification Service] Notification type '${payload.type}' skipped for user ${recipientId} due to preferences.`
    );
    return null;
  }

  // Create in-app notification in database
  const notification = await Notification.create({
    user: recipientId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    data: payload.data || {},
    isRead: false,
    status: 'sent',
  });

  // Check if external dispatch (Email / SMS) is required or relevant
  const recipientUser = await User.findById(recipientId);

  if (recipientUser && !recipientUser.isDeleted) {
    // External Email dispatch
    if (
      (payload.type === 'EMAIL' || payload.sendExternalEmail) &&
      preferences.email &&
      recipientUser.email
    ) {
      sendEmail({
        to: recipientUser.email,
        subject: payload.title,
        text: payload.message,
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h2>${payload.title}</h2>
          <p>${payload.message}</p>
        </div>`,
      }).catch((err) => {
        logger.error(
          `[Notification Service] External email dispatch failed for user ${recipientId}:`,
          err instanceof Error ? err.message : err
        );
      });
    }

    // External SMS dispatch
    if (
      (payload.type === 'SMS' || payload.sendExternalSMS) &&
      preferences.sms &&
      recipientUser.mobile
    ) {
      sendSMS(recipientUser.mobile, `${payload.title}: ${payload.message}`).catch((err) => {
        logger.error(
          `[Notification Service] External SMS dispatch failed for user ${recipientId}:`,
          err instanceof Error ? err.message : err
        );
      });
    }
  }

  return notification;
};

/**
 * Get paginated notifications for a user
 */
export const getUserNotifications = async (
  userId: Types.ObjectId | string,
  filters: GetNotificationsFilters = {}
) => {
  const userObj = new Types.ObjectId(userId.toString());
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(100, filters.limit || 20));
  const skip = (page - 1) * limit;

  const query: any = { user: userObj };

  if (filters.type) {
    query.type = filters.type;
  }

  if (typeof filters.isRead === 'boolean') {
    query.isRead = filters.isRead;
  }

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ user: userObj, isRead: false });

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
 * Get count of unread notifications for a user
 */
export const getUnreadNotificationCount = async (
  userId: Types.ObjectId | string
): Promise<number> => {
  const userObj = new Types.ObjectId(userId.toString());
  return Notification.countDocuments({ user: userObj, isRead: false });
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (
  userId: Types.ObjectId | string,
  notificationId: Types.ObjectId | string
): Promise<INotification> => {
  const userObj = new Types.ObjectId(userId.toString());
  const notifObj = new Types.ObjectId(notificationId.toString());

  const notification = await Notification.findOne({ _id: notifObj, user: userObj });
  if (!notification) {
    throw new Error('Notification not found');
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    notification.status = 'read';
    await notification.save();
  }

  return notification;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (
  userId: Types.ObjectId | string
) => {
  const userObj = new Types.ObjectId(userId.toString());
  const readAt = new Date();

  const result = await Notification.updateMany(
    { user: userObj, isRead: false },
    {
      $set: {
        isRead: true,
        readAt,
        status: 'read',
      },
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
  userId: Types.ObjectId | string,
  notificationId: Types.ObjectId | string
): Promise<boolean> => {
  const userObj = new Types.ObjectId(userId.toString());
  const notifObj = new Types.ObjectId(notificationId.toString());

  const result = await Notification.deleteOne({ _id: notifObj, user: userObj });
  if (result.deletedCount === 0) {
    throw new Error('Notification not found');
  }

  return true;
};
