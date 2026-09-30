import { Request, Response } from 'express';
import { Video } from '../../models/listing/video.model';
import { Property } from '../../models/listing/property.model';
import { FlatmateRequirement } from '../../models/listing/flatmateRequirements.model';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { uploadToS3, deleteFile } from '../../services/aws/s3.service';
import { sanitizeFileName } from '../../utils/fileValidation.util';
import { Types } from 'mongoose';
import path from 'path';

/** Create a standalone Video document (supports video file upload or url+key payload) */
export const createVideo = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    let url: string;
    let key: string;

    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.mp4';
      const cleanFileName = sanitizeFileName(path.basename(req.file.originalname, ext));
      const folder = (req.body.folder || req.query.folder) as string | undefined;
      const subFolder = (req.body.subFolder || req.query.subFolder) as string | undefined;
      const fileName = `video-${Date.now()}-${cleanFileName}${ext}`;

      const uploadRes = await uploadToS3({
        file: req.file.buffer,
        folder: folder || 'property',
        subFolder: subFolder || (folder ? undefined : 'video'),
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
      return sendError(res, 'Both url and key (or a multipart video file) are required', 400);
    }

    const video = await Video.create({ url, key });
    logger.info(`Video created: ${video._id}`);
    return sendSuccess(res, 'Video created successfully', video, 201);
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[VideoController] Rollback S3 video failed ${uploadedKey}:`, err)
      );
    }
    logger.error('[VideoController] create error:', error);
    return sendError(res, error.message || 'Failed to create video', 500);
  }
};

/** Get Video by ID */
export const getVideo = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid video ID', 400);
    }

    const video = await Video.findById(id).lean();
    if (!video) {
      return sendError(res, 'Video not found', 404);
    }

    return sendSuccess(res, 'Video fetched successfully', video);
  } catch (error: any) {
    logger.error('[VideoController] get error:', error);
    return sendError(res, 'Failed to fetch video', 500);
  }
};

/** Update Video by ID */
export const updateVideo = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid video ID', 400);
    }

    const existing = await Video.findById(id);
    if (!existing) {
      return sendError(res, 'Video not found', 404);
    }

    const oldKey = existing.key;
    let url = req.body.url;
    let key = req.body.key;

    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.mp4';
      const cleanFileName = sanitizeFileName(path.basename(req.file.originalname, ext));
      const folder = (req.body.folder || req.query.folder) as string | undefined;
      const subFolder = (req.body.subFolder || req.query.subFolder) as string | undefined;
      const fileName = `video-${Date.now()}-${cleanFileName}${ext}`;

      const uploadRes = await uploadToS3({
        file: req.file.buffer,
        folder: folder || 'property',
        subFolder: subFolder || (folder ? undefined : 'video'),
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
        logger.error(`[VideoController] Failed to delete old S3 video object ${oldKey}:`, err)
      );
    }

    logger.info(`Video updated: ${id}`);
    return sendSuccess(res, 'Video updated successfully', existing);
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[VideoController] Rollback S3 video failed ${uploadedKey}:`, err)
      );
    }
    logger.error('[VideoController] update error:', error);
    return sendError(res, error.message || 'Failed to update video', 500);
  }
};

/** Delete Video by ID and remove S3 object */
export const deleteVideo = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid video ID', 400);
    }

    const video = await Video.findById(id);
    if (!video) {
      return sendError(res, 'Video not found', 404);
    }

    const [isReferencedInProp, isReferencedInReq] = await Promise.all([
      Property.exists({ videos: id }),
      FlatmateRequirement.exists({ videos: id }),
    ]);
    if (isReferencedInProp || isReferencedInReq) {
      return sendError(res, 'Cannot delete video because it is currently attached to a listing', 400);
    }

    const keyToDelete = video.key;

    await Video.deleteOne({ _id: id });

    if (keyToDelete) {
      await deleteFile(keyToDelete);
    }

    logger.info(`Video deleted: ${id}`);
    return sendSuccess(res, 'Video deleted successfully');
  } catch (error: any) {
    logger.error('[VideoController] delete error:', error);
    return sendError(res, 'Failed to delete video', 500);
  }
};

