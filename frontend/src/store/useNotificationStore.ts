import { create } from 'zustand';
import {
  INotificationItem,
  INotificationPreferences,
  GetNotificationsFilters,
  NotificationPagination,
  UpdateNotificationPreferencesPayload,
} from '@/types/notification.types';
import {
  getNotificationsApi,
  getUnreadCountApi,
  getPreferencesApi,
  updatePreferencesApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  deleteNotificationApi,
} from '@/services/notification.service';

interface NotificationState {
  // Data
  notifications: INotificationItem[];
  unreadCount: number;
  preferences: INotificationPreferences | null;
  pagination: NotificationPagination;
  filters: GetNotificationsFilters;

  // Status flags
  isLoading: boolean;
  isLoadingMore: boolean;
  isUnreadCountLoading: boolean;
  isPreferencesLoading: boolean;
  isSavingPreferences: boolean;
  isItemActionLoading: Record<string, boolean>;

  // Errors
  error: string | null;
  preferencesError: string | null;

  // Actions
  fetchNotifications: (filters?: GetNotificationsFilters, refresh?: boolean) => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  setFilters: (newFilters: Partial<GetNotificationsFilters>) => void;
  fetchUnreadCount: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (payload: UpdateNotificationPreferencesPayload) => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  reset: () => void;
}

const INITIAL_PAGINATION: NotificationPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

const INITIAL_FILTERS: GetNotificationsFilters = {
  page: 1,
  limit: 20,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  preferences: null,
  pagination: { ...INITIAL_PAGINATION },
  filters: { ...INITIAL_FILTERS },

  isLoading: false,
  isLoadingMore: false,
  isUnreadCountLoading: false,
  isPreferencesLoading: false,
  isSavingPreferences: false,
  isItemActionLoading: {},

  error: null,
  preferencesError: null,

  /**
   * Fetch notification list with pagination and filter criteria
   */
  fetchNotifications: async (newFilters?: GetNotificationsFilters, refresh: boolean = true) => {
    const currentFilters = get().filters;
    const mergedFilters = {
      ...currentFilters,
      ...(newFilters || {}),
      page: refresh ? 1 : newFilters?.page || currentFilters.page || 1,
    };

    if (get().isLoading) return;

    set({
      isLoading: true,
      error: null,
      filters: mergedFilters,
      ...(refresh ? { notifications: [] } : {}),
    });

    try {
      const data = await getNotificationsApi(mergedFilters);
      set({
        notifications: data.notifications,
        pagination: data.pagination,
        unreadCount: data.unreadCount,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to load notifications',
        isLoading: false,
      });
    }
  },

  /**
   * Load the next page of notifications and append to existing list
   */
  loadMoreNotifications: async () => {
    const { pagination, filters, isLoading, isLoadingMore, notifications } = get();
    if (isLoading || isLoadingMore) return;
    if (pagination.page >= pagination.totalPages) return;

    const nextPage = pagination.page + 1;
    const nextFilters = { ...filters, page: nextPage };

    set({ isLoadingMore: true, error: null });

    try {
      const data = await getNotificationsApi(nextFilters);
      const existingIds = new Set(notifications.map((n) => n._id));
      const uniqueNewItems = data.notifications.filter((n) => !existingIds.has(n._id));

      set({
        notifications: [...notifications, ...uniqueNewItems],
        pagination: data.pagination,
        unreadCount: data.unreadCount,
        filters: nextFilters,
        isLoadingMore: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to load more notifications',
        isLoadingMore: false,
      });
    }
  },

  /**
   * Update active query filter parameters and refresh feed
   */
  setFilters: (newFilters: Partial<GetNotificationsFilters>) => {
    const updated = {
      ...get().filters,
      ...newFilters,
      page: 1,
    };
    get().fetchNotifications(updated, true);
  },

  /**
   * Fetch unread notification badge count
   */
  fetchUnreadCount: async () => {
    if (get().isUnreadCountLoading) return;
    set({ isUnreadCountLoading: true });
    try {
      const count = await getUnreadCountApi();
      set({ unreadCount: count, isUnreadCountLoading: false });
    } catch {
      set({ isUnreadCountLoading: false });
    }
  },

  /**
   * Fetch current user's notification preferences
   */
  fetchPreferences: async () => {
    if (get().isPreferencesLoading) return;
    set({ isPreferencesLoading: true, preferencesError: null });
    try {
      const data = await getPreferencesApi();
      set({ preferences: data, isPreferencesLoading: false });
    } catch (err: any) {
      set({
        preferencesError:
          err?.response?.data?.message || err?.message || 'Failed to load preferences',
        isPreferencesLoading: false,
      });
    }
  },

  /**
   * Update user's global and category channel preferences
   */
  updatePreferences: async (payload: UpdateNotificationPreferencesPayload): Promise<boolean> => {
    set({ isSavingPreferences: true, preferencesError: null });
    try {
      const updated = await updatePreferencesApi(payload);
      set({ preferences: updated, isSavingPreferences: false });
      return true;
    } catch (err: any) {
      set({
        preferencesError:
          err?.response?.data?.message || err?.message || 'Failed to save preferences',
        isSavingPreferences: false,
      });
      return false;
    }
  },


  /**
   * Mark a single notification item as read
   */
  markAsRead: async (notificationId: string): Promise<boolean> => {
    set((state) => ({
      isItemActionLoading: { ...state.isItemActionLoading, [notificationId]: true },
    }));

    try {
      const updated = await markNotificationAsReadApi(notificationId);
      set((state) => {
        const item = state.notifications.find((n) => n._id === notificationId);
        const wasUnread = item ? !item.isRead : true;

        return {
          notifications: state.notifications.map((n) =>
            n._id === notificationId ? { ...n, ...updated, isRead: true } : n
          ),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          isItemActionLoading: { ...state.isItemActionLoading, [notificationId]: false },
        };
      });
      return true;
    } catch {
      set((state) => ({
        isItemActionLoading: { ...state.isItemActionLoading, [notificationId]: false },
      }));
      return false;
    }
  },

  /**
   * Mark all unread notifications as read
   */
  markAllAsRead: async (): Promise<boolean> => {
    set({ isLoading: true });
    try {
      await markAllNotificationsAsReadApi();
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to mark all as read',
        isLoading: false,
      });
      return false;
    }
  },

  /**
   * Permanently delete a notification item
   */
  deleteNotification: async (notificationId: string): Promise<boolean> => {
    set((state) => ({
      isItemActionLoading: { ...state.isItemActionLoading, [notificationId]: true },
    }));

    try {
      await deleteNotificationApi(notificationId);
      set((state) => {
        const item = state.notifications.find((n) => n._id === notificationId);
        const wasUnread = item && !item.isRead;

        return {
          notifications: state.notifications.filter((n) => n._id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          pagination: {
            ...state.pagination,
            total: Math.max(0, state.pagination.total - 1),
          },
          isItemActionLoading: { ...state.isItemActionLoading, [notificationId]: false },
        };
      });
      return true;
    } catch {
      set((state) => ({
        isItemActionLoading: { ...state.isItemActionLoading, [notificationId]: false },
      }));
      return false;
    }
  },

  /**
   * Clear all notification data on logout or account switch
   */
  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      preferences: null,
      pagination: { ...INITIAL_PAGINATION },
      filters: { ...INITIAL_FILTERS },
      isLoading: false,
      isLoadingMore: false,
      isUnreadCountLoading: false,
      isPreferencesLoading: false,
      isSavingPreferences: false,
      isItemActionLoading: {},
      error: null,
      preferencesError: null,
    });
  },
}));

// Also alias for consistent imports
export default useNotificationStore;
