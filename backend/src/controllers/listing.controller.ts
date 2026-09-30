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
  sourceType: 'property' | 'flatmate_requirement';
}

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

    const sortBy = (query.sortBy as string) || 'createdAt';
    const orderStr = (query.order as string) || 'desc';
    const sortOrder = orderStr === 'asc' || orderStr === '1' ? 1 : -1;

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

    // 3. Search & Location Filter (Search strictly via Location fields or Title/Description)
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

      // Find matching location IDs from Location model by address, city, state, locality, name
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
        // Search by location text or title/description
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

    // 4. Budget / Rent Filter
    const budgetVal = query.budget !== undefined && query.budget !== '' ? parseFloat(query.budget as string) : undefined;
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
        return sendError(res, 'Invalid date format provided for moveInDate / availableFrom', 400);
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
        return sendError(res, 'Invalid postType parameter. Must be one of: all, property, partner', 400);
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

    // 10. Fetch index items (projections of _id and createdAt) based on sourceType
    let propertyItems: SlicedIndexItem[] = [];
    let flatmateItems: SlicedIndexItem[] = [];

    const fetchProperties = sourceType === 'all' || sourceType === 'property';
    const fetchFlatmates = sourceType === 'all' || sourceType === 'flatmate_requirement';

    const [rawProps, rawFlatmates] = await Promise.all([
      fetchProperties ? Property.find(propertyFilter, { _id: 1, createdAt: 1 }).lean() : [],
      fetchFlatmates ? FlatmateRequirement.find(flatmateFilter, { _id: 1, createdAt: 1 }).lean() : [],
    ]);

    if (fetchProperties) {
      propertyItems = rawProps.map((p) => ({
        id: p._id,
        createdAt: p.createdAt,
        sourceType: 'property',
      }));
    }

    if (fetchFlatmates) {
      flatmateItems = rawFlatmates.map((f) => ({
        id: f._id,
        createdAt: f.createdAt,
        sourceType: 'flatmate_requirement',
      }));
    }

    // 11. Combine & Sort Index Items
    const combinedIndex = [...propertyItems, ...flatmateItems];

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
            .populate('ownerId', 'email mobile role accountStatus profileVerified isOnline')
            .populate('location')
            .populate('amenities')
            .populate('images')
            .populate('videos')
            .lean()
        : [],
      flatIdsForPage.length > 0
        ? FlatmateRequirement.find({ _id: { $in: flatIdsForPage } })
            .populate('userId', 'email mobile role accountStatus profileVerified isOnline')
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
      ? await UserProfile.find({ userId: { $in: userIds } }).lean()
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

      return {
        ...userObj,
        name: fullName || (userObj as any).name || (userObj as any).email || 'User',
        gender: gender || '',
        email: (userObj as any).email || '',
        contact: (userObj as any).mobile || (userObj as any).contact || '',
        mobile: (userObj as any).mobile || (userObj as any).contact || '',
        image: profile?.image?.url || null,
        avatar: profile?.image?.url || null,
        profileImage: profile?.image?.url || null,
      };
    };

    const propMap = new Map(propDocs.map((doc: any) => [doc._id.toString(), doc]));
    const flatMap = new Map(flatDocs.map((doc: any) => [doc._id.toString(), doc]));

    // 15. Re-assemble Final Result Array in Sorted Order with sourceType
    const listings = pageIndexItems
      .map((item) => {
        const idStr = item.id.toString();
        if (item.sourceType === 'property') {
          const doc = propMap.get(idStr);
          if (!doc) return null;
          return {
            ...doc,
            ownerId: enrichUserData(doc.ownerId),
            sourceType: 'property',
          };
        } else {
          const doc = flatMap.get(idStr);
          if (!doc) return null;
          return {
            ...doc,
            userId: enrichUserData(doc.userId),
            sourceType: 'flatmate_requirement',
          };
        }
      })
      .filter(Boolean);

    return sendSuccess(res, 'Listings fetched successfully', {
      listings,
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
      const profile = await UserProfile.findOne({ userId: uId }).lean();
      const userObj = typeof user === 'object' ? user : { _id: user };
      const firstName = profile?.firstName || '';
      const lastName = profile?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const gender = profile?.gender || (userObj as any).gender || '';

      return {
        ...userObj,
        name: fullName || (userObj as any).name || (userObj as any).email || 'User',
        gender: gender || '',
        email: (userObj as any).email || '',
        contact: (userObj as any).mobile || (userObj as any).contact || '',
        mobile: (userObj as any).mobile || (userObj as any).contact || '',
        image: profile?.image?.url || null,
        avatar: profile?.image?.url || null,
        profileImage: profile?.image?.url || null,
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
