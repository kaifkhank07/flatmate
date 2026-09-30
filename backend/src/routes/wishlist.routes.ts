import { Router } from 'express';
import { authenticateUser } from '../middlewares/auth.middleware';
import {
  addWishlist,
  toggleWishlist,
  getWishlist,
  checkWishlistStatus,
  deleteWishlist,
} from '../controllers/wishlist.controller';

const router = Router();

router.post('/', authenticateUser, addWishlist);
router.post('/toggle', authenticateUser, toggleWishlist);
router.get('/', authenticateUser, getWishlist);
router.get('/check', authenticateUser, checkWishlistStatus);
router.delete('/by-target', authenticateUser, deleteWishlist);
router.delete('/:id', authenticateUser, deleteWishlist);

export default router;
