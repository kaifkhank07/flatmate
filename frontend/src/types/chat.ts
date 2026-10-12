/**
 * Chat Types & Interfaces
 * Matches Backend models and API response contracts
 */

export interface ChatParticipant {
  _id: string;
  email?: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  avatar?: string;
  gender?: string;
  accountStatus?: string;
  profileVerified?: boolean;
  verificationStatus?: string;
}

export interface ChatAttachment {
  url: string;
  key?: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export interface ChatPropertyRef {
  propertyId: string;
  title: string;
  slug: string;
  image?: string;
  rent?: number;
}

export interface ChatFlatmateRef {
  flatmatePostId: string;
  title: string;
  slug: string;
  image?: string;
  budget?: {
    min: number;
    max: number;
  };
}

export type MessageStatus = 'sent' | 'delivered' | 'read';
export type MessageType = 'text' | 'image' | 'property' | 'flatmate-post';

export interface ChatMessageItem {
  _id: string;
  conversationId: string;
  senderId: string | ChatParticipant;
  receiverId: string | ChatParticipant;
  type: MessageType;
  text?: string;
  attachment?: ChatAttachment;
  property?: ChatPropertyRef;
  flatmate?: ChatFlatmateRef;
  status: MessageStatus;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversationItem {
  _id: string;
  participants: ChatParticipant[];
  otherParticipant: ChatParticipant | null;
  lastMessage: ChatMessageItem | null;
  lastMessageAt?: string;
  unreadCount: number;
  isActive: boolean;
  isOnline?: boolean;
  isBlocked?: boolean;
  isBlockedByMe?: boolean;
  isBlockedByOther?: boolean;
  blockedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedUserItem {
  _id: string;
  blockerId: string;
  blockedUserId: string | ChatParticipant;
  reason?: string;
  createdAt: string;
}

export interface GetConversationsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetMessagesParams {
  page?: number;
  limit?: number;
  before?: string;
}

export interface GetBlockedUsersParams {
  page?: number;
  limit?: number;
}

export interface SendMessagePayload {
  text: string;
  type?: MessageType;
  attachment?: ChatAttachment;
  property?: ChatPropertyRef;
  flatmate?: ChatFlatmateRef;
}
