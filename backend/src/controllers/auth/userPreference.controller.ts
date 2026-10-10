import { Request, Response } from 'express';
import { Types } from 'mongoose';
import path from 'path';

import { UserPreference, IPreferenceImage } from '../../models/auth/userPreference.model';
import { UserProfile } from '../../models/auth/userProfile.model';

import { sendSuccess, sendError } from '../../utils/response.util'; 
import { logger } from '../../utils/logger.util';
import { sanitizeFileName } from '../../utils/fileValidation.util';

import { uploadToS3, deleteFile, extractKeyFromUrl } from '../../services/aws/s3.service';

/** Helper to parse image input from multipart file, JSON object, string, or undefined */
const parseImageInput = async (
  req: Request,
  defaultFolder: string = 'users',
  defaultSubFolder: string = 'preference'
): Promise<IPreferenceImage | undefined> => {
  if (req.file) {
    const ext = path.extname(req.file.originalname) || '.jpg';
    const cleanFileName = sanitizeFileName(path.basename(req.file.originalname, ext));

    const folder = (req.body.folder || req.query.folder || defaultFolder) as string;
    const subFolder = (req.body.subFolder || req.query.subFolder || defaultSubFolder) as string;
    const fileName = `img-${Date.now()}-${cleanFileName}${ext}`;

    const uploadRes = await uploadToS3({
      file: req.file.buffer,
      folder,
      subFolder,
      fileName,
      contentType: req.file.mimetype,
    });

    return { url: uploadRes.url, key: uploadRes.key };
  }

  if (req.body.image) {
    if (typeof req.body.image === 'object') {
      return {
        url: req.body.image.url ? String(req.body.image.url).trim() : undefined,
        key: req.body.image.key ? String(req.body.image.key).trim() : undefined,
      };
    }
    if (typeof req.body.image === 'string' && req.body.image.trim()) {
      const urlStr = req.body.image.trim();
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
 * Create a master preference option (Admin only)
 * POST /user-preferences
 */
export const createUserPreference = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    const { name, isActive } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return sendError(res, 'Name is required', 400);
    }

    const trimmedName = name.trim();

    // Check duplicate name
    const existing = await UserPreference.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });

    if (existing) {
      return sendError(res, `Preference '${trimmedName}' already exists`, 409);
    }

    const imageObj = await parseImageInput(req, 'users', 'preference');
    if (imageObj?.key) {
      uploadedKey = imageObj.key;
    }

    const preference = await UserPreference.create({
      name: trimmedName,
      image: imageObj,
      isActive: isActive !== false && isActive !== 'false',
    });

    logger.info(`UserPreference created: ${preference._id}`);
    return sendSuccess(res, 'Preference created successfully', preference, 201);
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[UserPreferenceController] Rollback S3 image failed ${uploadedKey}:`, err)
      );
    }
    if (error.code === 11000) {
      return sendError(res, 'Duplicate preference record', 409);
    }
    logger.error('[UserPreferenceController] create error:', error);
    return sendError(res, error.message || 'Failed to create preference', 500);
  }
};

/**
 * Get paginated list of master preference options with optional search filters (Public)
 * GET /user-preferences
 */
export const getUserPreferences = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
    const skip = (page - 1) * limit;

    const filter: any = {};

    const statusParam = req.query.status as string | undefined;
    if (statusParam && statusParam !== 'all') {
      if (statusParam === 'active') {
        filter.isActive = true;
      } else if (statusParam === 'inactive') {
        filter.isActive = false;
      }
    } else if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const searchStr = (req.query.search || req.query.q) as string | undefined;
    if (searchStr && searchStr.trim()) {
      filter.name = { $regex: searchStr.trim(), $options: 'i' };
    }

    const [items, total] = await Promise.all([
      UserPreference.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserPreference.countDocuments(filter),
    ]);

    return sendSuccess(res, 'Preference options fetched successfully', {
      items,
      total,
      page,
      limit,
    });
  } catch (error) {
    logger.error('[UserPreferenceController] list error:', error);
    return sendError(res, 'Failed to fetch preference options', 500);
  }
};

/**
 * Get a single master preference option by ID (Public)
 * GET /user-preferences/:id
 */
export const getUserPreferenceById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid preference ID', 400);
    }

    const preference = await UserPreference.findById(id).lean();
    if (!preference) {
      return sendError(res, 'Preference option not found', 404);
    }

    return sendSuccess(res, 'Preference option fetched successfully', preference);
  } catch (error) {
    logger.error('[UserPreferenceController] getById error:', error);
    return sendError(res, 'Failed to fetch preference option', 500);
  }
};

/**
 * Update a master preference option (Admin only)
 * PUT /user-preferences/:id
 */
export const updateUserPreference = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid preference ID', 400);
    }

    const preference = await UserPreference.findById(id);
    if (!preference) {
      return sendError(res, 'Preference option not found', 404);
    }

    const oldImageKey = preference.image?.key || extractKeyFromUrl(preference.image?.url);

    const { name, isActive } = req.body;

    const targetName = name !== undefined ? String(name).trim() : preference.name;

    if (name !== undefined && targetName === '') {
      return sendError(res, 'Name cannot be empty', 400);
    }

    // Check duplicate name on another record
    const duplicate = await UserPreference.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${targetName}$`, 'i') },
    });

    if (duplicate) {
      return sendError(res, `Preference '${targetName}' already exists`, 409);
    }

    preference.name = targetName;

    if (isActive !== undefined) {
      preference.isActive = isActive === true || isActive === 'true';
    }

    const imageObj = await parseImageInput(req, 'users', 'preference');
    if (imageObj !== undefined) {
      preference.image = imageObj;
      if (imageObj?.key) {
        uploadedKey = imageObj.key;
      }
    }

    await preference.save();

    // If image key changed, clean up old S3 object safely
    if (oldImageKey && preference.image?.key && oldImageKey !== preference.image.key) {
      deleteFile(oldImageKey).catch((err) =>
        logger.error(`[UserPreferenceController] Failed to delete old image ${oldImageKey}:`, err)
      );
    }

    logger.info(`UserPreference updated: ${id}`);
    return sendSuccess(res, 'Preference updated successfully', preference);
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[UserPreferenceController] Rollback S3 image failed ${uploadedKey}:`, err)
      );
    }
    if (error.code === 11000) {
      return sendError(res, 'Duplicate preference record', 409);
    }
    logger.error('[UserPreferenceController] update error:', error);
    return sendError(res, error.message || 'Failed to update preference', 500);
  }
};


/**
 * Delete a master preference option (Admin only)
 * DELETE /user-preferences/:id
 */
export const deleteUserPreference = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid preference ID', 400);
    }

    const preference = await UserPreference.findById(id);
    if (!preference) {
      return sendError(res, 'Preference option not found', 404);
    }

    // Check if referenced in UserProfile
    const referenceCount = await UserProfile.countDocuments({ preferences: id });
    if (referenceCount > 0) {
      return sendError(
        res,
        'Cannot delete preference option because it is currently selected by users',
        409
      );
    }

    const imageKey = preference.image?.key || extractKeyFromUrl(preference.image?.url);

    await UserPreference.deleteOne({ _id: id });

    if (imageKey) {
      deleteFile(imageKey).catch((err) =>
        logger.error(`[UserPreferenceController] Failed to delete S3 image ${imageKey}:`, err)
      );
    }

    logger.info(`UserPreference deleted: ${id}`);
    return sendSuccess(res, 'Preference option deleted successfully');
  } catch (error) {
    logger.error('[UserPreferenceController] delete error:', error);
    return sendError(res, 'Failed to delete preference option', 500);
  }
};

/**
 * Toggle preference status (Admin only)
 * PATCH /user-preferences/:id/status
 */
export const toggleUserPreferenceStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid preference ID', 400);
    }

    const preference = await UserPreference.findById(id);
    if (!preference) {
      return sendError(res, 'Preference option not found', 404);
    }

    if (typeof req.body.isActive === 'boolean') {
      preference.isActive = req.body.isActive;
    } else {
      preference.isActive = !preference.isActive;
    }

    await preference.save();

    logger.info(`UserPreference status toggled for ${id}: isActive=${preference.isActive}`);
    return sendSuccess(res, `Preference ${preference.isActive ? 'activated' : 'deactivated'} successfully`, preference);
  } catch (error) {
    logger.error('[UserPreferenceController] toggleStatus error:', error);
    return sendError(res, 'Failed to toggle preference status', 500);
  }
};
