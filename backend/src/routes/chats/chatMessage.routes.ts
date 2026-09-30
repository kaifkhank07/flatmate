import { Router } from 'express';
import { authenticateUser } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  sendMessageSchema,
  getMessagesSchema,
  markDeliveredSchema,
  markReadSchema,
  deleteMessageSchema,
} from '../../validations/chats/chatMessage.validation';
import {
  sendMessageHandler,
  getMessagesHandler,
  markDeliveredHandler,
  markReadHandler,
  deleteMessageHandler,
} from '../../controllers/chats/chatMessage.controller';

const router = Router();

router.use(authenticateUser);

// Conversation message routes
router.post('/conversations/:conversationId/messages', validate(sendMessageSchema), sendMessageHandler);
router.get('/conversations/:conversationId/messages', validate(getMessagesSchema), getMessagesHandler);
router.patch('/conversations/:conversationId/read', validate(markReadSchema), markReadHandler);

// Individual message routes
router.patch('/messages/:messageId/delivered', validate(markDeliveredSchema), markDeliveredHandler);
router.delete('/messages/:messageId', validate(deleteMessageSchema), deleteMessageHandler);

export default router;
