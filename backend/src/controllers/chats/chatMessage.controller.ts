import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import {
  sendMessage,
  getMessages,
  markMessageDelivered,
  markMessagesRead,
  deleteMessage,
} from '../../services/chat/chatMessage.service';
import { emitToConversationRoom, isUserOnline } from '../../socket/chat.socket';

/**
 * Send a message within a conversation
 * POST /api/chats/conversations/:conversationId/messages
 */
export const sendMessageHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { conversationId } = req.params;
    const { type, text, attachment, property, flatmate } = req.body;

    let message = await sendMessage(req.user._id, conversationId, {
      type,
      text,
      attachment,
      property,
      flatmate,
    });

    // Auto mark delivered if receiver socket is online
    const receiverIdStr = message.receiverId.toString();
    const receiverOnline = isUserOnline(receiverIdStr);

    logger.info(`[REST SendMessage] Sender: ${req.user._id}, Receiver: ${receiverIdStr}, ReceiverOnline: ${receiverOnline}`);

    if (receiverOnline) {
      try {
        message = await markMessageDelivered(message._id, message.receiverId);
        logger.info(`[REST SendMessage] Auto-marked message ${message._id} as DELIVERED (Receiver ${receiverIdStr} is online)`);
      } catch (e: any) {
        logger.warn(`[REST SendMessage] Failed to auto-mark message ${message._id} delivered: ${e.message}`);
      }
    } else {
      logger.info(`[REST SendMessage] Receiver ${receiverIdStr} is OFFLINE. Message ${message._id} status remains '${message.status}'`);
    }

    // Emit Socket.io real-time event with final status ('delivered' if receiver is online)
    emitToConversationRoom(conversationId, 'new_message', message);
    logger.info(`[REST SendMessage] Broadcasted new_message (ID: ${message._id}, Status: ${message.status}) to room conversation:${conversationId}`);

    return sendSuccess(res, 'Message sent successfully', message, 201);
  } catch (error: any) {
    logger.error('[ChatMessageController] Failed to send message:', error);
    const statusCode = error.message.includes('block')
      ? 403
      : error.message.includes('not found')
      ? 404
      : 400;
    return sendError(res, error.message || 'Failed to send message', statusCode);
  }
};

/**
 * Get paginated list of messages for a conversation
 * GET /api/chats/conversations/:conversationId/messages
 */
export const getMessagesHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const before = req.query.before as string;

    const result = await getMessages(conversationId, req.user._id, page, limit, before);

    return sendSuccess(res, 'Messages fetched successfully', result);
  } catch (error: any) {
    logger.error('[ChatMessageController] Failed to fetch messages:', error);
    const statusCode = error.message.includes('Unauthorized') ? 403 : 400;
    return sendError(res, error.message || 'Failed to fetch messages', statusCode);
  }
};

/**
 * Mark a message as delivered
 * PATCH /api/chats/messages/:messageId/delivered
 */
export const markDeliveredHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { messageId } = req.params;

    const message = await markMessageDelivered(messageId, req.user._id);

    // Emit socket update event
    emitToConversationRoom(message.conversationId.toString(), 'message_delivery_updated', message);

    return sendSuccess(res, 'Message marked as delivered', message);
  } catch (error: any) {
    logger.error('[ChatMessageController] Failed to mark message delivered:', error);
    const statusCode = error.message.includes('Unauthorized') ? 403 : 400;
    return sendError(res, error.message || 'Failed to mark message delivered', statusCode);
  }
};

/**
 * Mark all messages in a conversation as read
 * PATCH /api/chats/conversations/:conversationId/read
 */
export const markReadHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { conversationId } = req.params;

    const result = await markMessagesRead(conversationId, req.user._id);

    // Emit socket read event to conversation room
    emitToConversationRoom(conversationId, 'message_read', {
      conversationId,
      readerId: req.user._id,
      readAt: result.readAt,
      updatedCount: result.updatedCount,
    });

    return sendSuccess(res, 'Messages marked as read', result);
  } catch (error: any) {
    logger.error('[ChatMessageController] Failed to mark messages read:', error);
    const statusCode = error.message.includes('Unauthorized') ? 403 : 400;
    return sendError(res, error.message || 'Failed to mark messages read', statusCode);
  }
};

/**
 * Soft delete a message
 * DELETE /api/chats/messages/:messageId
 */
export const deleteMessageHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { messageId } = req.params;

    const message = await deleteMessage(messageId, req.user._id);

    // Emit socket deletion event to conversation room
    emitToConversationRoom(message.conversationId.toString(), 'message_deleted', {
      messageId: message._id,
      conversationId: message.conversationId,
      deletedAt: message.deletedAt,
    });

    return sendSuccess(res, 'Message deleted successfully', {
      _id: message._id,
      isDeleted: true,
      deletedAt: message.deletedAt,
    });
  } catch (error: any) {
    logger.error('[ChatMessageController] Failed to delete message:', error);
    const statusCode = error.message.includes('Unauthorized') ? 403 : 400;
    return sendError(res, error.message || 'Failed to delete message', statusCode);
  }
};
