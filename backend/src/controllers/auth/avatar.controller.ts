import { Request, Response } from 'express';
import { Avatar, IAvatarImage } from '../../models/auth/avatar.model';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { uploadToS3, deleteFile, extractKeyFromUrl } from '../../services/aws/s3.service';
import { sanitizeFileName } from '../../utils/fileValidation.util';
import { Types } from 'mongoose';
import path from 'path';

/** Helper to parse image input from multipart file, JSON object, string, or undefined */
const parseImageInput = async (
  req: Request,
  defaultFolder: string = 'avatars',
  defaultSubFolder: string = 'master'
): Promise<IAvatarImage | undefined> => {
  if (req.file) {
    const ext = path.extname(req.file.originalname) || '.jpg';
    const cleanFileName = sanitizeFileName(path.basename(req.file.originalname, ext));

    const folder = (req.body.folder || req.query.folder || defaultFolder) as string;
    const subFolder = (req.body.subFolder || req.query.subFolder || defaultSubFolder) as string;
    const fileName = `avatar-${Date.now()}-${cleanFileName}${ext}`;

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
    let imgObj = req.body.image;
    if (typeof imgObj === 'string') {
      try {
        imgObj = JSON.parse(imgObj);
      } catch {
        // String URL fallback
      }
    }
    if (typeof imgObj === 'object' && imgObj !== null) {
      if (imgObj.url && imgObj.key) {
        return {
          url: String(imgObj.url).trim(),
          key: String(imgObj.key).trim(),
        };
      }
    }
    if (typeof imgObj === 'string' && imgObj.trim()) {
      const urlStr = imgObj.trim();
      const extractedKey = extractKeyFromUrl(urlStr);
      if (extractedKey) {
        return { url: urlStr, key: extractedKey };
      }
    }
  }

  if (req.body['image.url'] && req.body['image.key']) {
    return {
      url: String(req.body['image.url']).trim(),
      key: String(req.body['image.key']).trim(),
    };
  }

  return undefined;
};

/**
 * Create a new Avatar (Admin only)
 * POST /api/avatars
 */
