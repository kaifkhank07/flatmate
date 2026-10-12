import { Types } from 'mongoose';
import { ChatMessage, IChatMessage, ChatMessageType } from '../../models/chats/ChatMessage';
import { ChatConversation } from '../../models/chats/ChatConversation';
import { checkBlockStatus } from './chatBlock.service';
import { verifyConversationParticipant, getParticipantSummary } from './chatConversation.service';
import { createNotification } from '../notification/notification.service';
import { logger } from '../../utils/logger.util';

export interface SendMessagePayloadInput {
  type: ChatMessageType;
  text?: string;
  attachment?: {
    url: string;
    key?: string;
    name?: string;
    size?: number;
    mimeType?: string;
  };
  property?: {
    propertyId: Types.ObjectId | string;
    title: string;
    slug: string;
    image?: string;
    rent?: number;
  };
  flatmate?: {
    flatmatePostId: Types.ObjectId | string;
    title: string;
    slug: string;
    image?: string;
    budget?: {
      min: number;
      max: number;
    };
  };
}

/**
 * Send a message within a conversation
 */
export const sendMessage = async (
  senderId: Types.ObjectId | string,
  conversationId: Types.ObjectId | string,
  payload: SendMessagePayloadInput
): Promise<IChatMessage> => {
  const senderObj = new Types.ObjectId(senderId.toString());
  const convObj = new Types.ObjectId(conversationId.toString());

  // Verify sender is participant in conversation
  const conversation = await verifyConversationParticipant(convObj, senderObj);

  // Find receiver ID (the other participant in the conversation)
  const receiverObj = conversation.participants.find((p) => !p.equals(senderObj));
  if (!receiverObj) {
    throw new Error('Receiver not found in conversation');
  }

  // Check block status between sender and receiver
  const blockStatus = await checkBlockStatus(senderObj, receiverObj);
  if (blockStatus.isBlocked) {
    throw new Error('Cannot send message due to block status between users');
  }

  // Format type-specific payloads if present
  let formattedProperty: any = undefined;
  if (payload.property) {
    formattedProperty = {
      ...payload.property,
      propertyId: new Types.ObjectId(payload.property.propertyId.toString()),
    };
  }

  let formattedFlatmate: any = undefined;
  if (payload.flatmate) {
    formattedFlatmate = {
      ...payload.flatmate,
      flatmatePostId: new Types.ObjectId(payload.flatmate.flatmatePostId.toString()),
    };
  }

  // Create ChatMessage
  const message = await ChatMessage.create({
    conversationId: convObj,
    senderId: senderObj,
    receiverId: receiverObj,
    type: payload.type,
    text: payload.text,
    attachment: payload.attachment,
    property: formattedProperty,
    flatmate: formattedFlatmate,
    status: 'sent',
    isDeleted: false,
  });

  // Atomic update on ChatConversation metadata and unread count increment
  const unreadCountKey = `unreadCounts.${receiverObj.toString()}`;
  await ChatConversation.findByIdAndUpdate(convObj, {
    $set: {
      lastMessageId: message._id,
      lastMessageAt: message.createdAt,
    },
    $inc: {
      [unreadCountKey]: 1,
    },
  });

  // Dispatch CHAT notification asynchronously
  createNotification({
    user: receiverObj,
    type: 'CHAT',
    title: 'New Chat Message',
    message: payload.text ? (payload.text.length > 50 ? `${payload.text.substring(0, 50)}...` : payload.text) : 'You received a new message',
    data: {
      conversationId: convObj.toString(),
      senderId: senderObj.toString(),
      messageId: message._id.toString(),
    },
  }).catch((err) => {
    logger.error('Failed to create chat notification', err);
  });

  return message;
};

/**
 * Get paginated list of messages for a conversation
 */
