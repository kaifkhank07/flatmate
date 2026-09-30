import { z } from 'zod';

export const sendOtpSchema = z.object({
  body: z.object({
    identifier: z.string().min(3, 'Identifier is required'),
    type: z.enum([
      'mobile_login',
      'email_login',
      'forgot_password',
      'mobile_verification',
      'email_verification',
    ]),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    identifier: z.string().min(3, 'Identifier is required'),
    otp: z.string().min(4, 'OTP is required').max(8),
    type: z.enum([
      'mobile_login',
      'email_login',
      'forgot_password',
      'mobile_verification',
      'email_verification',
    ]),
  }),
});
