'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';

interface NotificationBellProps {
  className?: string;
  onClick?: () => void;
  showBadgeOnly?: boolean;
}

export default function NotificationBell({
  className = '',
  onClick,
  showBadgeOnly = false,
}: NotificationBellProps) {
  const pathname = usePathname();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const { isAuthenticated, isInitialized } = useAuthStore();

  const isActive = pathname === '/notifications';

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isInitialized, isAuthenticated, fetchUnreadCount]);

  if (showBadgeOnly) {
    if (unreadCount <= 0) return null;
    return (
      <span className="bg-[#0066F9] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    );
  }

  return (
    <Link
      href="/notifications"
      onClick={onClick}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      className={`relative p-2 rounded-full transition-colors cursor-pointer select-none ${
        isActive
          ? 'text-[#0066F9] bg-blue-50/70'
          : 'text-gray-700 hover:text-[#0066F9] hover:bg-gray-50'
      } ${className}`}
    >
      <Bell className="w-5 h-5 lg:w-6 lg:h-6" />

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#0066F9] rounded-full border-2 border-white shadow-xs">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
