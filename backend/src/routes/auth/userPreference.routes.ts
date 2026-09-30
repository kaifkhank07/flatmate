import { Router } from 'express';
import {
  createUserPreference,
  getUserPreferences,
  getUserPreferenceById,
  updateUserPreference,
  deleteUserPreference,
  toggleUserPreferenceStatus,
} from '../../controllers/auth/userPreference.controller';
import { authenticateAdmin } from '../../middlewares/admin.middleware';
import { uploadSingleImage } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createUserPreferenceSchema,
  updateUserPreferenceSchema,
} from '../../validations/auth/userPreference.validation';

const router = Router();

// Public Read Routes
router.get('/', getUserPreferences);
router.get('/:id', getUserPreferenceById);

// Protected Admin Operations
router.post(
  '/',
  authenticateAdmin,
  uploadSingleImage,
  validate(createUserPreferenceSchema),
  createUserPreference
);
router.put(
  '/:id',
  authenticateAdmin,
  uploadSingleImage,
  validate(updateUserPreferenceSchema),
  updateUserPreference
);
router.delete('/:id', authenticateAdmin, deleteUserPreference);
router.patch('/:id/status', authenticateAdmin, toggleUserPreferenceStatus);

export default router;
