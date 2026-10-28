import { Request, Response } from 'express';
import crypto from 'crypto';

import { User } from '../../models/auth/user.model';
import { UserProfile } from '../../models/auth/userProfile.model';
import { OTP } from '../../models/auth/otp.model';
import { UserSession } from '../../models/auth/userSession.model';

import { sendMobileOTP, normalizePhoneNumber } from '../../services/sms/msg91.service';
import { hashSecret } from '../../utils/password.util';
import { generateAccessToken, generateRefreshToken } from '../../utils/token.util';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  setAuthCookies,
  clearAuthCookies,
} from '../../utils/cookie.util';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { createNotification, notifyAdmins } from '../../services/notification/notification.service';
import { config } from '../../config/env';

/**
 * Generate a random 6-digit numeric OTP string
 */
const generateRandomOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * New Registration with Mobile OTP (No Password required)
 * POST /api/auth/mobile/register
 */
export const registerWithMobileOTP = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { firstName, lastName, email, mobile } = req.body;

    const cleanEmail = email.toLowerCase().trim();

    let normalizedMobile: string;
    try {
      normalizedMobile = normalizePhoneNumber(mobile);
    } catch (normErr: any) {
      return sendError(res, normErr.message || 'Invalid mobile number format', 400);
    }

    // Check duplicate email
    const existingEmail = await User.findOne({ email: cleanEmail, isDeleted: false });
    if (existingEmail) {
      return sendError(res, 'User with this email already exists', 409);
    }

    // Check duplicate mobile
    const existingMobile = await User.findOne({ mobile: normalizedMobile, isDeleted: false });
    if (existingMobile) {
      return sendError(res, 'User with this mobile number already exists', 409);
    }

    // Create User without password
    const user = await User.create({
      email: cleanEmail,
      mobile: normalizedMobile,
      role: 'user',
      accountStatus: 'active',
      emailVerified: false,
      mobileVerified: false,
      profileVerified: false,
      verificationStatus: 'not_submitted',
      isDeleted: false,
    });

    // Create UserProfile with firstName and lastName
    await UserProfile.create({
      userId: user._id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      profileCompletion: 0,
    });

    // Send welcome notification to user
    createNotification({
      recipientType: 'USER',
      recipientId: user._id,
      eventType: 'USER_REGISTERED',
      category: 'ACCOUNT_AND_VERIFICATION',
      title: 'Welcome to FlatMate!',
      message: 'Your account has been successfully created. Explore properties and find ideal flatmates today.',
      actionUrl: '/profile',
      priority: 'NORMAL',
    }).catch((err) => logger.warn('[MobileAuthController] Failed to create welcome notification for user', err));

    // Notify admins of new user registration
    notifyAdmins({
      eventType: 'ADMIN_NEW_USER_REGISTERED',
      category: 'ADMINISTRATIVE',
      title: 'New User Registered',
      message: `${firstName.trim()} ${lastName.trim()} (${normalizedMobile || cleanEmail}) has registered on FlatMate.`,
      data: { userId: user._id.toString(), email: cleanEmail, mobile: normalizedMobile },
      actionUrl: '/admin/users',
      priority: 'NORMAL',
    }).catch((err) => logger.warn('[MobileAuthController] Failed to notify admins of registration', err));

    // Generate & Hash Mobile OTP
    const rawOtp = generateRandomOTP();
    const otpHash = hashSecret(rawOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.create({
      userId: user._id,
      identifier: normalizedMobile,
      type: 'mobile_verification',
      otpHash,
      expiresAt,
      attempts: 0,
      isUsed: false,
    });

    // Dispatch OTP via MSG91
    try {
      await sendMobileOTP({
        mobile: normalizedMobile,
        otp: rawOtp,
      });

      if (!config.isProduction) {
        logger.info(
          `[MobileAuth] Registration OTP dispatched | mobile=${normalizedMobile} | OTP=${rawOtp}`
        );
      }
    } catch (smsErr) {
      logger.error(`[MobileAuth] Failed to send SMS to ${normalizedMobile}:`, smsErr);
      return sendError(res, 'Failed to send OTP SMS. Please try again.', 500);
    }

    logger.info(`[MobileAuth] User registered via mobile OTP flow: ${user._id}`);

    const userJson = user.toObject();
    delete userJson.password;

    return sendSuccess(
      res,
      'Registration successful. OTP sent to your mobile number.',
      {
        user: userJson,
        requiresMobileVerification: true,
        // otp: rawOtp, // Commented: Real OTP is now dispatched via MSG91
      },
      201
    );
  } catch (error) {
    logger.error('[MobileAuth] Failed to register user with mobile OTP:', error);
    return sendError(res, 'Failed to register user', 500);
  }
};

/**
 * Verify Registration Mobile OTP
 * POST /api/auth/mobile/register/verify-otp
 */
