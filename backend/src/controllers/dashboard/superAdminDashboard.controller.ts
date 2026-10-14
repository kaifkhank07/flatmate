import { Request, Response } from 'express';
import { getSuperAdminDashboardData } from '../../services/dashboard/dashboard.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';

/**
 * Get platform-wide overview dashboard for Super Admin
 * GET /api/dashboard/super-admin
 * Access: Super Admin only
 */
export const getSuperAdminDashboard = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.admin) {
      return sendError(res, 'Admin authentication required', 401);
    }

    if (req.admin.role !== 'super_admin') {
      return sendError(res, 'Forbidden: Super admin privilege required', 403);
    }

    const data = await getSuperAdminDashboardData();

    return sendSuccess(
      res,
      'Super admin dashboard metrics retrieved successfully',
      data
    );
  } catch (error) {
    logger.error(
      '[SuperAdminDashboardController] Failed to retrieve dashboard metrics:',
      error
    );
    return sendError(
      res,
      'Failed to retrieve super admin dashboard statistics',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
};
