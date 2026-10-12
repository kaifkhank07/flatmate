import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { blockUser, unblockUser, getBlockedUsers } from '../../services/chat/chatBlock.service';
import { emitToUser } from '../../socket/chat.socket';

/**
 * Block a user
 * POST /api/chats/blocks
 */
export const blockUserHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { blockedUserId, reason } = req.body;

    const block = await blockUser(req.user._id, blockedUserId, reason);

    // Notify both users in real-time
    emitToUser(blockedUserId, 'user_block_updated', {
      blockerId: req.user._id.toString(),
      blockedUserId: blockedUserId.toString(),
      isBlocked: true,
    });
    emitToUser(req.user._id, 'user_block_updated', {
      blockerId: req.user._id.toString(),
      blockedUserId: blockedUserId.toString(),
      isBlocked: true,
    });

    return sendSuccess(res, 'User blocked successfully', block, 201);
  } catch (error: any) {
    logger.error('[ChatBlockController] Failed to block user:', error);
    const statusCode = error.message.includes('yourself') ? 400 : 404;
    return sendError(res, error.message || 'Failed to block user', statusCode);
  }
};

/**
 * Unblock a user
 * DELETE /api/chats/blocks/:userId
 */
export const unblockUserHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { userId } = req.params;

    const success = await unblockUser(req.user._id, userId);
    if (!success) {
      return sendError(res, 'User was not blocked', 404);
    }

    // Notify both users in real-time
    emitToUser(userId, 'user_block_updated', {
      blockerId: req.user._id.toString(),
      blockedUserId: userId.toString(),
      isBlocked: false,
    });
    emitToUser(req.user._id, 'user_block_updated', {
      blockerId: req.user._id.toString(),
      blockedUserId: userId.toString(),
      isBlocked: false,
    });

    return sendSuccess(res, 'User unblocked successfully');
  } catch (error: any) {
    logger.error('[ChatBlockController] Failed to unblock user:', error);
    return sendError(res, error.message || 'Failed to unblock user', 400);
  }
};

/**
 * Get paginated list of blocked users
 * GET /api/chats/blocks
 */
export const getBlockedUsersHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await getBlockedUsers(req.user._id, page, limit);

    return sendSuccess(res, 'Blocked users fetched successfully', result);
  } catch (error: any) {
    logger.error('[ChatBlockController] Failed to fetch blocked users:', error);
    return sendError(res, 'Failed to fetch blocked users', 500);
  }
};
