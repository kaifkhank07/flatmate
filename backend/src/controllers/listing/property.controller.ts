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
import { createNotification, notifyAdmins } from '../../services/notification/notification.service';
import { propertyDeletionService } from '../../services/deletion';
import { processListingMatches } from '../../services/listing/propertyMatch.service';

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
    const userExists = await User.findById(userId)
      .select('_id userType')
      .lean();

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

    const allowedPostedBy = ['owner', 'flatmate', 'agent', 'builder'] as const;

    const postedBy =
      body.postedBy !== undefined
        ? body.postedBy
        : userExists.userType;

    if (!allowedPostedBy.includes(postedBy)) {
      if (locationDoc) await locationService.deleteLocationIfUnreferenced(locationDoc._id);
      return sendError(res, 'Invalid postedBy value', 400);
    }

    const propertyData: Partial<IProperty> = {
      userId,
      title: body.title.trim(),
      slug,
      description: body.description.trim(),
      propertyType: body.propertyType || 'flats_apartments',
      propertyDetails: body.propertyDetails
        ? {
            ...(body.propertyDetails.floor !== undefined && { floor: Number(body.propertyDetails.floor) }),
            ...(body.propertyDetails.totalFloors !== undefined && { totalFloors: Number(body.propertyDetails.totalFloors) }),
            ...(body.propertyDetails.facing && { facing: body.propertyDetails.facing }),
            ...(body.propertyDetails.bedrooms && { bedrooms: body.propertyDetails.bedrooms }),
          }
        : undefined,
      brokerage: body.brokerage !== undefined ? Boolean(body.brokerage) : (body.brokerageDetails ? Boolean(body.brokerageDetails.applicable) : false),
      brokerageDetails: body.brokerageDetails
        ? {
            applicable: Boolean(body.brokerageDetails.applicable),
            ...(body.brokerageDetails.type && { type: body.brokerageDetails.type }),
            ...(body.brokerageDetails.value !== undefined && { value: Number(body.brokerageDetails.value) }),
          }
        : undefined,
      postedBy,
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
      tenantPreference: body.tenantPreference || 'anyone',
      genderPreference: body.genderPreference,
      occupationPreference: body.occupationPreference,
      amenities: amenitiesList,
      houseRules: body.houseRules || [],
      images: imageIds,
      videos: videoIds,
      status: initialStatus,
      rejectionReason: initialStatus === 'rejected' ? body.rejectionReason : undefined,
      ...(initialStatus === 'approved' && { approvedAt: now, publishedAt: now }),
    };

    const property = await Property.create(propertyData);

    // 1: When user creates any listing, create notification for user and admin
    if (initialStatus === 'approved') {
      createNotification({
        recipientType: 'USER',
        recipientId: property.userId,
        eventType: 'LISTING_APPROVED',
        category: 'LISTING_UPDATES',
        title: 'Listing Approved!',
        message: `Your property listing "${property.title}" is approved and live on FlatMate.`,
        actionUrl: `/my-listings/${property.slug || property._id}`,
        data: { listingId: property._id.toString(), listingType: 'property' },
        priority: 'HIGH',
      }).catch((err) => logger.warn('[PropertyController] Failed to notify user of approved listing', err));

      // Trigger automatic property matching notifications
      processListingMatches({ listingType: 'property', listingId: property._id }).catch((err) =>
        logger.warn(`[PropertyController] Match processing failed for property ${property._id}`, err)
      );
    } else {
      createNotification({
        recipientType: 'USER',
        recipientId: property.userId,
        eventType: 'LISTING_SUBMITTED',
        category: 'LISTING_UPDATES',
        title: 'Listing Submitted for Review',
        message: `Your property listing "${property.title}" has been submitted successfully and is awaiting moderation review.`,
        actionUrl: `/my-listings/${property.slug || property._id}`,
        data: { listingId: property._id.toString(), listingType: 'property' },
        priority: 'NORMAL',
      }).catch((err) => logger.warn('[PropertyController] Failed to notify user of listing submission', err));

      notifyAdmins({
        eventType: 'ADMIN_LISTING_AWAITING_MODERATION',
        category: 'ADMINISTRATIVE',
        title: 'New Property Listing Awaiting Review',
        message: `A new property listing "${property.title}" has been submitted and is waiting for review.`,
        actionUrl: '/admin/properties',
        data: { listingId: property._id.toString(), listingType: 'property' },
        priority: 'NORMAL',
      }).catch((err) => logger.warn('[PropertyController] Failed to notify admins of new property', err));
    }

    const populatedProperty = await Property.findById(property._id)
      .populate('userId', 'name email mobile userType accountStatus')
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

    // BHK / bedrooms filter
    const bhk = req.query.bhk || req.query.bedrooms;
    if (bhk && bhk !== 'all') {
      filter['propertyDetails.bedrooms'] = bhk;
    }

    // postedBy filter
    if (req.query.postedBy && req.query.postedBy !== 'all') {
      filter.postedBy = req.query.postedBy;
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

    // Tenant Preference filter
    if (req.query.tenantPreference && req.query.tenantPreference !== 'all') {
      filter.tenantPreference = req.query.tenantPreference;
    }
    if (req.query.brokerage !== undefined) {
      filter.brokerage = String(req.query.brokerage) === 'true';
    }

    // Legacy Gender / Occupation filter fallback
    if (req.query.genderPreference && req.query.genderPreference !== 'all') {
      filter.genderPreference = req.query.genderPreference;
    }
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
        .populate('userId', 'name email mobile userType accountStatus')
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
      .populate('userId', 'name email mobile userType accountStatus profileVerified')
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
      .populate('userId', 'name email mobile userType accountStatus profileVerified')
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
    const oldStatus = property.status;
    const wasRejected = oldStatus === 'rejected';

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
    if (body.propertyType !== undefined) {
      property.propertyType = body.propertyType;
    }
    if (body.propertyDetails !== undefined) {
      const existingDetails = property.propertyDetails
        ? (typeof (property.propertyDetails as any).toObject === 'function'
            ? (property.propertyDetails as any).toObject()
            : property.propertyDetails)
        : {};
      const updatedDetails: any = {
        ...existingDetails,
        ...body.propertyDetails,
      };
      if (body.propertyDetails.floor !== undefined) {
        updatedDetails.floor = Number(body.propertyDetails.floor);
      }
      if (body.propertyDetails.totalFloors !== undefined) {
        updatedDetails.totalFloors = Number(body.propertyDetails.totalFloors);
      }
      property.propertyDetails = updatedDetails;
    }
    if (body.brokerage !== undefined) {
      property.brokerage = Boolean(body.brokerage);
    }
    if (body.brokerageDetails !== undefined) {
      property.brokerageDetails = {
        applicable: Boolean(body.brokerageDetails.applicable),
        ...(body.brokerageDetails.type && { type: body.brokerageDetails.type }),
        ...(body.brokerageDetails.value !== undefined && { value: Number(body.brokerageDetails.value) }),
      };
      if (body.brokerage === undefined) {
        property.brokerage = Boolean(body.brokerageDetails.applicable);
      }
    }
    if (body.tenantPreference !== undefined) {
      property.tenantPreference = body.tenantPreference;
    }
    if (body.postedBy !== undefined) {
      property.postedBy = body.postedBy;
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

    // Status changes: if already rejected and user makes changes/updates, reset status to pending and clear rejectionReason
    if (body.status === 'pending' || (property.status === 'rejected' && body.status !== 'rejected')) {
      property.status = 'pending';
      property.set('rejectionReason', undefined);
      property.rejectionReason = undefined;
    } else if (body.status !== undefined && body.status !== property.status) {
      property.status = body.status;
      if (body.status === 'rejected') {
        property.rejectionReason = body.rejectionReason || property.rejectionReason;
      } else if (body.status === 'approved') {
        const now = new Date();
        if (!property.approvedAt) property.approvedAt = now;
        if (!property.publishedAt) property.publishedAt = now;
        property.set('rejectionReason', undefined);
        property.rejectionReason = undefined;
      } else {
        property.set('rejectionReason', undefined);
        property.rejectionReason = undefined;
      }
    } else if (body.rejectionReason === null) {
      property.set('rejectionReason', undefined);
      property.rejectionReason = undefined;
    }

    await property.save();

    // 3: When user updates listing but old status was rejected, make notification only for admin
    if (wasRejected && property.status === 'pending') {
      notifyAdmins({
        eventType: 'ADMIN_LISTING_AWAITING_MODERATION',
        category: 'ADMINISTRATIVE',
        title: 'Re-submitted Property Listing Awaiting Review',
        message: `The previously rejected property listing "${property.title}" has been updated by the owner and re-submitted for moderation.`,
        actionUrl: '/admin/properties',
        data: { listingId: property._id.toString(), listingType: 'property' },
        priority: 'NORMAL',
      }).catch((err) => logger.warn('[PropertyController] Failed to notify admins of re-submitted property', err));
    }

    // 2 & 4: When admin updates status via updateProperty, create notification for user only
    const isAdmin = Boolean((req as any).admin);
    if (isAdmin && body.status && body.status !== oldStatus) {
      if (property.status === 'approved') {
        createNotification({
          recipientType: 'USER',
          recipientId: property.userId,
          eventType: 'LISTING_APPROVED',
          category: 'LISTING_UPDATES',
          title: 'Listing Approved!',
          message: `Great news! Your property listing "${property.title}" has been approved and is now live on FlatMate.`,
          actionUrl: `/my-listings/${property.slug || property._id}`,
          data: { listingId: property._id.toString(), listingType: 'property' },
          priority: 'HIGH',
        }).catch((err) => logger.warn('[PropertyController] Failed to notify user of listing approval', err));

        // Trigger automatic property matching notifications
        processListingMatches({ listingType: 'property', listingId: property._id }).catch((err) =>
          logger.warn(`[PropertyController] Match processing failed for property ${property._id}`, err)
        );
      } else if (property.status === 'rejected') {
        createNotification({
          recipientType: 'USER',
          recipientId: property.userId,
          eventType: 'LISTING_REJECTED',
          category: 'LISTING_UPDATES',
          title: 'Listing Needs Revision',
          message: property.rejectionReason
            ? `Your property listing "${property.title}" was not approved. Reason: ${property.rejectionReason}`
            : `Your property listing "${property.title}" was not approved. Please review our guidelines, update your details, and re-submit.`,
          actionUrl: `/my-listings/${property.slug || property._id}`,
          data: { listingId: property._id.toString(), listingType: 'property', rejectionReason: property.rejectionReason },
          priority: 'HIGH',
        }).catch((err) => logger.warn('[PropertyController] Failed to notify user of listing rejection', err));
      } else if (property.status === 'blocked' || property.status === 'closed') {
        createNotification({
          recipientType: 'USER',
          recipientId: property.userId,
          eventType: 'LISTING_UNPUBLISHED',
          category: 'LISTING_UPDATES',
          title: property.status === 'blocked' ? 'Listing Blocked' : 'Listing Closed',
          message: `Your property listing "${property.title}" has been ${property.status === 'blocked' ? 'blocked by moderation' : 'closed'}.`,
          actionUrl: `/my-listings/${property.slug || property._id}`,
          data: { listingId: property._id.toString(), listingType: 'property', status: property.status },
          priority: 'NORMAL',
        }).catch((err) => logger.warn('[PropertyController] Failed to notify user of listing unpublished', err));
      }
    }

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
      .populate('userId', 'name email mobile userType accountStatus')
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
 * Delete property listing with cascading cleanup
 * DELETE /api/properties/:propertyId or /api/property/:id
 */
export const deleteProperty = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.propertyId || req.params.id;
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid property ID format', 400);
    }

    const callerUserId = req.user?._id;
    const isAdmin = Boolean((req as any).admin);

    await propertyDeletionService.deletePropertyCascade(id, callerUserId, isAdmin);

    return sendSuccess(res, 'Property deleted successfully');
  } catch (error: any) {
    if (error.message === 'Property listing not found') {
      return sendError(res, 'Property listing not found', 404);
    }
    if (error.statusCode === 403 || error.message === 'Not authorized to delete this property') {
      return sendError(res, 'Not authorized to delete this property', 403);
    }
    logger.error('[PropertyController] deleteProperty error:', error);
    return sendError(res, error.message || 'Failed to delete property', 500);
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
      property.set('approvedAt', undefined);
      property.approvedAt = undefined;
      property.set('publishedAt', undefined);
      property.publishedAt = undefined;
    } else if (status === 'approved') {
      if (!property.approvedAt) property.approvedAt = now;
      if (!property.publishedAt) property.publishedAt = now;
      property.set('rejectionReason', undefined);
      property.rejectionReason = undefined;
    } else if (status === 'pending' || status === 'draft') {
      property.set('rejectionReason', undefined);
      property.rejectionReason = undefined;
      property.set('approvedAt', undefined);
      property.approvedAt = undefined;
      property.set('publishedAt', undefined);
      property.publishedAt = undefined;
    } else {
      property.set('rejectionReason', undefined);
      property.rejectionReason = undefined;
    }

    await property.save();

    // 2 & 4: When admin changes status (like approve or reject, or other like blocked/closed), create notification for user only
    if (status === 'approved') {
      createNotification({
        recipientType: 'USER',
        recipientId: property.userId,
        eventType: 'LISTING_APPROVED',
        category: 'LISTING_UPDATES',
        title: 'Listing Approved!',
        message: `Great news! Your property listing "${property.title}" has been approved and is now live on FlatMate.`,
        actionUrl: `/my-listings/${property.slug || property._id}`,
        data: { listingId: property._id.toString(), listingType: 'property' },
        priority: 'HIGH',
      }).catch((err) => logger.warn('[PropertyController] Failed to notify user of listing approval', err));

      // Trigger automatic property matching notifications
      processListingMatches({ listingType: 'property', listingId: property._id }).catch((err) =>
        logger.warn(`[PropertyController] Match processing failed for property ${property._id}`, err)
      );
    } else if (status === 'rejected') {
      createNotification({
        recipientType: 'USER',
        recipientId: property.userId,
        eventType: 'LISTING_REJECTED',
        category: 'LISTING_UPDATES',
        title: 'Listing Needs Revision',
        message: rejectionReason
          ? `Your property listing "${property.title}" was not approved. Reason: ${rejectionReason.trim()}`
          : `Your property listing "${property.title}" was not approved. Please review our guidelines, update your details, and re-submit.`,
        actionUrl: `/my-listings/${property.slug || property._id}`,
        data: { listingId: property._id.toString(), listingType: 'property', rejectionReason: rejectionReason?.trim() },
        priority: 'HIGH',
      }).catch((err) => logger.warn('[PropertyController] Failed to notify user of listing rejection', err));
    } else if (status === 'blocked' || status === 'closed') {
      createNotification({
        recipientType: 'USER',
        recipientId: property.userId,
        eventType: 'LISTING_UNPUBLISHED',
        category: 'LISTING_UPDATES',
        title: status === 'blocked' ? 'Listing Blocked' : 'Listing Closed',
        message: `Your property listing "${property.title}" has been ${status === 'blocked' ? 'blocked by moderation' : 'closed'}.`,
        actionUrl: `/my-listings/${property.slug || property._id}`,
        data: { listingId: property._id.toString(), listingType: 'property', status },
        priority: 'NORMAL',
      }).catch((err) => logger.warn('[PropertyController] Failed to notify user of listing unpublished', err));
    }

    const updated = await Property.findById(id)
      .populate('userId', 'name email mobile userType')
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

