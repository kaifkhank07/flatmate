import { Router } from 'express';
import { authenticateUser, authenticateUserOrAdmin } from '../../middlewares/auth.middleware';
import { authenticateAdmin } from '../../middlewares/admin.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createReview,
  getReviews,
  getReviewById,
  updateOwnReview,
  deleteOwnReview,
  updateReviewStatus,
  deleteReviewAdmin
} from '../../controllers/listing/review.controller';
import {
  createReviewSchema,
  updateReviewSchema,
  updateReviewStatusSchema,
  getReviewsQuerySchema,
} from '../../validations/listing/review.validation';

const router = Router();

// User Routes
router.post('/', authenticateUser, validate(createReviewSchema), createReview);
router.get('/', authenticateUserOrAdmin, validate(getReviewsQuerySchema), getReviews);
router.get('/:reviewId', authenticateUserOrAdmin, getReviewById);
router.put('/:reviewId', authenticateUser, validate(updateReviewSchema), updateOwnReview);
router.patch('/:reviewId', authenticateUser, validate(updateReviewSchema), updateOwnReview);
router.delete('/:reviewId', authenticateUser, deleteOwnReview);

// Admin Routes
router.patch('/admin/:reviewId/status', authenticateAdmin, validate(updateReviewStatusSchema), updateReviewStatus);
router.delete('/admin/:reviewId', authenticateAdmin, deleteReviewAdmin);

export default router;
