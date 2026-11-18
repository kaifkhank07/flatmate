import { z } from 'zod';

export const mobileRegisterSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required').trim(),
    lastName: z.string().min(1, 'Last name is required').trim(),
    email: z.string().email('Invalid email address').trim(),
    mobile: z
      .string()
      .min(8, 'Invalid mobile number')
      .regex(/^[0-9+\s-]{8,15}$/, 'Invalid mobile number format'),
    userType: z.enum(['owner', 'flatmate', 'agent', 'builder']).optional(),
  }),
});

export const verifyMobileRegistrationOtpSchema = z.object({
  body: z.object({
    mobile: z.string().min(3, 'Mobile number or identifier is required'),
    otp: z.string().min(4, 'OTP is required').max(8),
  }),
});

export const sendMobileLoginOtpSchema = z.object({
  body: z.object({
    mobile: z.string().min(8, 'Mobile number is required'),
  }),
});

export const verifyMobileLoginOtpSchema = z.object({
  body: z.object({
    mobile: z.string().min(8, 'Mobile number is required'),
    otp: z.string().min(4, 'OTP is required').max(8),
  }),
});
