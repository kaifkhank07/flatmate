'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useChatStore, selectChatUnreadCount } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { connectSocket } from '@/lib/socket';
import { ChatMessageItem } from '@/types/chat';

interface ChatBellProps {
  className?: string;
  onClick?: () => void;
  showBadgeOnly?: boolean;
}

export default function ChatBell({
  className = '',
  onClick,
  showBadgeOnly = false,
}: ChatBellProps) {
  const pathname = usePathname();
  const unreadCount = useChatStore(selectChatUnreadCount);
  const { fetchConversations, handleIncomingMessage, handleMessageRead } = useChatStore();
  const { isAuthenticated, isInitialized, user } = useAuthStore();

  const isActive = pathname === '/chat';

  // Fetch initial conversations to compute unread count on mount when authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      fetchConversations();
    }
  }, [isInitialized, isAuthenticated, fetchConversations]);

  // Connect to socket and listen for real-time messages so badge updates live across the site
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    const socket = connectSocket();
    const currentUserId = user?._id;

    const onNewMessage = (msg: ChatMessageItem) => {
      handleIncomingMessage(msg, currentUserId);
    };

    const onMessageRead = (data: { conversationId: string; readerId: string }) => {
      handleMessageRead(data, currentUserId);
    };

    socket.on('new_message', onNewMessage);
    socket.on('message_read', onMessageRead);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('message_read', onMessageRead);
    };
  }, [isInitialized, isAuthenticated, user?._id, handleIncomingMessage, handleMessageRead]);

  if (showBadgeOnly) {
    if (unreadCount <= 0) return null;
    return (
      <span
        className={`bg-[#0066F9] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ${className}`}
      >
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    );
  }

  return (
    <Link
      href="/chat"
      onClick={onClick}
      aria-label={`Chat${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      className={`relative p-2 rounded-full transition-colors cursor-pointer select-none ${
        isActive
          ? 'text-[#0066F9] bg-blue-50/70'
          : 'text-gray-700 hover:text-[#0066F9] hover:bg-gray-50'
      } ${className}`}
    >
      <MessageCircle className="w-5 h-5 lg:w-6 lg:h-6" />

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#0066F9] rounded-full border-2 border-white shadow-xs">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

export { ChatBell as ChatIcon, ChatBell as ChatMessageBell, ChatBell as ChatNotification };
