import { Request, Response } from 'express';

import { Admin } from '../../models/auth/admin.model';
import { AdminSession } from '../../models/auth/adminSession.model';
import { User } from '../../models/auth/user.model';

import { comparePassword, hashPassword, hashSecret } from '../../utils/password.util';
import { generateAccessToken, generateRefreshToken } from '../../utils/token.util';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';

/**
 * Admin Login
 * POST /api/admin/auth/login
 */
export const adminLogin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase(), isDeleted: false }).select(
      '+password'
    );

    if (!admin) {
      return sendError(res, 'Invalid admin credentials', 401);
    }

    if (admin.status !== 'active') {
      return sendError(res, `Admin account is ${admin.status}`, 403);
    }

    const isMatch = await comparePassword(password, admin.password || '');
    if (!isMatch) {
      return sendError(res, 'Invalid admin credentials', 401);
    }

    // Generate Admin JWT tokens
    const accessToken = generateAccessToken({
      adminId: admin._id.toString(),
      role: admin.role,
      type: 'admin',
    });

    const refreshToken = generateRefreshToken({
      id: admin._id.toString(),
      type: 'admin',
    });

    const refreshTokenHash = hashSecret(refreshToken);

    // Save admin session
    await AdminSession.create({
      adminId: admin._id,
      refreshTokenHash,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    admin.lastLoginAt = new Date();
    await admin.save();

    const adminData = admin.toObject();
    delete adminData.password;

    logger.info(`Admin logged in successfully: ${admin._id}`);

    return sendSuccess(res, 'Admin logged in successfully', {
      admin: adminData,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('[AdminController] Admin login error:', error);
    return sendError(res, 'Admin login failed', 500);
  }
};

/**
 * Get Authenticated Admin Profile
 * GET /api/admin/auth/me
 */
export const getAdminProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.admin) {
      return sendError(res, 'Admin authentication required', 401);
    }

    return sendSuccess(res, 'Admin profile fetched successfully', req.admin);
  } catch (error) {
    logger.error('[AdminController] Failed to fetch admin profile:', error);
    return sendError(res, 'Failed to fetch admin profile', 500);
  }
};

/**
 * Admin Logout
 * POST /api/admin/auth/logout
 */
export const adminLogout = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.admin) {
      return sendError(res, 'Admin authentication required', 401);
    }

    await AdminSession.updateMany(
      { adminId: req.admin._id, isRevoked: false },
      { isRevoked: true }
    );

    return sendSuccess(res, 'Admin logged out successfully');
  } catch (error) {
    logger.error('[AdminController] Admin logout error:', error);
    return sendError(res, 'Failed to logout admin', 500);
  }
};

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard/stats
 */
export const getDashboardStats = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      deletedUsers,
      verifiedUsers,
      newUsersToday,
      newUsersThisMonth,
      totalAdmins,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ accountStatus: 'active', isDeleted: false }),
      User.countDocuments({ accountStatus: 'inactive', isDeleted: false }),
      User.countDocuments({ isDeleted: true }),
      User.countDocuments({ profileVerified: true, isDeleted: false }),
      User.countDocuments({ createdAt: { $gte: todayStart }, isDeleted: false }),
      User.countDocuments({ createdAt: { $gte: monthStart }, isDeleted: false }),
      Admin.countDocuments({ isDeleted: false }),
    ]);

    return sendSuccess(res, 'Dashboard statistics fetched successfully', {
      totalUsers,
      activeUsers,
      inactiveUsers,
      deletedUsers,
      verifiedUsers,
      newUsersToday,
      newUsersThisMonth,
      totalAdmins,
    });
  } catch (error) {
    logger.error('[AdminController] Failed to fetch dashboard stats:', error);
    return sendError(res, 'Failed to fetch dashboard statistics', 500);
  }
};

/**
 * Create new Admin user in Admin model (Super Admin restricted)
 * POST /api/admin/admins
 */
export const createAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password, role } = req.body;

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (existingAdmin) {
      return sendError(res, 'Admin with this email already exists', 409);
    }

    // Enforce strictly one Super Admin account limit
    if (role === 'super_admin') {
      const existingSuperAdmin = await Admin.findOne({ role: 'super_admin', isDeleted: false });
      if (existingSuperAdmin) {
        return sendError(res, 'Only one Super Admin account is allowed in the system', 400);
      }
    }

    const hashedPassword = await hashPassword(password);

    const newAdmin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      status: 'active',
    });

    const result = newAdmin.toObject();
    delete result.password;

    logger.info(`New Admin account created by ${req.admin?._id}: ${newAdmin._id}`);

    return sendSuccess(res, 'Admin account created successfully', result, 201);
  } catch (error) {
    logger.error('[AdminController] Failed to create admin account:', error);
    return sendError(res, 'Failed to create admin account', 500);
  }
};

/**
 * Get all Admin staff users (Super Admin restricted)
 * GET /api/admin/admins
 */
