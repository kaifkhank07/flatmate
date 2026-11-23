import { Request, Response } from 'express';
import { Types } from 'mongoose';
import crypto from 'crypto';

import { User } from '../../models/auth/user.model';
import { UserProfile } from '../../models/auth/userProfile.model';
import { UserPreference } from '../../models/auth/userPreference.model';
import { Avatar } from '../../models/auth/avatar.model';
import { UserSession } from '../../models/auth/userSession.model';
import { OTP } from '../../models/auth/otp.model';

import { calculateProfileCompletion, parseProfileImageInput } from './profile.controller';
import { deleteFile, extractKeyFromUrl } from '../../services/aws/s3.service';
import { sendEmail } from '../../services/email/email.service';
import { sendMobileOTP, normalizePhoneNumber } from '../../services/sms/msg91.service';
import { config } from '../../config/env';

import { comparePassword, hashPassword, hashSecret } from '../../utils/password.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/token.util';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  setAuthCookies,
  clearAuthCookies,
  getAccessTokenCookieOptions,
} from '../../utils/cookie.util';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { createNotification, notifyAdmins } from '../../services/notification/notification.service';
import { userDeletionService } from '../../services/deletion';

/**
 * Generate a random 6-digit numeric OTP string
 */
const generateRandomOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Register a new user
 * POST /api/users
 */
export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, mobile, password, userType } = req.body;

    // Check duplicate email
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        if (existingEmail.isDeleted) {
          return sendError(
            res,
            'An account with this email was previously deleted. Please contact support to restore.',
            409
          );
        }
        return sendError(res, 'User with this email already exists', 409);
      }
    }

    // Check duplicate mobile
    if (mobile) {
      const existingMobile = await User.findOne({ mobile });
      if (existingMobile) {
        if (existingMobile.isDeleted) {
          return sendError(
            res,
            'An account with this mobile number was previously deleted. Please contact support to restore.',
            409
          );
        }
        return sendError(res, 'User with this mobile number already exists', 409);
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      email: email ? email.toLowerCase() : undefined,
      mobile: mobile || undefined,
      password: hashedPassword,
      userType: userType || 'flatmate',
      accountStatus: 'active',
      emailVerified: false,
      mobileVerified: false,
    });

    // Create empty profile for user
    await UserProfile.create({
      userId: user._id,
      profileCompletion: 0,
    });

    logger.info(`User registered successfully: ${user._id}`);

    // Send welcome notification to user
    // createNotification({
    //   recipientType: 'USER',
    //   recipientId: user._id,
    //   eventType: 'USER_REGISTERED',
    //   category: 'ACCOUNT_AND_VERIFICATION',
    //   title: 'Welcome to FlatMate!',
    //   message: 'Your account has been successfully created. Explore properties and find ideal flatmates today.',
    //   actionUrl: '/profile',
    //   priority: 'NORMAL',
    // }).catch((err) => logger.warn('[UserController] Failed to create welcome notification for user', err));

    // Notify admins of new user registration
    // notifyAdmins({
    //   eventType: 'ADMIN_NEW_USER_REGISTERED',
    //   category: 'ADMINISTRATIVE',
    //   title: 'New User Registered',
    //   message: `A new user account (${user.email || user.mobile || user._id}) has registered on FlatMate.`,
    //   data: { userId: user._id.toString(), email: user.email, mobile: user.mobile },
    //   actionUrl: '/admin/users',
    //   priority: 'NORMAL',
    // }).catch((err) => logger.warn('[UserController] Failed to notify admins of user registration', err));

    const userJson = user.toObject();
    delete userJson.password;

    return sendSuccess(res, 'User registered successfully', userJson, 201);
  } catch (error: any) {
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'email';
      return sendError(
        res,
        `An account with this ${field} already exists or was previously deleted. Please contact support to reactivate.`,
        409
      );
    }
    logger.error('[UserController] Failed to register user:', error);
    return sendError(res, 'Failed to register user', 500);
  }
};

