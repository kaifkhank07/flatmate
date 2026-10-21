'use client';

import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import NotificationItem from './NotificationItem';
import {
  NotificationCategory,
  NOTIFICATION_CATEGORY_META,
} from '@/types/notification.types';
import EmptyState from '@/components/utils/EmptyState';
import {
  Bell,
  CheckCheck,
  Filter,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

const CATEGORY_OPTIONS: Array<{ key: NotificationCategory | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'PROPERTY_MATCH', label: 'Property Matches' },
  { key: 'CHAT', label: 'Chat' },
  { key: 'LISTING_UPDATES', label: 'Listings' },
  { key: 'INQUIRIES_AND_REQUESTS', label: 'Inquiries' },
  { key: 'ACCOUNT_AND_VERIFICATION', label: 'Account' },
  { key: 'REPORTS_AND_REVIEWS', label: 'Reviews' },
  { key: 'SYSTEM', label: 'System' },
];

export default function NotificationList() {
  const {
    notifications,
    unreadCount,
    pagination,
    filters,
    isLoading,
    isLoadingMore,
    error,
    fetchNotifications,
    loadMoreNotifications,
    setFilters,
    markAllAsRead,
  } = useNotificationStore();

  const [selectedTab, setSelectedTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'ALL'>('ALL');

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle Tab change (All vs Unread)
  const handleTabChange = (tab: 'ALL' | 'UNREAD') => {
    setSelectedTab(tab);
    setFilters({
      isRead: tab === 'UNREAD' ? false : undefined,
    });
  };

  // Handle Category change
  const handleCategoryChange = (cat: NotificationCategory | 'ALL') => {
    setSelectedCategory(cat);
    setFilters({
      category: cat === 'ALL' ? undefined : cat,
    });
  };

  const handleResetFilters = () => {
    setSelectedTab('ALL');
    setSelectedCategory('ALL');
    setFilters({
      category: undefined,
      isRead: undefined,
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Control Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2EFF8]">
        {/* All vs Unread Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('ALL')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer ${
              selectedTab === 'ALL'
                ? 'bg-[#0066F9] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-[#E2EFF8]'
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('UNREAD')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer ${
              selectedTab === 'UNREAD'
                ? 'bg-[#0066F9] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-[#E2EFF8]'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedTab === 'UNREAD'
                    ? 'bg-white text-[#0066F9]'
                    : 'bg-[#0066F9] text-white'
                }`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Category Dropdown */}
          {/* <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value as any)}
              className="appearance-none bg-white border border-[#E2EFF8] rounded-full px-4 py-2 pr-8 text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0066F9]/20 cursor-pointer shadow-xs"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div> */}

          {/* Mark All As Read */}
          {/* {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0066F9] hover:text-[#0052C7] transition cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          )} */}

          {/* Refresh */}
          <button
            type="button"
            onClick={() => fetchNotifications()}
            title="Refresh notifications"
            disabled={isLoading}
            className="p-2 rounded-full bg-white border border-[#E2EFF8] text-gray-600 hover:text-[#0066F9] hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchNotifications()}
            className="underline font-semibold hover:text-red-900 ml-4 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && notifications.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse flex items-start gap-4 p-4 sm:p-5 rounded-3xl bg-white border border-[#E2EFF8]"
            >
              <div className="w-11 h-11 rounded-2xl bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded-md w-1/3" />
                <div className="h-3 bg-gray-200 rounded-md w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && notifications.length === 0 && (
        <EmptyState
          boxed
          icon={<Bell className="w-10 h-10 text-[#0066F9]" />}
          title={selectedTab === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
          message={
            selectedTab === 'UNREAD'
              ? 'You have caught up with all your alerts.'
              : selectedCategory !== 'ALL'
              ? 'No notifications found in this category.'
              : 'Listing updates, chat messages, and match alerts will appear here.'
          }
          actionLabel={
            selectedTab === 'UNREAD' || selectedCategory !== 'ALL' ? 'View all alerts' : undefined
          }
          onAction={
            selectedTab === 'UNREAD' || selectedCategory !== 'ALL' ? handleResetFilters : undefined
          }
        />
      )}

      {/* Notification Items Feed */}
      {notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItem key={notification._id} notification={notification} />
          ))}
        </div>
      )}

      {/* Pagination / Load More Button */}
      {pagination.page < pagination.totalPages && (
        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={loadMoreNotifications}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-[#E2EFF8] text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#0066F9] hover:border-[#B9DCFF] shadow-xs hover:shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0066F9]" />
                <span>Loading more...</span>
              </>
            ) : (
              <span>Load more notifications</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
