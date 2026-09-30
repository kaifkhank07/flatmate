import { Request, Response } from 'express';

import { UserSession } from '../../models/auth/userSession.model';

import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';

/**
 * Get active sessions for current authenticated user
 * GET /api/sessions
 */
export const getSessions = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const sessions = await UserSession.find({
      userId: req.user._id,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .select('-refreshTokenHash')
      .sort({ lastUsedAt: -1 });

    return sendSuccess(res, 'Active sessions fetched successfully', sessions);
  } catch (error) {
    logger.error('[SessionController] Failed to fetch sessions:', error);
    return sendError(res, 'Failed to fetch active sessions', 500);
  }
};

/**
 * Revoke a specific session of current user
 * DELETE /api/sessions/:sessionId
 */
export const revokeSession = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { sessionId } = req.params;

    const session = await UserSession.findOne({
      _id: sessionId,
      userId: req.user._id,
    });

    if (!session) {
      return sendError(res, 'Session not found', 404);
    }

    session.isRevoked = true;
    await session.save();

    logger.info(`Session ${sessionId} revoked for user ${req.user._id}`);

    return sendSuccess(res, 'Session revoked successfully');
  } catch (error) {
    logger.error('[SessionController] Failed to revoke session:', error);
    return sendError(res, 'Failed to revoke session', 500);
  }
};

/**
 * Revoke all active sessions of current user
 * DELETE /api/sessions
 */
export const revokeAllSessions = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    await UserSession.updateMany(
      { userId: req.user._id, isRevoked: false },
      { isRevoked: true }
    );

    logger.info(`All sessions revoked for user ${req.user._id}`);

    return sendSuccess(res, 'All active sessions revoked successfully');
  } catch (error) {
    logger.error('[SessionController] Failed to revoke all sessions:', error);
    return sendError(res, 'Failed to revoke all sessions', 500);
  }
};