/**
 * Login a user with email/mobile and password
 * POST /api/users/login
 */
export const loginUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, mobile, password } = req.body;

    const query: any = { isDeleted: false };
    if (email) {
      query.email = email.toLowerCase().trim();
    } else if (mobile) {
      query.mobile = mobile.trim();
    }

    const user = await User.findOne(query).select('+password');

    if (!user || !user.password) {
      return sendError(res, 'Invalid email/mobile or password', 401);
    }

    if (user.accountStatus === 'inactive') {
      return sendError(res, 'Your account is inactive. Please contact support.', 403);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid email/mobile or password', 401);
    }

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

    user.lastLoginAt = new Date();
    await user.save();

    const userJson = user.toObject();
    delete userJson.password;

    // Set HTTP-only Cookies
    setAuthCookies(res, accessToken, refreshToken);

    logger.info(`User logged in successfully: ${user._id}`);

    return sendSuccess(res, 'User logged in successfully', {
      user: userJson,
    });
  } catch (error) {
    logger.error('[UserController] Login error:', error);
    return sendError(res, 'Failed to log in user', 500);
  }
};

/**
 * Refresh Access Token using HTTP-only Refresh Token Cookie
 * POST /api/users/refresh-token
 */
export const refreshToken = async (req: Request, res: Response): Promise<Response> => {
  try {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!token) {
      return sendError(res, 'Refresh token missing', 401);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (jwtErr) {
      clearAuthCookies(res);
      return sendError(res, 'Invalid or expired refresh token', 401);
    }

    if (!decoded || decoded.type !== 'user' || !decoded.id) {
      clearAuthCookies(res);
      return sendError(res, 'Invalid refresh token payload', 401);
    }

    const refreshTokenHash = hashSecret(token);
    const session = await UserSession.findOne({
      userId: decoded.id,
      refreshTokenHash,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      clearAuthCookies(res);
      return sendError(res, 'Session expired or revoked', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || user.isDeleted) {
      clearAuthCookies(res);
      return sendError(res, 'User account not found or deleted', 401);
    }

    if (user.accountStatus === 'inactive') {
      clearAuthCookies(res);
      return sendError(res, 'Account is inactive. Please contact support.', 403);
    }

    // Update session activity timestamp
    session.lastUsedAt = new Date();
    await session.save();

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      type: 'user',
    });

    res.cookie(ACCESS_TOKEN_COOKIE_NAME, newAccessToken, getAccessTokenCookieOptions());

    return sendSuccess(res, 'Token refreshed successfully');
  } catch (error) {
    logger.error('[UserController] Failed to refresh token:', error);
    return sendError(res, 'Failed to refresh token', 500);
  }
};

/**
 * Logout User & Revoke Session & Clear Cookies
 * POST /api/users/logout
 */
export const logoutUser = async (req: Request, res: Response): Promise<Response> => {
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
    logger.error('[UserController] Failed to logout user:', error);
    clearAuthCookies(res);
    return sendSuccess(res, 'Logged out successfully');
  }
};

/**
 * Get current authenticated user details and profile
 * GET /api/users/me
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    let profile = await UserProfile.findOne({ userId: req.user._id })
      .populate({
        path: 'preferences',
        select: 'name category image isActive',
      })
      .populate({
        path: 'avatar',
        select: '_id name image isActive',
      });

    if (!profile) {
      profile = await UserProfile.create({
        userId: req.user._id,
        profileCompletion: 0,
      });
      profile = await UserProfile.findById(profile._id)
        .populate({
          path: 'preferences',
          select: 'name category image isActive',
        })
        .populate({
          path: 'avatar',
          select: '_id name image isActive',
        });
    }

    const userJson = req.user.toObject();
    delete userJson.password;

    return sendSuccess(res, 'User fetched successfully', {
      user: userJson,
      profile,
    });
  } catch (error) {
    logger.error('[UserController] Failed to get current user:', error);
    return sendError(res, 'Failed to fetch current user', 500);
  }
};

/**
 * Update current authenticated user account fields
 * PATCH /api/users/me
 */
