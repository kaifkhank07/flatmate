import twilio from 'twilio';
import { twilioConfig } from '../../config/twilio';
import { logger } from '../../utils/logger.util';

export interface SendMobileOTPOptions {
  mobile: string;
  otp: string;
}

export interface SendSMSResult {
  success: boolean;
  message: string;
  messageSid?: string;
}

/**
 * Normalizes phone numbers to standard E.164 format.
 * Defaults Indian 10-digit numbers to +91 prefix.
 *
 * Examples:
 * - 7028469345     -> +917028469345
 * - +917028469345  -> +917028469345
 * - 917028469345   -> +917028469345
 */
// export const normalizePhoneNumber = (phone: string): string => {
//   const trimmed = phone.trim();
//   if (!trimmed) {
//     throw new Error('Phone number cannot be empty');
//   }

//   // If already starts with '+', sanitize any redundant formatting
//   if (trimmed.startsWith('+')) {
//     const cleaned = '+' + trimmed.slice(1).replace(/[^\d]/g, '');
//     if (!/^\+[1-9]\d{1,14}$/.test(cleaned)) {
//       throw new Error(`Invalid international phone number format: ${phone}`);
//     }
//     return cleaned;
//   }

//   // Strip non-digit characters
//   const digitsOnly = trimmed.replace(/[^\d]/g, '');

//   let normalized: string;
//   if (digitsOnly.length === 10) {
//     normalized = `+91${digitsOnly}`;
//   } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
//     normalized = `+${digitsOnly}`;
//   } else {
//     normalized = `+${digitsOnly}`;
//   }

//   if (!/^\+[1-9]\d{1,14}$/.test(normalized)) {
//     throw new Error(`Invalid phone number format: ${phone}`);
//   }

//   return normalized;
// };
export const normalizePhoneNumber = (phone: string): string => {
  const trimmed = phone.trim();

  if (!/^\d{10}$/.test(trimmed)) {
    throw new Error("Phone number must be exactly 10 digits");
  }

  return trimmed;
};

/**
 * Returns an initialized Twilio client, or null if credentials are missing (Mock Mode).
 */
const getTwilioClient = () => {
  if (!twilioConfig.accountSid || !twilioConfig.authToken) {
    return null;
  }
  return twilio(twilioConfig.accountSid, twilioConfig.authToken);
};

/**
 * Sends a generic SMS using Twilio.
 */
export const sendSMS = async (
  to: string,
  message: string
): Promise<SendSMSResult> => {
  const normalizedMobile = normalizePhoneNumber(to);
  const client = getTwilioClient();

  // Mock mode fallback for local development when credentials are not set
  if (!client) {
    logger.info(
      `[Twilio SMS Service (Mock Mode)] SMS dispatched to ${normalizedMobile}`
    );
    return {
      success: true,
      message: 'SMS sent (Mock Mode: Twilio credentials not provided)',
    };
  }

  try {
    const payload: {
      to: string;
      body: string;
      messagingServiceSid?: string;
      from?: string;
    } = {
      to: normalizedMobile,
      body: message,
    };

    if (twilioConfig.messagingServiceSid) {
      payload.messagingServiceSid = twilioConfig.messagingServiceSid;
    } else if (twilioConfig.phoneNumber) {
      payload.from = twilioConfig.phoneNumber;
    } else {
      throw new Error(
        'Neither TWILIO_MESSAGING_SERVICE_SID nor TWILIO_PHONE_NUMBER is configured in environment.'
      );
    }

    const response = await client.messages.create(payload);

    logger.info(
      `[Twilio SMS Service] SMS sent successfully | mobile=${normalizedMobile} | messageSid=${response.sid}`
    );

    return {
      success: true,
      message: 'SMS sent successfully via Twilio',
      messageSid: response.sid,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown Twilio SMS error';
    logger.error(
      `[Twilio SMS Service] Failed to send SMS to ${normalizedMobile}:`,
      errorMsg
    );
    throw new Error(`Failed to dispatch SMS: ${errorMsg}`);
  }
};

/**
 * Sends an OTP SMS via Twilio using standard message template.
 */
export async function sendMobileOTP(
  mobileOrOptions: string | SendMobileOTPOptions,
  otpParam?: string
): Promise<SendSMSResult> {
  let mobile: string;
  let otp: string;

  if (typeof mobileOrOptions === 'object') {
    mobile = mobileOrOptions.mobile;
    otp = mobileOrOptions.otp;
  } else {
    mobile = mobileOrOptions;
    otp = otpParam || '';
  }

  const message = `Your FlatMate OTP is ${otp}. It is valid for 5 minutes. Please do not share this OTP with anyone.`;
  return sendSMS(mobile, message);
}
