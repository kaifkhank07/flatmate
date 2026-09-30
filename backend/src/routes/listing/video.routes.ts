import { Router } from 'express';
import {
  createVideo,
  getVideo,
  updateVideo,
  deleteVideo,
} from '../../controllers/listing/video.controller';
import { authenticateUserOrAdmin } from '../../middlewares/auth.middleware';
import { uploadSingleVideo } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createVideoSchema, updateVideoSchema } from '../../validations/listing/video.validation';

const router = Router();

router.post('/', authenticateUserOrAdmin, uploadSingleVideo, createVideo);
router.get('/:id', getVideo);
router.put('/:id', authenticateUserOrAdmin, uploadSingleVideo, updateVideo);
router.delete('/:id', authenticateUserOrAdmin, deleteVideo);

export default router;