export const updateCurrentUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { email, mobile, userType } = req.body;

    if (userType) {
      req.user.userType = userType;
    }

    if (email && email.toLowerCase() !== req.user.email) {
      const existingEmail = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.user._id },
      });
      if (existingEmail) {
        if (existingEmail.isDeleted) {
          return sendError(
            res,
            'An account with this email was previously deleted. Please contact support to restore.',
            409
          );
        }
        return sendError(res, 'Email is already in use by another account', 409);
      }
      req.user.email = email.toLowerCase();
      req.user.emailVerified = false;
    }

    if (mobile && mobile !== req.user.mobile) {
      const existingMobile = await User.findOne({
        mobile,
        _id: { $ne: req.user._id },
      });
      if (existingMobile) {
        if (existingMobile.isDeleted) {
          return sendError(
            res,
            'An account with this mobile number was previously deleted. Please contact support to restore.',
            409
          );
        }
        return sendError(res, 'Mobile number is already in use by another account', 409);
      }
      req.user.mobile = mobile;
      req.user.mobileVerified = false;
    }

    await req.user.save();

    const userJson = req.user.toObject();
    delete userJson.password;

    return sendSuccess(res, 'User updated successfully', userJson);
  } catch (error) {
    logger.error('[UserController] Failed to update current user:', error);
    return sendError(res, 'Failed to update user', 500);
  }
};

/**
 * Deactivate current authenticated user account
 * PATCH /api/users/me/deactivate
 */
export const deactivateCurrentUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    req.user.accountStatus = 'inactive';
    req.user.deactiveAt = new Date();
    req.user.deactiveBy = req.user._id;
    await req.user.save();

    // Revoke all sessions for user
    await UserSession.updateMany({ userId: req.user._id }, { isRevoked: true });

    clearAuthCookies(res);

    logger.info(`User deactivated their account: ${req.user._id}`);

    // Fetch user profile / name for notification
    const userProfile = await UserProfile.findOne({ userId: req.user._id }).select('firstName lastName').lean();
    const userFullName = userProfile
      ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
      : '';
    const userName = userFullName || req.user.email || req.user.mobile || req.user._id.toString();

    return sendSuccess(res, 'Account deactivated successfully');
  } catch (error) {
    logger.error('[UserController] Failed to deactivate current user:', error);
    return sendError(res, 'Failed to deactivate account', 500);
  }
};

/**
 * Request OTP for account soft-deletion
 * POST /api/users/me/delete-otp
 */
