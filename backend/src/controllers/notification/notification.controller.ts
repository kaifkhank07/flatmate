import { Request, Response } from 'express';
import * as notificationService from '../../services/notification/notification.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { NotificationType } from '../../models/notification/notification.model';

/**
 * Get paginated notifications for the logged-in user
 */
export const getNotifications = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user!._id;
    const { page, limit, type, isRead } = req.query;

    const filters: notificationService.GetNotificationsFilters = {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      type: type as NotificationType,
      isRead: isRead !== undefined ? String(isRead) === 'true' : undefined,
    };

    const data = await notificationService.getUserNotifications(userId, filters);
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
 * Get unread notification count for the logged-in user
 */
export const getUnreadNotificationCount = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!._id;
    const unreadCount = await notificationService.getUnreadNotificationCount(userId);
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
    const userId = req.user!._id;
    const { notificationId } = req.params;

    const notification = await notificationService.markNotificationAsRead(
      userId,
      notificationId
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
 * Mark all notifications as read for the logged-in user
 */
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!._id;
    const result = await notificationService.markAllNotificationsAsRead(userId);
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
    const userId = req.user!._id;
    const { notificationId } = req.params;

    await notificationService.deleteNotification(userId, notificationId);
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
 * Get notification preferences for the logged-in user
 */
export const getNotificationPreferences = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!._id;
    const preferences = await notificationService.getOrCreateNotificationPreferences(userId);
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
 * Update notification preferences for the logged-in user
 */
export const updateNotificationPreferences = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!._id;
    const preferences = await notificationService.updateNotificationPreferences(
      userId,
      req.body
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
 * Create notification (Admin / System usage)
 */
export const createNotification = async (req: Request, res: Response): Promise<Response> => {
  try {
    const notification = await notificationService.createNotification(req.body);
    if (!notification) {
      return sendSuccess(res, 'Notification creation skipped based on user preferences', null);
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
