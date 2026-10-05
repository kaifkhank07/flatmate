import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Property } from '../models/listing/property.model';
import { FlatmateRequirement } from '../models/listing/flatmateRequirements.model';
import { Location } from '../models/listing/location.model';
import { UserProfile } from '../models/auth/userProfile.model';
import { sendSuccess, sendError } from '../utils/response.util';
import { logger } from '../utils/logger.util';

interface SlicedIndexItem {
  id: Types.ObjectId;
  createdAt: Date;
  locationId?: string;
  distance?: number;
  sourceType: 'property' | 'flatmate_requirement';
}

/**
 * Helper: Calculate Haversine distance between two coordinates in km rounded to 2 decimal places
 */
const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 100) / 100;
};

/**
 * Get unified list of public/user listings (Property + FlatmateRequirement)
 * GET /api/listings
 */
export const getListings = async (req: Request, res: Response): Promise<Response> => {
  try {
    const query = req.query;

    // 1. Pagination Parameters
    const page = Math.max(1, parseInt(query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const rawSourceType = (query.sourceType as string) || 'all';
    const sourceType = rawSourceType.toLowerCase();
    const allowedSourceTypes = ['all', 'property', 'flatmate_requirement'];
    if (!allowedSourceTypes.includes(sourceType)) {
      return sendError(res, 'Invalid sourceType parameter. Must be one of: all, property, flatmate_requirement', 400);
    }

    // Default sortBy: 'distance' (nearest first) when geographic search is active, else 'createdAt'
    const requestedSortBy = query.sortBy as string | undefined;
    const requestedOrder = query.order as string | undefined;

    // 2. Base Filters (Only Approved and Non-Expired Public Listings)
    const now = new Date();

    const propertyFilter: any = {
      status: 'approved',
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ],
    };

    const flatmateFilter: any = {
      status: 'approved',
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ],
    };

    // 3. Geographic Search vs. Text & Location ID Search
    let isGeographicSearch = false;
    let targetLat: number | undefined;
    let targetLng: number | undefined;
    let targetPlaceId: string | undefined;
    let searchRadiusKm = 25;

    const paramLat =
      query.latitude !== undefined && query.latitude !== ''
        ? parseFloat(query.latitude as string)
        : query.lat !== undefined && query.lat !== ''
          ? parseFloat(query.lat as string)
          : undefined;

    const paramLng =
      query.longitude !== undefined && query.longitude !== ''
        ? parseFloat(query.longitude as string)
        : query.lng !== undefined && query.lng !== ''
          ? parseFloat(query.lng as string)
          : undefined;

    const paramPlaceId = (query.locationPlaceId || query.placeId) as string;
    const paramRadius =
      query.radius !== undefined && query.radius !== ''
        ? parseFloat(query.radius as string)
        : 25;

    if (paramRadius && !isNaN(paramRadius)) {
      searchRadiusKm = Math.min(200, Math.max(1, paramRadius));
    }

    // A. Prioritize explicit latitude and longitude from search request if valid
    if (
      paramLat !== undefined &&
      paramLng !== undefined &&
      !isNaN(paramLat) &&
      !isNaN(paramLng)
    ) {
      targetLat = paramLat;
      targetLng = paramLng;
      targetPlaceId = paramPlaceId || undefined;
      isGeographicSearch = true;
    } else if (paramPlaceId && paramPlaceId.trim()) {
      // B. Fallback: Resolve coordinates via placeId in DB if placeId supplied without coordinates
      const foundLocation = await Location.findOne({
        placeId: paramPlaceId.trim(),
      }).lean();
      if (
        foundLocation &&
        typeof foundLocation.latitude === 'number' &&
        typeof foundLocation.longitude === 'number'
      ) {
        targetLat = foundLocation.latitude;
        targetLng = foundLocation.longitude;
        targetPlaceId = foundLocation.placeId;
        isGeographicSearch = true;
      }
    }

    const locationDistanceMap = new Map<string, number>();

    if (isGeographicSearch && targetLat !== undefined && targetLng !== undefined) {
      // Query active locations to calculate distance for radius filtering and distance sorting
      const activeLocations = await Location.find(
        { isActive: true },
        { _id: 1, latitude: 1, longitude: 1, geoLocation: 1 }
      ).lean();

      const matchingLocationIds: Types.ObjectId[] = [];

      activeLocations.forEach((loc) => {
        const lat =
          typeof loc.latitude === 'number' && !isNaN(loc.latitude)
            ? loc.latitude
            : loc.geoLocation?.coordinates?.[1];
        const lng =
          typeof loc.longitude === 'number' && !isNaN(loc.longitude)
            ? loc.longitude
            : loc.geoLocation?.coordinates?.[0];

        if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
          const dist = calculateHaversineDistance(
            targetLat!,
            targetLng!,
            lat,
            lng
          );
          locationDistanceMap.set(loc._id.toString(), dist);

          if (dist <= searchRadiusKm) {
            matchingLocationIds.push(loc._id);
          }
        }
      });

      if (matchingLocationIds.length > 0) {
        propertyFilter.location = { $in: matchingLocationIds };
        flatmateFilter.location = { $in: matchingLocationIds };
      } else {
        // Zero locations in radius -> zero listings
        propertyFilter.location = { $in: [] };
        flatmateFilter.location = { $in: [] };
      }
    } else {
      // Non-geographic search: Location ObjectId or Text Search fallback
      const searchStr = (query.q || query.search) as string;
      const locationVal = query.location as string;

      if (locationVal && locationVal !== 'all') {
        if (!Types.ObjectId.isValid(locationVal)) {
          return sendError(res, 'Invalid location ID format', 400);
        }
        const locId = new Types.ObjectId(locationVal);
        propertyFilter.location = locId;
        flatmateFilter.location = locId;
      } else if (searchStr && searchStr.trim()) {
        const escaped = searchStr.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escaped, 'i');

        const matchingLocations = await Location.find(
          {
            $or: [
              { name: searchRegex },
              { formattedAddress: searchRegex },
              { 'address.city': searchRegex },
              { 'address.state': searchRegex },
              { 'address.locality': searchRegex },
              { 'address.subLocality': searchRegex },
            ],
          },
          { _id: 1 }
        ).lean();

        const locationIds = matchingLocations.map((loc) => loc._id);

        if (locationIds.length > 0) {
          propertyFilter.location = { $in: locationIds };
          flatmateFilter.location = { $in: locationIds };
        } else {
          propertyFilter.$and = propertyFilter.$and || [];
          propertyFilter.$and.push({
            $or: [
              { title: searchRegex },
              { description: searchRegex },
              { slug: searchRegex },
            ],
          });

          flatmateFilter.$and = flatmateFilter.$and || [];
          flatmateFilter.$and.push({
            $or: [
              { title: searchRegex },
              { description: searchRegex },
              { slug: searchRegex },
            ],
          });
        }
      }
    }

    // 4. Budget / Rent Filter
    const budgetVal =
      query.budget !== undefined && query.budget !== ''
        ? parseFloat(query.budget as string)
        : undefined;
    if (budgetVal !== undefined && !isNaN(budgetVal)) {
      propertyFilter.rent = budgetVal;
      flatmateFilter.budget = budgetVal;
    }

    // 5. Gender Preference Filter
    const genderPref = query.genderPreference as string;
    if (genderPref && genderPref !== 'all') {
      propertyFilter.genderPreference = { $in: [genderPref, 'any'] };
      flatmateFilter.genderPreference = { $in: [genderPref, 'any'] };
    }

    // 6. Occupation Preference Filter
    const occPref = query.occupationPreference as string;
    if (occPref && occPref !== 'all') {
      propertyFilter.occupationPreference = { $in: [occPref, 'any'] };
      flatmateFilter.occupationPreference = { $in: [occPref, 'any'] };
    }

    // 7. Availability / Move-In Date Filter
    const dateValStr = (query.moveInDate || query.availableFrom) as string;
    if (dateValStr) {
      const dateVal = new Date(dateValStr);
      if (isNaN(dateVal.getTime())) {
        return sendError(
          res,
          'Invalid date format provided for moveInDate / availableFrom',
          400
        );
      }
      propertyFilter.availableFrom = { $gte: dateVal };
      flatmateFilter.moveInDate = { $gte: dateVal };
    }

    // 8. Property-Specific Filters
    if (query.listingType && query.listingType !== 'all') {
      propertyFilter.listingType = query.listingType;
    }
    if (query.furnishing && query.furnishing !== 'all') {
      propertyFilter.furnishing = query.furnishing;
    }

    // 9. FlatmateRequirement-Specific Filters
    if (query.postType) {
      const postTypeStr = (query.postType as string).toLowerCase();
      const allowedPostTypes = ['all', 'property', 'partner'];
      if (!allowedPostTypes.includes(postTypeStr)) {
        return sendError(
          res,
          'Invalid postType parameter. Must be one of: all, property, partner',
          400
        );
      }
      if (postTypeStr !== 'all') {
        flatmateFilter.postType = postTypeStr;
      }
    }
    if (query.propertyType && query.propertyType !== 'all') {
      flatmateFilter.propertyType = query.propertyType;
    }
    if (query.partnerType && query.partnerType !== 'all') {
      flatmateFilter.partnerType = query.partnerType;
    }
    if (query.peopleCount) {
      const count = parseInt(query.peopleCount as string, 10);
      if (!isNaN(count)) {
        flatmateFilter.peopleCount = { $gte: count };
      }
    }

    // 10. Fetch index items (projections of _id, createdAt, location) based on sourceType
    let propertyItems: SlicedIndexItem[] = [];
    let flatmateItems: SlicedIndexItem[] = [];

    const fetchProperties = sourceType === 'all' || sourceType === 'property';
    const fetchFlatmates =
      sourceType === 'all' || sourceType === 'flatmate_requirement';

    const [rawProps, rawFlatmates] = await Promise.all([
      fetchProperties
        ? Property.find(propertyFilter, {
          _id: 1,
          createdAt: 1,
          location: 1,
        }).lean()
        : [],
      fetchFlatmates
        ? FlatmateRequirement.find(flatmateFilter, {
          _id: 1,
          createdAt: 1,
          location: 1,
        }).lean()
        : [],
    ]);

    if (fetchProperties) {
      propertyItems = rawProps.map((p) => {
        const locIdStr = p.location ? p.location.toString() : '';
        const distance =
          isGeographicSearch && locIdStr
            ? locationDistanceMap.get(locIdStr)
            : undefined;
        return {
          id: p._id,
          createdAt: p.createdAt,
          locationId: locIdStr,
          distance,
          sourceType: 'property',
        };
      });
    }

    if (fetchFlatmates) {
      flatmateItems = rawFlatmates.map((f) => {
        const locIdStr = f.location ? f.location.toString() : '';
        const distance =
          isGeographicSearch && locIdStr
            ? locationDistanceMap.get(locIdStr)
            : undefined;
        return {
          id: f._id,
          createdAt: f.createdAt,
          locationId: locIdStr,
          distance,
          sourceType: 'flatmate_requirement',
        };
      });
    }

    // 11. Combine & Sort Index Items
    const combinedIndex = [...propertyItems, ...flatmateItems];

    // Whenever geographic location search is active, ALWAYS sort by nearest distance first (distance asc).
    // When no geographic search is active, sort by requested sortBy or default to createdAt desc.
    const effectiveSortBy = isGeographicSearch ? 'distance' : (requestedSortBy || 'createdAt');
    const orderStr = isGeographicSearch ? 'asc' : (requestedOrder || (effectiveSortBy === 'distance' ? 'asc' : 'desc'));
    const sortOrder = orderStr === 'asc' || orderStr === '1' ? 1 : -1;

    if (effectiveSortBy === 'distance' && isGeographicSearch) {
      combinedIndex.sort((a, b) => {
        const distA = a.distance !== undefined ? a.distance : Number.MAX_VALUE;
        const distB = b.distance !== undefined ? b.distance : Number.MAX_VALUE;
        if (distA !== distB) {
          return sortOrder === -1 ? distB - distA : distA - distB;
        }
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
    } else {
      combinedIndex.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        if (timeA !== timeB) {
          return sortOrder === 1 ? timeA - timeB : timeB - timeA;
        }
        const idA = a.id.toString();
        const idB = b.id.toString();
        return sortOrder === 1 ? idA.localeCompare(idB) : idB.localeCompare(idA);
      });
    }

    const total = combinedIndex.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // 12. Page Slicing & ID Extraction
    const pageIndexItems = combinedIndex.slice(skip, skip + limit);

    const propIdsForPage = pageIndexItems
      .filter((item) => item.sourceType === 'property')
      .map((item) => item.id);
    const flatIdsForPage = pageIndexItems
      .filter((item) => item.sourceType === 'flatmate_requirement')
      .map((item) => item.id);

    // 13. Fetch & Populate Documents for Current Page Only
    const [propDocs, flatDocs] = await Promise.all([
      propIdsForPage.length > 0
        ? Property.find({ _id: { $in: propIdsForPage } })
          .populate(
            'ownerId',
            'email mobile role accountStatus profileVerified isOnline'
          )
          .populate('location')
          .populate('amenities')
          .populate('images')
          .populate('videos')
          .lean()
        : [],
      flatIdsForPage.length > 0
        ? FlatmateRequirement.find({ _id: { $in: flatIdsForPage } })
          .populate(
            'userId',
            'email mobile role accountStatus profileVerified isOnline'
          )
          .populate('location')
          .populate('images')
          .populate('videos')
          .populate('lifestylePreferences')
          .lean()
        : [],
    ]);

    // 14. Populate User Profile Details (Name, Contact, Image/Avatar)
    const userIds = [
      ...propDocs.map((p: any) => p.ownerId?._id || p.ownerId),
      ...flatDocs.map((f: any) => f.userId?._id || f.userId),
    ].filter(Boolean);

    const profiles = userIds.length > 0
      ? await UserProfile.find({ userId: { $in: userIds } }).populate('avatar').lean()
      : [];

    const profileMap = new Map(profiles.map((p: any) => [p.userId.toString(), p]));

    const enrichUserData = (user: any) => {
      if (!user) return user;
      const uId = typeof user === 'object' && user._id ? user._id.toString() : user.toString();
      const profile = profileMap.get(uId);

      const userObj = typeof user === 'object' ? user : { _id: user };
      const firstName = profile?.firstName || '';
      const lastName = profile?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const gender = profile?.gender || (userObj as any).gender || '';
      const imageUrl = profile?.image?.url || (profile?.avatar as any)?.image?.url || null;

      return {
        ...userObj,
        name: fullName || (userObj as any).name || (userObj as any).email || 'User',
        gender: gender || '',
        email: (userObj as any).email || '',
        contact: (userObj as any).mobile || (userObj as any).contact || '',
        mobile: (userObj as any).mobile || (userObj as any).contact || '',
        image: imageUrl,
        avatar: imageUrl,
        profileImage: imageUrl,
      };
    };

    const propMap = new Map(propDocs.map((doc: any) => [doc._id.toString(), doc]));
    const flatMap = new Map(flatDocs.map((doc: any) => [doc._id.toString(), doc]));

    // 15. Re-assemble Final Result Array in Sorted Order with sourceType & distance
    const listings = pageIndexItems
      .map((item) => {
        const idStr = item.id.toString();
        let resultObj: any = null;
        if (item.sourceType === 'property') {
          const doc = propMap.get(idStr);
          if (!doc) return null;
          resultObj = {
            ...doc,
            ownerId: enrichUserData(doc.ownerId),
            sourceType: 'property',
          };
        } else {
          const doc = flatMap.get(idStr);
          if (!doc) return null;
          resultObj = {
            ...doc,
            userId: enrichUserData(doc.userId),
            sourceType: 'flatmate_requirement',
          };
        }

        if (item.distance !== undefined) {
          resultObj.distance = item.distance;
          resultObj.distanceUnit = 'km';
        }

        return resultObj;
      })
      .filter(Boolean);

    const searchLocation = isGeographicSearch
      ? {
        placeId: targetPlaceId,
        latitude: targetLat,
        longitude: targetLng,
        radius: searchRadiusKm,
        name: (query.searchLocationName || query.locationName) as string | undefined,
      }
      : undefined;

    return sendSuccess(res, 'Listings fetched successfully', {
      listings,
      searchLocation,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error: any) {
    logger.error('[ListingController] getListings error:', error);
    return sendError(res, 'Failed to fetch listings', 500);
  }
};

