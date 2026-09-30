import { Router } from 'express';
import { authenticateUser, authenticateUserOrAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createNotification,
  deleteNotification,
  getNotifications,
  getNotificationPreferences,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  updateNotificationPreferences
} from '../../controllers/notification/notification.controller';
import {
  createNotificationSchema,
  getNotificationsQuerySchema,
  markAsReadSchema,
  updateNotificationPreferencesSchema,
} from '../../validations/notification/notification.validation';

const router = Router();

// User Notification Routes
router.get('/', authenticateUser, validate(getNotificationsQuerySchema), getNotifications);
router.get('/unread-count', authenticateUser, getUnreadNotificationCount);
router.get('/preferences', authenticateUser, getNotificationPreferences);
router.patch('/preferences', authenticateUser, validate(updateNotificationPreferencesSchema), updateNotificationPreferences);
router.patch('/read-all', authenticateUser, markAllNotificationsAsRead);
router.patch('/:notificationId/read', authenticateUser, validate(markAsReadSchema), markNotificationAsRead);
router.delete('/:notificationId', authenticateUser, deleteNotification);

// Admin / System route to create notification
router.post('/', authenticateUserOrAdmin, validate(createNotificationSchema), createNotification);

export default router;
