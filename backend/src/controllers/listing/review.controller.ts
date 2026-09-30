import { Request, Response } from 'express';
import { Types } from 'mongoose';
import {
  Review,
  ReviewTargetType,
  ReviewStatus,
  getReviewTargetModelName,
} from '../../models/listing/review.model';
import { User } from '../../models/auth/user.model';
import { Property } from '../../models/listing/property.model';
import { FlatmateRequirement } from '../../models/listing/flatmateRequirements.model';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';

/** Helper to verify if target item exists in database */
const verifyTargetExists = async (
  targetType: string,
  targetId: string
): Promise<boolean> => {
  if (!Types.ObjectId.isValid(targetId)) return false;

  if (targetType === 'user') {
    const exists = await User.exists({ _id: targetId, isDeleted: false });
    return !!exists;
  }
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
 * Create a review for a user, property, or flatmate requirement
 */
export const createReview = async (req: Request, res: Response): Promise<Response> => {
  try {
    const reviewerId = req.user?._id;
    if (!reviewerId) {
      return sendError(res, 'Authentication required', 401);
    }

    const { targetType, targetId, rating, title, comment } = req.body;

    if (!targetType || !targetId || !rating) {
      return sendError(res, 'targetType, targetId, and rating are required', 400);
    }

    if (!['user', 'property', 'flatmaterequirement'].includes(targetType)) {
      return sendError(res, 'Invalid targetType', 400);
    }

    if (!Types.ObjectId.isValid(targetId)) {
      return sendError(res, 'Invalid targetId format', 400);
    }

    // Prevent self-review if target is user
    if (targetType === 'user' && targetId.toString() === reviewerId.toString()) {
      return sendError(res, 'You cannot review yourself', 400);
    }

    // Verify target existence
    const targetExists = await verifyTargetExists(targetType, targetId);
    if (!targetExists) {
      return sendError(
        res,
        `Target ${targetType} not found`,
        404
      );
    }

    // Check for existing duplicate review
    const existingReview = await Review.findOne({
      reviewerId,
      targetType,
      targetId,
    });

    if (existingReview) {
      return sendError(
        res,
        'You have already submitted a review for this target',
        409
      );
    }

    const targetModel = getReviewTargetModelName(targetType);

    const review = await Review.create({
      reviewerId,
      targetType,
      targetModel,
      targetId,
      rating,
      title,
      comment,
      status: 'published',
    });

    logger.info(`User ${reviewerId} submitted a review for ${targetType} ${targetId}`);
    return sendSuccess(res, 'Review submitted successfully', review, 201);
  } catch (error: any) {
    logger.error('[Review] create error:', error);
    return sendError(res, 'Failed to submit review', 500);
  }
};

/**
 * Get paginated list of reviews (Public / Authenticated User / Admin)
 */
export const getReviews = async (req: Request, res: Response): Promise<Response> => {
  try {
    const currentUserId = req.user?._id;
    const isAdmin = !!req.admin?._id;

    const targetType = req.query.targetType as string | undefined;
    const targetId = req.query.targetId as string | undefined;
    const ratingStr = req.query.rating as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit as string) || 20, 1),
      100
    );
    const skip = (page - 1) * limit;

    const query: any = {};

    // Target filters
    if (targetType && ['user', 'property', 'flatmaterequirement'].includes(targetType)) {
      query.targetType = targetType;
    }

    if (targetId && Types.ObjectId.isValid(targetId)) {
      query.targetId = new Types.ObjectId(targetId);
    }

    // Rating filter
    if (ratingStr) {
      const parsedRating = parseInt(ratingStr, 10);
      if (parsedRating >= 1 && parsedRating <= 5) {
        query.rating = parsedRating;
      }
    }

    // Status / Visibility filtering
    if (isAdmin) {
      if (status && ['pending', 'published', 'hidden', 'rejected'].includes(status)) {
        query.status = status;
      }
    } else {
      if (currentUserId) {
        query.$or = [{ status: 'published' }, { reviewerId: currentUserId }];
      } else {
        query.status = 'published';
      }
    }

    // Search filter in title or comment
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchCondition = [
        { title: searchRegex },
        { comment: searchRegex },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchCondition }];
        delete query.$or;
      } else {
        query.$or = searchCondition;
      }
    }

    const total = await Review.countDocuments(query);

    const reviews = await Review.find(query)
      .populate({
        path: 'reviewerId',
        select: 'firstName lastName email mobile image',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit) || 1;

    // Rating aggregation summary if target is specified
    let summary: any = undefined;
    if (targetType && targetId && Types.ObjectId.isValid(targetId)) {
      const stats = await Review.aggregate([
        {
          $match: {
            targetType,
            targetId: new Types.ObjectId(targetId),
            status: 'published',
          },
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalCount: { $sum: 1 },
            star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
            star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          },
        },
      ]);

      if (stats.length > 0) {
        const s = stats[0];
        summary = {
          averageRating: Math.round(s.avgRating * 10) / 10,
          totalReviews: s.totalCount,
          distribution: {
            1: s.star1,
            2: s.star2,
            3: s.star3,
            4: s.star4,
            5: s.star5,
          },
        };
      } else {
        summary = {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }
    }

    return sendSuccess(res, 'Reviews fetched successfully', {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      ...(summary && { summary }),
    });
  } catch (error: any) {
    logger.error('[Review] get error:', error);
    return sendError(res, 'Failed to fetch reviews', 500);
  }
};

