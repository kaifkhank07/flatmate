import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { getUserDashboardData } from '../../services/dashboard/dashboard.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';

/**
 * Get personalized dashboard metrics for Authenticated User
 * GET /api/dashboard/user or GET /api/dashboard/me
 * Access: Authenticated User only
 */
export const getUserDashboard = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const authenticatedUser = req.user;

    const rawUserId =
      authenticatedUser?._id ||
      authenticatedUser?.id;

    if (!rawUserId || !Types.ObjectId.isValid(rawUserId)) {
      return sendError(res, 'User authentication required', 401);
    }

    const userObjectId = new Types.ObjectId(rawUserId);

    const data = await getUserDashboardData(userObjectId);

    return sendSuccess(
      res,
      'User dashboard metrics retrieved successfully',
      data
    );
  } catch (error) {
    logger.error(
      '[UserDashboardController] Failed to retrieve user dashboard metrics:',
      error
    );
    return sendError(
      res,
      'Failed to retrieve user dashboard statistics',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
};
