import { Router } from 'express';
import {
  registerWithMobileOTP,
  verifyRegistrationMobileOTP,
  sendMobileLoginOTP,
  verifyMobileLoginOTP,
  logoutMobileUser,
} from '../../controllers/auth/mobileAuth.controller';
import { refreshToken } from '../../controllers/auth/user.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  mobileRegisterSchema,
  verifyMobileRegistrationOtpSchema,
  sendMobileLoginOtpSchema,
  verifyMobileLoginOtpSchema,
} from '../../validations/auth/mobileAuth.validation';

const router = Router();

router.post('/register', validate(mobileRegisterSchema), registerWithMobileOTP);
router.post('/register/verify-otp', validate(verifyMobileRegistrationOtpSchema), verifyRegistrationMobileOTP);
router.post('/send-otp', validate(sendMobileLoginOtpSchema), sendMobileLoginOTP);
router.post('/verify-otp', validate(verifyMobileLoginOtpSchema), verifyMobileLoginOTP);
router.post('/refresh-token', refreshToken);
router.post('/logout', logoutMobileUser);

export default router;
