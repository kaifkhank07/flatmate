import { Server, Socket } from 'socket.io';
import { Types } from 'mongoose';
import { verifyAccessToken, UserAccessTokenPayload } from '../utils/token.util';
import { User } from '../models/auth/user.model';
import { logger } from '../utils/logger.util';
import {
  AuthenticatedSocket,
  SendMessagePayload,
  MarkReadPayload,
  DeleteMessagePayload,
  TypingPayload,
  SocketAckCallback,
} from './chat.types';

import {
  sendMessage,
  markMessagesRead,
  deleteMessage,
  markMessageDelivered,
  markAllPendingMessagesDelivered,
} from '../services/chat/chatMessage.service';
import {
  verifyConversationParticipant,
} from '../services/chat/chatConversation.service';
import { checkBlockStatus } from '../services/chat/chatBlock.service';

// In-memory online user sockets mapping: userId string -> Set of socket IDs
const onlineUserSockets = new Map<string, Set<string>>();

let globalIo: Server | null = null;

export const isUserOnline = (userId: string | Types.ObjectId): boolean => {
  const userIdStr = userId.toString();
  const socketSet = onlineUserSockets.get(userIdStr);
  return !!(socketSet && socketSet.size > 0);
};

export const emitToConversationRoom = (conversationId: string, event: string, data: any) => {
  if (globalIo) {
    const roomName = `conversation:${conversationId}`;
    globalIo.to(roomName).emit(event, data);
  }
};

export const emitToUser = (userId: string | Types.ObjectId, event: string, data: any) => {
  if (globalIo) {
    const userIdStr = userId.toString();
    const socketSet = onlineUserSockets.get(userIdStr);
    if (socketSet) {
      socketSet.forEach((sockId) => {
        globalIo!.to(sockId).emit(event, data);
      });
    }
  }
};

/**
 * Socket Authentication Middleware
 */
