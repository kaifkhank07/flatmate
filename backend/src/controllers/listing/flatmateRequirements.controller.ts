import { Request, Response } from 'express';
import { FlatmateRequirement, IFlatmateRequirement, PostType, PostStatus } from '../../models/listing/flatmateRequirements.model';
import { User } from '../../models/auth/user.model';
import { Image } from '../../models/listing/image.model';
import { Video } from '../../models/listing/video.model';
import { locationService } from '../../services/location/location.service';
import { cleanupUnreferencedImages, cleanupUnreferencedVideos } from '../../utils/mediaCleanup.util';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { Types } from 'mongoose';
import { createNotification, notifyAdmins } from '../../services/notification/notification.service';
import { flatmateRequirementDeletionService } from '../../services/deletion';
import { processListingMatches } from '../../services/listing/propertyMatch.service';

/** Helper to populate standard flatmate requirement fields */
const populateFlatmateRequirementFields = (query: any) => {
  return query
    .populate('userId', 'email mobile userType profileVerified isOnline accountStatus')
    .populate('location')
    .populate('images')
    .populate('videos')
    .populate('userPreferences', 'name category image isActive')
    .populate('amenities', 'name category icon isActive');
};

/** Helper to generate a unique slug */
const generateUniqueSlug = async (titleOrSlug: string, existingId?: string): Promise<string> => {
  const baseSlug = titleOrSlug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let slug = baseSlug || 'flatmate-requirement';
  let counter = 1;

  while (true) {
    const filter: any = { slug };
    if (existingId) {
      filter._id = { $ne: existingId };
    }

    const existing = await FlatmateRequirement.findOne(filter).lean();
    if (!existing) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

/**
 * 1. Create Flatmate Requirement
 */
export const createFlatmateRequirement = async (req: Request, res: Response): Promise<Response> => {
  let locationDoc: any = null;
  try {
    let userId: Types.ObjectId;

    if ((req as any).admin) {
      const selectedUserId = req.body.userId || (req.user ? req.user._id.toString() : undefined);
      if (!selectedUserId || !Types.ObjectId.isValid(selectedUserId)) {
        return sendError(res, 'Valid target user ID is required', 400);
      }
      const targetUser = await User.findOne({ _id: selectedUserId, isDeleted: false });
      if (!targetUser) {
        return sendError(res, 'Target user account not found or is deleted', 404);
      }
      userId = new Types.ObjectId(selectedUserId);
    } else if (req.user) {
      userId = req.user._id;
    } else if (req.body.userId && Types.ObjectId.isValid(req.body.userId)) {
      const targetUser = await User.findOne({ _id: req.body.userId, isDeleted: false });
      if (!targetUser) {
        return sendError(res, 'Target user account not found or is deleted', 404);
      }
      userId = new Types.ObjectId(req.body.userId);
    } else {
      return sendError(res, 'Authentication required', 401);
    }

    const {
      title,
      slug: customSlug,
      description,
      postType,
      propertyType,
      partnerType,
      location,
      area,
      rent,
      budget,
      securityDeposit,
      maintenanceCharges,
      furnishing,
      parking,
      brokerage,
      availableFrom,
      moveInDate,
      genderPreference,
      occupancyPreference,
      occupationPreference,
      userPreferences,
      lifestylePreferences,
      amenities,
      images,
      videos,
      propertyDetails,
      status,
    } = req.body;

    // Validate Location existence
    if (!Types.ObjectId.isValid(location)) {
      return sendError(res, 'Invalid location ID format', 400);
    }
    locationDoc = await locationService.getLocationById(location);
    if (!locationDoc) {
      return sendError(res, 'A valid Location ID is required for flatmate requirement location', 400);
    }

    // Process and validate images if provided
    const imageIds = Array.isArray(images)
      ? images.map((img: any) => (typeof img === 'object' ? img._id : img)).filter(Boolean)
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
    const videoIds = Array.isArray(videos)
      ? videos.map((vid: any) => (typeof vid === 'object' ? vid._id : vid)).filter(Boolean)
      : [];

    if (videoIds.length > 0) {
      const validVideoIds = videoIds.filter((id: string) => Types.ObjectId.isValid(id));
      const count = await Video.countDocuments({ _id: { $in: validVideoIds } });
      if (count !== validVideoIds.length) {
        if (locationDoc) await locationService.deleteLocationIfUnreferenced(locationDoc._id);
        return sendError(res, 'One or more referenced video IDs are invalid', 400);
      }
    }

    // Generate safe unique slug
    const finalSlug = customSlug
      ? await generateUniqueSlug(customSlug)
      : await generateUniqueSlug(title);

    const parseValidDate = (val: any): Date | undefined => {
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    };

    const finalRent = rent !== undefined && rent !== null ? Number(rent) : Number(budget || 0);

    // Construct creation payload ensuring mutually exclusive post type fields
    const postData: Partial<IFlatmateRequirement> = {
      userId,
      title: title.trim(),
      slug: finalSlug,
      description: description ? description.trim() : undefined,
      postType,
      propertyType: postType === 'property' ? (propertyType || 'flat') : undefined,
      partnerType: postType === 'partner' ? (partnerType || 'flatmate') : undefined,
      location: locationDoc._id,
      area: area ? Number(area) : 0,
      rent: finalRent,
      securityDeposit: securityDeposit ? Number(securityDeposit) : 0,
      maintenanceCharges: maintenanceCharges || { amount: 0, frequency: 'yearly' },
      furnishing: furnishing || 'semi_furnished',
      parking: Boolean(parking),
      brokerage: Boolean(brokerage),
      availableFrom: parseValidDate(availableFrom || moveInDate) || new Date(),
      genderPreference: genderPreference || 'any',
      occupancyPreference: occupancyPreference || 'any',
      occupationPreference: occupationPreference || 'any',
      userPreferences: userPreferences || lifestylePreferences || [],
      amenities: amenities || [],
      images: imageIds,
      videos: videoIds,
      propertyDetails: postType === 'partner' && propertyDetails ? {
        ...(propertyDetails.floor !== undefined && { floor: Number(propertyDetails.floor) }),
        ...(propertyDetails.totalFloors !== undefined && { totalFloors: Number(propertyDetails.totalFloors) }),
        ...(propertyDetails.facing && { facing: propertyDetails.facing }),
        ...(propertyDetails.bedrooms && { bedrooms: propertyDetails.bedrooms }),
      } : undefined,
      status: status || 'pending',
    };

    const newRequirement = await FlatmateRequirement.create(postData);
    const populated = await populateFlatmateRequirementFields(FlatmateRequirement.findById(newRequirement._id)).lean();

    // 1: When user creates any listing, create notification for user and admin
    if (newRequirement.status === 'approved') {
      createNotification({
        recipientType: 'USER',
        recipientId: newRequirement.userId,
        eventType: 'LISTING_APPROVED',
        category: 'LISTING_UPDATES',
        // title: 'Flatmate Requirement Approved!',
        title: 'Listing Approved!',
        message: `Your flatmate requirement listing "${newRequirement.title}" is approved and live on FlatMate.`,
        actionUrl: `/my-listings/${newRequirement.slug || newRequirement._id}`,
        data: { listingId: newRequirement._id.toString(), listingType: 'flatmate_requirement' },
        priority: 'HIGH',
      }).catch((err) => logger.warn('[FlatmateRequirementController] Failed to notify user of approved requirement', err));

      // Trigger automatic matching notifications
      processListingMatches({ listingType: 'flatmate_requirement', listingId: newRequirement._id }).catch((err) =>
        logger.warn(`[FlatmateRequirementController] Match processing failed for requirement ${newRequirement._id}`, err)
      );
    } else {
      createNotification({
        recipientType: 'USER',
        recipientId: newRequirement.userId,
        eventType: 'LISTING_SUBMITTED',
        category: 'LISTING_UPDATES',
        title: 'Listing Submitted for Review',
        message: `Your flatmate requirement listing "${newRequirement.title}" has been submitted successfully and is awaiting moderation review.`,
        actionUrl: `/my-listings/${newRequirement.slug || newRequirement._id}`,
        data: { listingId: newRequirement._id.toString(), listingType: 'flatmate_requirement' },
        priority: 'NORMAL',
      }).catch((err) => logger.warn('[FlatmateRequirementController] Failed to create listing submitted notification for user', err));

      notifyAdmins({
        eventType: 'ADMIN_LISTING_AWAITING_MODERATION',
        category: 'ADMINISTRATIVE',
        title: 'New Flatmate Requirement Awaiting Review',
        message: `A new flatmate requirement listing "${newRequirement.title}" has been submitted and is waiting for review.`,
        actionUrl: '/admin/flatmate-requirements',
        data: { listingId: newRequirement._id.toString(), listingType: 'flatmate_requirement' },
        priority: 'NORMAL',
      }).catch((err) => logger.warn('[FlatmateRequirementController] Failed to notify admins of new requirement', err));
    }

    logger.info(`Flatmate requirement created successfully: ${newRequirement._id} by user: ${userId}`);
    return sendSuccess(res, 'Flatmate requirement created successfully', populated, 201);
  } catch (error: any) {
    if (locationDoc?._id) {
      await locationService.deleteLocationIfUnreferenced(locationDoc._id).catch(() => { });
    }
    if (error.code === 11000) {
      return sendError(res, 'A requirement with a duplicate unique key already exists', 409);
    }
    logger.error('[FlatmateRequirementController] create error:', error);
    return sendError(res, error.message || 'Failed to create flatmate requirement', 500);
  }
};

/**
 * 2. Get Flatmate Requirement by ID (Public)
 */
export const getFlatmateRequirementById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id || req.params.postId;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid requirement ID', 400);
    }

    const requirement = await populateFlatmateRequirementFields(FlatmateRequirement.findById(id)).lean();
    if (!requirement) {
      return sendError(res, 'Flatmate requirement not found', 404);
    }

    return sendSuccess(res, 'Flatmate requirement fetched successfully', requirement);
  } catch (error: any) {
    logger.error('[FlatmateRequirementController] getById error:', error);
    return sendError(res, 'Failed to fetch flatmate requirement', 500);
  }
};

