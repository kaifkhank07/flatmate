import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Property, IProperty, PropertyStatus } from '../../models/listing/property.model';
import { User } from '../../models/auth/user.model';
import { PropertyAmenity } from '../../models/listing/propertyAmenity.model';
import { Image } from '../../models/listing/image.model';
import { Video } from '../../models/listing/video.model';
import { locationService } from '../../services/location/location.service';
import { cleanupUnreferencedImages, cleanupUnreferencedVideos } from '../../utils/mediaCleanup.util';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';

/** Helper function to convert text into a URL-friendly slug */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

/** Helper to generate a unique slug for Property */
export const generateUniqueSlug = async (
  title: string,
  excludePropertyId?: string
): Promise<string> => {
  const baseSlug = slugify(title) || 'property';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const filter: any = { slug };
    if (excludePropertyId && Types.ObjectId.isValid(excludePropertyId)) {
      filter._id = { $ne: excludePropertyId };
    }

    const existing = await Property.findOne(filter).select('_id').lean();
    if (!existing) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
};

/**
 * Create a new Property listing
 * POST /api/properties or /api/property
 */
export const createProperty = async (req: Request, res: Response): Promise<Response> => {
  let locationDoc: any = null;
  try {
    const body = req.body;

    // Determine userId from body or authenticated user/admin
    const userId = body.userId || body.ownerId || (req as any).user?._id || (req as any).admin?._id;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return sendError(res, 'A valid userId is required', 400);
    }

    // Validate referenced user
    const userExists = await User.findById(userId).select('_id').lean();
    if (!userExists) {
      return sendError(res, 'Referenced property user not found', 404);
    }

    // Verify referenced location document exists in MongoDB
    if (body.location) {
      locationDoc = await locationService.getLocationById(body.location);
    }

    if (!locationDoc) {
      return sendError(
        res,
        'A valid Location ID is required for property location',
        400
      );
    }

    // Process and validate amenities if provided
    const amenitiesList = Array.isArray(body.amenities)
      ? body.amenities.map((a: any) => (typeof a === 'object' ? a._id : a)).filter(Boolean)
      : [];

    if (amenitiesList.length > 0) {
      const validAmenityIds = amenitiesList.filter((id: string) => Types.ObjectId.isValid(id));
      const count = await PropertyAmenity.countDocuments({ _id: { $in: validAmenityIds } });
      if (count !== validAmenityIds.length) {
        if (locationDoc) await locationService.deleteLocationIfUnreferenced(locationDoc._id);
        return sendError(res, 'One or more referenced amenity IDs are invalid or non-existent', 400);
      }
    }

    // Process and validate images if provided
    const imageIds = Array.isArray(body.images)
      ? body.images.map((img: any) => (typeof img === 'object' ? img._id : img)).filter(Boolean)
      : [];

    if (imageIds.length > 0) {
      const validImageIds = imageIds.filter((id: string) => Types.ObjectId.isValid(id));
      const count = await Image.countDocuments({ _id: { $in: validImageIds } });
      if (count !== validImageIds.length) {
        if (locationDoc) await locationService.deleteLocationIfUnreferenced(locationDoc._id);
        return sendError(res, 'One or more referenced image IDs are invalid', 400);
      }
    }

    // Process and validate videos if provided
    const videoIds = Array.isArray(body.videos)
      ? body.videos.map((vid: any) => (typeof vid === 'object' ? vid._id : vid)).filter(Boolean)
      : [];

    if (videoIds.length > 0) {
      const validVideoIds = videoIds.filter((id: string) => Types.ObjectId.isValid(id));
      const count = await Video.countDocuments({ _id: { $in: validVideoIds } });
      if (count !== validVideoIds.length) {
        if (locationDoc) await locationService.deleteLocationIfUnreferenced(locationDoc._id);
        return sendError(res, 'One or more referenced video IDs are invalid', 400);
      }
    }

    // Generate unique slug
    const customSlug = body.slug ? slugify(body.slug) : undefined;
    const slug = customSlug
      ? await generateUniqueSlug(customSlug)
      : await generateUniqueSlug(body.title);

    const initialStatus: PropertyStatus = body.status || 'pending';
    const now = new Date();

    const parseValidDate = (val: any): Date | undefined => {
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    };

    const propertyData: Partial<IProperty> = {
      userId,
      title: body.title.trim(),
      slug,
      description: body.description.trim(),
      propertyType: body.propertyType || body.listingType,
      area: Number(typeof body.area === 'object' ? body.area?.value : body.area || 0),
      location: locationDoc._id,
      rent: Number(body.rent),
      securityDeposit: Number(body.securityDeposit || 0),
      maintenanceCharges: {
        amount: Number(body.maintenanceCharges?.amount || 0),
        frequency: body.maintenanceCharges?.frequency || 'yearly',
      },
      furnishing: body.furnishing || 'semi_furnished',
      parking: typeof body.parking === 'object' ? Boolean(body.parking?.available) : Boolean(body.parking),
      availableFrom: parseValidDate(body.availableFrom) || now,
      genderPreference: body.genderPreference || 'any',
      occupationPreference: body.occupationPreference || 'any',
      amenities: amenitiesList,
      houseRules: body.houseRules || [],
      images: imageIds,
      videos: videoIds,
      status: initialStatus,
      rejectionReason: initialStatus === 'rejected' ? body.rejectionReason : undefined,
      ...(initialStatus === 'approved' && { approvedAt: now, publishedAt: now }),
    };

    const property = await Property.create(propertyData);

    const populatedProperty = await Property.findById(property._id)
      .populate('userId', 'name email mobile role accountStatus')
      .populate('location', 'name formattedAddress city state country latitude longitude placeId')
      .populate('amenities')
      .populate('images')
      .populate('videos')
      .lean();

    logger.info(`Property created successfully: ${property._id} (slug: ${slug})`);
    return sendSuccess(res, 'Property created successfully', populatedProperty, 201);
  } catch (error: any) {
    logger.error('[PropertyController] createProperty error:', error);
    if (locationDoc?._id) {
      await locationService.deleteLocationIfUnreferenced(locationDoc._id).catch(() => { });
    }
    return sendError(res, error.message || 'Failed to create property', 500);
  }
};

