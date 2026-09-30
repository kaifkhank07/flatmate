import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AdminAccessTokenPayload } from '../utils/token.util';
import { Admin } from '../models/auth/admin.model';
import { sendError } from '../utils/response.util';
import { logger } from '../utils/logger.util';

export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Admin authentication token missing or invalid', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Admin authentication token missing', 401);
    }

    const decoded = verifyAccessToken(token);

    if (decoded.type !== 'admin' || !('adminId' in decoded)) {
      return sendError(res, 'Invalid admin authentication token', 401);
    }

    const adminPayload = decoded as AdminAccessTokenPayload;
    const admin = await Admin.findById(adminPayload.adminId);

    if (!admin || admin.isDeleted) {
      return sendError(res, 'Admin account not found or deactivated', 401);
    }

    if (admin.status !== 'active') {
      return sendError(res, `Admin account is ${admin.status}`, 403);
    }

    req.admin = admin;
    next();
  } catch (error) {
    logger.warn('Admin authentication failed', error instanceof Error ? error.message : error);
    return sendError(res, 'Invalid or expired admin authentication token', 401);
  }
};

export const requireAdmin = authenticateAdmin;

export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  if (!req.admin) {
    return sendError(res, 'Admin authentication required', 401);
  }

  if (req.admin.role !== 'super_admin') {
    return sendError(res, 'Forbidden: Super admin privilege required', 403);
  }

  next();
};