export const registerSocketAuthMiddleware = (io: Server) => {
  io.use(async (socket: Socket, next) => {
    try {
      const authSocket = socket as AuthenticatedSocket;
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization;

      if (token && typeof token === 'string' && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      if (!token) {
        const rawCookies = socket.handshake.headers?.cookie || '';
        const match = rawCookies.match(/accessToken=([^;]+)/);
        if (match) {
          token = match[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = verifyAccessToken(token);
      if (decoded.type !== 'user' || !('userId' in decoded)) {
        return next(new Error('Invalid authentication token type'));
      }

      const userPayload = decoded as UserAccessTokenPayload;
      const user = await User.findById(userPayload.userId);

      if (!user || user.isDeleted) {
        return next(new Error('User account not found or deactivated'));
      }

      if (user.accountStatus === 'inactive') {
        return next(new Error('Account status is inactive'));
      }

      authSocket.user = user;
      authSocket.userId = user._id;
      next();
    } catch (error: any) {
      logger.warn('[SocketAuth] Connection rejected:', error.message);
      next(new Error('Authentication failed: Invalid or expired token'));
    }
  });
};

/**
 * Socket Chat Events Setup
 */
export const setupChatSocketEvents = (io: Server) => {
  globalIo = io;

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    if (!authSocket.userId || !authSocket.user) {
      socket.disconnect(true);
      return;
    }

    const userIdStr = authSocket.userId.toString();
    logger.info(`[Socket] User connected: ${userIdStr} (Socket ID: ${socket.id})`);

    // Track online user sockets
    if (!onlineUserSockets.has(userIdStr)) {
      onlineUserSockets.set(userIdStr, new Set());
    }
    onlineUserSockets.get(userIdStr)!.add(socket.id);

    // Notify online status if first socket
    if (onlineUserSockets.get(userIdStr)!.size === 1) {
      io.emit('user_online', { userId: userIdStr });

      // Mark all pending sent messages for this user as delivered
      markAllPendingMessagesDelivered(userIdStr)
        .then((deliveredMsgs) => {
          deliveredMsgs.forEach((msg) => {
            emitToConversationRoom(msg.conversationId.toString(), 'message_delivery_updated', msg);
          });
        })
        .catch(() => {});
    }

    // Send currently online user IDs to the connected client
    const onlineList = Array.from(onlineUserSockets.keys());
    socket.emit('online_users_list', { userIds: onlineList });

    socket.on('get_online_users', () => {
      const currentList = Array.from(onlineUserSockets.keys());
      socket.emit('online_users_list', { userIds: currentList });
    });

    // ----------------------------------------------------
    // Event: join_conversation
    // ----------------------------------------------------
    socket.on('join_conversation', async (data: { conversationId: string }, ack?: SocketAckCallback) => {
      try {
        const { conversationId } = data || {};
        if (!conversationId) {
          if (ack) ack({ success: false, message: 'conversationId is required' });
          return;
        }

        await verifyConversationParticipant(conversationId, authSocket.userId!);
        const roomName = `conversation:${conversationId}`;
        socket.join(roomName);

        logger.info(`[Socket] Socket ${socket.id} (User ${userIdStr}) joined room ${roomName}`);
        if (ack) ack({ success: true, message: `Joined room ${roomName}` });
      } catch (error: any) {
        logger.error('[Socket] join_conversation error:', error.message);
        if (ack) ack({ success: false, message: error.message || 'Failed to join conversation room' });
      }
    });

    // ----------------------------------------------------
    // Event: leave_conversation
    // ----------------------------------------------------
    socket.on('leave_conversation', (data: { conversationId: string }, ack?: SocketAckCallback) => {
      try {
        const { conversationId } = data || {};
        if (conversationId) {
          const roomName = `conversation:${conversationId}`;
          socket.leave(roomName);
          logger.info(`[Socket] Socket ${socket.id} left room ${roomName}`);
        }
        if (ack) ack({ success: true, message: 'Left conversation room' });
      } catch (error: any) {
        if (ack) ack({ success: false, message: error.message || 'Failed to leave conversation room' });
      }
    });

    // ----------------------------------------------------
    // Event: send_message
    // ----------------------------------------------------
    socket.on('send_message', async (payload: SendMessagePayload, ack?: SocketAckCallback) => {
      try {
        if (!payload || !payload.conversationId || !payload.type) {
          if (ack) ack({ success: false, message: 'Invalid send_message payload' });
          return;
        }

        let message = await sendMessage(authSocket.userId!, payload.conversationId, {
          type: payload.type,
          text: payload.text,
          attachment: payload.attachment,
          property: payload.property,
          flatmate: payload.flatmate,
        });

        const receiverIdStr = message.receiverId.toString();
        const receiverOnline = isUserOnline(receiverIdStr);

        logger.info(`[Socket SendMessage] Sender: ${userIdStr}, Receiver: ${receiverIdStr}, ReceiverOnline: ${receiverOnline}`);

        if (receiverOnline) {
          try {
            message = await markMessageDelivered(message._id, message.receiverId);
            logger.info(`[Socket SendMessage] Auto-marked message ${message._id} as DELIVERED (Receiver ${receiverIdStr} is online)`);
          } catch (e: any) {
            logger.warn(`[Socket SendMessage] Failed to auto-mark message ${message._id} delivered: ${e.message}`);
          }
        } else {
          logger.info(`[Socket SendMessage] Receiver ${receiverIdStr} is OFFLINE. Message ${message._id} status remains '${message.status}'`);
        }

        const roomName = `conversation:${payload.conversationId}`;

        // Broadcast new message to conversation room with status ('delivered' if receiver is online)
        io.to(roomName).emit('new_message', message);
        logger.info(`[Socket SendMessage] Broadcasted new_message (ID: ${message._id}, Status: ${message.status}) to room ${roomName}`);

        if (ack) ack({ success: true, message: 'Message sent successfully', data: message });
      } catch (error: any) {
        logger.error('[Socket] send_message error:', error);
        socket.emit('message_error', { message: error.message || 'Failed to send message' });
        if (ack) ack({ success: false, message: error.message || 'Failed to send message' });
      }
    });

    // ----------------------------------------------------
    // Event: mark_message_read
    // ----------------------------------------------------
    socket.on('mark_message_read', async (payload: MarkReadPayload, ack?: SocketAckCallback) => {
      try {
        if (!payload || !payload.conversationId) {
          if (ack) ack({ success: false, message: 'conversationId is required' });
          return;
        }

        const result = await markMessagesRead(payload.conversationId, authSocket.userId!);

        const roomName = `conversation:${payload.conversationId}`;
        io.to(roomName).emit('message_read', {
          conversationId: payload.conversationId,
          readerId: authSocket.userId,
          readAt: result.readAt,
          updatedCount: result.updatedCount,
        });

        if (ack) ack({ success: true, message: 'Messages marked as read', data: result });
      } catch (error: any) {
        logger.error('[Socket] mark_message_read error:', error.message);
        if (ack) ack({ success: false, message: error.message || 'Failed to mark read' });
      }
    });

    // ----------------------------------------------------
    // Event: delete_message
    // ----------------------------------------------------
    socket.on('delete_message', async (payload: DeleteMessagePayload, ack?: SocketAckCallback) => {
      try {
        if (!payload || !payload.messageId) {
          if (ack) ack({ success: false, message: 'messageId is required' });
          return;
        }

        const message = await deleteMessage(payload.messageId, authSocket.userId!);

        const roomName = `conversation:${message.conversationId}`;
        io.to(roomName).emit('message_deleted', {
          messageId: message._id,
          conversationId: message.conversationId,
          deletedAt: message.deletedAt,
        });

        if (ack) ack({ success: true, message: 'Message deleted', data: { _id: message._id, isDeleted: true } });
      } catch (error: any) {
        logger.error('[Socket] delete_message error:', error.message);
        if (ack) ack({ success: false, message: error.message || 'Failed to delete message' });
      }
    });

    // ----------------------------------------------------
    // Event: typing_start
    // ----------------------------------------------------
    socket.on('typing_start', async (payload: TypingPayload) => {
      try {
        if (!payload || !payload.conversationId) return;

        await verifyConversationParticipant(payload.conversationId, authSocket.userId!);
        const roomName = `conversation:${payload.conversationId}`;

        socket.to(roomName).emit('user_typing_start', {
          conversationId: payload.conversationId,
          userId: userIdStr,
        });
      } catch (error: any) {
        // Silent error for typing state
      }
    });

    // ----------------------------------------------------
    // Event: typing_stop
    // ----------------------------------------------------
    socket.on('typing_stop', async (payload: TypingPayload) => {
      try {
        if (!payload || !payload.conversationId) return;

        await verifyConversationParticipant(payload.conversationId, authSocket.userId!);
        const roomName = `conversation:${payload.conversationId}`;

        socket.to(roomName).emit('user_typing_stop', {
          conversationId: payload.conversationId,
          userId: userIdStr,
        });
      } catch (error: any) {
        // Silent error for typing state
      }
    });

    // ----------------------------------------------------
    // Event: disconnect
    // ----------------------------------------------------
    socket.on('disconnect', (reason: string) => {
      logger.info(`[Socket] User disconnected: ${userIdStr} (Socket ID: ${socket.id}, Reason: ${reason})`);

      const socketSet = onlineUserSockets.get(userIdStr);
      if (socketSet) {
        socketSet.delete(socket.id);
        if (socketSet.size === 0) {
          onlineUserSockets.delete(userIdStr);
          io.emit('user_offline', { userId: userIdStr });
        }
      }
    });
  });
};
