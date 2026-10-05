import { Request, Response } from 'express';
import { Types } from 'mongoose';
import path from 'path';

import { UserProfile, IUserProfile } from '../../models/auth/userProfile.model';
import { UserPreference } from '../../models/auth/userPreference.model';
import { Avatar } from '../../models/auth/avatar.model';

import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { sanitizeFileName } from '../../utils/fileValidation.util';

import { uploadToS3, deleteFile, extractKeyFromUrl } from '../../services/aws/s3.service';

/** Helper to parse profile image input from multipart file, JSON object, string, null, or undefined */
export const parseProfileImageInput = async (
  req: Request,
  defaultFolder: string = 'users',
  defaultSubFolder: string = 'profile'
): Promise<{ url?: string; key?: string } | null | undefined> => {
  if (req.file) {
    const ext = path.extname(req.file.originalname) || '.jpg';
    const cleanFileName = sanitizeFileName(path.basename(req.file.originalname, ext));
    const userIdPrefix = (req.user as any)?._id || req.params?.userId || 'user';

    const folder = (req.body.folder || req.query.folder || defaultFolder) as string;
    const subFolder = (req.body.subFolder || req.query.subFolder || defaultSubFolder) as string;
    const fileName = `${userIdPrefix}-${Date.now()}-${cleanFileName}${ext}`;

    const uploadRes = await uploadToS3({
      file: req.file.buffer,
      folder,
      subFolder,
      fileName,
      contentType: req.file.mimetype,
    });

    return { url: uploadRes.url, key: uploadRes.key };
  }

  if (
    req.body.removeImage === 'true' ||
    req.body.removeImage === true ||
    req.body.image === 'null' ||
    req.body.image === null ||
    req.body.image === ''
  ) {
    return null;
  }

  if (req.body.image !== undefined) {
    let imgVal = req.body.image;
    if (typeof imgVal === 'string') {
      try {
        imgVal = JSON.parse(imgVal);
      } catch {
        // Raw string URL
      }
    }
    if (imgVal === null || imgVal === '' || imgVal === 'null') {
      return null;
    }
    if (typeof imgVal === 'object' && imgVal !== null) {
      if (!imgVal.url && !imgVal.key) return null;
      return {
        url: imgVal.url ? String(imgVal.url).trim() : undefined,
        key: imgVal.key ? String(imgVal.key).trim() : undefined,
      };
    }
    if (typeof imgVal === 'string' && imgVal.trim()) {
      const urlStr = imgVal.trim();
      const extractedKey = extractKeyFromUrl(urlStr);
      return { url: urlStr, key: extractedKey };
    }
  }

  if (req.body['image.url'] || req.body['image.key']) {
    return {
      url: req.body['image.url'] ? String(req.body['image.url']).trim() : undefined,
      key: req.body['image.key'] ? String(req.body['image.key']).trim() : undefined,
    };
  }

  return undefined;
};

/**
 * Helper to calculate profile completion percentage (0 - 100)
 * Note: Avatar and custom image act interchangeably for the image field completion slot.
 */
export const calculateProfileCompletion = (profile: Partial<IUserProfile>): number => {
  const fields = [
    'firstName',
    'lastName',
    'dateOfBirth',
    'gender',
    'occupation',
    'languagesKnown',
    'aboutMe',
    'image',
    'preferences',
  ];

  let completedFields = 0;

  for (const field of fields) {
    let val = (profile as any)[field];
    if (field === 'image' && (!val || (typeof val === 'object' && Object.keys(val).length === 0))) {
      val = (profile as any)['avatar'];
    }
    if (val !== undefined && val !== null) {
      if (Array.isArray(val) && val.length > 0) {
        completedFields++;
      } else if (typeof val === 'object' && Object.keys(val).length > 0) {
        completedFields++;
      } else if (typeof val === 'string' && val.trim() !== '') {
        completedFields++;
      } else if (typeof val === 'number') {
        completedFields++;
      } else if (val instanceof Date) {
        completedFields++;
      }
    }
  }

  return Math.min(100, Math.round((completedFields / fields.length) * 100));
};

/**
 * Get profile of current authenticated user
 * GET /api/profile
 */
export const getProfile = async (req: Request, res: Response): Promise<Response> => {
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

    return sendSuccess(res, 'Profile fetched successfully', profile);
  } catch (error) {
    logger.error('[ProfileController] Failed to get profile:', error);
    return sendError(res, 'Failed to fetch profile', 500);
  }
};

