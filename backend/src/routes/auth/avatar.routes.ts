import { Router } from 'express';
import { authenticateAdmin } from '../../middlewares/admin.middleware';
import { uploadSingleImage } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createAvatarSchema,
  updateAvatarSchema,
  toggleAvatarStatusSchema,
} from '../../validations/auth/avatar.validation';
import {
  createAvatar,
  getAvatars,
  getAvatarById,
  updateAvatar,
  deleteAvatar,
  toggleAvatarStatus,
} from '../../controllers/auth/avatar.controller';

const router = Router();

// Public / User routes
router.get('/', getAvatars);
router.get('/:id', getAvatarById);

// Admin-only protected routes
router.post('/', authenticateAdmin, uploadSingleImage, validate(createAvatarSchema), createAvatar);
router.put('/:id', authenticateAdmin, uploadSingleImage, validate(updateAvatarSchema), updateAvatar);
router.patch('/:id', authenticateAdmin, uploadSingleImage, validate(updateAvatarSchema), updateAvatar);
router.delete('/:id', authenticateAdmin, deleteAvatar);
router.patch('/:id/status', authenticateAdmin, validate(toggleAvatarStatusSchema), toggleAvatarStatus);

export default router;