export const createAvatar = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    const { name, isActive } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return sendError(res, 'Avatar name is required', 400);
    }

    const trimmedName = name.trim();
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Check duplicate name
    const existing = await Avatar.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
    });

    if (existing) {
      return sendError(res, `Avatar '${trimmedName}' already exists`, 409);
    }

    const imageObj = await parseImageInput(req, 'avatars', 'master');
    if (!imageObj || !imageObj.url || !imageObj.key) {
      return sendError(res, 'Avatar image is required', 400);
    }
    uploadedKey = imageObj.key;

    const avatar = await Avatar.create({
      name: trimmedName,
      image: imageObj,
      isActive: isActive !== false && isActive !== 'false',
    });

    logger.info(`Avatar created: ${avatar._id}`);
    return sendSuccess(res, 'Avatar created successfully', avatar, 201);
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[AvatarController] Rollback S3 image failed ${uploadedKey}:`, err)
      );
    }
    if (error.code === 11000) {
      return sendError(res, 'Duplicate avatar record', 409);
    }
    logger.error('[AvatarController] create error:', error);
    return sendError(res, error.message || 'Failed to create avatar', 500);
  }
};

/**
 * Get paginated list of avatars
 * GET /api/avatars
 */
export const getAvatars = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    } else if (req.query.status === 'active') {
      filter.isActive = true;
    } else if (req.query.status === 'inactive') {
      filter.isActive = false;
    }

    const searchStr = (req.query.search || req.query.q) as string;
    if (searchStr && searchStr.trim()) {
      filter.name = { $regex: searchStr.trim(), $options: 'i' };
    }

    const [items, total] = await Promise.all([
      Avatar.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Avatar.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Avatars fetched successfully', {
      items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    logger.error('[AvatarController] list error:', error);
    return sendError(res, 'Failed to fetch avatars', 500);
  }
};

/**
 * Get single avatar by ID
 * GET /api/avatars/:id
 */
export const getAvatarById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid avatar ID', 400);
    }

    const avatar = await Avatar.findById(id).lean();
    if (!avatar) {
      return sendError(res, 'Avatar not found', 404);
    }

    return sendSuccess(res, 'Avatar fetched successfully', avatar);
  } catch (error: any) {
    logger.error('[AvatarController] getById error:', error);
    return sendError(res, 'Failed to fetch avatar', 500);
  }
};

/**
 * Update avatar (Admin only)
 * PUT /api/avatars/:id or PATCH /api/avatars/:id
 */
export const updateAvatar = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid avatar ID', 400);
    }

    const avatar = await Avatar.findById(id);
    if (!avatar) {
      return sendError(res, 'Avatar not found', 404);
    }

    const oldImageKey = avatar.image?.key || extractKeyFromUrl(avatar.image?.url);
    const { name, isActive } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return sendError(res, 'Avatar name cannot be empty', 400);
      }
      const trimmedName = name.trim();
      const escapedUpdateName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const duplicate = await Avatar.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${escapedUpdateName}$`, 'i') },
      });

      if (duplicate) {
        return sendError(res, `Avatar '${trimmedName}' already exists`, 409);
      }
      avatar.name = trimmedName;
    }

    if (isActive !== undefined) {
      avatar.isActive = isActive === true || isActive === 'true';
    }

    const imageObj = await parseImageInput(req, 'avatars', 'master');
    if (imageObj !== undefined && imageObj.url && imageObj.key) {
      avatar.image = imageObj;
      uploadedKey = imageObj.key;
    }

    await avatar.save();

    // Clean up old S3 object if changed
    if (oldImageKey && avatar.image?.key && oldImageKey !== avatar.image.key) {
      deleteFile(oldImageKey).catch((err) =>
        logger.error(`[AvatarController] Failed to delete old avatar image ${oldImageKey}:`, err)
      );
    }

    logger.info(`Avatar updated: ${id}`);
    return sendSuccess(res, 'Avatar updated successfully', avatar);
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[AvatarController] Rollback S3 image failed ${uploadedKey}:`, err)
      );
    }
    if (error.code === 11000) {
      return sendError(res, 'Duplicate avatar record', 409);
    }
    logger.error('[AvatarController] update error:', error);
    return sendError(res, error.message || 'Failed to update avatar', 500);
  }
};

/**
 * Delete avatar (Admin only)
 * DELETE /api/avatars/:id
 */
export const deleteAvatar = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid avatar ID', 400);
    }

    const avatar = await Avatar.findById(id);
    if (!avatar) {
      return sendError(res, 'Avatar not found', 404);
    }

    const imageKey = avatar.image?.key || extractKeyFromUrl(avatar.image?.url);

    await Avatar.deleteOne({ _id: id });

    if (imageKey) {
      deleteFile(imageKey).catch((err) =>
        logger.error(`[AvatarController] Failed to delete S3 image ${imageKey}:`, err)
      );
    }

    logger.info(`Avatar deleted: ${id}`);
    return sendSuccess(res, 'Avatar deleted successfully');
  } catch (error: any) {
    logger.error('[AvatarController] delete error:', error);
    return sendError(res, 'Failed to delete avatar', 500);
  }
};

/**
 * Toggle avatar active status (Admin only)
 * PATCH /api/avatars/:id/status
 */
export const toggleAvatarStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid avatar ID', 400);
    }

    const avatar = await Avatar.findByIdAndUpdate(
      id,
      { isActive: isActive === true || isActive === 'true' },
      { new: true, runValidators: true }
    );

    if (!avatar) {
      return sendError(res, 'Avatar not found', 404);
    }

    return sendSuccess(res, 'Avatar status updated', avatar);
  } catch (error: any) {
    logger.error('[AvatarController] toggle status error:', error);
    return sendError(res, 'Failed to toggle avatar status', 500);
  }
};