/**
 * Get paginated list of properties with filters & search
 * GET /api/properties or /api/property
 */
export const getProperties = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Search filter across title, description, and slug
    const search = (req.query.search || req.query.q) as string;
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { slug: searchRegex },
      ];
    }

    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    // Property Type filter
    const pType = req.query.propertyType || req.query.listingType;
    if (pType && pType !== 'all') {
      filter.propertyType = pType;
    }

    // Furnishing filter
    if (req.query.furnishing && req.query.furnishing !== 'all') {
      filter.furnishing = req.query.furnishing;
    }

    // Location filter
    if (req.query.location && req.query.location !== 'all') {
      if (Types.ObjectId.isValid(req.query.location as string)) {
        filter.location = req.query.location;
      }
    }

    // User filter
    const uId = req.query.userId || req.query.ownerId;
    if (uId && uId !== 'all') {
      if (Types.ObjectId.isValid(uId as string)) {
        filter.userId = uId;
      }
    }

    // Gender Preference filter
    if (req.query.genderPreference && req.query.genderPreference !== 'all') {
      filter.genderPreference = req.query.genderPreference;
    }

    // Occupation Preference filter
    if (req.query.occupationPreference && req.query.occupationPreference !== 'all') {
      filter.occupationPreference = req.query.occupationPreference;
    }

    // Rent filter
    if (req.query.budget !== undefined || req.query.rent !== undefined) {
      const rentVal = Number(req.query.budget ?? req.query.rent);
      if (!isNaN(rentVal)) {
        filter.rent = rentVal;
      }
    }

    // Available Date filter
    if (req.query.availableFrom) {
      filter.availableFrom = { $gte: new Date(req.query.availableFrom as string) };
    }

    // Sorting
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const sortOptions: any = { [sortBy]: order };

    const [items, total] = await Promise.all([
      Property.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email mobile role accountStatus')
        .populate('location', 'name formattedAddress city state country')
        .populate('amenities')
        .populate('images')
        .populate('videos')
        .lean(),
      Property.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Properties fetched successfully', {
      items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    logger.error('[PropertyController] getProperties error:', error);
    return sendError(res, 'Failed to fetch properties', 500);
  }
};

