import { Request, Response } from 'express';
import { Wishlist, WishlistTargetType, getTargetModelName } from '../../models/listing/wishlist.model';
import { Property } from '../../models/listing/property.model';
import { FlatmateRequirement } from '../../models/listing/flatmateRequirements.model';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { Types } from 'mongoose';
import { enrichUserProfilesForListings } from '../../utils/userEnrichment.util';

const ALLOWED_TARGET_TYPES = ['property', 'flatmaterequirement'];

/** Helper to verify if target property or flatmate post exists in database */
const verifyTargetExists = async (targetType: WishlistTargetType, targetId: string): Promise<boolean> => {
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

/** Add a wishlist item (property or flatmate post) for the authenticated user */
export const addWishlist = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) return sendError(res, 'Authentication required', 401);

    const { targetType, targetId } = req.body as { targetType: WishlistTargetType; targetId: string };
    if (!targetType || !targetId) return sendError(res, 'targetType and targetId are required', 400);
    if (!ALLOWED_TARGET_TYPES.includes(targetType)) return sendError(res, 'Invalid targetType', 400);
    if (!Types.ObjectId.isValid(targetId)) return sendError(res, 'Invalid targetId', 400);

    const targetExists = await verifyTargetExists(targetType, targetId);
    if (!targetExists) {
      return sendError(res, `${targetType === 'property' ? 'Property' : 'Flatmate Requirement'} not found`, 404);
    }

    const existing = await Wishlist.findOne({ userId, targetId });
    if (existing) {
      return sendSuccess(res, 'Item already in wishlist', existing);
    }

    const targetModel = getTargetModelName(targetType);
    const item = await Wishlist.create({
      userId,
      targetType,
      targetModel,
      targetId,
    });

    if (targetType === 'property') {
      await Property.findByIdAndUpdate(targetId, { $inc: { favoriteCount: 1 } });
    }

    logger.info(`User ${userId} added ${targetType} ${targetId} to wishlist`);
    return sendSuccess(res, 'Item added to wishlist', item, 201);
  } catch (error: any) {
    if (error.code === 11000) return sendError(res, 'Item already in wishlist', 409);
    logger.error('[Wishlist] add error:', error);
    return sendError(res, 'Failed to add item to wishlist', 500);
  }
};

/** Toggle wishlist status for a listing (property or flatmate post) */
export const toggleWishlist = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) return sendError(res, 'Authentication required', 401);

    const { targetType, targetId } = req.body as { targetType: WishlistTargetType; targetId: string };
    if (!targetType || !targetId) return sendError(res, 'targetType and targetId are required', 400);
    if (!ALLOWED_TARGET_TYPES.includes(targetType)) return sendError(res, 'Invalid targetType', 400);
    if (!Types.ObjectId.isValid(targetId)) return sendError(res, 'Invalid targetId', 400);

    const targetExists = await verifyTargetExists(targetType, targetId);
    if (!targetExists) {
      return sendError(res, `${targetType === 'property' ? 'Property' : 'Flatmate Requirement'} not found`, 404);
    }

    const existing = await Wishlist.findOne({ userId, targetId });

    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });
      if (existing.targetType === 'property') {
        await Property.findByIdAndUpdate(targetId, { $inc: { favoriteCount: -1 } });
      }
      logger.info(`User ${userId} removed ${targetType} ${targetId} from wishlist`);
      return sendSuccess(res, 'Item removed from wishlist', { wishlisted: false });
    } else {
      const targetModel = getTargetModelName(targetType);
      const item = await Wishlist.create({
        userId,
        targetType,
        targetModel,
        targetId,
      });

      if (targetType === 'property') {
        await Property.findByIdAndUpdate(targetId, { $inc: { favoriteCount: 1 } });
      }

      logger.info(`User ${userId} added ${targetType} ${targetId} to wishlist`);
      return sendSuccess(res, 'Item added to wishlist', { wishlisted: true, data: item }, 201);
    }
  } catch (error: any) {
    logger.error('[Wishlist] toggle error:', error);
    return sendError(res, 'Failed to toggle wishlist item', 500);
  }
};

/** Get all wishlist items for the authenticated user */
export const getWishlist = async (req: Request, res: Response): Promise<Response> => {
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
      Wishlist.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Wishlist.countDocuments(query),
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
            .populate('userId', 'email mobile userType accountStatus profileVerified isOnline')
            .populate('location')
            .populate('amenities')
            .populate('images')
            .populate('videos')
            .lean()
        : [],
      flatIds.length > 0
        ? FlatmateRequirement.find({ _id: { $in: flatIds } })
            .populate('userId', 'email mobile userType accountStatus profileVerified isOnline')
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

    // Re-assemble wishlist items with enriched targetId
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

    return sendSuccess(res, 'Wishlist fetched successfully', {
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
    logger.error('[Wishlist] get error:', error);
    return sendError(res, 'Failed to fetch wishlist', 500);
  }
};

/** Check if a listing is wishlisted by the authenticated user */
export const checkWishlistStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) return sendError(res, 'Authentication required', 401);

    const targetType = req.query.targetType as WishlistTargetType;
    const targetId = req.query.targetId as string;

    if (!targetType || !targetId) return sendError(res, 'targetType and targetId query params are required', 400);
    if (!ALLOWED_TARGET_TYPES.includes(targetType)) return sendError(res, 'Invalid targetType', 400);
    if (!Types.ObjectId.isValid(targetId)) return sendError(res, 'Invalid targetId', 400);

    const wishlisted = await Wishlist.findOne({
      userId,
      targetId,
    });

    return sendSuccess(res, 'Wishlist status retrieved', {
      isWishlisted: !!wishlisted,
      wishlistId: wishlisted?._id || null,
    });
  } catch (error) {
    logger.error('[Wishlist] check status error:', error);
    return sendError(res, 'Failed to check wishlist status', 500);
  }
};

/** Delete a wishlist item */
export const deleteWishlist = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) return sendError(res, 'Authentication required', 401);

    const { id } = req.params;
    const targetType = req.query.targetType as WishlistTargetType | undefined;
    const targetId = req.query.targetId as string | undefined;

    let item = null;
    if (id && Types.ObjectId.isValid(id)) {
      item = await Wishlist.findOne({ _id: id, userId });
    } else if (targetId && Types.ObjectId.isValid(targetId)) {
      item = await Wishlist.findOne({
        userId,
        targetId,
      });
    } else {
      return sendError(res, 'Valid ID or targetType & targetId are required', 400);
    }

    if (!item) return sendError(res, 'Wishlist item not found', 404);

    await Wishlist.deleteOne({ _id: item._id });

    if (item.targetType === 'property') {
      await Property.findByIdAndUpdate(item.targetId, { $inc: { favoriteCount: -1 } });
    }

    logger.info(`User ${userId} deleted wishlist item ${item._id}`);
    return sendSuccess(res, 'Item removed from wishlist');
  } catch (error) {
    logger.error('[Wishlist] delete error:', error);
    return sendError(res, 'Failed to delete wishlist item', 500);
  }
};
