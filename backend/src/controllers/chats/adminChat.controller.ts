import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import {
  getAdminConversations,
  getAdminConversationById,
  getAdminConversationMessages,
} from '../../services/chat/adminChat.service';

/**
 * Get paginated list of all platform conversations for Admin monitoring
 * GET /api/admin-chats/conversations
 */
export const getAdminConversationsHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.admin) {
      return sendError(res, 'Admin authentication required', 401);
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = req.query.search as string;
    const user1Id = req.query.user1Id as string;
    const user2Id = req.query.user2Id as string;

    const result = await getAdminConversations(page, limit, search, user1Id, user2Id);

    return sendSuccess(res, 'Admin conversations fetched successfully', result);
  } catch (error: any) {
    logger.error('[AdminChatController] Failed to fetch admin conversations:', error);
    return sendError(res, 'Failed to fetch admin conversations', 500);
  }
};

/**
 * Get specific conversation details by ID for Admin monitoring
 * GET /api/admin-chats/conversations/:conversationId
 */
export const getAdminConversationByIdHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.admin) {
      return sendError(res, 'Admin authentication required', 401);
    }

    const { conversationId } = req.params;

    const conversation = await getAdminConversationById(conversationId);

    return sendSuccess(res, 'Admin conversation details fetched successfully', conversation);
  } catch (error: any) {
    logger.error('[AdminChatController] Failed to fetch admin conversation details:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    return sendError(res, error.message || 'Failed to fetch admin conversation details', statusCode);
  }
};

/**
 * Get paginated list of messages for a conversation for Admin monitoring
 * GET /api/admin-chats/conversations/:conversationId/messages
 */
export const getAdminMessagesHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.admin) {
      return sendError(res, 'Admin authentication required', 401);
    }

    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const before = req.query.before as string;

    const result = await getAdminConversationMessages(conversationId, page, limit, before);

    return sendSuccess(res, 'Admin conversation messages fetched successfully', result);
  } catch (error: any) {
    logger.error('[AdminChatController] Failed to fetch admin messages:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    return sendError(res, error.message || 'Failed to fetch admin conversation messages', statusCode);
  }
};
