import { Router } from 'express';
import {
  adminLogin,
  getAdminProfile,
  adminLogout,
  getDashboardStats,
  createAdmin,
  getAdmins,
  updateAdmin,
  activateAdmin,
  deactivateAdmin,
  deleteAdmin,
} from '../../controllers/auth/admin.controller';
import { authenticateAdmin, requireSuperAdmin } from '../../middlewares/admin.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  adminLoginSchema,
  createAdminSchema,
  updateAdminSchema,
} from '../../validations/auth/admin.validation';

const router = Router();

// Public Admin Auth Routes
router.post('/auth/login', validate(adminLoginSchema), adminLogin);

// Protected Admin Routes (Require Admin Auth)
router.use(authenticateAdmin);

router.get('/auth/me', getAdminProfile);
router.post('/auth/logout', adminLogout);
router.get('/dashboard/stats', getDashboardStats);

// Admin Staff Management Routes (Super Admin Only)
router.post('/admins', requireSuperAdmin, validate(createAdminSchema), createAdmin);
router.get('/admins', requireSuperAdmin, getAdmins);
router.patch('/admins/:adminId', requireSuperAdmin, validate(updateAdminSchema), updateAdmin);
router.patch('/admins/:adminId/activate', requireSuperAdmin, activateAdmin);
router.patch('/admins/:adminId/deactivate', requireSuperAdmin, deactivateAdmin);
router.delete('/admins/:adminId', requireSuperAdmin, deleteAdmin);

export default router;
