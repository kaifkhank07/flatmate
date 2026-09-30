import { Router } from 'express';
import { authenticateAdmin } from '../../middlewares/admin.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  getConversationsSchema,
  getConversationByIdSchema,
} from '../../validations/chats/chatConversation.validation';
import {
  getMessagesSchema,
} from '../../validations/chats/chatMessage.validation';
import {
  getAdminConversationsHandler,
  getAdminConversationByIdHandler,
  getAdminMessagesHandler,
} from '../../controllers/chats/adminChat.controller';

const router = Router();

router.use(authenticateAdmin);

router.get('/conversations', validate(getConversationsSchema), getAdminConversationsHandler);
router.get('/conversations/:conversationId', validate(getConversationByIdSchema), getAdminConversationByIdHandler);
router.get('/conversations/:conversationId/messages', validate(getMessagesSchema), getAdminMessagesHandler);

export default router;
