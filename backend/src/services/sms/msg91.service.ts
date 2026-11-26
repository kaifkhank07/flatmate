import { msg91Config } from '../../config/msg91';
import { config } from '../../config/env';
import { logger } from '../../utils/logger.util';

export interface SendMobileOTPOptions {
  mobile: string;
  otp: string;
  otpTemplateId?: string;
}

export interface SendSMSResult {
  success: boolean;
  message: string;
  messageSid?: string;
  requestId?: string;
}

export interface SendSMSOptions {
  otpTemplateId?: string;
  variables?: Record<string, string | number>;
}

/**
 * Normalizes and validates Indian phone numbers to exactly 10 digits.
 * Strips leading +91 or 91 if present.
 */
export const normalizePhoneNumber = (phone: string): string => {
  const trimmed = phone.trim();

  // If already exactly 10 digits
  if (/^\d{10}$/.test(trimmed)) {
    return trimmed;
  }

  // If prefixed with +91 or 91 followed by 10 digits
  if (/^(?:\+91|91)(\d{10})$/.test(trimmed)) {
    const match = trimmed.match(/^(?:\+91|91)(\d{10})$/);
    if (match) {
      return match[1];
    }
  }

  throw new Error('Phone number must be exactly 10 digits');
};

/**
 * Formats a phone number for MSG91 by ensuring the country code is prefixed without '+'.
 * MSG91 requires recipient mobile numbers with country code (e.g. 917028469345).
 */
export const formatMobileForMSG91 = (phone: string): string => {
  const digitsOnly = phone.replace(/[^\d]/g, '');
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  return digitsOnly;
};

/**
 * Sends an OTP via the official MSG91 v5 OTP API (POST https://control.msg91.com/api/v5/otp).
 * This endpoint is dedicated to OTP dispatch and uses the configured MSG91_OTP_TEMPLATE_ID.
 */
export async function sendMobileOTP(
  mobileOrOptions: string | SendMobileOTPOptions,
  otpParam?: string
): Promise<SendSMSResult> {
  let mobile: string;
  let otp: string;
  let customTemplateId: string | undefined;

  if (typeof mobileOrOptions === 'object') {
    mobile = mobileOrOptions.mobile;
    otp = mobileOrOptions.otp;
    customTemplateId = mobileOrOptions.otpTemplateId;
  } else {
    mobile = mobileOrOptions;
    otp = otpParam || '';
  }

  const normalizedMobile = normalizePhoneNumber(mobile);

  // If not running in production, do not send real OTP; log instead
  if (!config.isProduction) {
    logger.info(
      `[MSG91 OTP Service (Non-Production)] Real OTP sending skipped | mobile=${normalizedMobile} | OTP=${otp}`
    );
    return {
      success: true,
      message: 'OTP sent (Development Mode: sending bypassed, logged only)',
    };
  }

  // Mock mode fallback when MSG91 credentials are not set
  if (!msg91Config.authKey) {
    logger.info(
      `[MSG91 OTP Service (Mock Mode)] OTP dispatched to ${normalizedMobile} | OTP=${otp}`
    );
    return {
      success: true,
      message: 'OTP sent (Mock Mode: MSG91 credentials not provided)',
    };
  }

  const templateId = customTemplateId || msg91Config.otpTemplateId;
  if (!templateId) {
    throw new Error('MSG91_OTP_TEMPLATE_ID is not configured in environment.');
  }

  const formattedMobile = formatMobileForMSG91(normalizedMobile);

  try {
    const url = new URL(msg91Config.otpApiUrl || 'https://control.msg91.com/api/v5/otp');
    url.searchParams.append('template_id', templateId);
    url.searchParams.append('mobile', formattedMobile);
    url.searchParams.append('otp', otp);
    url.searchParams.append('otp_expiry', '5');
    url.searchParams.append('otp_length', String(otp.length));

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        authkey: msg91Config.authKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        otp,
        OTP: otp,
        Otp: otp,
        code: otp,
        CODE: otp,
        VAR1: otp,
        var1: otp,
        domain: msg91Config.appDomain,
        DOMAIN: msg91Config.appDomain,
        Domain: msg91Config.appDomain,
      }),
    });

    const responseData = (await response.json().catch(() => null)) as {
      type?: string;
      message?: string;
      msg?: string;
      request_id?: string;
    } | null;

    if (!response.ok) {
      const errorMsg =
        responseData?.message ||
        responseData?.msg ||
        `HTTP error ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    if (responseData && responseData.type === 'error') {
      const errorMsg =
        responseData.message || responseData.msg || 'MSG91 OTP API returned error status';
      throw new Error(errorMsg);
    }

    const requestId =
      typeof responseData?.message === 'string'
        ? responseData.message
        : responseData?.request_id;

    logger.info(
      `[MSG91 OTP Service] OTP sent successfully | mobile=${normalizedMobile}${requestId ? ` | requestId=${requestId}` : ''}`
    );

    return {
      success: true,
      message: 'OTP sent successfully via MSG91',
      messageSid: requestId,
      requestId,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown MSG91 OTP error';
    logger.error(
      `[MSG91 OTP Service] Failed to send OTP to ${normalizedMobile}:`,
      errorMsg
    );
    throw new Error(`Failed to dispatch OTP: ${errorMsg}`);
  }
}

/**
 * Normal SMS is disabled/hidden: this project strictly uses OTP-only flow.
 * Preserved for interface compatibility.
 */
export const sendSMS = async (
  to: string,
  message: string,
  _options?: SendSMSOptions
): Promise<SendSMSResult> => {
  logger.warn(
    `[MSG91 SMS Service] Generic SMS is disabled in this project (OTP-only mode). Discarded message to ${to}: "${message}"`
  );
  return {
    success: false,
    message: 'Normal SMS is disabled: this project uses OTP only.',
  };
};
