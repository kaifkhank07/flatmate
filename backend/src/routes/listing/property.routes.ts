import { Router } from 'express';
import { authenticateUserOrAdmin, authenticateUser } from '../../middlewares/auth.middleware';
import { authenticateAdmin } from '../../middlewares/admin.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createPropertySchema,
  updatePropertySchema,
  updatePropertyStatusSchema,
  rejectPropertySchema,
  attachImageSchema,
  attachVideoSchema,
} from '../../validations/listing/property.validation';
import {
  createProperty,
  getProperties,
  getPropertyById,
  getPropertyBySlug,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
  approveProperty,
  rejectProperty,
  blockProperty,
  closeProperty,
  addImageToProperty,
  removeImageFromProperty,
  addVideoToProperty,
  removeVideoFromProperty,
} from '../../controllers/listing/property.controller';

const router = Router();

// Public Read Operations
router.get('/', getProperties);
router.get('/slug/:slug', getPropertyBySlug);
router.get('/:id', getPropertyById);

// Protected CRUD Operations (User / Admin)
router.post('/', authenticateUserOrAdmin, validate(createPropertySchema), createProperty);
router.put('/:id', authenticateUserOrAdmin, validate(updatePropertySchema), updateProperty);
router.delete('/:id', authenticateUserOrAdmin, deleteProperty);

// Status Management Endpoints
router.patch('/:id/status', authenticateUserOrAdmin, validate(updatePropertyStatusSchema), updatePropertyStatus);
router.patch('/:id/approve', authenticateAdmin, approveProperty);
router.patch('/:id/reject', authenticateAdmin, validate(rejectPropertySchema), rejectProperty);
router.patch('/:id/block', authenticateAdmin, blockProperty);
router.patch('/:id/close', authenticateUserOrAdmin, closeProperty);

// Media Attachment Endpoints
router.post('/:id/images', authenticateUserOrAdmin, validate(attachImageSchema), addImageToProperty);
router.delete('/:id/images/:imageId', authenticateUserOrAdmin, removeImageFromProperty);

router.post('/:id/videos', authenticateUserOrAdmin, validate(attachVideoSchema), addVideoToProperty);
router.delete('/:id/videos/:videoId', authenticateUserOrAdmin, removeVideoFromProperty);

export default router;
