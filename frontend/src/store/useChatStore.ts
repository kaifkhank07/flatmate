import { create } from 'zustand';
import {
  ChatConversationItem,
  ChatMessageItem,
  BlockedUserItem,
} from '@/types/chat';
import {
  getConversationsApi,
  getConversationByIdApi,
  getMessagesApi,
  sendChatMessageApi,
  markMessagesReadApi,
  deleteChatMessageApi,
  blockUserApi,
  unblockUserApi,
  getBlockedUsersApi,
  reportChatUserApi,
  ChatReportReason,
} from '@/lib/apiServices';

export interface TypingMap {
  [conversationId: string]: boolean;
}

interface ChatState {
  // State
  conversations: ChatConversationItem[];
  activeConversationId: string | null;
  activeConversation: ChatConversationItem | null;
  messages: ChatMessageItem[];
  blockedUsers: BlockedUserItem[];
  onlineUserIds: string[];
  typingState: TypingMap;
  unreadCount: number;
  loadingConversations: boolean;
  loadingMessages: boolean;
  loadingMoreMessages: boolean;
  sendingMessage: boolean;
  errorConversations: string | null;
  errorMessages: string | null;
  messagesPage: number;
  hasMoreMessages: boolean;

  // Actions
  fetchConversations: (search?: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  fetchMessages: (conversationId: string, isLoadMore?: boolean) => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<ChatMessageItem | null>;
  markRead: (conversationId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  blockUser: (userId: string, reason?: string) => Promise<boolean>;
  unblockUser: (userId: string) => Promise<boolean>;
  fetchBlockedUsers: () => Promise<void>;
  reportUser: (reportedUserId: string, reason: ChatReportReason, description?: string) => Promise<boolean>;

  // Real-Time Socket Event Handlers
  setOnlineUsersList: (userIds: string[]) => void;
  handleUserOnline: (userId: string) => void;
  handleUserOffline: (userId: string) => void;
  handleIncomingMessage: (msg: ChatMessageItem, currentUserId?: string) => void;
  handleMessageRead: (data: { conversationId: string; readerId: string }, currentUserId?: string) => void;
  handleDeliveryUpdated: (msg: ChatMessageItem) => void;
  handleTypingStart: (data: { conversationId: string; userId: string }) => void;
  handleTypingStop: (data: { conversationId: string; userId: string }) => void;
  handleUserBlockUpdated: (data: { blockerId: string; blockedUserId: string; isBlocked: boolean }, currentUserId?: string) => void;

  resetChatStore: () => void;
}

export const selectChatUnreadCount = (state: ChatState): number => {
  if (typeof state.unreadCount === 'number' && !isNaN(state.unreadCount)) {
    return state.unreadCount;
  }
  return state.conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  activeConversation: null,
  messages: [],
  blockedUsers: [],
  onlineUserIds: [],
  typingState: {},
  unreadCount: 0,
  loadingConversations: false,
  loadingMessages: false,
  loadingMoreMessages: false,
  sendingMessage: false,
  errorConversations: null,
  errorMessages: null,
  messagesPage: 1,
  hasMoreMessages: false,

  /**
   * Fetch authenticated user's conversations list
   */
  fetchConversations: async (search?: string) => {
    set({ loadingConversations: true, errorConversations: null });
    try {
      const res = await getConversationsApi({ search, limit: 50 });
      let list: ChatConversationItem[] = [];

      if (res?.data?.conversations && Array.isArray(res.data.conversations)) {
        list = res.data.conversations;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      }

      // Preserve activeConversation if activeConversationId is set so active chat is never lost during search!
      const currentActiveId = get().activeConversationId;
      const currentActiveConv = get().activeConversation;
      let preservedActiveConv = currentActiveConv;

      if (currentActiveId) {
        const foundInNewList = list.find((c) => c._id === currentActiveId);
        if (foundInNewList) {
          preservedActiveConv = foundInNewList;
        }
      }

      const currentOnlineUserIds = get().onlineUserIds;
      if (currentOnlineUserIds.length > 0) {
        list = list.map((c) => {
          const otherId = c.otherParticipant?._id;
          const isOnline = c.isBlockedByOther
            ? false
            : Boolean(otherId && (currentOnlineUserIds.includes(otherId) || c.isOnline));
          return { ...c, isOnline };
        });
        if (preservedActiveConv) {
          const otherId = preservedActiveConv.otherParticipant?._id;
          const isOnline = preservedActiveConv.isBlockedByOther
            ? false
            : Boolean(otherId && (currentOnlineUserIds.includes(otherId) || preservedActiveConv.isOnline));
          preservedActiveConv = { ...preservedActiveConv, isOnline };
        }
      }

      const totalUnread = list.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

      set({
        conversations: list,
        unreadCount: totalUnread,
        activeConversation: preservedActiveConv,
        loadingConversations: false,
        errorConversations: null,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load conversations';
      set({
        loadingConversations: false,
        errorConversations: msg,
      });
    }
  },

  /**
   * Fetch total unread count for current user
   */
  fetchUnreadCount: async () => {
    try {
      await get().fetchConversations();
    } catch {
      // ignore
    }
  },

  /**
   * Select active conversation and load initial messages
   */
  selectConversation: async (conversationId: string) => {
    if (!conversationId) {
      set({
        activeConversationId: null,
        activeConversation: null,
        messages: [],
        messagesPage: 1,
        hasMoreMessages: false,
        errorMessages: null,
      });
      return;
    }

    const existingConv =
      get().conversations.find((c) => c._id === conversationId) ||
      (get().activeConversationId === conversationId ? get().activeConversation : null);

    if (get().activeConversationId === conversationId && get().messages.length > 0) {
      if (existingConv && !get().activeConversation) {
        set({ activeConversation: existingConv });
      }
      return;
    }

    set({
      activeConversationId: conversationId,
      activeConversation: existingConv || null,
      messages: [],
      messagesPage: 1,
      hasMoreMessages: false,
      errorMessages: null,
    });

    // If existingConv was not found in the current conversations list, fetch it by ID so details stay intact
    if (!existingConv) {
      try {
        const res = await getConversationByIdApi(conversationId);
        const convData = res?.data || res;
        if (convData && convData._id) {
          set({ activeConversation: convData });
        }
      } catch (e) {
        // Ignore failure
      }
    }

    await get().fetchMessages(conversationId, false);
    get().markRead(conversationId);
  },

  /**
   * Fetch messages for active conversation
   */
  fetchMessages: async (conversationId: string, isLoadMore = false) => {
    const currentPage = isLoadMore ? get().messagesPage + 1 : 1;

    if (isLoadMore) {
      set({ loadingMoreMessages: true });
    } else {
      set({ loadingMessages: true, errorMessages: null });
    }

    try {
      let beforeParam: string | undefined = undefined;
      if (isLoadMore && get().messages.length > 0) {
        beforeParam = get().messages[0]._id;
      }

      const res = await getMessagesApi(conversationId, {
        page: currentPage,
        limit: 40,
        before: beforeParam,
      });

      const rawMessages: ChatMessageItem[] = res?.data?.messages || res?.data || [];
      const pagination = res?.data?.pagination;

      // Backend returns messages sorted newest-first ({ createdAt: -1 }), reverse to render chronologically
      const chronologicalMessages = [...rawMessages].reverse();

      if (isLoadMore) {
        set((state) => ({
          messages: [...chronologicalMessages, ...state.messages],
          messagesPage: currentPage,
          hasMoreMessages: pagination ? currentPage < pagination.totalPages : rawMessages.length > 0,
          loadingMoreMessages: false,
        }));
      } else {
        set({
          messages: chronologicalMessages,
          messagesPage: 1,
          hasMoreMessages: pagination ? pagination.totalPages > 1 : rawMessages.length >= 40,
          loadingMessages: false,
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load messages';
      set({
        loadingMessages: false,
        loadingMoreMessages: false,
        errorMessages: msg,
      });
    }
  },

  /**
   * Send a text message in the active conversation
   */
  sendMessage: async (conversationId: string, text: string) => {
    if (!text.trim()) return null;
    set({ sendingMessage: true });

    try {
      const res = await sendChatMessageApi(conversationId, {
        text: text.trim(),
        type: 'text',
      });

      const sentMsg: ChatMessageItem = res?.data || res;

      if (sentMsg && sentMsg._id) {
        set((state) => {
          const exists = state.messages.some((m) => m._id === sentMsg._id);
          const updatedMessages =
            state.activeConversationId === conversationId
              ? exists
                ? state.messages
                : [...state.messages, sentMsg]
              : state.messages;

          const updatedConversations = state.conversations.map((conv) => {
            if (conv._id === conversationId) {
              return {
                ...conv,
                lastMessage: sentMsg,
                lastMessageAt: sentMsg.createdAt,
                updatedAt: sentMsg.createdAt,
              };
            }
            return conv;
          });

          const updatedActiveConv =
            state.activeConversation && state.activeConversation._id === conversationId
              ? {
                  ...state.activeConversation,
                  lastMessage: sentMsg,
                  lastMessageAt: sentMsg.createdAt,
                  updatedAt: sentMsg.createdAt,
                }
              : state.activeConversation;

          return {
            messages: updatedMessages,
            conversations: updatedConversations,
            activeConversation: updatedActiveConv,
            sendingMessage: false,
          };
        });

        return sentMsg;
      }

      set({ sendingMessage: false });
      return null;
    } catch (err: any) {
      set({ sendingMessage: false });
      throw err;
    }
  },

  /**
   * Mark all unread messages in a conversation as read
   */
  markRead: async (conversationId: string) => {
    try {
      await markMessagesReadApi(conversationId);

      set((state) => {
        const updated = state.conversations.map((c) =>
          c._id === conversationId ? { ...c, unreadCount: 0 } : c
        );
        return {
          conversations: updated,
          unreadCount: updated.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
        };
      });
    } catch (err) {
      // Non-critical, swallow silent error
    }
  },

  /**
   * Delete a message by ID
   */
  deleteMessage: async (messageId: string) => {
    try {
      const res = await deleteChatMessageApi(messageId);
      if (res?.success !== false) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === messageId
              ? { ...m, isDeleted: true, text: 'This message was deleted' }
              : m
          ),
        }));
        return true;
      }
      return false;
    } catch (err: any) {
      throw err;
    }
  },

  /**
   * Block a user
   */
  blockUser: async (userId: string, reason?: string) => {
    try {
      const res = await blockUserApi(userId, reason);
      if (res?.success !== false) {
        await get().fetchBlockedUsers();
        return true;
      }
      return false;
    } catch (err: any) {
      throw err;
    }
  },

  /**
   * Unblock a user
   */
  unblockUser: async (userId: string) => {
    try {
      const res = await unblockUserApi(userId);
      if (res?.success !== false) {
        await get().fetchBlockedUsers();
        return true;
      }
      return false;
    } catch (err: any) {
      throw err;
    }
  },

  /**
   * Fetch list of blocked users
   */
  fetchBlockedUsers: async () => {
    try {
      const res = await getBlockedUsersApi();
      const list = res?.data?.blockedUsers || res?.data || [];
      set({ blockedUsers: Array.isArray(list) ? list : [] });
    } catch (err) {
      // Ignore
    }
  },

  /**
   * Report a chat user
   */
  reportUser: async (reportedUserId: string, reason: ChatReportReason, description?: string) => {
    try {
      const res = await reportChatUserApi({
        reportedUserId,
        reason,
        description,
      });
      return res?.success !== false;
    } catch (err: any) {
      throw err;
    }
  },

  // ----------------------------------------------------
  // Real-Time Socket Event Handlers
  // ----------------------------------------------------
  handleIncomingMessage: (msg: ChatMessageItem, currentUserId?: string) => {
    if (!msg || !msg._id || !msg.conversationId) return;

    const convId =
      typeof msg.conversationId === 'object'
        ? (msg.conversationId as any)?._id
        : msg.conversationId;

    const senderIdStr =
      typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;

    const isFromMe = Boolean(currentUserId && senderIdStr === currentUserId);
    const activeId = get().activeConversationId;

    set((state) => {
      // Append message if active conversation matches
      let newMessages = state.messages;
      if (state.activeConversationId === convId) {
        const exists = state.messages.some((m) => m._id === msg._id);
        if (!exists) {
          newMessages = [...state.messages, msg];
        } else {
          newMessages = state.messages.map((m) => (m._id === msg._id ? msg : m));
        }
      }

      // Update conversations list preview
      let convExists = false;
      const updatedConversations = state.conversations.map((c) => {
        if (c._id === convId) {
          convExists = true;
          const alreadyProcessed = c.lastMessage?._id === msg._id;
          const isUnread = activeId !== convId && !isFromMe && !alreadyProcessed;
          return {
            ...c,
            lastMessage: msg,
            lastMessageAt: msg.createdAt,
            updatedAt: msg.createdAt,
            unreadCount: isUnread ? (c.unreadCount || 0) + 1 : c.unreadCount || 0,
          };
        }
        return c;
      });

      let updatedActiveConv = state.activeConversation;
      if (updatedActiveConv && updatedActiveConv._id === convId) {
        updatedActiveConv = {
          ...updatedActiveConv,
          lastMessage: msg,
          lastMessageAt: msg.createdAt,
          updatedAt: msg.createdAt,
        };
      }

      if (!convExists) {
        // Refresh full conversation list if new conversation received
        get().fetchConversations();
      }

      return {
        messages: newMessages,
        conversations: updatedConversations,
        activeConversation: updatedActiveConv,
        unreadCount: updatedConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
      };
    });

    // Automatically mark read if message arrived for currently open active conversation
    if (activeId === convId && !isFromMe) {
      get().markRead(convId);
    }
  },

  handleMessageRead: (data: { conversationId: string; readerId: string }, currentUserId?: string) => {
    const { conversationId, readerId } = data || {};
    if (!conversationId) return;

    set((state) => {
      // Only transition sent messages to 'read' if readerId is NOT the current user
      // (i.e. the other participant read our messages)
      const isOtherUserReading = currentUserId ? readerId !== currentUserId : true;

      if (!isOtherUserReading) {
        // If current user is the reader, just clear unread count for this conversation
        const updated = state.conversations.map((c) =>
          c._id === conversationId ? { ...c, unreadCount: 0 } : c
        );
        return {
          conversations: updated,
          unreadCount: updated.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
        };
      }

      const updatedMessages = state.messages.map((m) => {
        const mConvId =
          typeof m.conversationId === 'object'
            ? (m.conversationId as any)?._id
            : m.conversationId;

        if (mConvId === conversationId) {
          return { ...m, status: 'read' as const };
        }
        return m;
      });

      const updatedConversations = state.conversations.map((c) => {
        if (c._id === conversationId && c.lastMessage) {
          return {
            ...c,
            unreadCount: 0,
            lastMessage: {
              ...c.lastMessage,
              status: 'read' as const,
            },
          };
        }
        return c;
      });

      return {
        messages: updatedMessages,
        conversations: updatedConversations,
      };
    });
  },

  handleDeliveryUpdated: (msg: ChatMessageItem) => {
    if (!msg || !msg._id) return;
    set((state) => {
      const updatedMessages = state.messages.map((m) => {
        if (m._id === msg._id) {
          const newStatus: 'sent' | 'delivered' | 'read' =
            m.status === 'read' ? 'read' : 'delivered';
          return { ...m, status: newStatus };
        }
        return m;
      });

      const updatedConversations = state.conversations.map((c) => {
        if (c.lastMessage && c.lastMessage._id === msg._id) {
          const currentStatus = c.lastMessage.status;
          const newStatus: 'sent' | 'delivered' | 'read' =
            currentStatus === 'read' ? 'read' : 'delivered';
          return {
            ...c,
            lastMessage: {
              ...c.lastMessage,
              status: newStatus,
            },
          };
        }
        return c;
      });

      return {
        messages: updatedMessages,
        conversations: updatedConversations,
      };
    });
  },

  handleTypingStart: (data: { conversationId: string; userId: string }) => {
    if (!data || !data.conversationId) return;
    set((state) => ({
      typingState: {
        ...state.typingState,
        [data.conversationId]: true,
      },
    }));
  },

  handleTypingStop: (data: { conversationId: string; userId: string }) => {
    if (!data || !data.conversationId) return;
    set((state) => ({
      typingState: {
        ...state.typingState,
        [data.conversationId]: false,
      },
    }));
  },

  handleUserBlockUpdated: (data: { blockerId: string; blockedUserId: string; isBlocked: boolean }, currentUserId?: string) => {
    if (!data) return;
    const { blockerId, blockedUserId, isBlocked } = data;
    const targetOtherUserId = currentUserId === blockerId ? blockedUserId : blockerId;
    const isMeBlocker = Boolean(currentUserId && currentUserId === blockerId);

    set((state) => {
      const updatedConversations = state.conversations.map((c) => {
        const cOtherId = c.otherParticipant?._id;
        if (cOtherId === targetOtherUserId) {
          return {
            ...c,
            isBlocked,
            isBlockedByMe: isBlocked && isMeBlocker,
            isBlockedByOther: isBlocked && !isMeBlocker,
            blockedBy: isBlocked ? blockerId : null,
          };
        }
        return c;
      });

      let updatedActiveConv = state.activeConversation;
      if (updatedActiveConv && updatedActiveConv.otherParticipant?._id === targetOtherUserId) {
        updatedActiveConv = {
          ...updatedActiveConv,
          isBlocked,
          isBlockedByMe: isBlocked && isMeBlocker,
          isBlockedByOther: isBlocked && !isMeBlocker,
          blockedBy: isBlocked ? blockerId : null,
        };
      }

      return {
        conversations: updatedConversations,
        activeConversation: updatedActiveConv,
      };
    });

    if (isMeBlocker) {
      get().fetchBlockedUsers();
    }
  },

  setOnlineUsersList: (userIds: string[]) => {
    set((state) => {
      const updatedConversations = state.conversations.map((c) => {
        const otherId = c.otherParticipant?._id;
        const isOnline = c.isBlockedByOther
          ? false
          : Boolean(otherId && userIds.includes(otherId));
        return { ...c, isOnline };
      });

      let updatedActiveConv = state.activeConversation;
      if (updatedActiveConv) {
        const otherId = updatedActiveConv.otherParticipant?._id;
        const isOnline = updatedActiveConv.isBlockedByOther
          ? false
          : Boolean(otherId && userIds.includes(otherId));
        updatedActiveConv = { ...updatedActiveConv, isOnline };
      }

      return {
        onlineUserIds: userIds,
        conversations: updatedConversations,
        activeConversation: updatedActiveConv,
      };
    });
  },

  handleUserOnline: (userId: string) => {
    set((state) => {
      const newOnlineUserIds = state.onlineUserIds.includes(userId)
        ? state.onlineUserIds
        : [...state.onlineUserIds, userId];

      const updatedConversations = state.conversations.map((c) => {
        const otherId = c.otherParticipant?._id;
        if (otherId === userId) {
          return {
            ...c,
            isOnline: c.isBlockedByOther ? false : true,
          };
        }
        return c;
      });

      let updatedActiveConv = state.activeConversation;
      if (updatedActiveConv && updatedActiveConv.otherParticipant?._id === userId) {
        updatedActiveConv = {
          ...updatedActiveConv,
          isOnline: updatedActiveConv.isBlockedByOther ? false : true,
        };
      }

      return {
        onlineUserIds: newOnlineUserIds,
        conversations: updatedConversations,
        activeConversation: updatedActiveConv,
      };
    });
  },

  handleUserOffline: (userId: string) => {
    set((state) => {
      const newOnlineUserIds = state.onlineUserIds.filter((id) => id !== userId);

      const updatedConversations = state.conversations.map((c) => {
        const otherId = c.otherParticipant?._id;
        if (otherId === userId) {
          return {
            ...c,
            isOnline: false,
          };
        }
        return c;
      });

      let updatedActiveConv = state.activeConversation;
      if (updatedActiveConv && updatedActiveConv.otherParticipant?._id === userId) {
        updatedActiveConv = {
          ...updatedActiveConv,
          isOnline: false,
        };
      }

      return {
        onlineUserIds: newOnlineUserIds,
        conversations: updatedConversations,
        activeConversation: updatedActiveConv,
      };
    });
  },

  resetChatStore: () => {
    set({
      conversations: [],
      activeConversationId: null,
      activeConversation: null,
      messages: [],
      blockedUsers: [],
      onlineUserIds: [],
      typingState: {},
      unreadCount: 0,
      loadingConversations: false,
      loadingMessages: false,
      loadingMoreMessages: false,
      sendingMessage: false,
      errorConversations: null,
      errorMessages: null,
      messagesPage: 1,
      hasMoreMessages: false,
    });
  },
}));
