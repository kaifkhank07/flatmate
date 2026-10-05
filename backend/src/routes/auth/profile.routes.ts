import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  uploadProfileImage,
  deleteProfileImage,
  getProfileCompletionStatus,
  markProfileAsCompleted,
} from '../../controllers/auth/profile.controller';
import { authenticateUser } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { updateProfileSchema } from '../../validations/auth/profile.validation';
import { uploadSingleImage } from '../../middlewares/upload.middleware';

const router = Router();

router.get('/', authenticateUser, getProfile);
router.patch('/', authenticateUser, uploadSingleImage, validate(updateProfileSchema), updateProfile);

router.get('/completion-status', authenticateUser, getProfileCompletionStatus);
router.patch('/complete', authenticateUser, markProfileAsCompleted);

// Profile image management routes
router.post('/image', authenticateUser, uploadSingleImage, uploadProfileImage);
router.post('/profile-image', authenticateUser, uploadSingleImage, uploadProfileImage);

router.delete('/image', authenticateUser, deleteProfileImage);
router.delete('/profile-image', authenticateUser, deleteProfileImage);

export default router;
