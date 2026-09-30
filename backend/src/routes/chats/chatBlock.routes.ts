import { Router } from 'express';
import { authenticateUser } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  blockUserSchema,
  unblockUserSchema,
  getBlockedUsersSchema,
} from '../../validations/chats/chatBlock.validation';
import {
  blockUserHandler,
  unblockUserHandler,
  getBlockedUsersHandler,
} from '../../controllers/chats/chatBlock.controller';

const router = Router();

router.use(authenticateUser);

router.post('/blocks', validate(blockUserSchema), blockUserHandler);
router.delete('/blocks/:userId', validate(unblockUserSchema), unblockUserHandler);
router.get('/blocks', validate(getBlockedUsersSchema), getBlockedUsersHandler);

export default router;