/**
 * 3. Get Flatmate Requirement by Slug (Public)
 */
export const getFlatmateRequirementBySlug = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return sendError(res, 'Flatmate requirement slug is required', 400);
    }

    const requirement = await populateFlatmateRequirementFields(
      FlatmateRequirement.findOne({ slug: slug.toLowerCase() })
    ).lean();
    if (!requirement) {
      return sendError(res, 'Flatmate requirement not found', 404);
    }

    return sendSuccess(res, 'Flatmate requirement fetched successfully', requirement);
  } catch (error: any) {
    logger.error('[FlatmateRequirementController] getBySlug error:', error);
    return sendError(res, 'Failed to fetch flatmate requirement', 500);
  }
};

/**
 * 4. Get My Requirements (Authenticated user's requirements)
 */
export const getMyFlatmateRequirements = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return sendError(res, 'Authentication required', 401);
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = req.query.order === 'asc' || req.query.order === '1' ? 1 : -1;

    const filter: any = { userId };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.postType) {
      filter.postType = req.query.postType;
    }

    if (req.query.propertyType) {
      filter.propertyType = req.query.propertyType;
    }

    if (req.query.partnerType) {
      filter.partnerType = req.query.partnerType;
    }

    const myBhk = req.query.bhk || req.query.bedrooms;
    if (myBhk && myBhk !== 'all') {
      filter['propertyDetails.bedrooms'] = myBhk;
    }

    const searchStr = (req.query.search || req.query.q) as string;
    if (searchStr && searchStr.trim()) {
      const escaped = searchStr.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      populateFlatmateRequirementFields(
        FlatmateRequirement.find(filter)
          .sort({ [sortBy]: order })
          .skip(skip)
          .limit(limit)
      ).lean(),
      FlatmateRequirement.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 'User flatmate requirements fetched successfully', {
      items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    logger.error('[FlatmateRequirementController] getMyFlatmateRequirements error:', error);
    return sendError(res, 'Failed to fetch user flatmate requirements', 500);
  }
};

