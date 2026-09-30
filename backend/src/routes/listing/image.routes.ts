import { Router } from 'express';
import {
  createImage,
  getImage,
  updateImage,
  deleteImage,
} from '../../controllers/listing/image.controller';
import { authenticateUserOrAdmin } from '../../middlewares/auth.middleware';
import { uploadSingleImage } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createImageSchema, updateImageSchema } from '../../validations/listing/image.validation';

const router = Router();

router.post('/', authenticateUserOrAdmin, uploadSingleImage, createImage);
router.get('/:id', getImage);
router.put('/:id', authenticateUserOrAdmin, uploadSingleImage, updateImage);
router.delete('/:id', authenticateUserOrAdmin, deleteImage);

export default router;