/**
 * Get unified listing details by slug or ID (Property or FlatmateRequirement)
 * GET /api/listings/slug/:slug or GET /api/listings/:slug
 */
export const getListingBySlug = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { slug } = req.params;
    if (!slug || !slug.trim()) {
      return sendError(res, 'Slug parameter is required', 400);
    }

    const trimmedSlug = slug.trim().toLowerCase();

    // Helper to enrich user object with profile name, email, contact & image
    const fetchAndEnrichUser = async (user: any) => {
      if (!user) return user;
      const uId = typeof user === 'object' && user._id ? user._id.toString() : user.toString();
      const profile = await UserProfile.findOne({ userId: uId }).populate('avatar').lean();
      const userObj = typeof user === 'object' ? user : { _id: user };
      const firstName = profile?.firstName || '';
      const lastName = profile?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const gender = profile?.gender || (userObj as any).gender || '';
      const imageUrl = profile?.image?.url || (profile?.avatar as any)?.image?.url || null;

      return {
        ...userObj,
        name: fullName || (userObj as any).name || (userObj as any).email || 'User',
        gender: gender || '',
        email: (userObj as any).email || '',
        contact: (userObj as any).mobile || (userObj as any).contact || '',
        mobile: (userObj as any).mobile || (userObj as any).contact || '',
        image: imageUrl,
        avatar: imageUrl,
        profileImage: imageUrl,
      };
    };

    // 1. Try finding in Property model by slug
    const property = await Property.findOne({ slug: trimmedSlug })
      .populate('ownerId', 'email mobile role accountStatus profileVerified isOnline')
      .populate('location')
      .populate('amenities')
      .populate('images')
      .populate('videos')
      .lean();

    if (property) {
      const enrichedOwner = await fetchAndEnrichUser(property.ownerId);
      return sendSuccess(res, 'Listing details fetched successfully', {
        ...property,
        ownerId: enrichedOwner,
        sourceType: 'property',
      });
    }

    // 2. Try finding in FlatmateRequirement model by slug
    const flatmate = await FlatmateRequirement.findOne({ slug: trimmedSlug })
      .populate('userId', 'email mobile role accountStatus profileVerified isOnline')
      .populate('location')
      .populate('images')
      .populate('videos')
      .populate('lifestylePreferences')
      .lean();

    if (flatmate) {
      const enrichedUser = await fetchAndEnrichUser(flatmate.userId);
      return sendSuccess(res, 'Listing details fetched successfully', {
        ...flatmate,
        userId: enrichedUser,
        sourceType: 'flatmate_requirement',
      });
    }

    // 3. Fallback: If slug is an ObjectId, search by _id
    if (Types.ObjectId.isValid(slug)) {
      const propById = await Property.findById(slug)
        .populate('ownerId', 'email mobile role accountStatus profileVerified isOnline')
        .populate('location')
        .populate('amenities')
        .populate('images')
        .populate('videos')
        .lean();

      if (propById) {
        const enrichedOwner = await fetchAndEnrichUser(propById.ownerId);
        return sendSuccess(res, 'Listing details fetched successfully', {
          ...propById,
          ownerId: enrichedOwner,
          sourceType: 'property',
        });
      }

      const flatById = await FlatmateRequirement.findById(slug)
        .populate('userId', 'email mobile role accountStatus profileVerified isOnline')
        .populate('location')
        .populate('images')
        .populate('videos')
        .populate('lifestylePreferences')
        .lean();

      if (flatById) {
        const enrichedUser = await fetchAndEnrichUser(flatById.userId);
        return sendSuccess(res, 'Listing details fetched successfully', {
          ...flatById,
          userId: enrichedUser,
          sourceType: 'flatmate_requirement',
        });
      }
    }

    return sendError(res, 'Listing not found', 404);
  } catch (error: any) {
    logger.error('[ListingController] getListingBySlug error:', error);
    return sendError(res, 'Failed to fetch listing details', 500);
  }
};