/**
 * 5. Get Public Requirements (Marketplace Search)
 */
export const getPublicFlatmateRequirements = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = req.query.order === 'asc' || req.query.order === '1' ? 1 : -1;

    // Default to approved posts for public marketplace
    const filter: any = { status: 'approved' };

    if (req.query.postType) {
      filter.postType = req.query.postType;
    }

    if (req.query.propertyType) {
      filter.propertyType = req.query.propertyType;
    }

    if (req.query.partnerType) {
      filter.partnerType = req.query.partnerType;
    }

    const myBhk = req.query.bhk || req.query.bedrooms;
    if (myBhk && myBhk !== 'all') {
      filter['propertyDetails.bedrooms'] = myBhk;
    }

    if (req.query.location && Types.ObjectId.isValid(req.query.location as string)) {
      filter.location = req.query.location;
    }

    if (req.query.occupationPreference && req.query.occupationPreference !== 'any') {
      filter.occupationPreference = { $in: [req.query.occupationPreference, 'any'] };
    }

    if (req.query.genderPreference && req.query.genderPreference !== 'any') {
      filter.genderPreference = { $in: [req.query.genderPreference, 'any'] };
    }

    if (req.query.occupancyPreference && req.query.occupancyPreference !== 'all' && req.query.occupancyPreference !== 'any') {
      filter.occupancyPreference = { $in: [req.query.occupancyPreference, 'any'] };
    }

    if (req.query.brokerage !== undefined) {
      filter.brokerage = String(req.query.brokerage) === 'true';
    }

    if (req.query.furnishing) {
      filter.furnishing = req.query.furnishing;
    }

    const availableFromQuery = (req.query.availableFrom || req.query.moveInDate) as string;
    if (availableFromQuery) {
      const parsedDate = new Date(availableFromQuery);
      if (!isNaN(parsedDate.getTime())) {
        filter.availableFrom = { $gte: parsedDate };
      }
    }

    const rentQuery = req.query.rent !== undefined ? req.query.rent : req.query.budget;
    const rentVal = rentQuery !== undefined ? parseFloat(rentQuery as string) : undefined;
    if (rentVal !== undefined && !isNaN(rentVal)) {
      filter.rent = rentVal;
    }

    const userPrefQuery = req.query.userPreferences || req.query.lifestylePreferences;
    if (userPrefQuery) {
      const prefs = Array.isArray(userPrefQuery) ? userPrefQuery : [userPrefQuery];
      const validPrefIds = prefs.filter((p: any) => Types.ObjectId.isValid(p));
      if (validPrefIds.length > 0) {
        filter.userPreferences = { $in: validPrefIds };
      }
    }

    if (req.query.amenities) {
      const amens = Array.isArray(req.query.amenities) ? req.query.amenities : [req.query.amenities];
      const validAmenIds = amens.filter((a: any) => Types.ObjectId.isValid(a));
      if (validAmenIds.length > 0) {
        filter.amenities = { $in: validAmenIds };
      }
    }

    const searchStr = (req.query.search || req.query.q) as string;
    if (searchStr && searchStr.trim()) {
      const escaped = searchStr.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      populateFlatmateRequirementFields(
        FlatmateRequirement.find(filter)
          .sort({ [sortBy]: order })
          .skip(skip)
          .limit(limit)
      ).lean(),
      FlatmateRequirement.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 'Public flatmate requirements fetched successfully', {
      items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    logger.error('[FlatmateRequirementController] getPublicFlatmateRequirements error:', error);
    return sendError(res, 'Failed to fetch public flatmate requirements', 500);
  }
};

/**
 * 6. Update Requirement (Owner or Admin)
 */