/**
 * Get single property by ObjectId
 * GET /api/properties/:propertyId or /api/property/:id
 */
export const getPropertyById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.propertyId || req.params.id;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid property ID format', 400);
    }

    const property = await Property.findById(id)
      .populate('userId', 'name email mobile role accountStatus profileVerified')
      .populate('location', 'name formattedAddress city state country latitude longitude')
      .populate('amenities')
      .populate('images')
      .populate('videos')
      .lean();

    if (!property) {
      return sendError(res, 'Property listing not found', 404);
    }

    return sendSuccess(res, 'Property details fetched successfully', property);
  } catch (error: any) {
    logger.error('[PropertyController] getPropertyById error:', error);
    return sendError(res, 'Failed to fetch property details', 500);
  }
};

/**
 * Get single property by Slug
 * GET /api/properties/slug/:slug
 */
export const getPropertyBySlug = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { slug } = req.params;
    if (!slug || !slug.trim()) {
      return sendError(res, 'Slug parameter is required', 400);
    }

    const property = await Property.findOne({ slug: slug.toLowerCase().trim() })
      .populate('userId', 'name email mobile role accountStatus profileVerified')
      .populate('location', 'name formattedAddress city state country latitude longitude')
      .populate('amenities')
      .populate('images')
      .populate('videos')
      .lean();

    if (!property) {
      return sendError(res, 'Property listing not found for slug', 404);
    }

    return sendSuccess(res, 'Property details fetched successfully', property);
  } catch (error: any) {
    logger.error('[PropertyController] getPropertyBySlug error:', error);
    return sendError(res, 'Failed to fetch property by slug', 500);
  }
};

/**
 * Update property listing
 * PUT /api/properties/:propertyId or /api/property/:id
 */
