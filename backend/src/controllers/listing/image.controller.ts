import { Request, Response } from 'express';
import { Image } from '../../models/listing/image.model';
import { Property } from '../../models/listing/property.model';
import { FlatmateRequirement } from '../../models/listing/flatmateRequirements.model';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { uploadToS3, deleteFile } from '../../services/aws/s3.service';
import { sanitizeFileName } from '../../utils/fileValidation.util';
import { Types } from 'mongoose';
import path from 'path';

/** Create a standalone Image document (supports file upload or url+key payload) */
export const createImage = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    let url: string;
    let key: string;

    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const cleanFileName = sanitizeFileName(path.basename(req.file.originalname, ext));
      const folder = (req.body.folder || req.query.folder) as string | undefined;
      const subFolder = (req.body.subFolder || req.query.subFolder) as string | undefined;
      const fileName = `img-${Date.now()}-${cleanFileName}${ext}`;

      const uploadRes = await uploadToS3({
        file: req.file.buffer,
        folder: folder || 'property',
        subFolder: subFolder || (folder ? undefined : 'image'),
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
      return sendError(res, 'Both url and key (or a multipart image file) are required', 400);
    }

    const image = await Image.create({ url, key });
    logger.info(`Image created: ${image._id}`);
    return sendSuccess(res, 'Image created successfully', image, 201);
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[ImageController] Rollback S3 image failed ${uploadedKey}:`, err)
      );
    }
    logger.error('[ImageController] create error:', error);
    return sendError(res, error.message || 'Failed to create image', 500);
  }
};

/** Get Image by ID */
export const getImage = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid image ID', 400);
    }

    const image = await Image.findById(id).lean();
    if (!image) {
      return sendError(res, 'Image not found', 404);
    }

    return sendSuccess(res, 'Image fetched successfully', image);
  } catch (error: any) {
    logger.error('[ImageController] get error:', error);
    return sendError(res, 'Failed to fetch image', 500);
  }
};

/** Update Image by ID */
export const updateImage = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid image ID', 400);
    }

    const existing = await Image.findById(id);
    if (!existing) {
      return sendError(res, 'Image not found', 404);
    }

    const oldKey = existing.key;
    let url = req.body.url;
    let key = req.body.key;

    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const cleanFileName = sanitizeFileName(path.basename(req.file.originalname, ext));
      const folder = (req.body.folder || req.query.folder) as string | undefined;
      const subFolder = (req.body.subFolder || req.query.subFolder) as string | undefined;
      const fileName = `img-${Date.now()}-${cleanFileName}${ext}`;

      const uploadRes = await uploadToS3({
        file: req.file.buffer,
        folder: folder || 'property',
        subFolder: subFolder || (folder ? undefined : 'image'),
        fileName,
        contentType: req.file.mimetype,
      });

      url = uploadRes.url;
      key = uploadRes.key;
      uploadedKey = key;
    }

    if (url !== undefined) existing.url = url;
    if (key !== undefined) existing.key = key;

    await existing.save();

    // Clean up old S3 object if key changed
    if (oldKey && key && oldKey !== key) {
      deleteFile(oldKey).catch((err) =>
        logger.error(`[ImageController] Failed to delete old S3 object ${oldKey}:`, err)
      );
    }

    logger.info(`Image updated: ${id}`);
    return sendSuccess(res, 'Image updated successfully', existing);
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[ImageController] Rollback S3 image failed ${uploadedKey}:`, err)
      );
    }
    logger.error('[ImageController] update error:', error);
    return sendError(res, error.message || 'Failed to update image', 500);
  }
};

/** Delete Image by ID and remove S3 object */
export const deleteImage = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid image ID', 400);
    }

    const image = await Image.findById(id);
    if (!image) {
      return sendError(res, 'Image not found', 404);
    }

    const [isReferencedInProp, isReferencedInReq] = await Promise.all([
      Property.exists({ images: id }),
      FlatmateRequirement.exists({ images: id }),
    ]);
    if (isReferencedInProp || isReferencedInReq) {
      return sendError(res, 'Cannot delete image because it is currently attached to a listing', 400);
    }

    const keyToDelete = image.key;

    await Image.deleteOne({ _id: id });

    // Clean up S3 object
    if (keyToDelete) {
      await deleteFile(keyToDelete);
    }

    logger.info(`Image deleted: ${id}`);
    return sendSuccess(res, 'Image deleted successfully');
  } catch (error: any) {
    logger.error('[ImageController] delete error:', error);
    return sendError(res, 'Failed to delete image', 500);
  }
};

