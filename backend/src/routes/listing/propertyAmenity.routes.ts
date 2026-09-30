import { Router } from 'express';
import { authenticateAdmin } from '../../middlewares/admin.middleware';
import { uploadSingleImage } from '../../middlewares/upload.middleware';
import {
  createPropertyAmenity,
  getPropertyAmenities,
  getPropertyAmenityById,
  updatePropertyAmenity,
  deletePropertyAmenity,
  togglePropertyAmenityStatus,
} from '../../controllers/listing/propertyAmenity.controller';

const router = Router();

// Public routes
router.get('/', getPropertyAmenities);
router.get('/:id', getPropertyAmenityById);

// Admin-only protected routes
router.post('/', authenticateAdmin, uploadSingleImage, createPropertyAmenity);
router.put('/:id', authenticateAdmin, uploadSingleImage, updatePropertyAmenity);
router.patch('/:id', authenticateAdmin, uploadSingleImage, updatePropertyAmenity);
router.delete('/:id', authenticateAdmin, deletePropertyAmenity);
router.patch('/:id/status', authenticateAdmin, togglePropertyAmenityStatus);

export default router;