export const verifyRegistrationMobileOTP = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { mobile, otp } = req.body;

    let normalizedMobile: string;
    try {
      normalizedMobile = normalizePhoneNumber(mobile);
    } catch (normErr: any) {
      return sendError(res, normErr.message || 'Invalid mobile number format', 400);
    }

    const otpRecord = await OTP.findOne({
      identifier: normalizedMobile,
      type: 'mobile_verification',
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

    // Find User and update mobileVerified = true
    const user = await User.findOne({ mobile: normalizedMobile, isDeleted: false });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.mobileVerified = true;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT Tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      type: 'user',
    });

    const refreshToken = generateRefreshToken({
      id: user._id.toString(),
      type: 'user',
    });

    const refreshTokenHash = hashSecret(refreshToken);

    // Save session
    await UserSession.create({
      userId: user._id,
      refreshTokenHash,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    const userJson = user.toObject();
    delete userJson.password;

    // Set HTTP-only Cookies
    setAuthCookies(res, accessToken, refreshToken);

    logger.info(`[MobileAuth] Registration OTP verified and user logged in: ${user._id}`);

    return sendSuccess(res, 'Mobile number verified and logged in successfully', {
      user: userJson,
    });
  } catch (error) {
    logger.error('[MobileAuth] Failed to verify registration OTP:', error);
    return sendError(res, 'Failed to verify OTP', 500);
  }
};

/**
 * Request Mobile Login OTP
 * POST /api/auth/mobile/send-otp
 */
export const sendMobileLoginOTP = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { mobile } = req.body;

    let normalizedMobile: string;
    try {
      normalizedMobile = normalizePhoneNumber(mobile);
    } catch (normErr: any) {
      return sendError(res, normErr.message || 'Invalid mobile number format', 400);
    }

    const user = await User.findOne({ mobile: normalizedMobile, isDeleted: false });

    if (!user) {
      return sendError(res, 'No account found with this mobile number. Please register first.', 404);
    }

    if (user.accountStatus === 'inactive') {
      return sendError(res, 'Your account is inactive. Please contact support.', 403);
    }

    // Rate Limit Check: 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentOtp = await OTP.findOne({
      identifier: normalizedMobile,
      type: 'mobile_login',
      createdAt: { $gte: oneMinuteAgo },
    });

    if (recentOtp && config.isProduction) {
      return sendError(res, 'Please wait a minute before requesting another OTP', 429);
    }

    const rawOtp = generateRandomOTP();
    const otpHash = hashSecret(rawOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.create({
      userId: user._id,
      identifier: normalizedMobile,
      type: 'mobile_login',
      otpHash,
      expiresAt,
      attempts: 0,
      isUsed: false,
    });

    try {
      await sendMobileOTP({
        mobile: normalizedMobile,
        otp: rawOtp,
      });

      if (!config.isProduction) {
        logger.info(
          `[MobileAuth] Mobile Login OTP dispatched | mobile=${normalizedMobile} | OTP=${rawOtp}`
        );
      }
    } catch (smsErr) {
      logger.error(`[MobileAuth] Failed to send SMS to ${normalizedMobile}:`, smsErr);
      return sendError(res, 'Failed to send OTP SMS. Please try again.', 500);
    }

    return sendSuccess(res, 'OTP sent successfully to your mobile number', {
      // otp: rawOtp, // Commented: Real OTP is now dispatched via MSG91
    });
  } catch (error) {
    logger.error('[MobileAuth] Failed to send mobile login OTP:', error);
    return sendError(res, 'Failed to send OTP', 500);
  }
};

/**
 * Verify Mobile Login OTP & Issue JWT Session
 * POST /api/auth/mobile/verify-otp
 */
export const verifyMobileLoginOTP = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { mobile, otp } = req.body;

    let normalizedMobile: string;
    try {
      normalizedMobile = normalizePhoneNumber(mobile);
    } catch (normErr: any) {
      return sendError(res, normErr.message || 'Invalid mobile number format', 400);
    }

    const otpRecord = await OTP.findOne({
      identifier: normalizedMobile,
      type: 'mobile_login',
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

    const user = await User.findOne({
      mobile: normalizedMobile,
      isDeleted: false,
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (user.accountStatus === 'inactive') {
      return sendError(res, 'Your account is inactive. Please contact support.', 403);
    }

    user.mobileVerified = true;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT Tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      type: 'user',
    });

    const refreshToken = generateRefreshToken({
      id: user._id.toString(),
      type: 'user',
    });

    const refreshTokenHash = hashSecret(refreshToken);

    // Save session
    await UserSession.create({
      userId: user._id,
      refreshTokenHash,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    const userJson = user.toObject();
    delete userJson.password;

    // Set HTTP-only Cookies
    setAuthCookies(res, accessToken, refreshToken);

    logger.info(`[MobileAuth] User logged in via mobile OTP: ${user._id}`);

    return sendSuccess(res, 'Login successful', {
      user: userJson,
    });
  } catch (error) {
    logger.error('[MobileAuth] Failed to verify mobile login OTP:', error);
    return sendError(res, 'Failed to verify OTP and log in', 500);
  }
};

/**
 * Logout User, Revoke Session & Clear HTTP-only Cookies
 * POST /api/auth/mobile/logout
 */
export const logoutMobileUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (token) {
      const refreshTokenHash = hashSecret(token);
      await UserSession.updateMany(
        { refreshTokenHash, isRevoked: false },
        { isRevoked: true }
      );
    }

    clearAuthCookies(res);
    return sendSuccess(res, 'Logged out successfully');
  } catch (error) {
    logger.error('[MobileAuth] Failed to logout user:', error);
    clearAuthCookies(res);
    return sendSuccess(res, 'Logged out successfully');
  }
};
