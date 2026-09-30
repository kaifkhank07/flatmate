import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, UserAccessTokenPayload, AdminAccessTokenPayload } from '../utils/token.util';
import { ACCESS_TOKEN_COOKIE_NAME } from '../utils/cookie.util';
import { User } from '../models/auth/user.model';
import { Admin } from '../models/auth/admin.model';
import { sendError } from '../utils/response.util';
import { logger } from '../utils/logger.util';

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    let token: string | undefined;

    if (req.cookies?.[ACCESS_TOKEN_COOKIE_NAME]) {
      token = req.cookies[ACCESS_TOKEN_COOKIE_NAME];
    } else {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return sendError(res, 'User authentication token missing or invalid', 401);
    }

    const decoded = verifyAccessToken(token);

    if (decoded.type !== 'user' || !('userId' in decoded)) {
      return sendError(res, 'Invalid user token', 401);
    }

    const userPayload = decoded as UserAccessTokenPayload;
    const user = await User.findById(userPayload.userId);

    if (!user || user.isDeleted) {
      return sendError(res, 'User not found or account deactivated', 401);
    }

    if (user.accountStatus === 'inactive') {
      return sendError(
        res,
        'Account is inactive. Please contact support.',
        403
      );
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn('User authentication failed', error instanceof Error ? error.message : error);
    return sendError(res, 'Invalid or expired user token', 401);
  }
};

export const authenticateUserOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    let token: string | undefined;

    if (req.cookies?.[ACCESS_TOKEN_COOKIE_NAME]) {
      token = req.cookies[ACCESS_TOKEN_COOKIE_NAME];
    } else if (req.cookies?.admin_access_token) {
      token = req.cookies.admin_access_token;
    } else {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return sendError(res, 'Authentication token missing or invalid', 401);
    }

    const decoded = verifyAccessToken(token);

    if (decoded.type === 'admin' && 'adminId' in decoded) {
      const adminPayload = decoded as AdminAccessTokenPayload;
      const admin = await Admin.findById(adminPayload.adminId);
      if (admin && !admin.isDeleted && admin.status === 'active') {
        req.admin = admin;
        return next();
      }
    } else if (decoded.type === 'user' && 'userId' in decoded) {
      const userPayload = decoded as UserAccessTokenPayload;
      const user = await User.findById(userPayload.userId);
      if (user && !user.isDeleted) {
        if (user.accountStatus === 'inactive') {
          return sendError(res, 'Account is inactive', 403);
        }
        req.user = user;
        return next();
      }
    }

    return sendError(res, 'Authentication failed or user/admin account inactive', 401);
  } catch (error) {
    logger.warn('Authentication failed', error instanceof Error ? error.message : error);
    return sendError(res, 'Invalid or expired authentication token', 401);
  }
};

