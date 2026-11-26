import dotenv from 'dotenv';
dotenv.config();

export interface MSG91Config {
  authKey: string;
  senderId: string;
  otpTemplateId: string;
  otpApiUrl?: string;
  appDomain: string;
}

export const msg91Config: MSG91Config = {
  authKey: process.env.MSG91_AUTH_KEY || '',
  senderId: process.env.MSG91_SENDER_ID || '',
  otpTemplateId: process.env.MSG91_OTP_TEMPLATE_ID || '',
  otpApiUrl: process.env.MSG91_OTP_API_URL || 'https://control.msg91.com/api/v5/otp',
  appDomain: process.env.APP_DOMAIN || 'flatmate.in',
};
