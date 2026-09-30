import { Request, Response } from 'express';
import { Types } from 'mongoose';

import { User } from '../../models/auth/user.model';
import { UserProfile } from '../../models/auth/userProfile.model';
import { UserPreference } from '../../models/auth/userPreference.model';
import { UserSession } from '../../models/auth/userSession.model';

import { calculateProfileCompletion, parseProfileImageInput } from './profile.controller';
import { deleteFile, extractKeyFromUrl } from '../../services/aws/s3.service';

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

/**
 * Register a new user
 * POST /api/users
 */
export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, mobile, password } = req.body;

    // Check duplicate email
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
      if (existingEmail) {
        return sendError(res, 'User with this email already exists', 409);
      }
    }

    // Check duplicate mobile
    if (mobile) {
      const existingMobile = await User.findOne({ mobile, isDeleted: false });
      if (existingMobile) {
        return sendError(res, 'User with this mobile number already exists', 409);
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      email: email ? email.toLowerCase() : undefined,
      mobile: mobile || undefined,
      password: hashedPassword,
      role: 'user',
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

    const userJson = user.toObject();
    delete userJson.password;

    return sendSuccess(res, 'User registered successfully', userJson, 201);
  } catch (error) {
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

    let profile = await UserProfile.findOne({ userId: req.user._id }).populate({
      path: 'preferences',
      select: 'name category image isActive',
    });

    if (!profile) {
      profile = await UserProfile.create({
        userId: req.user._id,
        profileCompletion: 0,
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

    const { email, mobile } = req.body;

    if (email && email.toLowerCase() !== req.user.email) {
      const existingEmail = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.user._id },
        isDeleted: false,
      });
      if (existingEmail) {
        return sendError(res, 'Email is already in use by another account', 409);
      }
      req.user.email = email.toLowerCase();
      req.user.emailVerified = false;
    }

    if (mobile && mobile !== req.user.mobile) {
      const existingMobile = await User.findOne({
        mobile,
        _id: { $ne: req.user._id },
        isDeleted: false,
      });
      if (existingMobile) {
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
 * Soft delete current authenticated user
 * DELETE /api/users/me
 */
export const deleteCurrentUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    req.user.isDeleted = true;
    req.user.deletedAt = new Date();
    await req.user.save();

    // Revoke all sessions for user
    await UserSession.updateMany({ userId: req.user._id }, { isRevoked: true });

    logger.info(`User soft-deleted: ${req.user._id}`);

    return sendSuccess(res, 'User account deleted successfully');
  } catch (error) {
    logger.error('[UserController] Failed to delete current user:', error);
    return sendError(res, 'Failed to delete user account', 500);
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

    const { search, accountStatus, isDeleted, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query: any = {};

    if (isDeleted !== undefined) {
      query.isDeleted = isDeleted === 'true';
    } else {
      query.isDeleted = false;
    }

    if (accountStatus) {
      query.accountStatus = accountStatus;
    }

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
      .select('userId firstName lastName profileCompletion image')
      .lean();

    const profileMap = new Map();
    profiles.forEach((p: any) => {
      profileMap.set(p.userId.toString(), p);
    });

    const usersWithProfiles = users.map((u: any) => {
      const p = profileMap.get(u._id.toString());
      return {
        ...u,
        firstName: p?.firstName || '',
        lastName: p?.lastName || '',
        profileCompletion: p?.profileCompletion || 0,
        image: p?.image || null,
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

    const profile = await UserProfile.findOne({ userId }).populate({
      path: 'preferences',
      select: 'name category image isActive',
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

    let profile = await UserProfile.findOne({ userId }).populate({
      path: 'preferences',
      select: 'name category image isActive',
    });

    if (!profile) {
      profile = await UserProfile.create({
        userId: new Types.ObjectId(userId),
        profileCompletion: 0,
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

    // Handle image upload / update / removal
    const imageObj = await parseProfileImageInput(req, 'users', 'profile');
    if (imageObj !== undefined) {
      if (imageObj === null) {
        profile.image = undefined;
      } else {
        profile.image = imageObj;
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

    const populatedProfile = await UserProfile.findById(profile._id).populate({
      path: 'preferences',
      select: 'name category image isActive',
    });

    // If image key changed, clean up old S3 object safely
    const newKey = profile.image?.key || (profile.image?.url ? extractKeyFromUrl(profile.image.url) : undefined);
    if (oldKey && oldKey !== newKey) {
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
    const { accountStatus, profileVerified, verificationStatus } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (accountStatus) user.accountStatus = accountStatus;
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

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    await UserSession.updateMany({ userId }, { isRevoked: true });

    logger.info(`User ${userId} soft-deleted by admin ${req.admin?._id}`);

    return sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    logger.error('[UserController] Failed to delete user:', error);
    return sendError(res, 'Failed to delete user', 500);
  }
};

/**
 * Restore soft-deleted user by Admin
 * PATCH /api/users/:userId/restore
 */
export const restoreUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.isDeleted = false;
    user.accountStatus = 'active';
    user.deletedAt = undefined;
    await user.save();

    logger.info(`User ${userId} restored by admin ${req.admin?._id}`);

    return sendSuccess(res, 'User restored successfully');
  } catch (error) {
    logger.error('[UserController] Failed to restore user:', error);
    return sendError(res, 'Failed to restore user', 500);
  }
};
