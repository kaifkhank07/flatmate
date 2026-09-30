import { Router } from 'express';
import { sendOTP, verifyOTP } from '../../controllers/auth/otp.controller';
import { validate } from '../../middlewares/validate.middleware';
import { sendOtpSchema, verifyOtpSchema } from '../../validations/auth/otp.validation';

const router = Router();

router.post('/send', validate(sendOtpSchema), sendOTP);
router.post('/verify', validate(verifyOtpSchema), verifyOTP);

export default router;