export const updateFlatmateRequirement = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id || req.params.postId;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid requirement ID', 400);
    }

    const existingRequirement = await FlatmateRequirement.findById(id);
    if (!existingRequirement) {
      return sendError(res, 'Flatmate requirement not found', 404);
    }

    const isOwner = req.user && existingRequirement.userId.toString() === req.user._id.toString();
    const isAdmin = Boolean((req as any).admin);

    if (!isOwner && !isAdmin) {
      return sendError(res, 'Not authorized to update this flatmate requirement', 403);
    }

    if (existingRequirement.status === 'closed' && req.body.status !== 'draft' && !isAdmin) {
      return sendError(res, 'Cannot modify a closed requirement. Please change status to draft to reopen.', 400);
    }

    const oldStatus = existingRequirement.status;
    const wasRejected = oldStatus === 'rejected';

    const updateData: any = { ...req.body };
    if (updateData.rent !== undefined || updateData.budget !== undefined) {
      updateData.rent = Number(updateData.rent ?? updateData.budget);
      delete updateData.budget;
    }
    if (updateData.area !== undefined) {
      updateData.area = Number(updateData.area);
    }
    if (updateData.securityDeposit !== undefined) {
      updateData.securityDeposit = Number(updateData.securityDeposit);
    }
    if (updateData.lifestylePreferences !== undefined && updateData.userPreferences === undefined) {
      updateData.userPreferences = updateData.lifestylePreferences;
      delete updateData.lifestylePreferences;
    }
    delete updateData.peopleCount;
    delete updateData.expiresAt;

    const oldLocationId = existingRequirement.location ? existingRequirement.location.toString() : null;
    let locationChanged = false;

    // Validate and update userId if admin is reassigning post ownership
    if (isAdmin && updateData.userId) {
      if (!Types.ObjectId.isValid(updateData.userId)) {
        return sendError(res, 'Invalid target user ID', 400);
      }
      const targetUser = await User.findOne({ _id: updateData.userId, isDeleted: false });
      if (!targetUser) {
        return sendError(res, 'Target user account not found or is deleted', 404);
      }
      updateData.userId = new Types.ObjectId(updateData.userId);
    } else {
      delete updateData.userId;
    }

    // Validate Location if changing
    if (updateData.location) {
      const locationDoc = await locationService.getLocationById(updateData.location);
      if (!locationDoc) {
        return sendError(res, 'Referenced location ID not found in database', 400);
      }
      if (!oldLocationId || locationDoc._id.toString() !== oldLocationId) {
        updateData.location = locationDoc._id;
        locationChanged = true;
      }
    }

    // Handle Title & Slug update
    if (updateData.title && updateData.title.trim() !== existingRequirement.title && !updateData.slug) {
      updateData.slug = await generateUniqueSlug(updateData.title, id);
    } else if (updateData.slug && updateData.slug !== existingRequirement.slug) {
      updateData.slug = await generateUniqueSlug(updateData.slug, id);
    }

    // Images update & orphan tracking
    let removedImageIds: Types.ObjectId[] = [];
    if (updateData.images !== undefined && Array.isArray(updateData.images)) {
      const newImageIds = updateData.images.map((img: any) => (typeof img === 'object' ? img._id : img)).filter(Boolean);
      const oldImageIds = (existingRequirement.images || []).map((imgId) => imgId.toString());
      removedImageIds = oldImageIds.filter((oldId) => !newImageIds.includes(oldId)) as any;
      updateData.images = newImageIds;
    }

    // Videos update & orphan tracking
    let removedVideoIds: Types.ObjectId[] = [];
    if (updateData.videos !== undefined && Array.isArray(updateData.videos)) {
      const newVideoIds = updateData.videos.map((vid: any) => (typeof vid === 'object' ? vid._id : vid)).filter(Boolean);
      const oldVideoIds = (existingRequirement.videos || []).map((vidId) => vidId.toString());
      removedVideoIds = oldVideoIds.filter((oldId) => !newVideoIds.includes(oldId)) as any;
      updateData.videos = newVideoIds;
    }

    // Determine target postType and handle clearing obsolete conditional fields ($unset)
    const targetPostType: PostType = updateData.postType || existingRequirement.postType;
    const unsetFields: any = {};

    if (targetPostType === 'property') {
      unsetFields.partnerType = '';
      delete updateData.partnerType;
      unsetFields.propertyDetails = '';
      delete updateData.propertyDetails;
      // Preserve existing valid value if available; if not available, default to 'flat'
      updateData.propertyType = updateData.propertyType || existingRequirement.propertyType || 'flat';
    } else if (targetPostType === 'partner') {
      unsetFields.propertyType = '';
      delete updateData.propertyType;
      // Preserve existing valid value if available; if not available, default to 'flatmate'
      updateData.partnerType = updateData.partnerType || existingRequirement.partnerType || 'flatmate';
      if (updateData.propertyDetails !== undefined) {
        const existingDetails = existingRequirement.propertyDetails
          ? (typeof (existingRequirement.propertyDetails as any).toObject === 'function'
              ? (existingRequirement.propertyDetails as any).toObject()
              : existingRequirement.propertyDetails)
          : {};
        updateData.propertyDetails = {
          ...existingDetails,
          ...updateData.propertyDetails,
        };
        if (updateData.propertyDetails.floor !== undefined) {
          updateData.propertyDetails.floor = Number(updateData.propertyDetails.floor);
        }
        if (updateData.propertyDetails.totalFloors !== undefined) {
          updateData.propertyDetails.totalFloors = Number(updateData.propertyDetails.totalFloors);
        }
      }
    }

    // Handle Status and Rejection Reason changes: if already rejected and user makes changes/updates, reset to pending
    if (updateData.status === 'pending' || (existingRequirement.status === 'rejected' && updateData.status !== 'rejected')) {
      updateData.status = 'pending';
      unsetFields.rejectionReason = '';
      delete updateData.rejectionReason;
    } else if (updateData.status === 'approved') {
      const now = new Date();
      if (!existingRequirement.approvedAt) updateData.approvedAt = now;
      if (!existingRequirement.publishedAt) updateData.publishedAt = now;
      unsetFields.rejectionReason = '';
      delete updateData.rejectionReason;
    } else if (updateData.status === 'rejected') {
      if (updateData.rejectionReason) {
        updateData.rejectionReason = updateData.rejectionReason.trim();
      }
    } else if (updateData.rejectionReason === null) {
      unsetFields.rejectionReason = '';
      delete updateData.rejectionReason;
    }

    const parseValidDate = (val: any): Date | undefined => {
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    };

    const availVal = updateData.availableFrom ?? updateData.moveInDate;
    if (availVal !== undefined) {
      const parsed = parseValidDate(availVal);
      if (parsed) {
        updateData.availableFrom = parsed;
      } else {
        delete updateData.availableFrom;
      }
      delete updateData.moveInDate;
    }

    const mongoUpdate: any = { $set: updateData };
    if (Object.keys(unsetFields).length > 0) {
      mongoUpdate.$unset = unsetFields;
    }

    const updatedRequirement = await FlatmateRequirement.findByIdAndUpdate(id, mongoUpdate, {
      new: true,
      runValidators: true,
    });

    // 3: When user updates listing but old status was rejected, make notification only for admin
    if (wasRejected && updatedRequirement?.status === 'pending') {
      notifyAdmins({
        eventType: 'ADMIN_LISTING_AWAITING_MODERATION',
        category: 'ADMINISTRATIVE',
        title: 'Re-submitted Flatmate Requirement Awaiting Review',
        message: `The previously rejected flatmate requirement "${updatedRequirement.title}" has been updated by the owner and re-submitted for moderation.`,
        actionUrl: '/admin/flatmate-requirements',
        data: { listingId: updatedRequirement._id.toString(), listingType: 'flatmate_requirement' },
        priority: 'NORMAL',
      }).catch((err) => logger.warn('[FlatmateRequirementController] Failed to notify admins of re-submitted requirement', err));
    }

    // 2 & 4: When admin updates status via updateFlatmateRequirement, notify user only
    if (isAdmin && updateData.status && updateData.status !== oldStatus) {
      if (updatedRequirement?.status === 'approved') {
        createNotification({
          recipientType: 'USER',
          recipientId: existingRequirement.userId,
          eventType: 'LISTING_APPROVED',
          category: 'LISTING_UPDATES',
          // title: 'Flatmate Requirement Approved!',
          title: 'Listing Approved!',
          message: `Great news! Your flatmate requirement listing "${updatedRequirement.title}" has been approved and is now live on FlatMate.`,
          actionUrl: `/my-listings/${updatedRequirement.slug || updatedRequirement._id}`,
          data: { listingId: updatedRequirement._id.toString(), listingType: 'flatmate_requirement' },
          priority: 'HIGH',
        }).catch((err) => logger.warn('[FlatmateRequirementController] Failed to notify user of approval', err));

        // Trigger automatic matching notifications
        processListingMatches({ listingType: 'flatmate_requirement', listingId: updatedRequirement._id }).catch((err) =>
          logger.warn(`[FlatmateRequirementController] Match processing failed for requirement ${updatedRequirement._id}`, err)
        );
      } else if (updatedRequirement?.status === 'rejected') {
        createNotification({
          recipientType: 'USER',
          recipientId: existingRequirement.userId,
          eventType: 'LISTING_REJECTED',
          category: 'LISTING_UPDATES',
          title: 'Listing Needs Revision',
          message: updateData.rejectionReason
            ? `Your flatmate requirement listing "${updatedRequirement.title}" was not approved. Reason: ${updateData.rejectionReason.trim()}`
            : `Your flatmate requirement listing "${updatedRequirement.title}" was not approved. Please review our guidelines, update your details, and re-submit.`,
          actionUrl: `/my-listings/${updatedRequirement.slug || updatedRequirement._id}`,
          data: { listingId: updatedRequirement._id.toString(), listingType: 'flatmate_requirement', rejectionReason: updateData.rejectionReason },
          priority: 'HIGH',
        }).catch((err) => logger.warn('[FlatmateRequirementController] Failed to notify user of rejection', err));
      } else if (updatedRequirement?.status === 'blocked' || updatedRequirement?.status === 'closed') {
        createNotification({
          recipientType: 'USER',
          recipientId: existingRequirement.userId,
          eventType: 'LISTING_UNPUBLISHED',
          category: 'LISTING_UPDATES',
          title: updatedRequirement.status === 'blocked' ? 'Listing Blocked' : 'Listing Closed',
          message: `Your flatmate requirement listing "${updatedRequirement.title}" has been ${updatedRequirement.status === 'blocked' ? 'blocked by moderation' : 'closed'}.`,
          actionUrl: `/my-listings/${updatedRequirement.slug || updatedRequirement._id}`,
          data: { listingId: updatedRequirement._id.toString(), listingType: 'flatmate_requirement', status: updatedRequirement.status },
          priority: 'NORMAL',
        }).catch((err) => logger.warn('[FlatmateRequirementController] Failed to notify user of status update', err));
      }
    }

    // Clean up previous Location document if location changed and old location is no longer referenced
    if (locationChanged && oldLocationId) {
      await locationService.deleteLocationIfUnreferenced(oldLocationId).catch((err) =>
        logger.error('[FlatmateRequirementController] Old location cleanup error:', err)
      );
    }

    // Trigger asynchronous cleanup of removed media items
    if (removedImageIds.length > 0) {
      cleanupUnreferencedImages(removedImageIds).catch((err) =>
        logger.error('[FlatmateRequirementController] Image cleanup error:', err)
      );
    }
    if (removedVideoIds.length > 0) {
      cleanupUnreferencedVideos(removedVideoIds).catch((err) =>
        logger.error('[FlatmateRequirementController] Video cleanup error:', err)
      );
    }

    const populated = await populateFlatmateRequirementFields(FlatmateRequirement.findById(updatedRequirement!._id)).lean();

    logger.info(`Flatmate requirement updated: ${id}`);
    return sendSuccess(res, 'Flatmate requirement updated successfully', populated);
  } catch (error: any) {
    if (error.code === 11000) {
      return sendError(res, 'A requirement with a duplicate unique key already exists', 409);
    }
    logger.error('[FlatmateRequirementController] update error:', error);
    return sendError(res, error.message || 'Failed to update flatmate requirement', 500);
  }
};

