import { Types, ClientSession } from 'mongoose';
import { FlatmateRequirement } from '../../models/listing/flatmateRequirements.model';
import { Wishlist } from '../../models/listing/wishlist.model';
import { RecentlyViewed } from '../../models/listing/recentlyViewed.model';
import { Review } from '../../models/listing/review.model';
import { Report } from '../../models/listing/report.model';
import { locationService } from '../location/location.service';
import { cleanupUnreferencedImages, cleanupUnreferencedVideos } from '../../utils/mediaCleanup.util';
import { runInTransaction } from '../../utils/transaction.util';
import { logger } from '../../utils/logger.util';

export interface FlatmateRequirementDeletionResult {
  success: boolean;
  requirementId: string;
  deletedWishlistCount: number;
  deletedRecentlyViewedCount: number;
  deletedReviewCount: number;
  deletedReportCount: number;
}

/**
 * Service to execute safe, atomic cascading deletion for a FlatmateRequirement listing.
 * Cleans up exclusively owned dependent records (Wishlists, RecentlyViewed, Reviews, Reports),
 * removes the requirement listing, and performs post-commit unreferenced media/location cleanup.
 */
export class FlatmateRequirementDeletionService {
  /**
   * Delete a flatmate requirement listing with full cascading cleanup.
   *
   * @param requirementId The ObjectId string or Types.ObjectId of the requirement to delete.
   * @param callerUserId Optional user ID of the caller requesting deletion (for authorization).
   * @param isAdmin Optional boolean indicating if the caller is an authenticated admin.
   */
  public async deleteFlatmateRequirementCascade(
    requirementId: string | Types.ObjectId,
    callerUserId?: string | Types.ObjectId,
    isAdmin: boolean = false
  ): Promise<FlatmateRequirementDeletionResult> {
    const reqIdStr = requirementId.toString();
    if (!Types.ObjectId.isValid(reqIdStr)) {
      throw new Error('Invalid requirement ID format');
    }

    const reqObjId = new Types.ObjectId(reqIdStr);
    const requirement = await FlatmateRequirement.findById(reqObjId);

    if (!requirement) {
      throw new Error('Flatmate requirement not found');
    }

    // Authorization check if caller details are provided
    if (callerUserId && !isAdmin) {
      const callerIdStr = callerUserId.toString();
      const ownerIdStr = requirement.userId.toString();
      if (callerIdStr !== ownerIdStr) {
        const error: any = new Error('Not authorized to delete this flatmate requirement');
        error.statusCode = 403;
        throw error;
      }
    }

    // Capture media and location references prior to database deletion
    const attachedImages = [...(requirement.images || [])];
    const attachedVideos = [...(requirement.videos || [])];
    const attachedLocationId = requirement.location ? requirement.location.toString() : null;

    let deletedWishlistCount = 0;
    let deletedRecentlyViewedCount = 0;
    let deletedReviewCount = 0;
    let deletedReportCount = 0;

    // Execute database operations in a managed transaction
    await runInTransaction(async (session: ClientSession | null) => {
      const sessionOption = session ? { session } : {};

      // 1. Delete all Wishlist entries pointing to this requirement
      const wishlistRes = await Wishlist.deleteMany(
        { targetType: 'flatmaterequirement', targetId: reqObjId },
        sessionOption
      );
      deletedWishlistCount = wishlistRes.deletedCount || 0;

      // 2. Delete all RecentlyViewed entries pointing to this requirement
      const rvRes = await RecentlyViewed.deleteMany(
        { targetType: 'flatmaterequirement', targetId: reqObjId },
        sessionOption
      );
      deletedRecentlyViewedCount = rvRes.deletedCount || 0;

      // 3. Delete all Reviews pointing to this requirement
      const reviewRes = await Review.deleteMany(
        { targetType: 'flatmaterequirement', targetId: reqObjId },
        sessionOption
      );
      deletedReviewCount = reviewRes.deletedCount || 0;

      // 4. Delete all Reports submitted against this requirement
      const reportRes = await Report.deleteMany(
        { targetType: 'flatmaterequirement', targetId: reqObjId },
        sessionOption
      );
      deletedReportCount = reportRes.deletedCount || 0;

      // 5. Delete the primary FlatmateRequirement document
      await FlatmateRequirement.deleteOne({ _id: reqObjId }, sessionOption);
    });

    logger.info(
      `[FlatmateRequirementDeletionService] Requirement ${reqIdStr} deleted. Cleaned up: ${deletedWishlistCount} wishlists, ${deletedRecentlyViewedCount} recently viewed, ${deletedReviewCount} reviews, ${deletedReportCount} reports.`
    );

    // Post-commit: Asynchronously clean up media and location documents if no other listings reference them
    if (attachedImages.length > 0) {
      cleanupUnreferencedImages(attachedImages).catch((err) =>
        logger.error(`[FlatmateRequirementDeletionService] Failed to clean up images for requirement ${reqIdStr}:`, err)
      );
    }

    if (attachedVideos.length > 0) {
      cleanupUnreferencedVideos(attachedVideos).catch((err) =>
        logger.error(`[FlatmateRequirementDeletionService] Failed to clean up videos for requirement ${reqIdStr}:`, err)
      );
    }

    if (attachedLocationId) {
      locationService.deleteLocationIfUnreferenced(attachedLocationId).catch((err) =>
        logger.error(`[FlatmateRequirementDeletionService] Failed to clean up location ${attachedLocationId} for requirement ${reqIdStr}:`, err)
      );
    }

    return {
      success: true,
      requirementId: reqIdStr,
      deletedWishlistCount,
      deletedRecentlyViewedCount,
      deletedReviewCount,
      deletedReportCount,
    };
  }
}

export const flatmateRequirementDeletionService = new FlatmateRequirementDeletionService();