/**
 * Get unified listings owned by the authenticated user
 * GET /api/listings/my-listings
 */
export const getMyListings = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // 1. Get authenticated user
    const authenticatedUser = (req as any).user;

    const userId =
      authenticatedUser?._id ||
      authenticatedUser?.id ||
      authenticatedUser?.userId;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return sendError(res, 'Unauthorized', 401);
    }

    const userObjectId = new Types.ObjectId(userId);

    // 2. Pagination Parameters
    const query = req.query;

    const page = Math.max(
      1,
      parseInt(query.page as string, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, parseInt(query.limit as string, 10) || 10)
    );

    const skip = (page - 1) * limit;

    // 3. Source Type
    const rawSourceType = (query.sourceType as string) || 'all';
    const sourceType = rawSourceType.toLowerCase();

    const allowedSourceTypes = [
      'all',
      'property',
      'flatmate_requirement',
    ];

    if (!allowedSourceTypes.includes(sourceType)) {
      return sendError(
        res,
        'Invalid sourceType parameter. Must be one of: all, property, flatmate_requirement',
        400
      );
    }

    // 4. Status Filter
    const status = ((query.status as string) || 'all').toLowerCase();

    const allowedStatuses = [
      'all',
      'draft',
      'pending',
      'approved',
      'rejected',
      'blocked',
      'closed',
      'expired',
    ];

    if (!allowedStatuses.includes(status)) {
      return sendError(
        res,
        'Invalid status parameter. Must be one of: all, draft, pending, approved, rejected, blocked, closed, expired',
        400
      );
    }

    // 5. Sorting
    // Same sorting options as public listings.
    const requestedSortBy = query.sortBy as string | undefined;
    const requestedOrder = query.order as string | undefined;

    // 6. Base Filters
    // IMPORTANT:
    // Unlike public listings, user's own listings are NOT restricted
    // to approved/non-expired listings.
    const propertyFilter: any = {
      ownerId: userObjectId,
    };

    const flatmateFilter: any = {
      userId: userObjectId,
    };

    // Optional status filter
    if (status !== 'all') {
      propertyFilter.status = status;
      flatmateFilter.status = status;
    }

    // 7. Geographic Search vs. Text & Location ID Search
    let isGeographicSearch = false;

    let targetLat: number | undefined;
    let targetLng: number | undefined;
    let targetPlaceId: string | undefined;

    let searchRadiusKm = 25;

    const paramLat =
      query.latitude !== undefined && query.latitude !== ''
        ? parseFloat(query.latitude as string)
        : query.lat !== undefined && query.lat !== ''
          ? parseFloat(query.lat as string)
          : undefined;

    const paramLng =
      query.longitude !== undefined && query.longitude !== ''
        ? parseFloat(query.longitude as string)
        : query.lng !== undefined && query.lng !== ''
          ? parseFloat(query.lng as string)
          : undefined;

    const paramPlaceId = (query.locationPlaceId ||
      query.placeId) as string;

    const paramRadius =
      query.radius !== undefined && query.radius !== ''
        ? parseFloat(query.radius as string)
        : 25;

    if (paramRadius && !isNaN(paramRadius)) {
      searchRadiusKm = Math.min(
        200,
        Math.max(1, paramRadius)
      );
    }

    // A. Explicit latitude + longitude
    if (
      paramLat !== undefined &&
      paramLng !== undefined &&
      !isNaN(paramLat) &&
      !isNaN(paramLng)
    ) {
      targetLat = paramLat;
      targetLng = paramLng;
      targetPlaceId = paramPlaceId || undefined;
      isGeographicSearch = true;
    }

    // B. Resolve placeId if coordinates are not provided
    else if (
      paramPlaceId &&
      paramPlaceId.trim()
    ) {
      const foundLocation = await Location.findOne({
        placeId: paramPlaceId.trim(),
      }).lean();

      if (
        foundLocation &&
        typeof foundLocation.latitude === 'number' &&
        typeof foundLocation.longitude === 'number'
      ) {
        targetLat = foundLocation.latitude;
        targetLng = foundLocation.longitude;
        targetPlaceId = foundLocation.placeId;
        isGeographicSearch = true;
      }
    }

    const locationDistanceMap = new Map<string, number>();

    if (
      isGeographicSearch &&
      targetLat !== undefined &&
      targetLng !== undefined
    ) {
      // Same location distance logic as public listings
      const activeLocations = await Location.find(
        { isActive: true },
        {
          _id: 1,
          latitude: 1,
          longitude: 1,
          geoLocation: 1,
        }
      ).lean();

      const matchingLocationIds: Types.ObjectId[] = [];

      activeLocations.forEach((loc) => {
        const lat =
          typeof loc.latitude === 'number' &&
            !isNaN(loc.latitude)
            ? loc.latitude
            : loc.geoLocation?.coordinates?.[1];

        const lng =
          typeof loc.longitude === 'number' &&
            !isNaN(loc.longitude)
            ? loc.longitude
            : loc.geoLocation?.coordinates?.[0];

        if (
          lat !== undefined &&
          lng !== undefined &&
          !isNaN(lat) &&
          !isNaN(lng)
        ) {
          const dist = calculateHaversineDistance(
            targetLat!,
            targetLng!,
            lat,
            lng
          );

          locationDistanceMap.set(
            loc._id.toString(),
            dist
          );

          if (dist <= searchRadiusKm) {
            matchingLocationIds.push(loc._id);
          }
        }
      });

      if (matchingLocationIds.length > 0) {
        propertyFilter.location = {
          $in: matchingLocationIds,
        };

        flatmateFilter.location = {
          $in: matchingLocationIds,
        };
      } else {
        propertyFilter.location = {
          $in: [],
        };

        flatmateFilter.location = {
          $in: [],
        };
      }
    } else {
      // Non-geographic search
      const searchStr = (query.q ||
        query.search) as string;

      const locationVal = query.location as string;

      // Location ObjectId
      if (
        locationVal &&
        locationVal !== 'all'
      ) {
        if (!Types.ObjectId.isValid(locationVal)) {
          return sendError(
            res,
            'Invalid location ID format',
            400
          );
        }

        const locId = new Types.ObjectId(
          locationVal
        );

        propertyFilter.location = locId;
        flatmateFilter.location = locId;
      }

      // Text search
      else if (
        searchStr &&
        searchStr.trim()
      ) {
        const escaped = searchStr
          .trim()
          .replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          );

        const searchRegex = new RegExp(
          escaped,
          'i'
        );

        const matchingLocations =
          await Location.find(
            {
              $or: [
                { name: searchRegex },
                {
                  formattedAddress:
                    searchRegex,
                },
                {
                  'address.city':
                    searchRegex,
                },
                {
                  'address.state':
                    searchRegex,
                },
                {
                  'address.locality':
                    searchRegex,
                },
                {
                  'address.subLocality':
                    searchRegex,
                },
              ],
            },
            { _id: 1 }
          ).lean();

        const locationIds =
          matchingLocations.map(
            (loc) => loc._id
          );

        if (locationIds.length > 0) {
          propertyFilter.location = {
            $in: locationIds,
          };

          flatmateFilter.location = {
            $in: locationIds,
          };
        } else {
          propertyFilter.$and =
            propertyFilter.$and || [];

          propertyFilter.$and.push({
            $or: [
              { title: searchRegex },
              { description: searchRegex },
              { slug: searchRegex },
            ],
          });

          flatmateFilter.$and =
            flatmateFilter.$and || [];

          flatmateFilter.$and.push({
            $or: [
              { title: searchRegex },
              { description: searchRegex },
              { slug: searchRegex },
            ],
          });
        }
      }
    }

    // 8. Budget / Rent Filter
    const budgetVal =
      query.budget !== undefined &&
        query.budget !== ''
        ? parseFloat(query.budget as string)
        : undefined;

    if (
      budgetVal !== undefined &&
      !isNaN(budgetVal)
    ) {
      propertyFilter.rent = budgetVal;
      flatmateFilter.budget = budgetVal;
    }

    // 9. Gender Preference Filter
    const genderPref =
      query.genderPreference as string;

    if (
      genderPref &&
      genderPref !== 'all'
    ) {
      propertyFilter.genderPreference = {
        $in: [genderPref, 'any'],
      };

      flatmateFilter.genderPreference = {
        $in: [genderPref, 'any'],
      };
    }

    // 10. Occupation Preference Filter
    const occPref =
      query.occupationPreference as string;

    if (
      occPref &&
      occPref !== 'all'
    ) {
      propertyFilter.occupationPreference = {
        $in: [occPref, 'any'],
      };

      flatmateFilter.occupationPreference = {
        $in: [occPref, 'any'],
      };
    }

    // 11. Availability / Move-In Date Filter
    const dateValStr = (query.moveInDate ||
      query.availableFrom) as string;

    if (dateValStr) {
      const dateVal = new Date(
        dateValStr
      );

      if (isNaN(dateVal.getTime())) {
        return sendError(
          res,
          'Invalid date format provided for moveInDate / availableFrom',
          400
        );
      }

      propertyFilter.availableFrom = {
        $gte: dateVal,
      };

      flatmateFilter.moveInDate = {
        $gte: dateVal,
      };
    }

    // 12. Property-Specific Filters
    if (
      query.listingType &&
      query.listingType !== 'all'
    ) {
      propertyFilter.listingType =
        query.listingType;
    }

    if (
      query.furnishing &&
      query.furnishing !== 'all'
    ) {
      propertyFilter.furnishing =
        query.furnishing;
    }

    // 13. FlatmateRequirement-Specific Filters
    if (query.postType) {
      const postTypeStr =
        (
          query.postType as string
        ).toLowerCase();

      const allowedPostTypes = [
        'all',
        'property',
        'partner',
      ];

      if (
        !allowedPostTypes.includes(
          postTypeStr
        )
      ) {
        return sendError(
          res,
          'Invalid postType parameter. Must be one of: all, property, partner',
          400
        );
      }

      if (
        postTypeStr !== 'all'
      ) {
        flatmateFilter.postType =
          postTypeStr;
      }
    }

    if (
      query.propertyType &&
      query.propertyType !== 'all'
    ) {
      flatmateFilter.propertyType =
        query.propertyType;
    }

    if (
      query.partnerType &&
      query.partnerType !== 'all'
    ) {
      flatmateFilter.partnerType =
        query.partnerType;
    }

    if (query.peopleCount) {
      const count = parseInt(
        query.peopleCount as string,
        10
      );

      if (!isNaN(count)) {
        flatmateFilter.peopleCount = {
          $gte: count,
        };
      }
    }

    // 14. Fetch index items
    let propertyItems: SlicedIndexItem[] =
      [];

    let flatmateItems: SlicedIndexItem[] =
      [];

    const fetchProperties =
      sourceType === 'all' ||
      sourceType === 'property';

    const fetchFlatmates =
      sourceType === 'all' ||
      sourceType ===
      'flatmate_requirement';

    const [
      rawProps,
      rawFlatmates,
    ] = await Promise.all([
      fetchProperties
        ? Property.find(
          propertyFilter,
          {
            _id: 1,
            createdAt: 1,
            location: 1,
          }
        ).lean()
        : [],

      fetchFlatmates
        ? FlatmateRequirement.find(
          flatmateFilter,
          {
            _id: 1,
            createdAt: 1,
            location: 1,
          }
        ).lean()
        : [],
    ]);

    // 15. Create property index items
    if (fetchProperties) {
      propertyItems =
        rawProps.map((p) => {
          const locIdStr = p.location
            ? p.location.toString()
            : '';

          const distance =
            isGeographicSearch &&
              locIdStr
              ? locationDistanceMap.get(
                locIdStr
              )
              : undefined;

          return {
            id: p._id,
            createdAt: p.createdAt,
            locationId: locIdStr,
            distance,
            sourceType:
              'property',
          };
        });
    }

    // 16. Create flatmate index items
    if (fetchFlatmates) {
      flatmateItems =
        rawFlatmates.map((f) => {
          const locIdStr = f.location
            ? f.location.toString()
            : '';

          const distance =
            isGeographicSearch &&
              locIdStr
              ? locationDistanceMap.get(
                locIdStr
              )
              : undefined;

          return {
            id: f._id,
            createdAt: f.createdAt,
            locationId: locIdStr,
            distance,
            sourceType:
              'flatmate_requirement',
          };
        });
    }

    // 17. Combine index items
    const combinedIndex = [
      ...propertyItems,
      ...flatmateItems,
    ];

    // 18. EXACT SAME SORTING AS PUBLIC LISTINGS
    //
    // Geographic search:
    //   distance ASC
    //
    // Non-geographic:
    //   requested sortBy/order
    //   default createdAt DESC
    //
    const effectiveSortBy =
      isGeographicSearch
        ? 'distance'
        : requestedSortBy ||
        'createdAt';

    const orderStr =
      isGeographicSearch
        ? 'asc'
        : requestedOrder ||
        (effectiveSortBy ===
          'distance'
          ? 'asc'
          : 'desc');

    const sortOrder =
      orderStr === 'asc' ||
        orderStr === '1'
        ? 1
        : -1;

    if (
      effectiveSortBy ===
      'distance' &&
      isGeographicSearch
    ) {
      combinedIndex.sort(
        (a, b) => {
          const distA =
            a.distance !== undefined
              ? a.distance
              : Number.MAX_VALUE;

          const distB =
            b.distance !== undefined
              ? b.distance
              : Number.MAX_VALUE;

          if (
            distA !== distB
          ) {
            return sortOrder === -1
              ? distB - distA
              : distA - distB;
          }

          const timeA =
            new Date(
              a.createdAt
            ).getTime();

          const timeB =
            new Date(
              b.createdAt
            ).getTime();

          return (
            timeB - timeA
          );
        }
      );
    } else {
      combinedIndex.sort(
        (a, b) => {
          const timeA =
            new Date(
              a.createdAt
            ).getTime();

          const timeB =
            new Date(
              b.createdAt
            ).getTime();

          if (
            timeA !== timeB
          ) {
            return sortOrder === 1
              ? timeA - timeB
              : timeB - timeA;
          }

          const idA =
            a.id.toString();

          const idB =
            b.id.toString();

          return sortOrder === 1
            ? idA.localeCompare(
              idB
            )
            : idB.localeCompare(
              idA
            );
        }
      );
    }

    // 19. Pagination
    const total =
      combinedIndex.length;

    const totalPages =
      Math.ceil(
        total / limit
      ) || 1;

    const hasNextPage =
      page < totalPages;

    const hasPreviousPage =
      page > 1;

    // 20. Get current page only
    const pageIndexItems =
      combinedIndex.slice(
        skip,
        skip + limit
      );

    const propIdsForPage =
      pageIndexItems
        .filter(
          (item) =>
            item.sourceType ===
            'property'
        )
        .map(
          (item) => item.id
        );

    const flatIdsForPage =
      pageIndexItems
        .filter(
          (item) =>
            item.sourceType ===
            'flatmate_requirement'
        )
        .map(
          (item) => item.id
        );

    // 21. Fetch populated documents for current page
    const [
      propDocs,
      flatDocs,
    ] = await Promise.all([
      propIdsForPage.length > 0
        ? Property.find({
          _id: {
            $in: propIdsForPage,
          },
        })
          .populate(
            'ownerId',
            'email mobile role accountStatus profileVerified isOnline'
          )
          .populate('location')
          .populate('amenities')
          .populate('images')
          .populate('videos')
          .lean()
        : [],

      flatIdsForPage.length > 0
        ? FlatmateRequirement.find({
          _id: {
            $in: flatIdsForPage,
          },
        })
          .populate(
            'userId',
            'email mobile role accountStatus profileVerified isOnline'
          )
          .populate('location')
          .populate('images')
          .populate('videos')
          .populate(
            'lifestylePreferences'
          )
          .lean()
        : [],
    ]);

    // 22. Populate User Profiles
    const userIds = [
      ...propDocs.map(
        (p: any) =>
          p.ownerId?._id ||
          p.ownerId
      ),

      ...flatDocs.map(
        (f: any) =>
          f.userId?._id ||
          f.userId
      ),
    ].filter(Boolean);

    const profiles =
      userIds.length > 0
        ? await UserProfile.find({
          userId: {
            $in: userIds,
          },
        })
          .populate('avatar')
          .lean()
        : [];

    const profileMap =
      new Map(
        profiles.map(
          (p: any) => [
            p.userId.toString(),
            p,
          ]
        )
      );

    // 23. Enrich User Data
    const enrichUserData = (
      user: any
    ) => {
      if (!user) return user;

      const uId =
        typeof user ===
          'object' &&
          user._id
          ? user._id.toString()
          : user.toString();

      const profile =
        profileMap.get(uId);

      const userObj =
        typeof user ===
          'object'
          ? user
          : {
            _id: user,
          };

      const firstName =
        profile?.firstName ||
        '';

      const lastName =
        profile?.lastName ||
        '';

      const fullName =
        `${firstName} ${lastName}`.trim();

      const gender =
        profile?.gender ||
        userObj.gender ||
        '';

      const imageUrl =
        profile?.image?.url ||
        (profile?.avatar as any)?.image?.url ||
        null;

      return {
        ...userObj,

        name:
          fullName ||
          userObj.name ||
          userObj.email ||
          'User',

        gender,

        email:
          userObj.email ||
          '',

        contact:
          userObj.mobile ||
          userObj.contact ||
          '',

        mobile:
          userObj.mobile ||
          userObj.contact ||
          '',

        image: imageUrl,

        avatar: imageUrl,

        profileImage: imageUrl,
      };
    };

    // 24. Create lookup maps
    const propMap =
      new Map(
        propDocs.map(
          (doc: any) => [
            doc._id.toString(),
            doc,
          ]
        )
      );

    const flatMap =
      new Map(
        flatDocs.map(
          (doc: any) => [
            doc._id.toString(),
            doc,
          ]
        )
      );

    // 25. Re-assemble final result in sorted order
    const listings =
      pageIndexItems
        .map((item) => {
          const idStr =
            item.id.toString();

          let resultObj: any =
            null;

          if (
            item.sourceType ===
            'property'
          ) {
            const doc =
              propMap.get(
                idStr
              );

            if (!doc)
              return null;

            resultObj = {
              ...doc,

              ownerId:
                enrichUserData(
                  doc.ownerId
                ),

              sourceType:
                'property',
            };
          } else {
            const doc =
              flatMap.get(
                idStr
              );

            if (!doc)
              return null;

            resultObj = {
              ...doc,

              userId:
                enrichUserData(
                  doc.userId
                ),

              sourceType:
                'flatmate_requirement',
            };
          }

          // Same distance response as public listings
          if (
            item.distance !==
            undefined
          ) {
            resultObj.distance =
              item.distance;

            resultObj.distanceUnit =
              'km';
          }

          return resultObj;
        })
        .filter(Boolean);

    // 26. Same searchLocation response as public listings
    const searchLocation =
      isGeographicSearch
        ? {
          placeId:
            targetPlaceId,

          latitude:
            targetLat,

          longitude:
            targetLng,

          radius:
            searchRadiusKm,

          name:
            (query.searchLocationName ||
              query.locationName) as
            | string
            | undefined,
        }
        : undefined;

    return sendSuccess(
      res,
      'My listings fetched successfully',
      {
        listings,
        searchLocation,

        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      }
    );
  } catch (error: any) {
    logger.error(
      '[ListingController] getMyListings error:',
      error
    );

    return sendError(
      res,
      'Failed to fetch your listings',
      500
    );
  }
};