/**
 * 7. Delete Requirement with Cascade Media and Location Cleanup (Owner or Admin)
 */
export const deleteFlatmateRequirement = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id || req.params.postId;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid requirement ID', 400);
    }

    const callerUserId = req.user?._id;
    const isAdmin = Boolean((req as any).admin);

    await flatmateRequirementDeletionService.deleteFlatmateRequirementCascade(id, callerUserId, isAdmin);

    return sendSuccess(res, 'Flatmate requirement deleted successfully');
  } catch (error: any) {
    if (error.message === 'Flatmate requirement not found') {
      return sendError(res, 'Flatmate requirement not found', 404);
    }
    if (error.statusCode === 403 || error.message === 'Not authorized to delete this flatmate requirement') {
      return sendError(res, 'Not authorized to delete this flatmate requirement', 403);
    }
    logger.error('[FlatmateRequirementController] delete error:', error);
    return sendError(res, error.message || 'Failed to delete flatmate requirement', 500);
  }
};

/**
 * 8. Update Requirement Status (Owner or Admin)
 */
export const updateFlatmateRequirementStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id || req.params.postId;
    let { status, rejectionReason } = req.body;

    const validStatuses: PostStatus[] = [
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

    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid requirement ID', 400);
    }

    const existingRequirement = await FlatmateRequirement.findById(id);
    if (!existingRequirement) {
      return sendError(res, 'Flatmate requirement not found', 404);
    }

    const isOwner = req.user && existingRequirement.userId.toString() === req.user._id.toString();
    const isAdmin = Boolean((req as any).admin);

    if (!isOwner && !isAdmin) {
      return sendError(res, 'Not authorized to update status for this requirement', 403);
    }

    existingRequirement.status = status;
    if (status === 'rejected' && rejectionReason) {
      existingRequirement.rejectionReason = rejectionReason.trim();
      existingRequirement.set('approvedAt', undefined);
      existingRequirement.approvedAt = undefined;
      existingRequirement.set('publishedAt', undefined);
      existingRequirement.publishedAt = undefined;
    } else if (status === 'approved') {
      const now = new Date();
      if (!existingRequirement.approvedAt) existingRequirement.approvedAt = now;
      if (!existingRequirement.publishedAt) existingRequirement.publishedAt = now;
      existingRequirement.set('rejectionReason', undefined);
      existingRequirement.rejectionReason = undefined;
    } else if (status === 'pending' || status === 'draft') {
      existingRequirement.set('rejectionReason', undefined);
      existingRequirement.rejectionReason = undefined;
      existingRequirement.set('approvedAt', undefined);
      existingRequirement.approvedAt = undefined;
      existingRequirement.set('publishedAt', undefined);
      existingRequirement.publishedAt = undefined;
    } else {
      existingRequirement.set('rejectionReason', undefined);
      existingRequirement.rejectionReason = undefined;
    }
    await existingRequirement.save();

    // 2 & 4: When admin changes status (like approve or reject, or other like blocked/closed), create notification for user only
    if (status === 'approved') {
      createNotification({
        recipientType: 'USER',
        recipientId: existingRequirement.userId,
        eventType: 'LISTING_APPROVED',
        category: 'LISTING_UPDATES',
        // title: 'Flatmate Requirement Approved!',
        title: 'Listing Approved!',
        message: `Great news! Your flatmate requirement listing "${existingRequirement.title}" has been approved and is now live on FlatMate.`,
        actionUrl: `/my-listings/${existingRequirement.slug || existingRequirement._id}`,
        data: { listingId: existingRequirement._id.toString(), listingType: 'flatmate_requirement' },
        priority: 'HIGH',
      }).catch((err) => logger.warn('[FlatmateRequirementController] Failed to notify user of listing approval', err));

      // Trigger automatic matching notifications
      processListingMatches({ listingType: 'flatmate_requirement', listingId: existingRequirement._id }).catch((err) =>
        logger.warn(`[FlatmateRequirementController] Match processing failed for requirement ${existingRequirement._id}`, err)
      );
    } else if (status === 'rejected') {
      createNotification({
        recipientType: 'USER',
        recipientId: existingRequirement.userId,
        eventType: 'LISTING_REJECTED',
        category: 'LISTING_UPDATES',
        title: 'Listing Needs Revision',
        message: rejectionReason
          ? `Your flatmate requirement listing "${existingRequirement.title}" was not approved. Reason: ${rejectionReason.trim()}`
          : `Your flatmate requirement listing "${existingRequirement.title}" was not approved. Please review our guidelines, update your details, and re-submit.`,
        actionUrl: `/my-listings/${existingRequirement.slug || existingRequirement._id}`,
        data: { listingId: existingRequirement._id.toString(), listingType: 'flatmate_requirement', rejectionReason: rejectionReason?.trim() },
        priority: 'HIGH',
      }).catch((err) => logger.warn('[FlatmateRequirementController] Failed to notify user of listing rejection', err));
    } else if (status === 'blocked' || status === 'closed') {
      createNotification({
        recipientType: 'USER',
        recipientId: existingRequirement.userId,
        eventType: 'LISTING_UNPUBLISHED',
        category: 'LISTING_UPDATES',
        title: status === 'blocked' ? 'Listing Blocked' : 'Listing Closed',
        message: `Your flatmate requirement listing "${existingRequirement.title}" has been ${status === 'blocked' ? 'blocked by moderation' : 'closed'}.`,
        actionUrl: `/my-listings/${existingRequirement.slug || existingRequirement._id}`,
        data: { listingId: existingRequirement._id.toString(), listingType: 'flatmate_requirement', status },
        priority: 'NORMAL',
      }).catch((err) => logger.warn('[FlatmateRequirementController] Failed to notify user of listing status update', err));
    }

    const populated = await populateFlatmateRequirementFields(FlatmateRequirement.findById(existingRequirement._id)).lean();

    logger.info(`Flatmate requirement status updated to ${status} for: ${id}`);
    return sendSuccess(res, `Flatmate requirement status updated to ${status}`, populated);
  } catch (error: any) {
    logger.error('[FlatmateRequirementController] updateStatus error:', error);
    return sendError(res, 'Failed to update requirement status', 500);
  }
};

