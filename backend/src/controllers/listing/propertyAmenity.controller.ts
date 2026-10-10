import { Request, Response } from 'express';
import { PropertyAmenity, IAmenityImage } from '../../models/listing/propertyAmenity.model';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { uploadToS3, deleteFile, extractKeyFromUrl } from '../../services/aws/s3.service';
import { sanitizeFileName } from '../../utils/fileValidation.util';
import { Types } from 'mongoose';
import path from 'path';

/** Helper to parse image input from multipart file, JSON object, string, or undefined */
const parseImageInput = async (
  req: Request,
  defaultFolder: string = 'property',
  defaultSubFolder: string = 'amenity'
): Promise<IAmenityImage | undefined> => {
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
 * Create a new property amenity (Admin only)
 * POST /property-amenities
 */
export const createPropertyAmenity = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    const { name, isActive } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return sendError(res, 'Amenity name is required', 400);
    }

    const trimmedName = name.trim();
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Check duplicate name
    const existing = await PropertyAmenity.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
    });

    if (existing) {
      return sendError(res, `Property amenity '${trimmedName}' already exists`, 409);
    }

    const imageObj = await parseImageInput(req, 'property', 'amenity');
    if (imageObj?.key) {
      uploadedKey = imageObj.key;
    }

    const amenity = await PropertyAmenity.create({
      name: trimmedName,
      image: imageObj,
      isActive: isActive !== false && isActive !== 'false',
    });

    logger.info(`PropertyAmenity created: ${amenity._id}`);
    return sendSuccess(res, 'Property amenity created successfully', amenity, 201);
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[PropertyAmenityController] Rollback S3 image failed ${uploadedKey}:`, err)
      );
    }
    if (error.code === 11000) {
      return sendError(res, 'Duplicate property amenity record', 409);
    }
    logger.error('[PropertyAmenityController] create error:', error);
    return sendError(res, error.message || 'Failed to create property amenity', 500);
  }
};

/**
 * Get paginated list of property amenities (Public)
 * GET /property-amenities
 */
export const getPropertyAmenities = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const searchStr = (req.query.search || req.query.q) as string;
    if (searchStr && searchStr.trim()) {
      filter.name = { $regex: searchStr.trim(), $options: 'i' };
    }

    const [items, total] = await Promise.all([
      PropertyAmenity.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PropertyAmenity.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 'Property amenities fetched successfully', {
      items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    logger.error('[PropertyAmenityController] list error:', error);
    return sendError(res, 'Failed to fetch property amenities', 500);
  }
};

/**
 * Get single property amenity by ID (Public)
 * GET /property-amenities/:id
 */
export const getPropertyAmenityById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid amenity ID', 400);
    }

    const amenity = await PropertyAmenity.findById(id).lean();
    if (!amenity) {
      return sendError(res, 'Property amenity not found', 404);
    }

    return sendSuccess(res, 'Property amenity fetched successfully', amenity);
  } catch (error: any) {
    logger.error('[PropertyAmenityController] getById error:', error);
    return sendError(res, 'Failed to fetch property amenity', 500);
  }
};

/**
 * Update property amenity (Admin only)
 * PUT /property-amenities/:id or PATCH /property-amenities/:id
 */
export const updatePropertyAmenity = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid amenity ID', 400);
    }

    const amenity = await PropertyAmenity.findById(id);
    if (!amenity) {
      return sendError(res, 'Property amenity not found', 404);
    }

    const oldImageKey = amenity.image?.key || extractKeyFromUrl(amenity.image?.url);
    const { name, isActive } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return sendError(res, 'Amenity name cannot be empty', 400);
      }
      amenity.name = name.trim();
    }

    if (isActive !== undefined) {
      amenity.isActive = isActive === true || isActive === 'true';
    }

    const imageObj = await parseImageInput(req, 'property', 'amenity');
    if (imageObj !== undefined) {
      amenity.image = imageObj;
      if (imageObj?.key) {
        uploadedKey = imageObj.key;
      }
    }

    // Check duplicate name on another document
    const escapedUpdateName = amenity.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const duplicate = await PropertyAmenity.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${escapedUpdateName}$`, 'i') },
    });

    if (duplicate) {
      return sendError(res, `Property amenity '${amenity.name}' already exists`, 409);
    }

    await amenity.save();

    // If image key changed, clean up old S3 object safely
    if (oldImageKey && amenity.image?.key && oldImageKey !== amenity.image.key) {
      deleteFile(oldImageKey).catch((err) =>
        logger.error(`[PropertyAmenityController] Failed to delete old image ${oldImageKey}:`, err)
      );
    }

    logger.info(`PropertyAmenity updated: ${id}`);
    return sendSuccess(res, 'Property amenity updated successfully', amenity);
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[PropertyAmenityController] Rollback S3 image failed ${uploadedKey}:`, err)
      );
    }

    if (error.code === 11000) {
      return sendError(res, 'Duplicate property amenity record', 409);
    }
    logger.error('[PropertyAmenityController] update error:', error);
    return sendError(res, error.message || 'Failed to update property amenity', 500);
  }
};

/**
 * Delete property amenity (Admin only)
 * DELETE /property-amenities/:id
 */
export const deletePropertyAmenity = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid amenity ID', 400);
    }

    const amenity = await PropertyAmenity.findById(id);
    if (!amenity) {
      return sendError(res, 'Property amenity not found', 404);
    }

    const imageKey = amenity.image?.key || extractKeyFromUrl(amenity.image?.url);

    await PropertyAmenity.deleteOne({ _id: id });

    if (imageKey) {
      deleteFile(imageKey).catch((err) =>
        logger.error(`[PropertyAmenityController] Failed to delete S3 image ${imageKey}:`, err)
      );
    }

    logger.info(`PropertyAmenity deleted: ${id}`);
    return sendSuccess(res, 'Property amenity deleted successfully');
  } catch (error: any) {
    logger.error('[PropertyAmenityController] delete error:', error);
    return sendError(res, 'Failed to delete property amenity', 500);
  }
};

/**
 * Toggle property amenity active status (Admin only)
 * PATCH /property-amenities/:id/status
 */
export const togglePropertyAmenityStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid amenity ID', 400);
    }

    const amenity = await PropertyAmenity.findByIdAndUpdate(
      id,
      { isActive: !!isActive },
      { new: true, runValidators: true }
    );

    if (!amenity) {
      return sendError(res, 'Property amenity not found', 404);
    }

    return sendSuccess(res, 'Property amenity status updated', amenity);
  } catch (error: any) {
    logger.error('[PropertyAmenityController] toggle status error:', error);
    return sendError(res, 'Failed to toggle property amenity status', 500);
  }
};
