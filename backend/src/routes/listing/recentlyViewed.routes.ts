import { Router } from 'express';
import { authenticateUser } from '../../middlewares/auth.middleware';
import {
  addRecentlyViewed,
  getRecentlyViewed,
  deleteRecentlyViewed,
  clearRecentlyViewed,
} from '../../controllers/listing/recentlyViewed.controller';

const router = Router();

// Add a property or flatmate post to recently viewed list
router.post('/', authenticateUser, addRecentlyViewed);

// Get paginated recently viewed list
router.get('/', authenticateUser, getRecentlyViewed);

// Clear all recently viewed items for authenticated user
router.delete('/clear', authenticateUser, clearRecentlyViewed);

// Delete a recently viewed entry by target
router.delete('/by-target', authenticateUser, deleteRecentlyViewed);

// Delete a recently viewed entry by ID
router.delete('/:id', authenticateUser, deleteRecentlyViewed);

export default router;