export const updateProperty = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.propertyId || req.params.id;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid property ID format', 400);
    }

    const property = await Property.findById(id);
    if (!property) {
      return sendError(res, 'Property listing not found', 404);
    }

    const body = req.body;

    const oldLocationId = property.location ? property.location.toString() : null;
    let locationChanged = false;

    // Validate referenced user if changing
    const reqUserId = body.userId || body.ownerId;
    if (reqUserId && Types.ObjectId.isValid(reqUserId)) {
      const userExists = await User.findById(reqUserId).select('_id').lean();
      if (!userExists) {
        return sendError(res, 'Referenced property user not found', 404);
      }
      property.userId = reqUserId;
    }

    // Validate location if changing
    if (body.location) {
      const locationDoc = await locationService.getLocationById(body.location);
      if (!locationDoc) {
        return sendError(res, 'Referenced location ID not found in database', 400);
      }
      if (!oldLocationId || locationDoc._id.toString() !== oldLocationId) {
        property.location = locationDoc._id;
        locationChanged = true;
      }
    }

    // Handle Title & Slug update
    if (body.title && body.title.trim() !== property.title) {
      property.title = body.title.trim();
      const customSlug = body.slug ? slugify(body.slug) : undefined;
      property.slug = customSlug
        ? await generateUniqueSlug(customSlug, id)
        : await generateUniqueSlug(body.title, id);
    } else if (body.slug && slugify(body.slug) !== property.slug) {
      property.slug = await generateUniqueSlug(body.slug, id);
    }

    // Direct string/enum fields
    if (body.description !== undefined) property.description = body.description.trim();
    if (body.propertyType !== undefined || body.listingType !== undefined) {
      property.propertyType = body.propertyType || body.listingType;
    }
    if (body.furnishing !== undefined) property.furnishing = body.furnishing;
    if (body.genderPreference !== undefined) property.genderPreference = body.genderPreference;
    if (body.occupationPreference !== undefined) property.occupationPreference = body.occupationPreference;

    // Financials
    if (body.rent !== undefined) {
      property.rent = Number(body.rent);
    }
    if (body.securityDeposit !== undefined) {
      property.securityDeposit = Number(body.securityDeposit);
    }
    if (body.maintenanceCharges !== undefined) {
      property.maintenanceCharges = {
        amount: Number(body.maintenanceCharges.amount || 0),
        frequency: body.maintenanceCharges.frequency || 'yearly',
      };
    }

    const parseValidDate = (val: any): Date | undefined => {
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    };

    // Availability Date
    if (body.availableFrom !== undefined) {
      const parsed = parseValidDate(body.availableFrom);
      if (parsed) property.availableFrom = parsed;
    }

    // Specifications
    if (body.parking !== undefined) {
      property.parking = typeof body.parking === 'object' ? Boolean(body.parking?.available) : Boolean(body.parking);
    }

    if (body.area !== undefined) {
      property.area = Number(typeof body.area === 'object' ? body.area?.value : body.area || 0);
    }

    // House Rules & Amenities
    if (body.houseRules !== undefined && Array.isArray(body.houseRules)) {
      property.houseRules = body.houseRules;
    }
    if (body.amenities !== undefined && Array.isArray(body.amenities)) {
      property.amenities = body.amenities.map((a: any) => (typeof a === 'object' ? a._id : a)).filter(Boolean);
    }

    // Images update & orphan tracking
    let removedImageIds: Types.ObjectId[] = [];
    if (body.images !== undefined && Array.isArray(body.images)) {
      const newImageIds = body.images.map((img: any) => (typeof img === 'object' ? img._id : img)).filter(Boolean);
      const oldImageIds = (property.images || []).map((imgId) => imgId.toString());
      removedImageIds = oldImageIds.filter((oldId) => !newImageIds.includes(oldId)) as any;
      property.images = newImageIds;
    }

    // Videos update & orphan tracking
    let removedVideoIds: Types.ObjectId[] = [];
    if (body.videos !== undefined && Array.isArray(body.videos)) {
      const newVideoIds = body.videos.map((vid: any) => (typeof vid === 'object' ? vid._id : vid)).filter(Boolean);
      const oldVideoIds = (property.videos || []).map((vidId) => vidId.toString());
      removedVideoIds = oldVideoIds.filter((oldId) => !newVideoIds.includes(oldId)) as any;
      property.videos = newVideoIds;
    }

    // Status changes
    if (body.status !== undefined && body.status !== property.status) {
      property.status = body.status;
      if (body.status === 'rejected') {
        property.rejectionReason = body.rejectionReason || property.rejectionReason;
      } else if (body.status === 'approved') {
        const now = new Date();
        if (!property.approvedAt) property.approvedAt = now;
        if (!property.publishedAt) property.publishedAt = now;
      }
    }

    await property.save();

    // Clean up previous Location document if location changed and old location is no longer referenced
    if (locationChanged && oldLocationId) {
      await locationService.deleteLocationIfUnreferenced(oldLocationId).catch((err) =>
        logger.error('[PropertyController] Old location cleanup error:', err)
      );
    }

    // Trigger asynchronous cleanup of removed media items
    if (removedImageIds.length > 0) {
      cleanupUnreferencedImages(removedImageIds).catch((err) =>
        logger.error('[PropertyController] Image cleanup error:', err)
      );
    }
    if (removedVideoIds.length > 0) {
      cleanupUnreferencedVideos(removedVideoIds).catch((err) =>
        logger.error('[PropertyController] Video cleanup error:', err)
      );
    }

    const updatedProperty = await Property.findById(property._id)
      .populate('userId', 'name email mobile role accountStatus')
      .populate('location', 'name formattedAddress city state country latitude longitude placeId')
      .populate('amenities')
      .populate('images')
      .populate('videos')
      .lean();

    logger.info(`Property updated: ${property._id}`);
    return sendSuccess(res, 'Property updated successfully', updatedProperty);
  } catch (error: any) {
    logger.error('[PropertyController] updateProperty error:', error);
    return sendError(res, error.message || 'Failed to update property', 500);
  }
};

