'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  INotificationItem,
  NotificationCategory,
  NotificationPriority,
} from '@/types/notification.types';
import { useNotificationStore } from '@/store/useNotificationStore';
import DeleteNotificationDialog from './DeleteNotificationDialog';
import {
  ShieldCheck,
  Home,
  Sparkles,
  MessageCircle,
  UserCheck,
  Star,
  ShieldAlert,
  AlertCircle,
  Check,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface NotificationItemProps {
  notification: INotificationItem;
}

/**
 * Format relative time (e.g. "Just now", "10m ago", "3h ago", "Yesterday")
 */
function formatTimeAgo(dateString: string): string {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 172800) return 'Yesterday';
    return past.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: past.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Recently';
  }
}

/**
 * Get category icon and accent colors
 */
function getCategoryVisuals(category: NotificationCategory) {
  switch (category) {
    case 'ACCOUNT_AND_VERIFICATION':
      return {
        icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
        bg: 'bg-emerald-50 border-emerald-100',
      };
    case 'LISTING_UPDATES':
      return {
        icon: <Home className="w-5 h-5 text-[#0066F9]" />,
        bg: 'bg-blue-50 border-blue-100',
      };
    case 'PROPERTY_MATCH':
      return {
        icon: <Sparkles className="w-5 h-5 text-amber-500" />,
        bg: 'bg-amber-50 border-amber-100',
      };
    case 'CHAT':
      return {
        icon: <MessageCircle className="w-5 h-5 text-indigo-600" />,
        bg: 'bg-indigo-50 border-indigo-100',
      };
    case 'INQUIRIES_AND_REQUESTS':
      return {
        icon: <UserCheck className="w-5 h-5 text-teal-600" />,
        bg: 'bg-teal-50 border-teal-100',
      };
    case 'REPORTS_AND_REVIEWS':
      return {
        icon: <Star className="w-5 h-5 text-purple-600" />,
        bg: 'bg-purple-50 border-purple-100',
      };
    case 'ADMINISTRATIVE':
      return {
        icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
        bg: 'bg-rose-50 border-rose-100',
      };
    case 'SYSTEM':
    default:
      return {
        icon: <AlertCircle className="w-5 h-5 text-red-600" />,
        bg: 'bg-red-50 border-red-100',
      };
  }
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter();
  const { markAsRead, deleteNotification, isItemActionLoading } = useNotificationStore();

  const isActionBusy = isItemActionLoading[notification._id] || false;
  const { icon, bg } = getCategoryVisuals(notification.category);
  const formattedTime = formatTimeAgo(notification.createdAt);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Validate internal action route safety
  const isValidInternalRoute =
    Boolean(notification.actionUrl) &&
    notification.actionUrl!.startsWith('/') &&
    !notification.actionUrl!.startsWith('//');

  const handleCardClick = async () => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (isValidInternalRoute && notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead && !isActionBusy) {
      await markAsRead(notification._id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isActionBusy) {
      setShowDeleteDialog(true);
    }
  };

  const handleConfirmDelete = async () => {
    await deleteNotification(notification._id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
      className={`group relative flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 ${
        isValidInternalRoute ? 'cursor-pointer' : ''
      } ${
        notification.isRead
          ? 'bg-white border-[#E2EFF8] hover:border-[#CCDDEE] hover:shadow-xs'
          : 'bg-[#F4F9FF] border-[#B9DCFF] shadow-xs hover:border-[#96C7FF]'
      }`}
    >
      {/* Category Icon */}
      <div
        className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border ${bg}`}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {/* Unread indicator */}
          {!notification.isRead && (
            <span
              className="w-2 h-2 rounded-full bg-[#0066F9] shrink-0"
              title="Unread notification"
            />
          )}

          {/* Title */}
          <h4
            className={`text-sm sm:text-base font-semibold truncate ${
              notification.isRead ? 'text-gray-900' : 'text-gray-950 font-bold'
            }`}
          >
            {notification.title}
          </h4>

          {/* Priority pill for High/Urgent */}
          {/* {notification.priority === 'URGENT' && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              Urgent
            </span>
          )}
          {notification.priority === 'HIGH' && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              High
            </span>
          )} */}

          {/* Timestamp */}
          <span className="ml-auto text-xs text-gray-600 shrink-0">{formattedTime}</span>
        </div>

        {/* Message body */}
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
          {notification.message}
        </p>

        {/* Action button if actionable */}
        {isValidInternalRoute && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-[#0066F9] hover:underline">
            <span>View details</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="shrink-0 flex items-center gap-1 self-start sm:opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <button
            type="button"
            onClick={handleMarkAsRead}
            disabled={isActionBusy}
            title="Mark as read"
            aria-label="Mark as read"
            className="p-1.5 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
          >
            {isActionBusy ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={isActionBusy}
          title="Delete notification"
          aria-label="Delete notification"
          className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Delete Confirmation Dialog */}
    <DeleteNotificationDialog
      isOpen={showDeleteDialog}
      notificationTitle={notification.title}
      isDeleting={isActionBusy}
      onConfirm={handleConfirmDelete}
      onCancel={() => setShowDeleteDialog(false)}
    />
  </>
  );
}