/**
 * Bulk update property listing statuses (Admin)
 * PATCH /api/properties/admin/bulk-status
 */
export const bulkUpdatePropertyStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const rawIds = req.body.ids || req.body.listingIds;
    const { status, rejectionReason } = req.body;

    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return sendError(res, 'Listing IDs array cannot be empty', 400);
    }

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

    const invalidIds = rawIds.filter((id: any) => typeof id !== 'string' || !Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return sendError(res, 'One or more listing IDs are invalid ObjectIds', 400, { invalidIds });
    }

    const uniqueIds = Array.from(new Set(rawIds as string[]));
    if (uniqueIds.length !== rawIds.length) {
      return sendError(res, 'Listing IDs must not contain duplicate values', 400);
    }

    const objectIds = uniqueIds.map((id) => new Types.ObjectId(id));
    const properties = await Property.find({ _id: { $in: objectIds } });

    if (properties.length === 0) {
      return sendError(res, 'No property listings found for the provided IDs', 404);
    }

    const propertyMap = new Map<string, IProperty>();
    for (const p of properties) {
      propertyMap.set(p._id.toString(), p);
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

    const updatedPropertiesToNotify: Array<{
      property: IProperty;
      oldStatus: string;
    }> = [];

    for (const idStr of uniqueIds) {
      const prop = propertyMap.get(idStr);
      if (!prop) {
        perListingResults.push({
          id: idStr,
          status: 'not_found',
          reason: 'Property listing not found',
        });
        continue;
      }

      if (prop.status === status) {
        perListingResults.push({
          id: idStr,
          title: prop.title,
          status: 'skipped',
          previousStatus: prop.status,
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

      if ((Property.schema.paths as any).updatedBy && (req as any).admin?._id) {
        updateDoc.$set.updatedBy = (req as any).admin._id;
      }

      if (status === 'approved') {
        if (!prop.approvedAt) updateDoc.$set.approvedAt = now;
        if (!prop.publishedAt) updateDoc.$set.publishedAt = now;
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
          filter: { _id: prop._id },
          update: updateDoc,
        },
      });

      updatedPropertiesToNotify.push({
        property: prop,
        oldStatus: prop.status,
      });

      perListingResults.push({
        id: idStr,
        title: prop.title,
        status: 'updated',
        previousStatus: prop.status,
        newStatus: status,
      });
    }

    if (bulkOps.length > 0) {
      await Property.bulkWrite(bulkOps);
    }

    for (const { property } of updatedPropertiesToNotify) {
      if (status === 'approved') {
        createNotification({
          recipientType: 'USER',
          recipientId: property.userId,
          eventType: 'LISTING_APPROVED',
          category: 'LISTING_UPDATES',
          title: 'Listing Approved!',
          message: `Great news! Your property listing "${property.title}" has been approved and is now live on FlatMate.`,
          actionUrl: `/my-listings/${property.slug || property._id}`,
          data: { listingId: property._id.toString(), listingType: 'property' },
          priority: 'HIGH',
        }).catch((err) =>
          logger.warn(`[PropertyController] Failed to notify user of bulk approval for ${property._id}`, err)
        );

        // Trigger automatic property matching notifications
        processListingMatches({ listingType: 'property', listingId: property._id }).catch((err) =>
          logger.warn(`[PropertyController] Match processing failed for bulk approved property ${property._id}`, err)
        );
      } else if (status === 'rejected') {
        createNotification({
          recipientType: 'USER',
          recipientId: property.userId,
          eventType: 'LISTING_REJECTED',
          category: 'LISTING_UPDATES',
          title: 'Listing Needs Revision',
          message: rejectionReason
            ? `Your property listing "${property.title}" was not approved. Reason: ${rejectionReason.trim()}`
            : `Your property listing "${property.title}" was not approved. Please review our guidelines, update your details, and re-submit.`,
          actionUrl: `/my-listings/${property.slug || property._id}`,
          data: {
            listingId: property._id.toString(),
            listingType: 'property',
            rejectionReason: rejectionReason?.trim(),
          },
          priority: 'HIGH',
        }).catch((err) =>
          logger.warn(`[PropertyController] Failed to notify user of bulk rejection for ${property._id}`, err)
        );
      } else if (status === 'blocked' || status === 'closed') {
        createNotification({
          recipientType: 'USER',
          recipientId: property.userId,
          eventType: 'LISTING_UNPUBLISHED',
          category: 'LISTING_UPDATES',
          title: status === 'blocked' ? 'Listing Blocked' : 'Listing Closed',
          message: `Your property listing "${property.title}" has been ${
            status === 'blocked' ? 'blocked by moderation' : 'closed'
          }.`,
          actionUrl: `/my-listings/${property.slug || property._id}`,
          data: { listingId: property._id.toString(), listingType: 'property', status },
          priority: 'NORMAL',
        }).catch((err) =>
          logger.warn(`[PropertyController] Failed to notify user of bulk unpublished for ${property._id}`, err)
        );
      }
    }

    const updatedCount = bulkOps.length;
    const skippedCount = perListingResults.filter((r) => r.status === 'skipped').length;
    const notFoundCount = perListingResults.filter((r) => r.status === 'not_found').length;

    logger.info(
      `[PropertyController] Bulk status update completed: ${updatedCount} updated, ${skippedCount} skipped, ${notFoundCount} not found to ${status}`
    );

    return sendSuccess(
      res,
      `Bulk status update completed. ${updatedCount} property listing(s) updated to ${status}.`,
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
    logger.error('[PropertyController] bulkUpdatePropertyStatus error:', error);
    return sendError(res, error.message || 'Failed to perform bulk status update on properties', 500);
  }
};