export const getMessages = async (
  conversationId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
  page: number = 1,
  limit: number = 50,
  before?: string
) => {
  const userObj = new Types.ObjectId(userId.toString());
  const convObj = new Types.ObjectId(conversationId.toString());

  // Verify user is participant
  await verifyConversationParticipant(convObj, userObj);

  const query: any = {
    conversationId: convObj,
  };

  if (before) {
    query._id = { $lt: new Types.ObjectId(before) };
  }

  const skip = (page - 1) * limit;
  const total = await ChatMessage.countDocuments({ conversationId: convObj });

  const messages = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Format messages (obscure content if deleted)
  const formattedMessages = messages.map((msg) => {
    const msgObj = msg.toObject();
    if (msgObj.isDeleted) {
      delete msgObj.text;
      delete msgObj.attachment;
      delete msgObj.property;
      delete msgObj.flatmate;
      msgObj.text = 'This message was deleted';
    }
    return msgObj;
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    messages: formattedMessages,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Mark a specific message as delivered (Receiver only)
 */
export const markMessageDelivered = async (
  messageId: Types.ObjectId | string,
  receiverId: Types.ObjectId | string
): Promise<IChatMessage> => {
  const msgObj = new Types.ObjectId(messageId.toString());
  const receiverObj = new Types.ObjectId(receiverId.toString());

  const message = await ChatMessage.findById(msgObj);
  if (!message) {
    throw new Error('Message not found');
  }

  if (!message.receiverId.equals(receiverObj)) {
    throw new Error('Unauthorized to mark this message as delivered');
  }

  if (message.status === 'sent') {
    message.status = 'delivered';
    message.deliveredAt = new Date();
    await message.save();
  }

  return message;
};

/**
 * Bulk mark all pending 'sent' messages for a receiver as delivered when receiver comes online
 */
export const markAllPendingMessagesDelivered = async (
  receiverId: Types.ObjectId | string
): Promise<IChatMessage[]> => {
  const receiverObj = new Types.ObjectId(receiverId.toString());

  const pendingMessages = await ChatMessage.find({
    receiverId: receiverObj,
    status: 'sent',
  });

  if (pendingMessages.length === 0) return [];

  const deliveredAt = new Date();
  await ChatMessage.updateMany(
    {
      receiverId: receiverObj,
      status: 'sent',
    },
    {
      $set: {
        status: 'delivered',
        deliveredAt,
      },
    }
  );

  return pendingMessages.map((m) => {
    m.status = 'delivered';
    m.deliveredAt = deliveredAt;
    return m;
  });
};

/**
 * Bulk mark messages in a conversation as read and reset user unread count (Receiver only)
 */
export const markMessagesRead = async (
  conversationId: Types.ObjectId | string,
  receiverId: Types.ObjectId | string
) => {
  const convObj = new Types.ObjectId(conversationId.toString());
  const receiverObj = new Types.ObjectId(receiverId.toString());

  // Verify participant
  await verifyConversationParticipant(convObj, receiverObj);

  const readAt = new Date();

  // Bulk update unread messages for receiver
  const updateResult = await ChatMessage.updateMany(
    {
      conversationId: convObj,
      receiverId: receiverObj,
      status: { $ne: 'read' },
    },
    {
      $set: {
        status: 'read',
        readAt,
      },
    }
  );

  // Reset receiver unread count in ChatConversation
  const unreadCountKey = `unreadCounts.${receiverObj.toString()}`;
  await ChatConversation.findByIdAndUpdate(convObj, {
    $set: {
      [unreadCountKey]: 0,
    },
  });

  return {
    updatedCount: updateResult.modifiedCount,
    readAt,
  };
};

/**
 * Soft delete a message (Sender only)
 */
export const deleteMessage = async (
  messageId: Types.ObjectId | string,
  senderId: Types.ObjectId | string
): Promise<IChatMessage> => {
  const msgObj = new Types.ObjectId(messageId.toString());
  const senderObj = new Types.ObjectId(senderId.toString());

  const message = await ChatMessage.findById(msgObj);
  if (!message) {
    throw new Error('Message not found');
  }

  if (!message.senderId.equals(senderObj)) {
    throw new Error('Unauthorized to delete this message');
  }

  if (!message.isDeleted) {
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();
  }

  return message;
};
