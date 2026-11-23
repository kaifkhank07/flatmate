import { Router } from 'express';
import {
  registerWithMobileOTP,
  verifyRegistrationMobileOTP,
  sendMobileLoginOTP,
  verifyMobileLoginOTP,
  logoutMobileUser,
  sendRestoreAccountOTP,
  verifyRestoreAccountOTP,
} from '../../controllers/auth/mobileAuth.controller';
import { refreshToken } from '../../controllers/auth/user.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  mobileRegisterSchema,
  verifyMobileRegistrationOtpSchema,
  sendMobileLoginOtpSchema,
  verifyMobileLoginOtpSchema,
  sendRestoreAccountOtpSchema,
  verifyRestoreAccountOtpSchema,
} from '../../validations/auth/mobileAuth.validation';

const router = Router();

router.post('/register', validate(mobileRegisterSchema), registerWithMobileOTP);
router.post('/register/verify-otp', validate(verifyMobileRegistrationOtpSchema), verifyRegistrationMobileOTP);
router.post('/send-otp', validate(sendMobileLoginOtpSchema), sendMobileLoginOTP);
router.post('/verify-otp', validate(verifyMobileLoginOtpSchema), verifyMobileLoginOTP);
router.post('/restore/send-otp', validate(sendRestoreAccountOtpSchema), sendRestoreAccountOTP);
router.post('/restore/verify-otp', validate(verifyRestoreAccountOtpSchema), verifyRestoreAccountOTP);
router.post('/refresh-token', refreshToken);
router.post('/logout', logoutMobileUser);

export default router;
