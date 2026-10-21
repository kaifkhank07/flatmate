import apiClient from '@/lib/api';
import {
  NotificationApiResponse,
  GetNotificationsFilters,
  GetNotificationsResponseData,
  INotificationItem,
  INotificationPreferences,
  IPropertyMatchPreferences,
  UpdateNotificationPreferencesPayload,
} from '@/types/notification.types';

/**
 * Centralized API route definitions for notifications
 */
export const NOTIFICATION_ENDPOINTS = {
  BASE: '/notifications',
  UNREAD_COUNT: '/notifications/unread-count',
  PREFERENCES: '/notifications/preferences',
  PROPERTY_MATCH_PREFERENCES: '/notifications/preferences/property-match',
  READ_ALL: '/notifications/read-all',
  MARK_READ: (id: string) => `/notifications/${id}/read`,
  DELETE: (id: string) => `/notifications/${id}`,
} as const;

/**
 * Fetch paginated notification feed with optional filters
 */
export const getNotificationsApi = async (
  filters: GetNotificationsFilters = {}
): Promise<GetNotificationsResponseData> => {
  const params: Record<string, any> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.category) params.category = filters.category;
  if (filters.eventType) params.eventType = filters.eventType;
  if (filters.priority) params.priority = filters.priority;
  if (typeof filters.isRead === 'boolean') params.isRead = filters.isRead;

  const res = await apiClient.get<NotificationApiResponse<GetNotificationsResponseData>>(
    NOTIFICATION_ENDPOINTS.BASE,
    { params }
  );
  return res.data.data;
};

/**
 * Fetch total count of unread notifications for the active account
 */
export const getUnreadCountApi = async (): Promise<number> => {
  const res = await apiClient.get<NotificationApiResponse<{ unreadCount: number }>>(
    NOTIFICATION_ENDPOINTS.UNREAD_COUNT
  );
  return res.data.data.unreadCount;
};

/**
 * Fetch user's notification preferences
 */
export const getPreferencesApi = async (): Promise<INotificationPreferences> => {
  const res = await apiClient.get<NotificationApiResponse<INotificationPreferences>>(
    NOTIFICATION_ENDPOINTS.PREFERENCES
  );
  return res.data.data;
};

/**
 * Update global channel and category-level notification preferences
 */
export const updatePreferencesApi = async (
  payload: UpdateNotificationPreferencesPayload
): Promise<INotificationPreferences> => {
  const res = await apiClient.patch<NotificationApiResponse<INotificationPreferences>>(
    NOTIFICATION_ENDPOINTS.PREFERENCES,
    payload
  );
  return res.data.data;
};

/**
 * Update smart property-matching criteria filters
 */
export const updatePropertyMatchPreferencesApi = async (
  payload: Partial<IPropertyMatchPreferences>
): Promise<IPropertyMatchPreferences> => {
  const res = await apiClient.patch<NotificationApiResponse<IPropertyMatchPreferences>>(
    NOTIFICATION_ENDPOINTS.PROPERTY_MATCH_PREFERENCES,
    payload
  );
  return res.data.data;
};

/**
 * Mark a single notification item as read
 */
export const markNotificationAsReadApi = async (
  notificationId: string
): Promise<INotificationItem> => {
  const res = await apiClient.patch<NotificationApiResponse<INotificationItem>>(
    NOTIFICATION_ENDPOINTS.MARK_READ(notificationId)
  );
  return res.data.data;
};

/**
 * Mark all user notifications as read in bulk
 */
export const markAllNotificationsAsReadApi = async (): Promise<{
  updatedCount: number;
  readAt: string;
}> => {
  const res = await apiClient.patch<
    NotificationApiResponse<{ updatedCount: number; readAt: string }>
  >(NOTIFICATION_ENDPOINTS.READ_ALL);
  return res.data.data;
};

/**
 * Permanently delete a notification item
 */
export const deleteNotificationApi = async (notificationId: string): Promise<boolean> => {
  await apiClient.delete<NotificationApiResponse<null>>(
    NOTIFICATION_ENDPOINTS.DELETE(notificationId)
  );
  return true;
};
