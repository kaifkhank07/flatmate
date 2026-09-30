import { Socket } from 'socket.io';
import { Types } from 'mongoose';
import { IUser } from '../models/auth/user.model';
import {
  ChatMessageType,
  IChatMessageAttachment,
  IChatMessageProperty,
  IChatMessageFlatmate,
  IChatMessage,
} from '../models/chats/ChatMessage';

export interface AuthenticatedSocket extends Socket {
  user?: IUser;
  userId?: Types.ObjectId;
}

export interface SendMessagePayload {
  conversationId: string;
  type: ChatMessageType;
  text?: string;
  attachment?: IChatMessageAttachment;
  property?: IChatMessageProperty;
  flatmate?: IChatMessageFlatmate;
}

export interface MarkReadPayload {
  conversationId: string;
  messageId?: string;
}

export interface MarkDeliveredPayload {
  messageId: string;
}

export interface DeleteMessagePayload {
  messageId: string;
}

export interface TypingPayload {
  conversationId: string;
}

export interface SocketAckResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

export type SocketAckCallback<T = any> = (response: SocketAckResponse<T>) => void;