/**
 * Get single review details by ID
 */
export const getReviewById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const currentUserId = req.user?._id;
    const isAdmin = !!req.admin?._id;
    const { reviewId } = req.params;

    if (!Types.ObjectId.isValid(reviewId)) {
      return sendError(res, 'Invalid review ID', 400);
    }

    const review = await Review.findById(reviewId)
      .populate({
        path: 'reviewerId',
        select: 'firstName lastName email mobile image',
      })
      .lean();

    if (!review) {
      return sendError(res, 'Review not found', 404);
    }

    // Visibility rules
    if (!isAdmin) {
      const isOwner = currentUserId && review.reviewerId._id.toString() === currentUserId.toString();
      if (review.status !== 'published' && !isOwner) {
        return sendError(res, 'Review not found or not visible', 404);
      }
    }

    // Populate target item details
    let target = null;
    if (review.targetType === 'user') {
      target = await User.findById(review.targetId)
        .select('email mobile role accountStatus profileVerified verificationStatus')
        .lean();
    } else if (review.targetType === 'property') {
      target = await Property.findById(review.targetId)
        .select('title slug location rent status images')
        .populate('location')
        .lean();
    } else if (review.targetType === 'flatmaterequirement') {
      target = await FlatmateRequirement.findById(review.targetId)
        .select('title slug postType propertyType partnerType location budget status')
        .populate('location')
        .lean();
    }

    return sendSuccess(res, 'Review fetched successfully', {
      ...review,
      target,
    });
  } catch (error: any) {
    logger.error('[Review] getById error:', error);
    return sendError(res, 'Failed to fetch review details', 500);
  }
};

/**
 * Update logged-in user's own review
 */
export const updateOwnReview = async (req: Request, res: Response): Promise<Response> => {
  try {
    const reviewerId = req.user?._id;
    if (!reviewerId) {
      return sendError(res, 'Authentication required', 401);
    }

    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;

    if (!Types.ObjectId.isValid(reviewId)) {
      return sendError(res, 'Invalid review ID', 400);
    }

    const review = await Review.findOne({ _id: reviewId, reviewerId });
    if (!review) {
      return sendError(res, 'Review not found or unauthorized to update', 404);
    }

    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;

    await review.save();
    logger.info(`Review ${reviewId} updated by user ${reviewerId}`);
    return sendSuccess(res, 'Review updated successfully', review);
  } catch (error: any) {
    logger.error('[Review] update error:', error);
    return sendError(res, 'Failed to update review', 500);
  }
};

/**
 * Delete logged-in user's own review
 */
export const deleteOwnReview = async (req: Request, res: Response): Promise<Response> => {
  try {
    const reviewerId = req.user?._id;
    if (!reviewerId) {
      return sendError(res, 'Authentication required', 401);
    }

    const { reviewId } = req.params;
    if (!Types.ObjectId.isValid(reviewId)) {
      return sendError(res, 'Invalid review ID', 400);
    }

    const result = await Review.deleteOne({ _id: reviewId, reviewerId });
    if (result.deletedCount === 0) {
      return sendError(res, 'Review not found or unauthorized to delete', 404);
    }

    logger.info(`Review ${reviewId} deleted by user ${reviewerId}`);
    return sendSuccess(res, 'Review deleted successfully');
  } catch (error: any) {
    logger.error('[Review] delete error:', error);
    return sendError(res, 'Failed to delete review', 500);
  }
};

/**
 * Admin: Update review status
 */
export const updateReviewStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;

    if (!Types.ObjectId.isValid(reviewId)) {
      return sendError(res, 'Invalid review ID', 400);
    }

    if (!status || !['pending', 'published', 'hidden', 'rejected'].includes(status)) {
      return sendError(res, 'Invalid review status', 400);
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return sendError(res, 'Review not found', 404);
    }

    review.status = status as ReviewStatus;
    await review.save();

    logger.info(`Review ${reviewId} status updated to ${status} by admin`);
    return sendSuccess(res, 'Review status updated successfully', review);
  } catch (error: any) {
    logger.error('[Review] updateStatus error:', error);
    return sendError(res, 'Failed to update review status', 500);
  }
};

/**
 * Admin: Delete any review
 */
export const deleteReviewAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { reviewId } = req.params;
    if (!Types.ObjectId.isValid(reviewId)) {
      return sendError(res, 'Invalid review ID', 400);
    }

    const result = await Review.deleteOne({ _id: reviewId });
    if (result.deletedCount === 0) {
      return sendError(res, 'Review not found', 404);
    }

    logger.info(`Review ${reviewId} deleted by admin`);
    return sendSuccess(res, 'Review deleted successfully by admin');
  } catch (error: any) {
    logger.error('[Review] deleteAdmin error:', error);
    return sendError(res, 'Failed to delete review', 500);
  }
};
