import { Router } from 'express';
import { authenticateUser } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createChatReportSchema,
  getChatReportsSchema,
} from '../../validations/chats/chatReport.validation';
import {
  createChatReportHandler,
  getMyChatReportsHandler,
} from '../../controllers/chats/chatReport.controller';

const router = Router();

router.use(authenticateUser);

router.post('/', validate(createChatReportSchema), createChatReportHandler);
router.get('/', validate(getChatReportsSchema), getMyChatReportsHandler);

export default router;