export const requestAccountDeletionOTP = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const user = await User.findById(req.user._id);
    if (!user || user.isDeleted) {
      return sendError(res, 'User not found or account is already deleted', 404);
    }

    const identifier = user.mobile || user.email;
    if (!identifier) {
      return sendError(res, 'No registered mobile or email found for your account', 400);
    }

    const cleanIdentifier = identifier.toLowerCase().trim();

    // Rate limit check: 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentOtp = await OTP.findOne({
      userId: user._id,
      type: 'account_deletion',
      createdAt: { $gte: oneMinuteAgo },
    });

    if (recentOtp && config.isProduction) {
      return sendError(res, 'Please wait a minute before requesting another OTP', 429);
    }

    const rawOtp = generateRandomOTP();
    const otpHash = hashSecret(rawOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.create({
      userId: user._id,
      identifier: cleanIdentifier,
      type: 'account_deletion',
      otpHash,
      expiresAt,
      attempts: 0,
      isUsed: false,
    });

    let maskedDestination = '';
    let sentViaSms = false;
    let sentViaEmail = false;

    // Send SMS if user has mobile
    if (user.mobile) {
      try {
        await sendMobileOTP({
          mobile: user.mobile,
          otp: rawOtp,
        });
        sentViaSms = true;
        const mob = user.mobile.trim();
        maskedDestination = mob.length > 4 ? `+${mob.slice(0, 2)}******${mob.slice(-4)}` : mob;
        if (!config.isProduction) {
          logger.info(`[AccountDeletion] SMS OTP dispatched | mobile=${user.mobile} | OTP=${rawOtp}`);
        }
      } catch (smsErr) {
        logger.error(`[AccountDeletion] Failed to send SMS to ${user.mobile}:`, smsErr);
      }
    }

    // Send Email if user has email
    // if (user.email) {
    //   try {
    //     await sendEmail({
    //       to: user.email,
    //       subject: 'Flatmate Marketplace - Account Deletion Verification Code',
    //       html: `<p>You have requested to delete your FlatMate Marketplace account.</p>
    //              <p>Your verification code is: <strong>${rawOtp}</strong></p>
    //              <p>This code expires in 5 minutes. If you did not request this, please secure your account immediately.</p>`,
    //       text: `You have requested to delete your FlatMate Marketplace account. Your verification code is: ${rawOtp}. This code expires in 5 minutes.`,
    //     });
    //     sentViaEmail = true;
    //     if (!maskedDestination) {
    //       const parts = user.email.split('@');
    //       const namePart = parts[0];
    //       const domainPart = parts[1] || '';
    //       maskedDestination = namePart.length > 2
    //         ? `${namePart.slice(0, 2)}****@${domainPart}`
    //         : `${namePart}****@${domainPart}`;
    //     }
    //     if (!config.isProduction) {
    //       logger.info(`[AccountDeletion] Email OTP dispatched | email=${user.email} | OTP=${rawOtp}`);
    //     }
    //   } catch (emailErr) {
    //     logger.error(`[AccountDeletion] Failed to send email to ${user.email}:`, emailErr);
    //   }
    // }

    if (!sentViaSms && !sentViaEmail) {
      return sendError(res, 'Failed to dispatch verification code to your registered contact. Please try again.', 500);
    }

    return sendSuccess(res, 'Account deletion verification code sent successfully', {
      destination: maskedDestination,
      expiresIn: 300,
    });
  } catch (error: any) {
    logger.error('[UserController] Failed to request account deletion OTP:', error);
    return sendError(res, error.message || 'Failed to request deletion OTP', 500);
  }
};

/**
 * Soft delete current authenticated user (Requires OTP verification)
 * DELETE /api/users/me or POST /api/users/me/verify-delete
 */
export const deleteCurrentUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const otp = (req.body?.otp || req.headers?.['x-otp'] || req.query?.otp) as string;
    if (!otp || typeof otp !== 'string' || !otp.trim()) {
      return sendError(
        res,
        'OTP verification is required to delete your account. Please request a verification code.',
        400
      );
    }

    const cleanOtp = otp.trim();

    // Verify OTP for this user
    const otpRecord = await OTP.findOne({
      userId: req.user._id,
      type: 'account_deletion',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return sendError(res, 'Invalid or expired verification code. Please request a new OTP.', 400);
    }

    if (otpRecord.attempts >= 5) {
      return sendError(res, 'Maximum verification attempts exceeded. Please request a new OTP.', 429);
    }

    const inputHash = hashSecret(cleanOtp);
    if (otpRecord.otpHash !== inputHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return sendError(res, 'Invalid verification code. Please check the code and try again.', 400);
    }

    // OTP is valid! Mark as used and set verifiedAt
    otpRecord.isUsed = true;
    otpRecord.verifiedAt = new Date();
    await otpRecord.save();

    // Fetch user profile / name for notification before cascading soft delete
    const userProfile = await UserProfile.findOne({ userId: req.user._id }).select('firstName lastName').lean();
    const userFullName = userProfile
      ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
      : '';
    const userName = userFullName || req.user.email || req.user.mobile || req.user._id.toString();

    await userDeletionService.softDeleteUserCascade(req.user._id, req.user._id);

    clearAuthCookies(res);

    logger.info(`User soft-deleted with OTP verification and cascading cleanup: ${req.user._id}`);

    // Dispatch notification to admins when user deletes account by itself
    notifyAdmins({
      eventType: 'ADMIN_USER_DELETED',
      category: 'ADMINISTRATIVE',
      title: 'User Account Deleted',
      message: `User ${userName} (${req.user.email || req.user.mobile || 'No email/mobile'}) has deleted their own account after OTP verification.`,
      actionUrl: '/admin/users',
      data: {
        userId: req.user._id.toString(),
        email: req.user.email,
        mobile: req.user.mobile,
        deletedBy: 'self',
        deletedAt: new Date(),
      },
      priority: 'NORMAL',
    }).catch((err) => logger.warn('[UserController] Failed to notify admins of user deletion', err));

    return sendSuccess(res, 'Your account has been deleted successfully.');
  } catch (error: any) {
    logger.error('[UserController] Failed to delete current user with OTP:', error);
    return sendError(res, error.message || 'Failed to delete user account', 500);
  }
};