/**
 * 9. Admin List All Requirements
 */
export const getAdminFlatmateRequirements = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = req.query.order === 'asc' || req.query.order === '1' ? 1 : -1;

    const filter: any = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.postType) {
      filter.postType = req.query.postType;
    }

    if (req.query.propertyType) {
      filter.propertyType = req.query.propertyType;
    }

    if (req.query.partnerType) {
      filter.partnerType = req.query.partnerType;
    }

    const myBhk = req.query.bhk || req.query.bedrooms;
    if (myBhk && myBhk !== 'all') {
      filter['propertyDetails.bedrooms'] = myBhk;
    }

    if (req.query.location && Types.ObjectId.isValid(req.query.location as string)) {
      filter.location = req.query.location;
    }

    if (req.query.userId && Types.ObjectId.isValid(req.query.userId as string)) {
      filter.userId = req.query.userId;
    }

    const searchStr = (req.query.search || req.query.q) as string;
    if (searchStr && searchStr.trim()) {
      const escaped = searchStr.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      populateFlatmateRequirementFields(
        FlatmateRequirement.find(filter)
          .sort({ [sortBy]: order })
          .skip(skip)
          .limit(limit)
      ).lean(),
      FlatmateRequirement.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 'Admin flatmate requirements fetched successfully', {
      items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    logger.error('[FlatmateRequirementController] getAdminFlatmateRequirements error:', error);
    return sendError(res, 'Failed to fetch admin flatmate requirements', 500);
  }
};

/**
 * 10. Attach Image to Requirement
 * POST /api/flatmate-requirements/:id/images
 */
export const addImageToFlatmateRequirement = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id || req.params.postId;
    const { imageId } = req.body;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(imageId)) {
      return sendError(res, 'Invalid requirement ID or image ID', 400);
    }

    const [requirement, image] = await Promise.all([
      FlatmateRequirement.findById(id),
      Image.findById(imageId),
    ]);

    if (!requirement) return sendError(res, 'Flatmate requirement not found', 404);
    if (!image) return sendError(res, 'Image not found', 404);

    const isOwner = req.user && requirement.userId.toString() === req.user._id.toString();
    const isAdmin = Boolean((req as any).admin);
    if (!isOwner && !isAdmin) {
      return sendError(res, 'Not authorized to modify this flatmate requirement', 403);
    }

    if (!requirement.images.includes(image._id)) {
      requirement.images.push(image._id);
      await requirement.save();
    }

    const populated = await populateFlatmateRequirementFields(FlatmateRequirement.findById(requirement._id)).lean();
    return sendSuccess(res, 'Image attached to flatmate requirement successfully', populated);
  } catch (error: any) {
    logger.error('[FlatmateRequirementController] addImageToFlatmateRequirement error:', error);
    return sendError(res, 'Failed to attach image to flatmate requirement', 500);
  }
};

