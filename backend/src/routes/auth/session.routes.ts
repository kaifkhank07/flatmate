import { Router } from 'express';
import {
  getSessions,
  revokeSession,
  revokeAllSessions,
} from '../../controllers/auth/session.controller';
import { authenticateUser } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateUser, getSessions);
router.delete('/:sessionId', authenticateUser, revokeSession);
router.delete('/', authenticateUser, revokeAllSessions);

export default router;
