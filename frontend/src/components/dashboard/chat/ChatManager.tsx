"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Pencil,
  Search,
  Phone,
  MoreVertical,
  Mic,
  Send,
  Check,
  CheckCheck,
  ArrowLeft,
  ChevronDown,
  Ban,
  ShieldCheck,
  Flag,
  X,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { getMediaUrl } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { ChatMessageItem } from "@/types/chat";
import { ChatReportReason } from "@/lib/apiServices";

export interface ChatMessage {
  id: string;
  sender: "user" | "them";
  senderName: string;
  senderAvatar: string;
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
}

export interface ChatConversation {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  isTyping: boolean;
  lastTime: string;
  lastMessage: string;
  unreadCount?: number;
  isLastMsgFromMe?: boolean;
  lastMsgStatus?: "sent" | "delivered" | "read";
  isBlocked?: boolean;
  isBlockedByMe?: boolean;
  isBlockedByOther?: boolean;
  messages: ChatMessage[];
}

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200";

export default function ChatManager() {
  const { user, profile } = useAuthStore();
  const currentUserId = user?._id;

  const {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    blockedUsers,
    onlineUserIds,
    loadingMessages,
    typingState,
    sendingMessage,
    fetchConversations,
    selectConversation,
    sendMessage,
    blockUser,
    unblockUser,
    fetchBlockedUsers,
    reportUser,
    setOnlineUsersList,
    handleUserOnline,
    handleUserOffline,
    handleIncomingMessage,
    handleMessageRead,
    handleDeliveryUpdated,
    handleTypingStart,
    handleTypingStop,
    handleUserBlockUpdated,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);

  // Menu and Modals State
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
  const [showUnblockModal, setShowUnblockModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [blockReason, setBlockReason] = useState<string>("");
  const [blockError, setBlockError] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<ChatReportReason>("spam");
  const [reportDescription, setReportDescription] = useState<string>("");
  const [reportFeedback, setReportFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchQueryRef = useRef<string>(searchQuery);
  searchQueryRef.current = searchQuery;

  const showToastNotification = (msg: string) => {
    setStatusNotification(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setStatusNotification(null);
    }, 3500);
  };

  // Close menu on click outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMenuOpen]);

  // Fetch initial blocked users
  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  // Socket Connection & Real-Time Listeners
  useEffect(() => {
    fetchConversations();

    const socket = connectSocket();

    const onNewMessage = (msg: ChatMessageItem) => {
      handleIncomingMessage(msg, currentUserId);
    };

    const onMessageRead = (data: { conversationId: string; readerId: string }) => {
      handleMessageRead(data, currentUserId);
    };

    const onDeliveryUpdated = (msg: ChatMessageItem) => {
      handleDeliveryUpdated(msg);
    };

    const onTypingStart = (data: { conversationId: string; userId: string }) => {
      handleTypingStart(data);
    };

    const onTypingStop = (data: { conversationId: string; userId: string }) => {
      handleTypingStop(data);
    };

    const onUserBlockUpdated = (data: { blockerId: string; blockedUserId: string; isBlocked: boolean }) => {
      handleUserBlockUpdated(data, currentUserId);
    };

    const onOnlineUsersList = (data: { userIds: string[] }) => {
      if (data && Array.isArray(data.userIds)) {
        setOnlineUsersList(data.userIds);
      }
    };

    const onUserOnline = (data: { userId: string }) => {
      if (data?.userId) {
        handleUserOnline(data.userId);
      }
    };

    const onUserOffline = (data: { userId: string }) => {
      if (data?.userId) {
        handleUserOffline(data.userId);
      }
    };

    socket.on("new_message", onNewMessage);
    socket.on("message_read", onMessageRead);
    socket.on("message_delivery_updated", onDeliveryUpdated);
    socket.on("user_typing_start", onTypingStart);
    socket.on("user_typing_stop", onTypingStop);
    socket.on("user_block_updated", onUserBlockUpdated);
    socket.on("online_users_list", onOnlineUsersList);
    socket.on("user_online", onUserOnline);
    socket.on("user_offline", onUserOffline);

    const requestOnlineUsers = () => {
      socket.emit("get_online_users");
    };

    if (socket.connected) {
      requestOnlineUsers();
    }
    socket.on("connect", requestOnlineUsers);

    // Backup polling every 10 seconds
    const interval = setInterval(() => {
      fetchConversations(searchQueryRef.current);
    }, 10000);

    return () => {
      clearInterval(interval);
      socket.off("connect", requestOnlineUsers);
      socket.off("new_message", onNewMessage);
      socket.off("message_read", onMessageRead);
      socket.off("message_delivery_updated", onDeliveryUpdated);
      socket.off("user_typing_start", onTypingStart);
      socket.off("user_typing_stop", onTypingStop);
      socket.off("user_block_updated", onUserBlockUpdated);
      socket.off("online_users_list", onOnlineUsersList);
      socket.off("user_online", onUserOnline);
      socket.off("user_offline", onUserOffline);
    };
  }, [currentUserId]);

  // Join / Leave Room on Active Conversation Change
  useEffect(() => {
    const socket = connectSocket();
    if (activeConversationId && socket) {
      socket.emit("join_conversation", { conversationId: activeConversationId });
    }

    return () => {
      if (activeConversationId && socket) {
        socket.emit("leave_conversation", { conversationId: activeConversationId });
      }
    };
  }, [activeConversationId]);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      fetchConversations(val);
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    fetchConversations("");
  };

  // Handle Input Composer Change & Emit Typing Events
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    const socket = connectSocket();
    if (activeConversationId && socket && socket.connected) {
      socket.emit("typing_start", { conversationId: activeConversationId });

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => {
        socket.emit("typing_stop", { conversationId: activeConversationId });
      }, 1800);
    }
  };

  // Map real backend conversations to UI ChatConversation format
  const mappedConversations: ChatConversation[] = conversations.map((conv) => {
    const participant = conv.otherParticipant;
    const name = participant
      ? `${participant.firstName || ""} ${participant.lastName || ""}`.trim() ||
      participant.email ||
      "Chat User"
      : "Chat User";

    const avatar = getMediaUrl(participant?.image || participant?.avatar) || DEFAULT_AVATAR;
    const lastMsg = conv.lastMessage;
    const lastText = lastMsg
      ? lastMsg.isDeleted
        ? "This message was deleted"
        : lastMsg.text || "Attachment"
      : "No messages yet";

    let timeDisplay = "Just now";
    if (conv.lastMessageAt || conv.updatedAt) {
      const d = new Date(conv.lastMessageAt || conv.updatedAt);
      if (!isNaN(d.getTime())) {
        timeDisplay = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
    }

    const lastMsgSenderId =
      lastMsg && typeof lastMsg.senderId === "object"
        ? lastMsg.senderId._id
        : lastMsg?.senderId;

    const isLastMsgFromMe = Boolean(lastMsg && lastMsgSenderId === currentUserId);
    const lastMsgStatus = lastMsg?.status || "sent";
    const isTyping = Boolean(typingState[conv._id]);

    const cOtherUserId = participant?._id;
    const itemBlockedByMe = Boolean(
      conv.isBlockedByMe ||
      (cOtherUserId &&
        blockedUsers.some((b) => {
          const bId =
            typeof b.blockedUserId === "object"
              ? (b.blockedUserId as any)?._id
              : b.blockedUserId;
          return bId === cOtherUserId;
        }))
    );
    const itemBlockedByOther = Boolean(conv.isBlockedByOther);
    const itemBlocked = Boolean(conv.isBlocked || itemBlockedByMe || itemBlockedByOther);

    const isUserOnline = itemBlockedByOther
      ? false
      : Boolean(
        cOtherUserId &&
        (onlineUserIds.includes(cOtherUserId) || conv.isOnline)
      );

    return {
      id: conv._id,
      name,
      avatar,
      isOnline: isUserOnline,
      isTyping: itemBlockedByOther ? false : isTyping,
      lastTime: timeDisplay,
      lastMessage: lastText,
      unreadCount: conv.unreadCount || 0,
      isLastMsgFromMe,
      lastMsgStatus,
      isBlocked: itemBlocked,
      isBlockedByMe: itemBlockedByMe,
      isBlockedByOther: itemBlockedByOther,
      messages: [],
    };
  });

  // Active Conversation: Find in current list, or fall back to activeConversation stored in Zustand!
  const activeConvObj = activeConversationId
    ? conversations.find((c) => c._id === activeConversationId) || activeConversation || null
    : null;

  const otherParticipant =
    activeConvObj?.otherParticipant ||
    (activeConvObj?.participants?.find(
      (p: any) => (typeof p === "object" ? p._id : p) !== currentUserId
    ) as any);

  const otherUserId: string | undefined =
    typeof otherParticipant === "object" ? otherParticipant?._id : otherParticipant;

  const isBlockedByMe = Boolean(
    activeConvObj?.isBlockedByMe ||
    (otherUserId &&
      blockedUsers.some((b) => {
        const bId =
          typeof b.blockedUserId === "object"
            ? (b.blockedUserId as any)?._id
            : b.blockedUserId;
        return bId === otherUserId;
      }))
  );

  const isBlockedByOther = Boolean(activeConvObj?.isBlockedByOther);
  const isAnyBlocked = isBlockedByMe || isBlockedByOther;

  const isOtherUserOnline = isBlockedByOther
    ? false
    : Boolean(
      otherUserId &&
      (onlineUserIds.includes(otherUserId) || activeConvObj?.isOnline)
    );

  const activeChat: ChatConversation | null = activeConvObj
    ? {
      id: activeConvObj._id,
      name: otherParticipant
        ? `${otherParticipant.firstName || ""} ${otherParticipant.lastName || ""}`.trim() ||
        otherParticipant.email ||
        "Chat User"
        : "Chat User",
      avatar:
        getMediaUrl(otherParticipant?.image || otherParticipant?.avatar) ||
        DEFAULT_AVATAR,
      isOnline: isOtherUserOnline,
      isTyping: isBlockedByOther ? false : Boolean(typingState[activeConvObj._id]),
      lastTime: "",
      lastMessage: "",
      isBlocked: isAnyBlocked,
      isBlockedByMe,
      isBlockedByOther,
      messages: [],
    }
    : null;

  // Action Handlers for Block, Unblock, Report
  const handleConfirmBlock = async () => {
    if (!otherUserId) return;
    setActionLoading(true);
    setBlockError(null);
    try {
      await blockUser(otherUserId, blockReason.trim() || undefined);
      setShowBlockModal(false);
      setBlockReason("");
      showToastNotification(`Blocked ${activeChat?.name || "user"}`);
    } catch (err: any) {
      setBlockError(
        err?.response?.data?.message || err?.message || "Failed to block user"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmUnblock = async () => {
    if (!otherUserId) return;
    setActionLoading(true);
    try {
      await unblockUser(otherUserId);
      setShowUnblockModal(false);
      showToastNotification(`Unblocked ${activeChat?.name || "user"}`);
    } catch (err: any) {
      showToastNotification("Failed to unblock user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReport = async () => {
    if (!otherUserId) return;
    setActionLoading(true);
    setReportFeedback(null);
    try {
      await reportUser(
        otherUserId,
        reportReason,
        reportDescription.trim() || undefined
      );
      setReportFeedback({
        type: "success",
        message: "Report submitted successfully. Our team will review it.",
      });
      setTimeout(() => {
        setShowReportModal(false);
        setReportReason("spam");
        setReportDescription("");
        setReportFeedback(null);
        showToastNotification("Report submitted successfully");
      }, 1200);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to submit report";
      setReportFeedback({ type: "error", message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Map real messages to UI format
  const mappedMessages: ChatMessage[] = messages.map((msg: ChatMessageItem) => {
    const senderIdStr =
      typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId;
    const isUser = senderIdStr === currentUserId;

    let timeStr = "";
    if (msg.createdAt) {
      const d = new Date(msg.createdAt);
      if (!isNaN(d.getTime())) {
        timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
    }

    const userProfilePic =
      (profile as any)?.image?.url ||
      (profile as any)?.image ||
      (profile as any)?.avatar?.image?.url ||
      (profile as any)?.avatar?.url ||
      (profile as any)?.avatar;

    return {
      id: msg._id,
      sender: isUser ? "user" : "them",
      senderName: isUser ? "You" : activeChat?.name || "User",
      senderAvatar: isUser
        ? getMediaUrl(userProfilePic) || DEFAULT_AVATAR
        : activeChat?.avatar || DEFAULT_AVATAR,
      text: msg.isDeleted ? "This message was deleted" : msg.text || "",
      time: timeStr,
      status: msg.status || "sent",
    };
  });

  const filteredConversations = mappedConversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const forceScrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  const handleMessagesScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= 80;
    setShowScrollToBottom(!isAtBottom);
  };

  // Default to bottom scroll whenever active conversation or messages load/change
  useEffect(() => {
    forceScrollToBottom();
    const timer = setTimeout(() => {
      forceScrollToBottom();
    }, 60);
    setShowScrollToBottom(false);
    return () => clearTimeout(timer);
  }, [activeConversationId, mappedMessages.length, loadingMessages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConvObj?._id || sendingMessage) return;

    const textToSend = inputText.trim();
    setInputText("");

    const socket = connectSocket();
    if (socket && socket.connected) {
      socket.emit("typing_stop", { conversationId: activeConvObj._id });
    }

    try {
      await sendMessage(activeConvObj._id, textToSend);
      setTimeout(() => scrollToBottom("smooth"), 100);
    } catch (err) {
      setInputText(textToSend);
    }
  };

  const handleSelectChat = (id: string) => {
    selectConversation(id);
    setMobileShowChat(true);
  };

  const handleCloseMobileChat = () => {
    setMobileShowChat(false);
    selectConversation("");
  };

  return (
    <section className="relative w-full py-2 sm:py-4 md:py-6 lg:py-8">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-3 sm:px-6 lg:px-16">
        {/* Chat Interface Container */}
        <div className="w-full h-[80vh] sm:h-[80vh] md:h-[80vh] lg:h-[calc(100vh-120px)] max-h-[80vh] sm:max-h-[80vh] md:max-h-[80vh] lg:max-h-[850px] rounded-[20px] sm:rounded-[28px] lg:rounded-[32px] border border-gray-200/80 overflow-hidden flex flex-col lg:flex-row bg-white shadow-xs">

          {/* LEFT SIDEBAR: Conversation List */}
          <div
            className={`w-full lg:w-[340px] xl:w-[380px] shrink-0 border-r border-gray-100 flex flex-col min-h-0 bg-white transition-all h-full ${mobileShowChat ? "hidden lg:flex" : "flex"}`}
          >
            {/* Sidebar Top Bar */}
            <div className="p-3.5 sm:p-5 lg:p-6 pb-2 sm:pb-3 space-y-2.5 sm:space-y-3.5 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-roboto-serif text-xl sm:text-2xl lg:text-3xl font-regular text-[#0066FF] tracking-tight">
                  Chatbox
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSearchInput((prev) => !prev)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100/80 hover:bg-gray-200/80 flex items-center justify-center text-gray-700 transition-all cursor-pointer active:scale-95"
                    title="Search chat"
                  >
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              {/* Collapsible Search Input */}
              {showSearchInput && (
                <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search conversations..."
                    className="w-full pl-8 sm:pl-9 pr-8 py-1.5 sm:py-2 bg-gray-100/80 border border-gray-200 rounded-full text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-[#0066FF] transition-all"
                  />
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Sub-Header Label */}
              <div className="font-roboto-serif flex items-center gap-2 text-[#0066FF] font-regular text-sm sm:text-base lg:text-xl pt-0.5 sm:pt-1">
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0066FF]" />
                <span>All Messages</span>
              </div>
            </div>

            {/* Conversation Items List */}
            <div
              onWheel={(e) => e.stopPropagation()}
              className="flex-1 overflow-y-auto min-h-0 overscroll-none scrollbar-thin scrollbar-thumb-gray-200 px-2.5 sm:px-4 space-y-1"
              style={{ overscrollBehavior: "none", overscrollBehaviorY: "none" }}
            >
              {filteredConversations.length === 0 ? (
                <div className="py-16 text-center text-gray-400 space-y-2">
                  <MessageCircle className="w-10 h-10 mx-auto opacity-30 text-[#0066FF]" />
                  <p className="font-roboto-serif text-sm font-regular text-gray-600">No conversations found</p>
                  <p className="text-xs text-gray-400 font-regular">
                    Your conversation list is empty.
                  </p>
                </div>
              ) : (
                filteredConversations.map((chat) => {
                  const isActive = activeConvObj?._id === chat.id;
                  return (
                    <div
                      key={chat.id}
                      onClick={() => handleSelectChat(chat.id)}
                      className={`flex items-center gap-2.5 sm:gap-3.5 p-2 sm:p-2.5 lg:p-3 rounded-2xl cursor-pointer transition-all duration-200 ${isActive
                        ? "bg-blue-50/80 border border-blue-100 shadow-2xs"
                        : "hover:bg-gray-50 border border-transparent"
                        }`}
                    >
                      {/* User Avatar */}
                      <div className="relative shrink-0">
                        <img
                          src={chat.avatar}
                          alt={chat.name}
                          className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full object-cover shadow-2xs border border-gray-100"
                        />
                        {chat.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                        )}
                      </div>

                      {/* Chat Text Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className="font-roboto-serif text-xs sm:text-sm lg:text-base font-regular text-gray-900 truncate">
                              {chat.name}
                            </h4>
                            {chat.isBlockedByOther && (
                              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 px-1.5 py-0.5 rounded-md shrink-0">
                                Blocked
                              </span>
                            )}
                            {chat.isBlockedByMe && (
                              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md shrink-0">
                                Blocked
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] sm:text-xs text-gray-400 font-regular shrink-0">
                            {chat.lastTime}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          {chat.isTyping ? (
                            <span className="text-xs font-medium text-emerald-500 animate-pulse">
                              Typing..
                            </span>
                          ) : chat.isBlockedByOther ? (
                            <p className="text-xs truncate font-regular text-rose-500 italic">
                              Blocked by this user
                            </p>
                          ) : chat.isBlockedByMe ? (
                            <p className="text-xs truncate font-regular text-gray-400 italic">
                              You blocked this user
                            </p>
                          ) : (
                            <p
                              className={`text-xs truncate font-regular ${(chat.unreadCount || 0) > 0
                                ? "font-semibold text-gray-900"
                                : "text-gray-500"
                                }`}
                            >
                              {chat.lastMessage}
                            </p>
                          )}

                          {(chat.unreadCount || 0) > 0 ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#0066FF] text-white rounded-full shrink-0 shadow-2xs">
                              {chat.unreadCount}
                            </span>
                          ) : (
                            chat.isLastMsgFromMe && (
                              chat.lastMsgStatus === "read" ? (
                                <span title="Read"><CheckCheck className="w-4 h-4 text-[#0066FF] shrink-0" /></span>
                              ) : chat.lastMsgStatus === "delivered" ? (
                                <span title="Delivered"><CheckCheck className="w-4 h-4 text-gray-400 shrink-0" /></span>
                              ) : (
                                <span title="Sent"><Check className="w-4 h-4 text-gray-400 shrink-0" /></span>
                              )
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT MAIN CHAT PANE */}
          <div
            className={`flex-1 flex flex-col min-h-0 bg-[#F0F7FF] relative transition-all h-full ${!mobileShowChat ? "hidden lg:flex" : "flex"
              }`}
          >
            {activeChat ? (
              <>
                {/* Active Chat Top Bar Header */}
                <div className="p-2.5 sm:p-3.5 lg:p-5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 shadow-2xs">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* Back button for mobile */}
                    <button
                      type="button"
                      onClick={handleCloseMobileChat}
                      className="lg:hidden p-1 sm:p-1.5 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors shrink-0"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="relative shrink-0">
                      <img
                        src={activeChat.avatar}
                        alt={activeChat.name}
                        className="w-8 h-8 sm:w-9 sm:h-9 lg:w-11 lg:h-11 rounded-full object-cover border border-gray-100"
                      />
                      {activeChat.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 tracking-tight leading-tight truncate">
                        {activeChat.name}
                      </h3>
                      {isBlockedByOther ? (
                        <p className="text-[10px] sm:text-xs font-semibold text-rose-500 flex items-center gap-1">
                          <Ban className="w-3 h-3" /> Blocked you
                        </p>
                      ) : isBlockedByMe ? (
                        <p className="text-[10px] sm:text-xs font-medium text-gray-500">
                          Blocked by you
                        </p>
                      ) : (
                        <p
                          className={`text-[10px] sm:text-xs font-medium ${activeChat.isTyping
                            ? "text-emerald-500 animate-pulse"
                            : activeChat.isOnline
                              ? "text-emerald-500"
                              : "text-gray-400"
                            }`}
                        >
                          {activeChat.isTyping ? "Typing.." : activeChat.isOnline ? "Online" : "Offline"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* <button
                      type="button"
                      disabled={isAnyBlocked}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isAnyBlocked
                          ? "bg-gray-100 text-gray-300 cursor-not-allowed opacity-50"
                          : "bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 cursor-pointer active:scale-95"
                      }`}
                      title={
                        isBlockedByOther
                          ? "Calls unavailable (This user has blocked you)"
                          : isBlockedByMe
                          ? "Calls unavailable (You blocked this user)"
                          : "Voice Call"
                      }
                    >
                      <Phone className="w-4 h-4" />
                    </button> */}

                    {/* More options menu button & dropdown dialog */}
                    <div className="relative" ref={menuRef}>
                      <button
                        type="button"
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${isMenuOpen
                          ? "bg-gray-200 text-gray-900 shadow-2xs"
                          : "bg-gray-100/80 hover:bg-gray-200/80 text-gray-700"
                          }`}
                        title="More options"
                        aria-expanded={isMenuOpen}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu Dialog */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-11 z-40 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                          {/* Block / Unblock Option */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              if (isBlockedByMe) {
                                setShowUnblockModal(true);
                              } else {
                                setShowBlockModal(true);
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors text-left cursor-pointer ${isBlockedByMe
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-rose-600 hover:bg-rose-50"
                              }`}
                          >
                            {isBlockedByMe ? (
                              <>
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Unblock User</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>Block User</span>
                              </>
                            )}
                          </button>

                          {/* Report Option */}
                          {/* <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setShowReportModal(true);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                          >
                            <Flag className="w-4 h-4 text-gray-500 shrink-0" />
                            <span>Report Chat / User</span>
                          </button> */}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Blocked User Banner */}
                {isBlockedByOther ? (
                  <div className="px-4 sm:px-6 py-3 bg-rose-50/95 border-b border-rose-200/80 flex items-center justify-between text-xs sm:text-sm text-rose-900 shrink-0 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                        <Ban className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold block sm:inline">You have been blocked by {activeChat.name}.</span>
                        <span className="text-rose-600 text-xs sm:ml-1.5">You can no longer send messages or call this user.</span>
                      </div>
                    </div>
                  </div>
                ) : isBlockedByMe ? (
                  <div className="px-4 sm:px-6 py-2.5 bg-gray-100/90 border-b border-gray-200/80 flex items-center justify-between text-xs sm:text-sm text-gray-700 shrink-0">
                    <div className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-gray-500 shrink-0" />
                      <span>You have blocked this user. Messages cannot be exchanged.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUnblockModal(true)}
                      className="font-semibold text-[#0066FF] hover:underline cursor-pointer ml-3 shrink-0"
                    >
                      Unblock
                    </button>
                  </div>
                ) : null}

                {/* Chat Messages Body */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  onWheel={(e) => e.stopPropagation()}
                  className="flex-1 overflow-y-auto min-h-0 overscroll-none scrollbar-thin scrollbar-thumb-gray-200 p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6"
                  style={{ overscrollBehavior: "none", overscrollBehaviorY: "none" }}
                >
                  {/* Date Separator Pill */}
                  <div className="flex justify-center my-1 sm:my-2">
                    <span className="bg-[#0066FF] text-white text-[11px] sm:text-xs font-medium px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-md shadow-blue-500/20">
                      Today
                    </span>
                  </div>

                  {/* Messages Render */}
                  {mappedMessages.map((msg, index) => {
                    const isUser = msg.sender === "user";

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex items-start gap-2 sm:gap-3 ${isUser ? "flex-row-reverse" : "flex-row"
                          }`}
                      >
                        {/* Avatar */}
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full object-cover shrink-0 mt-0.5 border border-white shadow-2xs"
                        />

                        {/* Content Group */}
                        <div
                          className={`space-y-0.5 sm:space-y-1 max-w-[85%] sm:max-w-[70%] lg:max-w-[65%] ${isUser ? "items-end text-right" : "items-start text-left"
                            }`}
                        >
                          <div
                            className={`flex items-center gap-1.5 sm:gap-2 ${isUser ? "justify-end" : "justify-start"
                              }`}
                          >
                            <span className="text-xs sm:text-sm font-semibold text-gray-900">
                              {msg.senderName}
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-gray-400 font-regular">
                              {msg.time}
                            </span>
                          </div>

                          {/* Bubble */}
                          <div
                            className={`p-2.5 sm:p-3.5 px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-regular leading-relaxed inline-block shadow-2xs border border-gray-100/60 ${isUser
                              ? "bg-white text-gray-800 rounded-tr-xs"
                              : "bg-white text-gray-800 rounded-tl-xs"
                              }`}
                          >
                            <p>{msg.text}</p>
                          </div>

                          {/* Checkmark Status for User Messages */}
                          {isUser && (
                            <div className="flex justify-end pt-0.5">
                              {msg.status === "read" ? (
                                <span title="Read"><CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0066FF]" /></span>
                              ) : msg.status === "delivered" ? (
                                <span title="Delivered"><CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" /></span>
                              ) : (
                                <span title="Sent"><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" /></span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Scroll To Bottom Button */}
                {showScrollToBottom && (
                  <button
                    type="button"
                    onClick={() => scrollToBottom("smooth")}
                    className="absolute bottom-16 sm:bottom-20 lg:bottom-24 right-3 sm:right-6 lg:right-8 z-10 p-2 sm:p-2.5 bg-[#0066FF] text-white hover:bg-blue-700 rounded-full shadow-lg shadow-blue-500/30 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 cursor-pointer active:scale-95 flex items-center justify-center border border-white/20"
                    title="Scroll to bottom"
                  >
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}

                {/* Input Bar Footer */}
                <div className="p-2.5 sm:p-3.5 lg:p-5 bg-white border-t border-gray-100 shrink-0">
                  {isBlockedByOther ? (
                    <div className="flex items-center gap-2.5 p-2.5 sm:p-3.5 px-3 sm:px-4 bg-rose-50/80 border border-rose-200/80 rounded-2xl text-xs sm:text-sm text-rose-800">
                      <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>You cannot send messages to this conversation because {activeChat.name} has blocked you.</span>
                    </div>
                  ) : isBlockedByMe ? (
                    <div className="flex items-center justify-between p-2.5 sm:p-3.5 px-3 sm:px-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Ban className="w-4 h-4 text-gray-500 shrink-0" />
                        <span>You have blocked this user. Unblock to resume messaging.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowUnblockModal(true)}
                        className="font-semibold text-[#0066FF] underline hover:text-blue-800 cursor-pointer ml-3 shrink-0"
                      >
                        Unblock
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
                      <div className="flex-1 bg-gray-100/80 hover:bg-gray-100 border border-gray-200/80 rounded-full px-3 sm:px-4 py-1.5 sm:py-2.5 flex items-center gap-2 sm:gap-3 transition-colors">
                        <input
                          type="text"
                          value={inputText}
                          onChange={handleInputChange}
                          placeholder="Type A Message......"
                          className="flex-1 bg-transparent text-xs sm:text-sm text-gray-800 focus:outline-none placeholder:text-gray-400 font-regular"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!inputText.trim() || sendingMessage}
                        className="bg-[#0066FF] hover:bg-blue-700 disabled:opacity-50 text-white rounded-full px-3.5 sm:px-5 py-1.5 sm:py-2.5 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer shrink-0"
                      >
                        <span>Send</span>
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                <MessageCircle className="w-16 h-16 text-[#0066FF] opacity-20 mb-3" />
                <h3 className="font-roboto-serif text-lg font-regular text-gray-700">Select a Conversation</h3>
                <p className="text-xs text-gray-400 max-w-sm mt-1 font-regular">
                  Choose a chat from the left sidebar to start messaging.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BLOCK USER MODAL */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-roboto-serif">
                  Block {activeChat?.name || "User"}?
                </h3>
                <p className="text-xs text-gray-500">
                  They will not be able to message you or see when you're online.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-gray-700">Reason (Optional)</label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g. Inappropriate messages, spam..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
              />
            </div>

            {blockError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                {blockError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockReason("");
                  setBlockError(null);
                }}
                className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmBlock}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {actionLoading ? "Blocking..." : "Block User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNBLOCK USER MODAL */}
      {showUnblockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-roboto-serif">
                  Unblock {activeChat?.name || "User"}?
                </h3>
                <p className="text-xs text-gray-500">
                  They will be able to send and receive messages with you again.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowUnblockModal(false)}
                className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmUnblock}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {actionLoading ? "Unblocking..." : "Unblock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CHAT/USER MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Flag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-roboto-serif">
                  Report {activeChat?.name || "User"}
                </h3>
                <p className="text-xs text-gray-500">
                  Help us keep Flatmate safe. Reports are confidential and reviewed by moderators.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label htmlFor="report-reason-select" className="text-xs font-semibold text-gray-700">
                  Reason for report *
                </label>
                <div className="relative">
                  <select
                    id="report-reason-select"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as ChatReportReason)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-[#0066FF] focus:bg-white transition-all appearance-none cursor-pointer font-medium"
                  >
                    <option value="spam">Spam / Unsolicited Messages</option>
                    <option value="harassment">Harassment / Abusive Behavior</option>
                    <option value="inappropriate_content">Inappropriate or Offensive Content</option>
                    <option value="fraud">Fraud, Scam, or Phishing</option>
                    <option value="fake_profile">Fake Profile or Impersonation</option>
                    <option value="other">Other Issue</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Additional Details (Optional)</label>
                <textarea
                  rows={3}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide any additional context or details..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#0066FF] focus:bg-white transition-all resize-none"
                />
              </div>

              {reportFeedback && (
                <p
                  className={`text-xs p-2.5 rounded-xl border ${reportFeedback.type === "success"
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-rose-700 bg-rose-50 border-rose-200"
                    }`}
                >
                  {reportFeedback.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason("spam");
                  setReportDescription("");
                  setReportFeedback(null);
                }}
                className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmReport}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-[#0066FF] hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {actionLoading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION PILL */}
      {statusNotification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gray-900 text-white rounded-2xl shadow-xl text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}
    </section>
  );
}