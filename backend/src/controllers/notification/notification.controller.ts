import { Request, Response } from 'express';
import * as notificationService from '../../services/notification/notification.service';
import {
  NotificationCategory,
  NotificationEventType,
  NotificationPriority,
  RecipientType,
} from '../../models/notification/notification.model';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';

/**
 * Helper to extract recipient/owner auth context from either User or Admin session
 */
const getAuthContext = (
  req: Request
): { id: string; type: RecipientType } => {
  if (req.admin && req.admin._id) {
    return { id: req.admin._id.toString(), type: 'ADMIN' };
  }
  if (req.user && req.user._id) {
    return { id: req.user._id.toString(), type: 'USER' };
  }
  throw new Error('Authentication required');
};

/**
 * Get paginated notifications for the authenticated user or admin
 */
export const getNotifications = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id, type } = getAuthContext(req);
    const { page, limit, category, eventType, priority, isRead } = req.query;

    const filters: notificationService.GetNotificationsFilters = {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      category: category as NotificationCategory,
      eventType: eventType as NotificationEventType,
      priority: priority as NotificationPriority,
      isRead: isRead !== undefined ? String(isRead) === 'true' : undefined,
    };

    const data = await notificationService.getUserNotifications(id, filters, type);
    return sendSuccess(res, 'Notifications retrieved successfully', data);
  } catch (error) {
    logger.error('Failed to get notifications', error);
    return sendError(
      res,
      error instanceof Error ? error.message : 'Failed to retrieve notifications',
      500
    );
  }
};

/**
 * Get unread notification count for the authenticated user or admin
 */
export const getUnreadNotificationCount = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id, type } = getAuthContext(req);
    const unreadCount = await notificationService.getUnreadNotificationCount(id, type);
    return sendSuccess(res, 'Unread notification count retrieved successfully', { unreadCount });
  } catch (error) {
    logger.error('Failed to get unread notification count', error);
    return sendError(
      res,
      error instanceof Error ? error.message : 'Failed to retrieve unread notification count',
      500
    );
  }
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id, type } = getAuthContext(req);
    const { notificationId } = req.params;

    const notification = await notificationService.markNotificationAsRead(
      id,
      notificationId,
      type
    );
    return sendSuccess(res, 'Notification marked as read', notification);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark notification as read';
    if (message === 'Notification not found') {
      return sendError(res, message, 404);
    }
    logger.error('Failed to mark notification as read', error);
    return sendError(res, message, 500);
  }
};

/**
 * Mark all notifications as read for the authenticated user or admin
 */
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id, type } = getAuthContext(req);
    const result = await notificationService.markAllNotificationsAsRead(id, type);
    return sendSuccess(res, 'All notifications marked as read', result);
  } catch (error) {
    logger.error('Failed to mark all notifications as read', error);
    return sendError(
      res,
      error instanceof Error ? error.message : 'Failed to mark all notifications as read',
      500
    );
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id, type } = getAuthContext(req);
    const { notificationId } = req.params;

    await notificationService.deleteNotification(id, notificationId, type);
    return sendSuccess(res, 'Notification deleted successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete notification';
    if (message === 'Notification not found') {
      return sendError(res, message, 404);
    }
    logger.error('Failed to delete notification', error);
    return sendError(res, message, 500);
  }
};

/**
 * Get notification preferences for the authenticated user or admin
 */
export const getNotificationPreferences = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id, type } = getAuthContext(req);
    const preferences = await notificationService.getOrCreateNotificationPreferences(id, type);
    return sendSuccess(res, 'Notification preferences retrieved successfully', preferences);
  } catch (error) {
    logger.error('Failed to get notification preferences', error);
    return sendError(
      res,
      error instanceof Error ? error.message : 'Failed to retrieve notification preferences',
      500
    );
  }
};

/**
 * Update notification preferences for the authenticated user or admin
 */
export const updateNotificationPreferences = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id, type } = getAuthContext(req);
    const preferences = await notificationService.updateNotificationPreferences(
      id,
      req.body,
      type
    );
    return sendSuccess(res, 'Notification preferences updated successfully', preferences);
  } catch (error) {
    logger.error('Failed to update notification preferences', error);
    return sendError(
      res,
      error instanceof Error ? error.message : 'Failed to update notification preferences',
      500
    );
  }
};

/**
 * Update smart property-match criteria (User only)
 */
export const updatePropertyMatchPreferences = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id, type } = getAuthContext(req);
    if (type !== 'USER') {
      return sendError(res, 'Property match preferences are only configurable for users', 403);
    }

    const preferences = await notificationService.updatePropertyMatchPreferences(id, req.body);
    return sendSuccess(
      res,
      'Property match preferences updated successfully',
      preferences.propertyMatch
    );
  } catch (error) {
    logger.error('Failed to update property match preferences', error);
    return sendError(
      res,
      error instanceof Error ? error.message : 'Failed to update property match preferences',
      500
    );
  }
};

/**
 * Create notification (Admin / System / Inter-service usage)
 */
export const createNotification = async (req: Request, res: Response): Promise<Response> => {
  try {
    const notification = await notificationService.createNotification(req.body);
    if (!notification) {
      return sendSuccess(res, 'Notification creation skipped based on preferences', null);
    }
    return sendSuccess(res, 'Notification created successfully', notification, 201);
  } catch (error) {
    logger.error('Failed to create notification', error);
    return sendError(
      res,
      error instanceof Error ? error.message : 'Failed to create notification',
      500
    );
  }
};
