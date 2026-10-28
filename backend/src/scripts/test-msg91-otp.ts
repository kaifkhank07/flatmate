import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import { sendMobileOTP } from '../services/sms/msg91.service';
import { msg91Config } from '../config/msg91';

async function main() {
  const targetMobile = process.argv[2] || '7028469345';
  const testOtp = crypto.randomInt(100000, 999999).toString();

  console.log('=== MSG91 OTP Flow Test ===');
  console.log('Target Mobile:', targetMobile);
  console.log('Generated OTP:', testOtp);
  console.log('Auth Key set:', Boolean(msg91Config.authKey));
  console.log('Template ID:', msg91Config.otpTemplateId || '(not set)');
  console.log('OTP API URL:', msg91Config.otpApiUrl);
  console.log('---------------------------');
  console.log('Sending OTP via MSG91 v5 OTP API...');

  try {
    const result = await sendMobileOTP({
      mobile: targetMobile,
      otp: testOtp,
    });
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('=== TEST COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('=== TEST FAILED ===');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