// ==========================================
// Admin Operations on Users
// ==========================================

/**
 * Get paginated list of regular users (Admin only)
 * GET /api/users
 */
export const getUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const { search, accountStatus, isDeleted, userType, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query: any = {};

    if (userType && userType !== 'all') {
      query.userType = userType;
    }

    if (accountStatus === 'deleted' || isDeleted === 'true') {
      query.isDeleted = true;
    } else if (accountStatus === 'active') {
      query.accountStatus = 'active';
      query.isDeleted = false;
    } else if (accountStatus === 'inactive') {
      query.accountStatus = 'inactive';
      query.isDeleted = false;
    } else if (isDeleted === 'false') {
      query.isDeleted = false;
    }
    // Note: When isDeleted is 'all' or filter is 'all', all entries (active, inactive, deleted) are included in normal list!

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');

      const matchingProfiles = await UserProfile.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      }).select('userId');

      const profileUserIds = matchingProfiles.map((p) => p.userId);

      query.$or = [
        { email: searchRegex },
        { mobile: searchRegex },
        { _id: { $in: profileUserIds } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions: any = { [sortBy as string]: sortOrder };

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const userIds = users.map((u: any) => u._id);
    const profiles = await UserProfile.find({ userId: { $in: userIds } })
      .select('userId firstName lastName profileCompletion image avatar')
      .populate({
        path: 'avatar',
        select: '_id name image',
      })
      .lean();

    const profileMap = new Map();
    profiles.forEach((p: any) => {
      profileMap.set(p.userId.toString(), p);
    });

    const usersWithProfiles = users.map((u: any) => {
      const p = profileMap.get(u._id.toString());
      const customImageUrl = p?.image?.url || (typeof p?.image === 'string' ? p.image : null) || null;
      const avatarImageUrl = (p?.avatar as any)?.image?.url || (p?.avatar as any)?.url || null;
      const resolvedPhoto = customImageUrl || avatarImageUrl || null;

      return {
        ...u,
        firstName: p?.firstName || '',
        lastName: p?.lastName || '',
        profileCompletion: p?.profileCompletion || 0,
        image: p?.image || (avatarImageUrl ? { url: avatarImageUrl } : null),
        avatar: avatarImageUrl,
        photoUrl: resolvedPhoto,
        profile: p || null,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Users fetched successfully', {
      users: usersWithProfiles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error('[UserController] Failed to fetch users:', error);
    return sendError(res, 'Failed to fetch users', 500);
  }
};

/**
 * Get user details with profile and sessions summary (Admin only)
 * GET /api/users/:userId
 */
export const getUserDetails = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const profile = await UserProfile.findOne({ userId })
      .populate({
        path: 'preferences',
        select: 'name category image isActive',
      })
      .populate({
        path: 'avatar',
        select: '_id name image isActive',
      });

    const activeSessionsCount = await UserSession.countDocuments({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    return sendSuccess(res, 'User details fetched successfully', {
      user,
      profile: profile || null,
      sessionsSummary: {
        activeSessionsCount,
      },
    });
  } catch (error) {
    logger.error('[UserController] Failed to fetch user details:', error);
    return sendError(res, 'Failed to fetch user details', 500);
  }
};

/**
 * Get user profile details by Admin
 * GET /api/users/:userId/profile
 */
export const getUserProfileByAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    let profile = await UserProfile.findOne({ userId })
      .populate({
        path: 'preferences',
        select: 'name category image isActive',
      })
      .populate({
        path: 'avatar',
        select: '_id name image isActive',
      });

    if (!profile) {
      profile = await UserProfile.create({
        userId: new Types.ObjectId(userId),
        profileCompletion: 0,
      });
      profile = await UserProfile.findById(profile._id)
        .populate({
          path: 'preferences',
          select: 'name category image isActive',
        })
        .populate({
          path: 'avatar',
          select: '_id name image isActive',
        });
    }

    return sendSuccess(res, 'User profile fetched successfully', {
      user,
      profile,
    });
  } catch (error) {
    logger.error('[UserController] Failed to fetch user profile by admin:', error);
    return sendError(res, 'Failed to fetch user profile', 500);
  }
};

/**
 * Update user profile details by Admin
 * PUT /api/users/:userId/profile
 */
export const updateUserProfileByAdmin = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = new UserProfile({ userId });
    }

    const oldKey = profile.image?.key || (profile.image?.url ? extractKeyFromUrl(profile.image.url) : undefined);

    // Prevent modifying system fields
    delete req.body.userId;
    delete req.body.profileCompletion;
    delete req.body._id;
    delete req.body.completedOnce;

    // Parse preferences if string
    let preferencesInput = req.body.preferences;
    if (typeof preferencesInput === 'string') {
      try {
        preferencesInput = JSON.parse(preferencesInput);
      } catch {
        preferencesInput = preferencesInput.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }

    // Handle preferences validation if preferences are passed
    if (Array.isArray(preferencesInput)) {
      const uniquePrefIds = Array.from(
        new Set(preferencesInput.map((id: any) => id.toString()))
      );

      if (uniquePrefIds.length > 0) {
        const validActivePrefs = await UserPreference.find({
          _id: { $in: uniquePrefIds },
          isActive: true,
          isDeleted: { $ne: true },
        });

        if (validActivePrefs.length !== uniquePrefIds.length) {
          return sendError(
            res,
            'One or more selected preferences are invalid or inactive',
            400
          );
        }

        profile.preferences = uniquePrefIds.map((id) => new Types.ObjectId(id as string));
      } else {
        profile.preferences = [];
      }
      delete req.body.preferences;
    }

    // Parse languagesKnown if string
    if (typeof req.body.languagesKnown === 'string') {
      try {
        req.body.languagesKnown = JSON.parse(req.body.languagesKnown);
      } catch {
        req.body.languagesKnown = req.body.languagesKnown.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }

    // Handle Avatar selection vs Custom Image mutual exclusivity
    if (req.body.avatar !== undefined) {
      const avatarVal = req.body.avatar;
      if (avatarVal === null || avatarVal === '' || avatarVal === 'null' || req.body.removeAvatar === true || req.body.removeAvatar === 'true') {
        profile.avatar = undefined;
      } else {
        if (!Types.ObjectId.isValid(String(avatarVal))) {
          return sendError(res, 'Invalid avatar ID', 400);
        }
        const avatarDoc = await Avatar.findById(avatarVal);
        if (!avatarDoc || !avatarDoc.isActive) {
          return sendError(res, 'Selected avatar is invalid or inactive', 400);
        }
        profile.avatar = avatarDoc._id;
        if (oldKey) {
          deleteFile(oldKey).catch((err) =>
            logger.error(`[UserController] Failed to delete old profile custom image ${oldKey}:`, err)
          );
        }
        profile.image = undefined;
      }
      delete req.body.avatar;
      delete req.body.removeAvatar;
    }

    // Handle image upload / update / removal
    const imageObj = await parseProfileImageInput(req, 'users', 'profile');
    if (imageObj !== undefined) {
      if (imageObj === null) {
        profile.image = undefined;
      } else {
        profile.image = imageObj;
        profile.avatar = undefined; // Mutually exclusive
        if (imageObj.key) {
          uploadedKey = imageObj.key;
        }
      }
    }
    delete req.body.image;
    delete req.body.removeImage;

    Object.assign(profile, req.body);

    profile.profileCompletion = calculateProfileCompletion(profile.toObject());
    await profile.save();

    const populatedProfile = await UserProfile.findById(profile._id)
      .populate({
        path: 'preferences',
        select: 'name category image isActive',
      })
      .populate({
        path: 'avatar',
        select: '_id name image isActive',
      });

    // If image key changed, clean up old S3 object safely
    const newKey = profile.image?.key || (profile.image?.url ? extractKeyFromUrl(profile.image.url) : undefined);
    if (oldKey && newKey && oldKey !== newKey) {
      deleteFile(oldKey).catch((err) =>
        logger.error(`[UserController] Failed to delete old user profile image ${oldKey}:`, err)
      );
    }

    logger.info(`User profile ${userId} updated by admin ${req.admin?._id}`);

    return sendSuccess(res, 'User profile updated successfully', {
      user: {
        _id: user._id,
        email: user.email,
        mobile: user.mobile,
        userType: user.userType,
        accountStatus: user.accountStatus,
        verificationStatus: user.verificationStatus,
      },
      profile: populatedProfile,
    });
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[UserController] Rollback S3 profile image failed ${uploadedKey}:`, err)
      );
    }
    logger.error('[UserController] Failed to update user profile by admin:', error);
    return sendError(res, error.message || 'Failed to update user profile', 500);
  }
};

/**
 * Update user status/verification by Admin
 * PATCH /api/users/:userId
 */
export const updateUserByAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    const { accountStatus, profileVerified, verificationStatus, userType } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (userType) user.userType = userType;
    if (accountStatus) {
      user.accountStatus = accountStatus;
      if (accountStatus === 'inactive') {
        user.deactiveAt = new Date();
        user.deactiveBy = req.admin?._id;
      } else if (accountStatus === 'active') {
        user.deactiveAt = undefined;
        user.deactiveBy = undefined;
      }
    }
    if (profileVerified !== undefined) user.profileVerified = profileVerified;
    if (verificationStatus) user.verificationStatus = verificationStatus;

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    logger.info(`User ${userId} updated by admin ${req.admin?._id}`);

    return sendSuccess(res, 'User updated successfully', updatedUser);
  } catch (error) {
    logger.error('[UserController] Failed to update user:', error);
    return sendError(res, 'Failed to update user', 500);
  }
};

/**
 * Block user by Admin
 * PATCH /api/users/:userId/block
 */
export const blockUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.accountStatus = 'inactive';
    user.deactiveAt = new Date();
    user.deactiveBy = req.admin?._id;
    await user.save();

    await UserSession.updateMany({ userId }, { isRevoked: true });

    logger.info(`User ${userId} blocked by admin ${req.admin?._id}`);

    return sendSuccess(res, 'User blocked successfully');
  } catch (error) {
    logger.error('[UserController] Failed to block user:', error);
    return sendError(res, 'Failed to block user', 500);
  }
};

/**
 * Unblock user by Admin
 * PATCH /api/users/:userId/unblock
 */
export const unblockUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.accountStatus = 'active';
    user.deactiveAt = undefined;
    user.deactiveBy = undefined;
    await user.save();

    logger.info(`User ${userId} unblocked by admin ${req.admin?._id}`);

    return sendSuccess(res, 'User unblocked successfully');
  } catch (error) {
    logger.error('[UserController] Failed to unblock user:', error);
    return sendError(res, 'Failed to unblock user', 500);
  }
};

/**
 * Soft delete user by Admin
 * DELETE /api/users/:userId
 */
export const deleteUserByAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;

    await userDeletionService.softDeleteUserCascade(userId, req.admin?._id);

    logger.info(`User ${userId} soft-deleted with cascading cleanup by admin ${req.admin?._id}`);

    return sendSuccess(res, 'User deleted successfully');
  } catch (error: any) {
    if (error.message === 'User not found') {
      return sendError(res, 'User not found', 404);
    }
    logger.error('[UserController] Failed to delete user:', error);
    return sendError(res, error.message || 'Failed to delete user', 500);
  }
};

/**
 * Hard delete user by Admin (Permanently purges user account and all cascading listings/media)
 * DELETE /api/users/:userId/hard
 */
export const hardDeleteUserByAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;

    await userDeletionService.hardDeleteUserCascade(userId);

    logger.info(`User ${userId} permanently hard-deleted with cascading cleanup by admin ${req.admin?._id}`);

    return sendSuccess(res, 'User permanently deleted successfully');
  } catch (error: any) {
    if (error.message === 'User not found') {
      return sendError(res, 'User not found', 404);
    }
    logger.error('[UserController] Failed to hard delete user:', error);
    return sendError(res, error.message || 'Failed to hard delete user', 500);
  }
};

/**
 * Restore soft-deleted user by Admin
 * PATCH /api/users/:userId/restore
 */
export const restoreUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;

    await userDeletionService.restoreUserCascade(userId);

    logger.info(`User ${userId} restored by admin ${req.admin?._id}`);

    return sendSuccess(res, 'User restored successfully');
  } catch (error: any) {
    logger.error('[UserController] Failed to restore user:', error);
    return sendError(res, error.message || 'Failed to restore user', 500);
  }
};

/**
 * Create a new user by Admin without OTP
 * POST /api/users
 */
export const createUserByAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { firstName, lastName, email, mobile, userType } = req.body;

    const cleanEmail = email.toLowerCase().trim();

    let normalizedMobile: string;
    try {
      normalizedMobile = normalizePhoneNumber(mobile);
    } catch (normErr: any) {
      return sendError(res, normErr.message || 'Invalid mobile number format', 400);
    }

    // Check duplicate email
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      if (existingEmail.isDeleted) {
        return sendError(
          res,
          'An account with this email was previously deleted. You can restore it using the restore action in the table.',
          409
        );
      }
      return sendError(res, 'User with this email already exists', 409);
    }

    // Check duplicate mobile
    const existingMobile = await User.findOne({ mobile: normalizedMobile });
    if (existingMobile) {
      if (existingMobile.isDeleted) {
        return sendError(
          res,
          'An account with this mobile number was previously deleted. You can restore it using the restore action in the table.',
          409
        );
      }
      return sendError(res, 'User with this mobile number already exists', 409);
    }

    // Create User (created by admin, active, verified, no password/OTP required)
    const user = await User.create({
      email: cleanEmail,
      mobile: normalizedMobile,
      userType: userType || 'flatmate',
      accountStatus: 'active',
      emailVerified: true,
      mobileVerified: true,
      profileVerified: false,
      verificationStatus: 'not_submitted',
      isDeleted: false,
    });

    // Create UserProfile with firstName and lastName
    await UserProfile.create({
      userId: user._id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      profileCompletion: 20,
    });

    logger.info(`[UserController] User ${user._id} created by admin ${req.admin?._id}`);

    // Send welcome notification to user
    createNotification({
      recipientType: 'USER',
      recipientId: user._id,
      eventType: 'USER_REGISTERED',
      category: 'ACCOUNT_AND_VERIFICATION',
      title: 'Welcome to FlatMate!',
      message: 'Your account has been created by the administrator. You can now log in and explore.',
      actionUrl: '/profile',
      priority: 'NORMAL',
    }).catch((err) => logger.warn('[UserController] Failed to create welcome notification for user', err));

    const userJson = user.toObject();
    delete userJson.password;

    return sendSuccess(res, 'User account created successfully', userJson, 201);
  } catch (error: any) {
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'email';
      return sendError(res, `An account with this ${field} already exists.`, 409);
    }
    logger.error('[UserController] Failed to create user by admin:', error);
    return sendError(res, 'Failed to create user', 500);
  }
};
