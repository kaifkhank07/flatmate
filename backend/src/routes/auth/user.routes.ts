import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
  deactivateCurrentUser,
  getUsers,
  getUserDetails,
  getUserProfileByAdmin,
  updateUserProfileByAdmin,
  updateUserByAdmin,
  blockUser,
  unblockUser,
  deleteUserByAdmin,
  restoreUser,
} from '../../controllers/auth/user.controller';
import { authenticateUser } from '../../middlewares/auth.middleware';
import { authenticateAdmin } from '../../middlewares/admin.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploadSingleImage } from '../../middlewares/upload.middleware';
import {
  createUserSchema,
  loginUserSchema,
  updateUserSchema,
  updateUserByAdminSchema,
} from '../../validations/auth/user.validation';
import {
  getProfileCompletionStatus,
  markProfileAsCompleted,
} from '../../controllers/auth/profile.controller';
import { updateUserProfileByAdminSchema } from '../../validations/auth/profile.validation';

const router = Router();

// ==========================================
// User Self-Service Routes (End Users)
// ==========================================
router.post('/register', validate(createUserSchema), registerUser);
router.post('/login', validate(loginUserSchema), loginUser);
router.post('/logout', logoutUser);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticateUser, getCurrentUser);
router.patch('/me', authenticateUser, validate(updateUserSchema), updateCurrentUser);
router.delete('/me', authenticateUser, deleteCurrentUser);
router.patch('/me/deactivate', authenticateUser, deactivateCurrentUser);
router.get('/profile/completion-status', authenticateUser, getProfileCompletionStatus);
router.patch('/profile/complete', authenticateUser, markProfileAsCompleted);

// ==========================================
// Admin Operations on Users (Admins Only)
// ==========================================
router.get('/', authenticateAdmin, getUsers);
router.get('/:userId', authenticateAdmin, getUserDetails);
router.get('/:userId/profile', authenticateAdmin, getUserProfileByAdmin);
router.put(
  '/:userId/profile',
  authenticateAdmin,
  uploadSingleImage,
  validate(updateUserProfileByAdminSchema),
  updateUserProfileByAdmin
);
router.patch('/:userId', authenticateAdmin, validate(updateUserByAdminSchema), updateUserByAdmin);
router.patch('/:userId/block', authenticateAdmin, blockUser);
router.patch('/:userId/unblock', authenticateAdmin, unblockUser);
router.delete('/:userId', authenticateAdmin, deleteUserByAdmin);
router.patch('/:userId/restore', authenticateAdmin, restoreUser);

export default router;
