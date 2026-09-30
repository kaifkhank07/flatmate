import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import {
  getOrCreateConversation,
  getUserConversations,
  getConversationById,
} from '../../services/chat/chatConversation.service';

/**
 * Get existing or create a new conversation with a user
 * POST /api/chats/conversations
 */
export const createConversationHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { receiverId } = req.body;

    const { conversation, isNew } = await getOrCreateConversation(req.user._id, receiverId);

    const message = isNew ? 'Conversation created successfully' : 'Conversation retrieved successfully';
    const statusCode = isNew ? 201 : 200;

    return sendSuccess(res, message, conversation, statusCode);
  } catch (error: any) {
    logger.error('[ChatConversationController] Failed to get or create conversation:', error);
    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('block') || error.message.includes('yourself')
      ? 403
      : 400;
    return sendError(res, error.message || 'Failed to process conversation request', statusCode);
  }
};

/**
 * Get paginated list of conversations for current authenticated user
 * GET /api/chats/conversations
 */
export const getMyConversationsHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = req.query.search as string;

    const result = await getUserConversations(req.user._id, page, limit, search);

    return sendSuccess(res, 'Conversations fetched successfully', result);
  } catch (error: any) {
    logger.error('[ChatConversationController] Failed to fetch user conversations:', error);
    return sendError(res, 'Failed to fetch conversations', 500);
  }
};

/**
 * Get details of a specific conversation by ID
 * GET /api/chats/conversations/:conversationId
 */
export const getConversationByIdHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { conversationId } = req.params;

    const conversation = await getConversationById(conversationId, req.user._id);

    return sendSuccess(res, 'Conversation details fetched successfully', conversation);
  } catch (error: any) {
    logger.error('[ChatConversationController] Failed to fetch conversation details:', error);
    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('Unauthorized')
      ? 403
      : 400;
    return sendError(res, error.message || 'Failed to fetch conversation details', statusCode);
  }
};
