import { Request, Response } from 'express';
import { getAdminDashboardData } from '../../services/dashboard/dashboard.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';

/**
 * Get operational dashboard metrics for Admin Staff
 * GET /api/dashboard/admin
 * Access: Admin / Super Admin
 */
export const getAdminDashboard = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.admin) {
      return sendError(res, 'Admin authentication required', 401);
    }

    const data = await getAdminDashboardData();

    return sendSuccess(
      res,
      'Admin dashboard metrics retrieved successfully',
      data
    );
  } catch (error) {
    logger.error(
      '[AdminDashboardController] Failed to retrieve dashboard metrics:',
      error
    );
    return sendError(
      res,
      'Failed to retrieve admin dashboard statistics',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
};