/**
 * 11. Remove Image from Requirement
 * DELETE /api/flatmate-requirements/:id/images/:imageId
 */
export const removeImageFromFlatmateRequirement = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id || req.params.postId;
    const { imageId } = req.params;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(imageId)) {
      return sendError(res, 'Invalid requirement ID or image ID', 400);
    }

    const requirement = await FlatmateRequirement.findById(id);
    if (!requirement) return sendError(res, 'Flatmate requirement not found', 404);

    const isOwner = req.user && requirement.userId.toString() === req.user._id.toString();
    const isAdmin = Boolean((req as any).admin);
    if (!isOwner && !isAdmin) {
      return sendError(res, 'Not authorized to modify this flatmate requirement', 403);
    }

    requirement.images = requirement.images.filter((imgId) => imgId.toString() !== imageId);
    await requirement.save();

    cleanupUnreferencedImages([imageId]).catch((err) =>
      logger.error('[FlatmateRequirementController] Image cleanup error:', err)
    );

    const populated = await populateFlatmateRequirementFields(FlatmateRequirement.findById(requirement._id)).lean();
    return sendSuccess(res, 'Image detached from flatmate requirement successfully', populated);
  } catch (error: any) {
    logger.error('[FlatmateRequirementController] removeImageFromFlatmateRequirement error:', error);
    return sendError(res, 'Failed to remove image from flatmate requirement', 500);
  }
};

/**
 * 12. Attach Video to Requirement
 * POST /api/flatmate-requirements/:id/videos
 */
export const addVideoToFlatmateRequirement = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id || req.params.postId;
    const { videoId } = req.body;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(videoId)) {
      return sendError(res, 'Invalid requirement ID or video ID', 400);
    }

    const [requirement, video] = await Promise.all([
      FlatmateRequirement.findById(id),
      Video.findById(videoId),
    ]);

    if (!requirement) return sendError(res, 'Flatmate requirement not found', 404);
    if (!video) return sendError(res, 'Video not found', 404);

    const isOwner = req.user && requirement.userId.toString() === req.user._id.toString();
    const isAdmin = Boolean((req as any).admin);
    if (!isOwner && !isAdmin) {
      return sendError(res, 'Not authorized to modify this flatmate requirement', 403);
    }

    if (!requirement.videos.includes(video._id)) {
      requirement.videos.push(video._id);
      await requirement.save();
    }

    const populated = await populateFlatmateRequirementFields(FlatmateRequirement.findById(requirement._id)).lean();
    return sendSuccess(res, 'Video attached to flatmate requirement successfully', populated);
  } catch (error: any) {
    logger.error('[FlatmateRequirementController] addVideoToFlatmateRequirement error:', error);
    return sendError(res, 'Failed to attach video to flatmate requirement', 500);
  }
};

/**
 * 13. Remove Video from Requirement
 * DELETE /api/flatmate-requirements/:id/videos/:videoId
 */
export const removeVideoFromFlatmateRequirement = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id || req.params.postId;
    const { videoId } = req.params;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(videoId)) {
      return sendError(res, 'Invalid requirement ID or video ID', 400);
    }

    const requirement = await FlatmateRequirement.findById(id);
    if (!requirement) return sendError(res, 'Flatmate requirement not found', 404);

    const isOwner = req.user && requirement.userId.toString() === req.user._id.toString();
    const isAdmin = Boolean((req as any).admin);
    if (!isOwner && !isAdmin) {
      return sendError(res, 'Not authorized to modify this flatmate requirement', 403);
    }

    requirement.videos = requirement.videos.filter((vidId) => vidId.toString() !== videoId);
    await requirement.save();

    cleanupUnreferencedVideos([videoId]).catch((err) =>
      logger.error('[FlatmateRequirementController] Video cleanup error:', err)
    );

    const populated = await populateFlatmateRequirementFields(FlatmateRequirement.findById(requirement._id)).lean();
    return sendSuccess(res, 'Video detached from flatmate requirement successfully', populated);
  } catch (error: any) {
    logger.error('[FlatmateRequirementController] removeVideoFromFlatmateRequirement error:', error);
    return sendError(res, 'Failed to remove video from flatmate requirement', 500);
  }
};

/**
 * 14. Bulk update flatmate requirement statuses (Admin)
 * PATCH /api/flatmate-requirements/admin/bulk-status
 */
export const bulkUpdateFlatmateRequirementStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const rawIds = req.body.ids || req.body.listingIds;
    const { status, rejectionReason } = req.body;

    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return sendError(res, 'Listing IDs array cannot be empty', 400);
    }

    const validStatuses: PostStatus[] = [
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

    const invalidIds = rawIds.filter((id: any) => typeof id !== 'string' || !Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return sendError(res, 'One or more listing IDs are invalid ObjectIds', 400, { invalidIds });
    }

    const uniqueIds = Array.from(new Set(rawIds as string[]));
    if (uniqueIds.length !== rawIds.length) {
      return sendError(res, 'Listing IDs must not contain duplicate values', 400);
    }

    const objectIds = uniqueIds.map((id) => new Types.ObjectId(id));
    const requirements = await FlatmateRequirement.find({ _id: { $in: objectIds } });

    if (requirements.length === 0) {
      return sendError(res, 'No flatmate requirements found for the provided IDs', 404);
    }

    const requirementMap = new Map<string, IFlatmateRequirement>();
    for (const r of requirements) {
      requirementMap.set(r._id.toString(), r);
    }

    const now = new Date();
    const bulkOps: any[] = [];
    const perListingResults: Array<{
      id: string;
      title?: string;
      status: 'updated' | 'skipped' | 'not_found';
      previousStatus?: string;
      newStatus?: string;
      reason?: string;
    }> = [];

    const updatedRequirementsToNotify: Array<{
      requirement: IFlatmateRequirement;
      oldStatus: string;
    }> = [];

    for (const idStr of uniqueIds) {
      const reqDoc = requirementMap.get(idStr);
      if (!reqDoc) {
        perListingResults.push({
          id: idStr,
          status: 'not_found',
          reason: 'Flatmate requirement not found',
        });
        continue;
      }

      if (reqDoc.status === status) {
        perListingResults.push({
          id: idStr,
          title: reqDoc.title,
          status: 'skipped',
          previousStatus: reqDoc.status,
          newStatus: status,
          reason: `Listing is already ${status}`,
        });
        continue;
      }

      const updateDoc: any = {
        $set: {
          status,
          updatedAt: now,
        },
      };

      if ((FlatmateRequirement.schema.paths as any).updatedBy && (req as any).admin?._id) {
        updateDoc.$set.updatedBy = (req as any).admin._id;
      }

      if (status === 'approved') {
        if (!reqDoc.approvedAt) updateDoc.$set.approvedAt = now;
        if (!reqDoc.publishedAt) updateDoc.$set.publishedAt = now;
        updateDoc.$unset = { rejectionReason: 1 };
      } else if (status === 'rejected') {
        updateDoc.$set.rejectionReason = rejectionReason.trim();
        updateDoc.$unset = {
          approvedAt: 1,
          publishedAt: 1,
        };
      } else if (status === 'pending' || status === 'draft') {
        updateDoc.$unset = {
          rejectionReason: 1,
          approvedAt: 1,
          publishedAt: 1,
        };
      } else {
        updateDoc.$unset = { rejectionReason: 1 };
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: reqDoc._id },
          update: updateDoc,
        },
      });

      updatedRequirementsToNotify.push({
        requirement: reqDoc,
        oldStatus: reqDoc.status,
      });

      perListingResults.push({
        id: idStr,
        title: reqDoc.title,
        status: 'updated',
        previousStatus: reqDoc.status,
        newStatus: status,
      });
    }

    if (bulkOps.length > 0) {
      await FlatmateRequirement.bulkWrite(bulkOps);
    }

    for (const { requirement } of updatedRequirementsToNotify) {
      if (status === 'approved') {
        createNotification({
          recipientType: 'USER',
          recipientId: requirement.userId,
          eventType: 'LISTING_APPROVED',
          category: 'LISTING_UPDATES',
          title: 'Listing Approved!',
          message: `Great news! Your flatmate requirement listing "${requirement.title}" has been approved and is now live on FlatMate.`,
          actionUrl: `/my-listings/${requirement.slug || requirement._id}`,
          data: { listingId: requirement._id.toString(), listingType: 'flatmate_requirement' },
          priority: 'HIGH',
        }).catch((err) =>
          logger.warn(`[FlatmateRequirementController] Failed to notify user of bulk approval for ${requirement._id}`, err)
        );

        // Trigger automatic matching notifications
        processListingMatches({ listingType: 'flatmate_requirement', listingId: requirement._id }).catch((err) =>
          logger.warn(`[FlatmateRequirementController] Match processing failed for bulk approved requirement ${requirement._id}`, err)
        );
      } else if (status === 'rejected') {
        createNotification({
          recipientType: 'USER',
          recipientId: requirement.userId,
          eventType: 'LISTING_REJECTED',
          category: 'LISTING_UPDATES',
          title: 'Listing Needs Revision',
          message: rejectionReason
            ? `Your flatmate requirement listing "${requirement.title}" was not approved. Reason: ${rejectionReason.trim()}`
            : `Your flatmate requirement listing "${requirement.title}" was not approved. Please review our guidelines, update your details, and re-submit.`,
          actionUrl: `/my-listings/${requirement.slug || requirement._id}`,
          data: {
            listingId: requirement._id.toString(),
            listingType: 'flatmate_requirement',
            rejectionReason: rejectionReason?.trim(),
          },
          priority: 'HIGH',
        }).catch((err) =>
          logger.warn(`[FlatmateRequirementController] Failed to notify user of bulk rejection for ${requirement._id}`, err)
        );
      } else if (status === 'blocked' || status === 'closed') {
        createNotification({
          recipientType: 'USER',
          recipientId: requirement.userId,
          eventType: 'LISTING_UNPUBLISHED',
          category: 'LISTING_UPDATES',
          title: status === 'blocked' ? 'Listing Blocked' : 'Listing Closed',
          message: `Your flatmate requirement listing "${requirement.title}" has been ${
            status === 'blocked' ? 'blocked by moderation' : 'closed'
          }.`,
          actionUrl: `/my-listings/${requirement.slug || requirement._id}`,
          data: { listingId: requirement._id.toString(), listingType: 'flatmate_requirement', status },
          priority: 'NORMAL',
        }).catch((err) =>
          logger.warn(`[FlatmateRequirementController] Failed to notify user of bulk status update for ${requirement._id}`, err)
        );
      }
    }

    const updatedCount = bulkOps.length;
    const skippedCount = perListingResults.filter((r) => r.status === 'skipped').length;
    const notFoundCount = perListingResults.filter((r) => r.status === 'not_found').length;

    logger.info(
      `[FlatmateRequirementController] Bulk status update completed: ${updatedCount} updated, ${skippedCount} skipped, ${notFoundCount} not found to ${status}`
    );

    return sendSuccess(
      res,
      `Bulk status update completed. ${updatedCount} flatmate requirement(s) updated to ${status}.`,
      {
        targetStatus: status,
        totalRequested: uniqueIds.length,
        updatedCount,
        skippedCount,
        notFoundCount,
        results: perListingResults,
      }
    );
  } catch (error: any) {
    logger.error('[FlatmateRequirementController] bulkUpdateFlatmateRequirementStatus error:', error);
    return sendError(res, error.message || 'Failed to perform bulk status update on flatmate requirements', 500);
  }
};


