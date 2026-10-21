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
  updateNotificationPreferences,
  updatePropertyMatchPreferences,
} from '../../controllers/notification/notification.controller';
import {
  createNotificationSchema,
  getNotificationsQuerySchema,
  markAsReadSchema,
  updateNotificationPreferencesSchema,
  updatePropertyMatchPreferencesSchema,
} from '../../validations/notification/notification.validation';

const router = Router();

// ---------------------------------------------------------------------------
// Notification Feed & Status Routes (User & Admin)
// ---------------------------------------------------------------------------
router.get('/', authenticateUserOrAdmin, validate(getNotificationsQuerySchema), getNotifications);
router.get('/unread-count', authenticateUserOrAdmin, getUnreadNotificationCount);
router.patch('/read-all', authenticateUserOrAdmin, markAllNotificationsAsRead);
router.patch('/:notificationId/read', authenticateUserOrAdmin, validate(markAsReadSchema), markNotificationAsRead);
router.delete('/:notificationId', authenticateUserOrAdmin, deleteNotification);

// ---------------------------------------------------------------------------
// Preference Management Routes
// ---------------------------------------------------------------------------
router.get('/preferences', authenticateUserOrAdmin, getNotificationPreferences);
router.patch(
  '/preferences',
  authenticateUserOrAdmin,
  validate(updateNotificationPreferencesSchema),
  updateNotificationPreferences
);
router.patch(
  '/preferences/property-match',
  authenticateUser,
  validate(updatePropertyMatchPreferencesSchema),
  updatePropertyMatchPreferences
);

// ---------------------------------------------------------------------------
// Admin / Inter-service Notification Creation Route
// ---------------------------------------------------------------------------
router.post('/', authenticateUserOrAdmin, validate(createNotificationSchema), createNotification);

export default router;