/**
 * Delete property listing
 * DELETE /api/properties/:propertyId or /api/property/:id
 */
export const deleteProperty = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.propertyId || req.params.id;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid property ID format', 400);
    }

    const property = await Property.findById(id);
    if (!property) {
      return sendError(res, 'Property listing not found', 404);
    }

    const attachedImages = [...(property.images || [])];
    const attachedVideos = [...(property.videos || [])];
    const attachedLocationId = property.location ? property.location.toString() : null;

    await Property.deleteOne({ _id: id });

    // Clean up unreferenced media documents & S3 objects
    if (attachedImages.length > 0) {
      cleanupUnreferencedImages(attachedImages).catch((err) =>
        logger.error('[PropertyController] Delete property image cleanup error:', err)
      );
    }

    if (attachedVideos.length > 0) {
      cleanupUnreferencedVideos(attachedVideos).catch((err) =>
        logger.error('[PropertyController] Delete property video cleanup error:', err)
      );
    }

    // Clean up associated Location document if unreferenced
    if (attachedLocationId) {
      await locationService.deleteLocationIfUnreferenced(attachedLocationId).catch((err) =>
        logger.error('[PropertyController] Delete property location cleanup error:', err)
      );
    }

    logger.info(`Property deleted: ${id} (Location ${attachedLocationId || 'none'} cleaned up)`);
    return sendSuccess(res, 'Property deleted successfully');
  } catch (error: any) {
    logger.error('[PropertyController] deleteProperty error:', error);
    return sendError(res, 'Failed to delete property', 500);
  }
};

/**
 * Update property status dedicated endpoint
 * PATCH /api/properties/:propertyId/status or /api/property/:id/status
 */
