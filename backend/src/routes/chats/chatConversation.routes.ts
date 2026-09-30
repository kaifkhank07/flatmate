import { Router } from 'express';
import { authenticateUser } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createConversationSchema,
  getConversationsSchema,
  getConversationByIdSchema,
} from '../../validations/chats/chatConversation.validation';
import {
  createConversationHandler,
  getMyConversationsHandler,
  getConversationByIdHandler,
} from '../../controllers/chats/chatConversation.controller';

const router = Router();

router.use(authenticateUser);

router.post('/', validate(createConversationSchema), createConversationHandler);
router.get('/', validate(getConversationsSchema), getMyConversationsHandler);
router.get('/:conversationId', validate(getConversationByIdSchema), getConversationByIdHandler);

export default router;
