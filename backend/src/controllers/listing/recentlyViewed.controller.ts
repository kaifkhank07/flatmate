import { Request, Response } from 'express';
import { RecentlyViewed, RecentlyViewedTargetType, getTargetModelName } from '../../models/listing/recentlyViewed.model';
import { Property } from '../../models/listing/property.model';
import { FlatmateRequirement } from '../../models/listing/flatmateRequirements.model';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { Types } from 'mongoose';
import { enrichUserProfilesForListings } from '../../utils/userEnrichment.util';

/** Helper to verify if target property or flatmate post exists in database */
const ALLOWED_TARGET_TYPES = ['property', 'flatmaterequirement'];

/** Helper to verify if target property or flatmate post exists in database */
const verifyTargetExists = async (targetType: RecentlyViewedTargetType, targetId: string): Promise<boolean> => {
  if (targetType === 'property') {
    const exists = await Property.exists({ _id: targetId });
    return !!exists;
  }
  if (targetType === 'flatmaterequirement') {
    const exists = await FlatmateRequirement.exists({ _id: targetId });
    return !!exists;
  }
  return false;
};

/**
 * Add a listing (property or flatmate post) to the authenticated user's recently viewed list.
 * POST /recently-viewed
 */
export const addRecentlyViewed = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) return sendError(res, 'Authentication required', 401);

    let targetType = req.body.targetType as RecentlyViewedTargetType;
    let targetId = req.body.targetId || req.body.propertyId;

    // Default to 'property' if propertyId was passed for backward compatibility
    if (!targetType && req.body.propertyId) {
      targetType = 'property';
    }

    if (!targetType || !targetId) return sendError(res, 'targetType and targetId are required', 400);
    if (!ALLOWED_TARGET_TYPES.includes(targetType)) return sendError(res, 'Invalid targetType', 400);
    if (!Types.ObjectId.isValid(targetId)) return sendError(res, 'Invalid targetId', 400);

    const targetExists = await verifyTargetExists(targetType, targetId);
    if (!targetExists) {
      return sendError(res, `${targetType === 'property' ? 'Property' : 'Flatmate Requirement'} not found`, 404);
    }

    const targetModel = getTargetModelName(targetType);

    // Upsert ensures a single entry per (user, targetId)
    const viewed = await RecentlyViewed.findOneAndUpdate(
      { userId, targetId },
      { $set: { viewedAt: new Date(), targetType, targetModel } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Increment viewsCount if target is property
    if (targetType === 'property') {
      await Property.findByIdAndUpdate(targetId, { $inc: { viewsCount: 1 } });
    }

    logger.info(`User ${userId} viewed ${targetType} ${targetId}`);
    return sendSuccess(res, 'Recently viewed recorded', viewed);
  } catch (error) {
    logger.error('[RecentlyViewed] add error:', error);
    return sendError(res, 'Failed to add recently viewed', 500);
  }
};

/**
 * Get paginated recently viewed listings for the authenticated user.
 * GET /recently-viewed
 */
export const getRecentlyViewed = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) return sendError(res, 'Authentication required', 401);

    const rawTargetType = (req.query.targetType || req.query.sourceType) as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const query: any = { userId };
    if (rawTargetType) {
      const normalized = rawTargetType.toLowerCase();
      if (normalized === 'property') {
        query.targetType = 'property';
      } else if (normalized === 'flatmaterequirement' || normalized === 'flatmate_requirement') {
        query.targetType = 'flatmaterequirement';
      }
    }

    const [rawItems, total] = await Promise.all([
      RecentlyViewed.find(query)
        .sort({ viewedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RecentlyViewed.countDocuments(query),
    ]);

    const propIds = rawItems
      .filter((i: any) => i.targetType === 'property' && i.targetId)
      .map((i: any) => i.targetId);
    const flatIds = rawItems
      .filter((i: any) => i.targetType === 'flatmaterequirement' && i.targetId)
      .map((i: any) => i.targetId);

    const [propDocsRaw, flatDocsRaw] = await Promise.all([
      propIds.length > 0
        ? Property.find({ _id: { $in: propIds } })
            .populate('userId', 'email mobile role accountStatus profileVerified isOnline')
            .populate('location')
            .populate('amenities')
            .populate('images')
            .populate('videos')
            .lean()
        : [],
      flatIds.length > 0
        ? FlatmateRequirement.find({ _id: { $in: flatIds } })
            .populate('userId', 'email mobile role accountStatus profileVerified isOnline')
            .populate('location')
            .populate('images')
            .populate('videos')
            .populate('userPreferences')
            .populate('amenities')
            .lean()
        : [],
    ]);

    // Add sourceType flag for profile enrichment
    const propDocsEnriched = await enrichUserProfilesForListings(
      propDocsRaw.map((doc: any) => ({ ...doc, sourceType: 'property' }))
    );
    const flatDocsEnriched = await enrichUserProfilesForListings(
      flatDocsRaw.map((doc: any) => ({ ...doc, sourceType: 'flatmate_requirement' }))
    );

    const propMap = new Map(propDocsEnriched.map((doc: any) => [doc._id.toString(), doc]));
    const flatMap = new Map(flatDocsEnriched.map((doc: any) => [doc._id.toString(), doc]));

    // Re-assemble recently viewed items with enriched targetId
    const items = rawItems
      .map((item: any) => {
        const idStr = item.targetId?.toString();
        const targetDoc = item.targetType === 'property' ? propMap.get(idStr) : flatMap.get(idStr);
        if (!targetDoc) return null;
        return {
          ...item,
          targetId: targetDoc,
        };
      })
      .filter(Boolean);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Recently viewed fetched', {
      items,
      total,
      page,
      limit,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    logger.error('[RecentlyViewed] get error:', error);
    return sendError(res, 'Failed to fetch recently viewed', 500);
  }
};

/**
 * Delete a recently viewed entry.
 * DELETE /recently-viewed/:id or DELETE /recently-viewed/by-target
 */
export const deleteRecentlyViewed = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) return sendError(res, 'Authentication required', 401);

    const { id } = req.params;
    const targetType = req.query.targetType as RecentlyViewedTargetType | undefined;
    const targetId = req.query.targetId as string | undefined;

    let result = null;
    if (id && Types.ObjectId.isValid(id)) {
      result = await RecentlyViewed.deleteOne({ _id: id, userId });
    } else if (targetId && Types.ObjectId.isValid(targetId)) {
      result = await RecentlyViewed.deleteOne({ userId, targetId });
    } else {
      return sendError(res, 'Valid ID or targetType & targetId are required', 400);
    }

    if (!result || result.deletedCount === 0) {
      return sendError(res, 'Recently viewed entry not found', 404);
    }

    return sendSuccess(res, 'Recently viewed entry deleted');
  } catch (error) {
    logger.error('[RecentlyViewed] delete error:', error);
    return sendError(res, 'Failed to delete recently viewed', 500);
  }
};

/**
 * Clear all recently viewed history for the authenticated user.
 * DELETE /recently-viewed/clear
 */
export const clearRecentlyViewed = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) return sendError(res, 'Authentication required', 401);

    await RecentlyViewed.deleteMany({ userId });
    logger.info(`User ${userId} cleared recently viewed history`);

    return sendSuccess(res, 'Recently viewed history cleared');
  } catch (error) {
    logger.error('[RecentlyViewed] clear error:', error);
    return sendError(res, 'Failed to clear recently viewed history', 500);
  }
};
