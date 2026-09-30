import { Request, Response } from 'express';
import crypto from 'crypto';

import { OTP, OTPType } from '../../models/auth/otp.model';
import { User } from '../../models/auth/user.model';
import { UserSession } from '../../models/auth/userSession.model';

import { sendEmail } from '../../services/email';
import { sendMobileOTP } from '../../services/sms';

import { hashSecret } from '../../utils/password.util';
import { generateAccessToken, generateRefreshToken } from '../../utils/token.util';
import { setAuthCookies } from '../../utils/cookie.util';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';

/**
 * Generate a random 6-digit numeric OTP string
 */
const generateRandomOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send OTP to identifier (email or mobile)
 * POST /api/otp/send
 */
export const sendOTP = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { identifier, type } = req.body as { identifier: string; type: OTPType };

    const cleanIdentifier = identifier.toLowerCase().trim();

    // Basic Rate Limit Check: Check if an OTP was issued in the last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentOtp = await OTP.findOne({
      identifier: cleanIdentifier,
      type,
      createdAt: { $gte: oneMinuteAgo },
    });

    if (recentOtp) {
      return sendError(
        res,
        'Please wait a minute before requesting another OTP',
        429
      );
    }

    const rawOtp = generateRandomOTP();
    const otpHash = hashSecret(rawOtp);

    // Expire in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { mobile: cleanIdentifier }],
    });

    await OTP.create({
      userId: user?._id,
      identifier: cleanIdentifier,
      type,
      otpHash,
      expiresAt,
      attempts: 0,
      isUsed: false,
    });

    // logger.info(`OTP generated for identifier: ${cleanIdentifier}, type: ${type}`);

    // If identifier is an email, send email
    if (cleanIdentifier.includes('@')) {
      try {
        await sendEmail({
          to: cleanIdentifier,
          subject: 'Flatmate Marketplace - Verification Code',
          html: `<p>Your verification code is: <strong>${rawOtp}</strong></p><p>This code expires in 5 minutes.</p>`,
          text: `Your verification code is: ${rawOtp}. This code expires in 5 minutes.`,
        });

        if (process.env.NODE_ENV !== 'production') {
          logger.info(
            `[OTP TEST] Email OTP dispatched successfully | email=${cleanIdentifier} | OTP=${rawOtp}`
          );
        }

      } catch (emailErr) {
        logger.warn(
          `Failed to dispatch OTP email to ${cleanIdentifier}:`,
          emailErr instanceof Error ? emailErr.message : emailErr
        );
      }
    } else {
      try {
        await sendMobileOTP({
          mobile: cleanIdentifier,
          otp: rawOtp,
        });

        if (process.env.NODE_ENV !== 'production') {
          logger.info(
            `[OTP TEST] Twilio SMS dispatched successfully | mobile=${cleanIdentifier} | OTP=${rawOtp}`
          );
        }

      } catch (smsErr) {
        logger.warn(
          `Failed to dispatch OTP SMS via Twilio to ${cleanIdentifier}:`,
          smsErr instanceof Error ? smsErr.message : smsErr
        );
      }
    }

    return sendSuccess(res, 'OTP sent successfully', {
      otp: rawOtp,
    });
  } catch (error) {
    logger.error('[OTPController] Failed to send OTP:', error);
    return sendError(res, 'Failed to send OTP', 500);
  }
};

/**
 * Verify OTP and login if login flow
 * POST /api/otp/verify
 */
export const verifyOTP = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { identifier, otp, type } = req.body as {
      identifier: string;
      otp: string;
      type: OTPType;
    };

    const cleanIdentifier = identifier.toLowerCase().trim();

    // Find latest unused and non-expired OTP record
    const otpRecord = await OTP.findOne({
      identifier: cleanIdentifier,
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return sendError(res, 'Invalid or expired OTP', 400);
    }

    if (otpRecord.attempts >= 5) {
      return sendError(res, 'Maximum OTP verification attempts exceeded', 429);
    }

    const inputHash = hashSecret(otp);

    if (otpRecord.otpHash !== inputHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return sendError(res, 'Invalid OTP', 400);
    }

    // Mark OTP verified and used
    otpRecord.isUsed = true;
    otpRecord.verifiedAt = new Date();
    await otpRecord.save();

    // Update user verification status if applicable
    let user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { mobile: cleanIdentifier }],
    });

    if (user) {
      if (type === 'email_verification' || type === 'email_login') {
        user.emailVerified = true;
      }
      if (type === 'mobile_verification' || type === 'mobile_login') {
        user.mobileVerified = true;
      }
      await user.save();
    }

    // If login flow, issue JWT tokens and set cookies
    let loginData = undefined;
    if (user && (type === 'email_login' || type === 'mobile_login')) {
      if (user.accountStatus === 'inactive') {
        return sendError(res, 'Your account is inactive. Please contact support.', 403);
      }

      const accessToken = generateAccessToken({
        userId: user._id.toString(),
        type: 'user',
      });

      const refreshToken = generateRefreshToken({
        id: user._id.toString(),
        type: 'user',
      });

      const refreshTokenHash = hashSecret(refreshToken);

      await UserSession.create({
        userId: user._id,
        refreshTokenHash,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      user.lastLoginAt = new Date();
      await user.save();

      const userJson = user.toObject();
      delete userJson.password;

      // Set HTTP-only Cookies
      setAuthCookies(res, accessToken, refreshToken);

      loginData = {
        user: userJson,
      };
    }

    logger.info(`OTP verified successfully for identifier: ${cleanIdentifier}`);

    return sendSuccess(
      res,
      'OTP verified successfully',
      loginData
    );
  } catch (error) {
    logger.error('[OTPController] Failed to verify OTP:', error);
    return sendError(res, 'Failed to verify OTP', 500);
  }
};