export const getAdmins = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, status, role, isDeleted, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query: any = {};

    if (isDeleted !== undefined) {
      query.isDeleted = isDeleted === 'true';
    } else {
      query.isDeleted = false;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions: any = { [sortBy as string]: sortOrder };

    const total = await Admin.countDocuments(query);
    const admins = await Admin.find(query)
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Admins list fetched successfully', {
      admins,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error('[AdminController] Failed to fetch admins list:', error);
    return sendError(res, 'Failed to fetch admins list', 500);
  }
};

/**
 * Update Admin staff user (Super Admin restricted)
 * PATCH /api/admin/admins/:adminId
 */
export const updateAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { adminId } = req.params;
    const { name, role, status } = req.body;

    const adminToUpdate = await Admin.findById(adminId);
    if (!adminToUpdate || adminToUpdate.isDeleted) {
      return sendError(res, 'Admin account not found', 404);
    }

    // Enforce single Super Admin constraint
    if (role === 'super_admin' && adminToUpdate.role !== 'super_admin') {
      const existingSuperAdmin = await Admin.findOne({ role: 'super_admin', isDeleted: false });
      if (existingSuperAdmin) {
        return sendError(res, 'Only one Super Admin account is allowed in the system', 400);
      }
    }

    if (role === 'admin' && adminToUpdate.role === 'super_admin') {
      const superAdminCount = await Admin.countDocuments({ role: 'super_admin', isDeleted: false });
      if (superAdminCount <= 1) {
        return sendError(res, 'Cannot demote the only Super Admin account', 400);
      }
    }

    if (name) adminToUpdate.name = name;
    if (role) adminToUpdate.role = role;
    if (status) adminToUpdate.status = status;

    await adminToUpdate.save();

    const result = adminToUpdate.toObject();
    delete result.password;

    logger.info(`Admin account ${adminId} updated by ${req.admin?._id}`);

    return sendSuccess(res, 'Admin account updated successfully', result);
  } catch (error) {
    logger.error('[AdminController] Failed to update admin account:', error);
    return sendError(res, 'Failed to update admin account', 500);
  }
};

/**
 * Activate Admin staff user
 * PATCH /api/admin/admins/:adminId/activate
 */
export const activateAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { adminId } = req.params;

    const adminToUpdate = await Admin.findById(adminId);
    if (!adminToUpdate || adminToUpdate.isDeleted) {
      return sendError(res, 'Admin account not found', 404);
    }

    adminToUpdate.status = 'active';
    await adminToUpdate.save();

    logger.info(`Admin account ${adminId} activated by ${req.admin?._id}`);

    return sendSuccess(res, 'Admin account activated successfully');
  } catch (error) {
    logger.error('[AdminController] Failed to activate admin account:', error);
    return sendError(res, 'Failed to activate admin account', 500);
  }
};

/**
 * Deactivate Admin staff user
 * PATCH /api/admin/admins/:adminId/deactivate
 */
export const deactivateAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { adminId } = req.params;

    if (adminId === req.admin?._id.toString()) {
      return sendError(res, 'Cannot deactivate your own account', 400);
    }

    const adminToUpdate = await Admin.findById(adminId);
    if (!adminToUpdate || adminToUpdate.isDeleted) {
      return sendError(res, 'Admin account not found', 404);
    }

    if (adminToUpdate.role === 'super_admin') {
      const activeSuperAdmins = await Admin.countDocuments({ role: 'super_admin', status: 'active', isDeleted: false });
      if (activeSuperAdmins <= 1) {
        return sendError(res, 'Cannot deactivate the only active Super Admin account', 400);
      }
    }

    adminToUpdate.status = 'inactive';
    await adminToUpdate.save();

    await AdminSession.updateMany({ adminId }, { isRevoked: true });

    logger.info(`Admin account ${adminId} deactivated by ${req.admin?._id}`);

    return sendSuccess(res, 'Admin account deactivated successfully');
  } catch (error) {
    logger.error('[AdminController] Failed to deactivate admin account:', error);
    return sendError(res, 'Failed to deactivate admin account', 500);
  }
};

/**
 * Soft delete Admin staff user (Super Admin restricted)
 * DELETE /api/admin/admins/:adminId
 */
export const deleteAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { adminId } = req.params;

    if (adminId === req.admin?._id.toString()) {
      return sendError(res, 'Cannot delete your own super admin account', 400);
    }

    const adminToDelete = await Admin.findById(adminId);
    if (!adminToDelete || adminToDelete.isDeleted) {
      return sendError(res, 'Admin account not found', 404);
    }

    if (adminToDelete.role === 'super_admin') {
      const superAdminCount = await Admin.countDocuments({ role: 'super_admin', isDeleted: false });
      if (superAdminCount <= 1) {
        return sendError(res, 'Cannot delete the only Super Admin account', 400);
      }
    }

    adminToDelete.isDeleted = true;
    adminToDelete.status = 'inactive';
    adminToDelete.deletedAt = new Date();
    await adminToDelete.save();

    await AdminSession.updateMany({ adminId }, { isRevoked: true });

    logger.info(`Admin account ${adminId} deleted by ${req.admin?._id}`);

    return sendSuccess(res, 'Admin account deleted successfully');
  } catch (error) {
    logger.error('[AdminController] Failed to delete admin account:', error);
    return sendError(res, 'Failed to delete admin account', 500);
  }
};