/**
 * Update profile of current authenticated user
 * PATCH /api/profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    let profile = await UserProfile.findOne({ userId: req.user._id });

    if (!profile) {
      profile = new UserProfile({ userId: req.user._id });
    }

    const oldKey = profile.image?.key || (profile.image?.url ? extractKeyFromUrl(profile.image.url) : undefined);

    // Prevent modifying core system fields
    delete req.body.userId;
    delete req.body.profileCompletion;
    delete req.body._id;

    // Parse stringified preferences if sent via FormData
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
        // Mutually exclusive: selecting an avatar clears custom image & deletes old custom S3 image
        if (oldKey) {
          deleteFile(oldKey).catch((err) =>
            logger.error(`[ProfileController] Failed to delete old profile custom image ${oldKey}:`, err)
          );
        }
        profile.image = undefined;
      }
      delete req.body.avatar;
      delete req.body.removeAvatar;
    }

    // Handle custom image upload / update / removal
    const imageObj = await parseProfileImageInput(req, 'users', 'profile');
    if (imageObj !== undefined) {
      if (imageObj === null) {
        profile.image = undefined;
      } else {
        profile.image = imageObj;
        profile.avatar = undefined; // Mutually exclusive: uploading a custom image clears avatar
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

    // If custom image key changed to another custom image key, clean up old S3 object
    const newKey = profile.image?.key || (profile.image?.url ? extractKeyFromUrl(profile.image.url) : undefined);
    if (oldKey && newKey && oldKey !== newKey) {
      deleteFile(oldKey).catch((err) =>
        logger.error(`[ProfileController] Failed to delete old profile image ${oldKey}:`, err)
      );
    }

    logger.info(`Profile updated for user: ${req.user._id}`);
    return sendSuccess(res, 'Profile updated successfully', populatedProfile);
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[ProfileController] Rollback S3 profile image failed ${uploadedKey}:`, err)
      );
    }
    logger.error('[ProfileController] Failed to update profile:', error);
    return sendError(res, error.message || 'Failed to update profile', 500);
  }
};

/**
 * Upload profile image for current user
 * POST /api/profile/image or /api/profile/profile-image
 */
export const uploadProfileImage = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    let profile = await UserProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new UserProfile({ userId: req.user._id });
    }

    const oldKey = profile.image?.key;
    let url: string;
    let key: string;

    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const cleanFileName = sanitizeFileName(path.basename(req.file.originalname, ext));

      const folder = (req.body.folder || req.query.folder || 'users') as string;
      const subFolder = (req.body.subFolder || req.query.subFolder || 'profile') as string;
      const fileName = `${req.user._id}-${Date.now()}-${cleanFileName}${ext}`;

      const uploadRes = await uploadToS3({
        file: req.file.buffer,
        folder,
        subFolder,
        fileName,
        contentType: req.file.mimetype,
      });

      url = uploadRes.url;
      key = uploadRes.key;
      uploadedKey = key;
    } else if (req.body.url && req.body.key) {
      url = req.body.url;
      key = req.body.key;
    } else {
      return sendError(res, 'Please provide an image file or S3 url/key', 400);
    }

    profile.image = { url, key };
    profile.avatar = undefined; // Mutually exclusive!

    profile.profileCompletion = calculateProfileCompletion(profile.toObject());
    await profile.save();

    // Clean up old S3 object after DB save succeeds
    if (oldKey && oldKey !== key) {
      deleteFile(oldKey).catch((err) =>
        logger.error(`[ProfileController] Failed to delete old profile image S3 object ${oldKey}:`, err)
      );
    }

    const populatedProfile = await UserProfile.findById(profile._id)
      .populate({
        path: 'preferences',
        select: 'name category image isActive',
      })
      .populate({
        path: 'avatar',
        select: '_id name image isActive',
      });

    logger.info(`Profile image uploaded for user: ${req.user._id}`);
    return sendSuccess(res, 'Profile image uploaded successfully', populatedProfile);
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[ProfileController] Rollback S3 profile image failed ${uploadedKey}:`, err)
      );
    }
    logger.error('[ProfileController] Failed to upload profile image:', error);
    return sendError(res, error.message || 'Failed to upload profile image', 500);
  }
};

/**
 * Delete profile image of current user
 * DELETE /api/profile/image or /api/profile/profile-image
 */
export const deleteProfileImage = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const profile = await UserProfile.findOne({ userId: req.user._id });
    if (!profile || (!profile.image && !profile.avatar)) {
      return sendError(res, 'No profile image or avatar to delete', 404);
    }

    const oldKey = profile.image?.key;

    profile.image = undefined;
    profile.avatar = undefined;

    profile.profileCompletion = calculateProfileCompletion(profile.toObject());
    await profile.save();

    if (oldKey) {
      await deleteFile(oldKey);
    }

    const populatedProfile = await UserProfile.findById(profile._id)
      .populate({
        path: 'preferences',
        select: 'name category image isActive',
      })
      .populate({
        path: 'avatar',
        select: '_id name image isActive',
      });

    logger.info(`Profile image deleted for user: ${req.user._id}`);
    return sendSuccess(res, 'Profile image deleted successfully', populatedProfile);
  } catch (error) {
    logger.error('[ProfileController] Failed to delete profile image:', error);
    return sendError(res, 'Failed to delete profile image', 500);
  }
};

/**
 * Check profile completion status of current authenticated user
 * GET /api/users/profile/completion-status or GET /api/profile/completion-status
 */
export const getProfileCompletionStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const profile = await UserProfile.findOne({ userId: req.user._id }).select('completedOnce').lean();

    return sendSuccess(res, 'Profile completion status fetched successfully', {
      completedOnce: profile?.completedOnce === true,
    });
  } catch (error) {
    logger.error('[ProfileController] Failed to get profile completion status:', error);
    return sendError(res, 'Failed to fetch profile completion status', 500);
  }
};

/**
 * Mark profile as completed once for current authenticated user
 * PATCH /api/users/profile/complete or PATCH /api/profile/complete
 */
export const markProfileAsCompleted = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    let profile = await UserProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new UserProfile({
        userId: req.user._id,
        profileCompletion: 0,
      });
    }

    profile.completedOnce = true;
    await profile.save();

    logger.info(`Profile marked as completed for user: ${req.user._id}`);
    return sendSuccess(res, 'Profile marked as completed successfully', {
      completedOnce: true,
    });
  } catch (error) {
    logger.error('[ProfileController] Failed to mark profile as completed:', error);
    return sendError(res, 'Failed to mark profile as completed', 500);
  }
};