export const updatePropertyStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.propertyId || req.params.id;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid property ID format', 400);
    }

    let { status, rejectionReason } = req.body;

    const validStatuses: PropertyStatus[] = [
      'draft',
      'pending',
      'approved',
      'rejected',
      'blocked',
      'closed',
      'expired',
    ];

    if (!status || !validStatuses.includes(status)) {
      return sendError(res, `Invalid status value. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    if (status === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
      return sendError(res, 'Rejection reason is required when status is set to rejected', 400);
    }

    const property = await Property.findById(id);
    if (!property) {
      return sendError(res, 'Property listing not found', 404);
    }

    property.status = status;
    const now = new Date();

    if (status === 'rejected') {
      property.rejectionReason = rejectionReason.trim();
    } else if (status === 'approved') {
      if (!property.approvedAt) property.approvedAt = now;
      if (!property.publishedAt) property.publishedAt = now;
    }

    await property.save();

    const updated = await Property.findById(id)
      .populate('userId', 'name email mobile role')
      .populate('location', 'name city state')
      .populate('amenities')
      .lean();

    logger.info(`Property status updated: ${id} -> ${status}`);
    return sendSuccess(res, `Property status updated to ${status}`, updated);
  } catch (error: any) {
    logger.error('[PropertyController] updatePropertyStatus error:', error);
    return sendError(res, 'Failed to update property status', 500);
  }
};

/**
 * Helper endpoint to approve property
 * PATCH /api/properties/:propertyId/approve
 */
export const approveProperty = async (req: Request, res: Response): Promise<Response> => {
  req.body = { status: 'approved' };
  return updatePropertyStatus(req, res);
};

/**
 * Helper endpoint to reject property
 * PATCH /api/properties/:propertyId/reject
 */
export const rejectProperty = async (req: Request, res: Response): Promise<Response> => {
  req.body = { status: 'rejected', rejectionReason: req.body.rejectionReason };
  return updatePropertyStatus(req, res);
};

/**
 * Helper endpoint to block property
 * PATCH /api/properties/:propertyId/block
 */
export const blockProperty = async (req: Request, res: Response): Promise<Response> => {
  req.body = { status: 'blocked' };
  return updatePropertyStatus(req, res);
};

/**
 * Helper endpoint to close property
 * PATCH /api/properties/:propertyId/close
 */
export const closeProperty = async (req: Request, res: Response): Promise<Response> => {
  req.body = { status: 'closed' };
  return updatePropertyStatus(req, res);
};

/**
 * Media attachment: add image to property
 * POST /api/properties/:propertyId/images
 */
export const addImageToProperty = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.propertyId || req.params.id;
    const { imageId } = req.body;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(imageId)) {
      return sendError(res, 'Invalid property ID or image ID', 400);
    }

    const [property, image] = await Promise.all([
      Property.findById(id),
      Image.findById(imageId),
    ]);

    if (!property) return sendError(res, 'Property not found', 404);
    if (!image) return sendError(res, 'Image not found', 404);

    if (!property.images.includes(image._id)) {
      property.images.push(image._id);
      await property.save();
    }

    return sendSuccess(res, 'Image attached to property successfully', property);
  } catch (error: any) {
    logger.error('[PropertyController] addImageToProperty error:', error);
    return sendError(res, 'Failed to attach image to property', 500);
  }
};

/**
 * Media attachment: remove image from property
 * DELETE /api/properties/:propertyId/images/:imageId
 */
export const removeImageFromProperty = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { propertyId, imageId } = req.params;

    if (!Types.ObjectId.isValid(propertyId) || !Types.ObjectId.isValid(imageId)) {
      return sendError(res, 'Invalid property ID or image ID', 400);
    }

    const property = await Property.findById(propertyId);
    if (!property) return sendError(res, 'Property not found', 404);

    property.images = property.images.filter((imgId) => imgId.toString() !== imageId);
    await property.save();

    return sendSuccess(res, 'Image detached from property successfully', property);
  } catch (error: any) {
    logger.error('[PropertyController] removeImageFromProperty error:', error);
    return sendError(res, 'Failed to remove image from property', 500);
  }
};

/**
 * Media attachment: add video to property
 * POST /api/properties/:propertyId/videos
 */
export const addVideoToProperty = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.propertyId || req.params.id;
    const { videoId } = req.body;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(videoId)) {
      return sendError(res, 'Invalid property ID or video ID', 400);
    }

    const [property, video] = await Promise.all([
      Property.findById(id),
      Video.findById(videoId),
    ]);

    if (!property) return sendError(res, 'Property not found', 404);
    if (!video) return sendError(res, 'Video not found', 404);

    if (!property.videos.includes(video._id)) {
      property.videos.push(video._id);
      await property.save();
    }

    return sendSuccess(res, 'Video attached to property successfully', property);
  } catch (error: any) {
    logger.error('[PropertyController] addVideoToProperty error:', error);
    return sendError(res, 'Failed to attach video to property', 500);
  }
};

/**
 * Media attachment: remove video from property
 * DELETE /api/properties/:propertyId/videos/:videoId
 */
export const removeVideoFromProperty = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { propertyId, videoId } = req.params;

    if (!Types.ObjectId.isValid(propertyId) || !Types.ObjectId.isValid(videoId)) {
      return sendError(res, 'Invalid property ID or video ID', 400);
    }

    const property = await Property.findById(propertyId);
    if (!property) return sendError(res, 'Property not found', 404);

    property.videos = property.videos.filter((vidId) => vidId.toString() !== videoId);
    await property.save();

    return sendSuccess(res, 'Video detached from property successfully', property);
  } catch (error: any) {
    logger.error('[PropertyController] removeVideoFromProperty error:', error);
    return sendError(res, 'Failed to remove video from property', 500);
  }
};
