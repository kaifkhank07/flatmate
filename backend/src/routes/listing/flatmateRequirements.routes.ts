import { Router } from 'express';
import { authenticateUser, authenticateUserOrAdmin } from '../../middlewares/auth.middleware';
import { authenticateAdmin } from '../../middlewares/admin.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createFlatmateRequirementSchema,
  updateFlatmateRequirementSchema,
  getPublicFlatmateRequirementsSchema,
  getMyFlatmateRequirementsSchema,
  updateFlatmateRequirementStatusSchema,
} from '../../validations/listing/flatmateRequirements.validation';
import {
  createFlatmateRequirement,
  getPublicFlatmateRequirements,
  getMyFlatmateRequirements,
  getFlatmateRequirementBySlug,
  getFlatmateRequirementById,
  updateFlatmateRequirement,
  deleteFlatmateRequirement,
  updateFlatmateRequirementStatus,
  getAdminFlatmateRequirements,
  addImageToFlatmateRequirement,
  removeImageFromFlatmateRequirement,
  addVideoToFlatmateRequirement,
  removeVideoFromFlatmateRequirement,
} from '../../controllers/listing/flatmateRequirements.controller';

const router = Router();

// Public read-only routes
router.get('/', validate(getPublicFlatmateRequirementsSchema), getPublicFlatmateRequirements);
router.get('/public', validate(getPublicFlatmateRequirementsSchema), getPublicFlatmateRequirements);
router.get('/slug/:slug', getFlatmateRequirementBySlug);

// Protected user search routes
router.get('/my-requirements', authenticateUser, validate(getMyFlatmateRequirementsSchema), getMyFlatmateRequirements);
router.get('/my-posts', authenticateUser, validate(getMyFlatmateRequirementsSchema), getMyFlatmateRequirements); // Alias for backward compatibility

// Public get by ID route
router.get('/:id', getFlatmateRequirementById);

// Protected user / admin CRUD routes
router.post('/', authenticateUserOrAdmin, validate(createFlatmateRequirementSchema), createFlatmateRequirement);
router.put('/:id', authenticateUserOrAdmin, validate(updateFlatmateRequirementSchema), updateFlatmateRequirement);
router.patch('/:id/status', authenticateUserOrAdmin, validate(updateFlatmateRequirementStatusSchema), updateFlatmateRequirementStatus);
router.delete('/:id', authenticateUserOrAdmin, deleteFlatmateRequirement);

// Media Attachment routes
router.post('/:id/images', authenticateUserOrAdmin, addImageToFlatmateRequirement);
router.delete('/:id/images/:imageId', authenticateUserOrAdmin, removeImageFromFlatmateRequirement);
router.post('/:id/videos', authenticateUserOrAdmin, addVideoToFlatmateRequirement);
router.delete('/:id/videos/:videoId', authenticateUserOrAdmin, removeVideoFromFlatmateRequirement);

// Admin operations
router.get('/admin/all', authenticateAdmin, getAdminFlatmateRequirements);
router.patch('/admin/:id/status', authenticateAdmin, validate(updateFlatmateRequirementStatusSchema), updateFlatmateRequirementStatus);

export default router;
