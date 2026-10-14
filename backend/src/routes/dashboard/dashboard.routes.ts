import { Router } from 'express';
import {
  getSuperAdminDashboard,
  getAdminDashboard,
  getUserDashboard,
} from '../../controllers/dashboard/dashboard.controller';
import {
  authenticateAdmin,
  requireSuperAdmin,
} from '../../middlewares/admin.middleware';
import { authenticateUser } from '../../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/dashboard/super-admin
 * @desc    Get comprehensive platform-wide analytics and admin staff metrics
 * @access  Private (Super Admin only)
 */
router.get(
  '/super-admin',
  authenticateAdmin,
  requireSuperAdmin,
  getSuperAdminDashboard
);

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get operational moderation workload, listings, and user statistics
 * @access  Private (Admin / Super Admin)
 */
router.get(
  '/admin',
  authenticateAdmin,
  getAdminDashboard
);

/**
 * @route   GET /api/dashboard/user
 * @route   GET /api/dashboard/me
 * @desc    Get user's personal listings, wishlist, views, and engagement statistics
 * @access  Private (Authenticated User only)
 */
router.get(
  '/user',
  authenticateUser,
  getUserDashboard
);

router.get(
  '/me',
  authenticateUser,
  getUserDashboard
);

export default router;
