import { Types, ClientSession } from 'mongoose';
import { Property, IProperty } from '../../models/listing/property.model';
import { Wishlist } from '../../models/listing/wishlist.model';
import { RecentlyViewed } from '../../models/listing/recentlyViewed.model';
import { Review } from '../../models/listing/review.model';
import { Report } from '../../models/listing/report.model';
import { locationService } from '../location/location.service';
import { cleanupUnreferencedImages, cleanupUnreferencedVideos } from '../../utils/mediaCleanup.util';
import { runInTransaction } from '../../utils/transaction.util';
import { logger } from '../../utils/logger.util';

export interface PropertyDeletionResult {
  success: boolean;
  propertyId: string;
  deletedWishlistCount: number;
  deletedRecentlyViewedCount: number;
  deletedReviewCount: number;
  deletedReportCount: number;
}

/**
 * Service to execute safe, atomic cascading deletion for a Property listing.
 * Cleans up exclusively owned dependent records (Wishlists, RecentlyViewed, Reviews, Reports),
 * removes the property, and performs post-commit unreferenced media/location cleanup.
 */
export class PropertyDeletionService {
  /**
   * Delete a property listing with full cascading cleanup.
   *
   * @param propertyId The ObjectId string or Types.ObjectId of the property to delete.
   * @param callerUserId Optional user ID of the caller requesting deletion (for authorization).
   * @param isAdmin Optional boolean indicating if the caller is an authenticated admin.
   */
  public async deletePropertyCascade(
    propertyId: string | Types.ObjectId,
    callerUserId?: string | Types.ObjectId,
    isAdmin: boolean = false
  ): Promise<PropertyDeletionResult> {
    const propIdStr = propertyId.toString();
    if (!Types.ObjectId.isValid(propIdStr)) {
      throw new Error('Invalid property ID format');
    }

    const propObjId = new Types.ObjectId(propIdStr);
    const property = await Property.findById(propObjId);

    if (!property) {
      throw new Error('Property listing not found');
    }

    // Authorization check if caller details are provided
    if (callerUserId && !isAdmin) {
      const callerIdStr = callerUserId.toString();
      const ownerIdStr = property.userId.toString();
      if (callerIdStr !== ownerIdStr) {
        const error: any = new Error('Not authorized to delete this property');
        error.statusCode = 403;
        throw error;
      }
    }

    // Capture media and location references prior to database deletion
    const attachedImages = [...(property.images || [])];
    const attachedVideos = [...(property.videos || [])];
    const attachedLocationId = property.location ? property.location.toString() : null;

    let deletedWishlistCount = 0;
    let deletedRecentlyViewedCount = 0;
    let deletedReviewCount = 0;
    let deletedReportCount = 0;

    // Execute database operations in a managed transaction
    await runInTransaction(async (session: ClientSession | null) => {
      const sessionOption = session ? { session } : {};

      // 1. Delete all Wishlist entries pointing to this property
      const wishlistRes = await Wishlist.deleteMany(
        { targetType: 'property', targetId: propObjId },
        sessionOption
      );
      deletedWishlistCount = wishlistRes.deletedCount || 0;

      // 2. Delete all RecentlyViewed entries pointing to this property
      const rvRes = await RecentlyViewed.deleteMany(
        { targetType: 'property', targetId: propObjId },
        sessionOption
      );
      deletedRecentlyViewedCount = rvRes.deletedCount || 0;

      // 3. Delete all Reviews pointing to this property
      const reviewRes = await Review.deleteMany(
        { targetType: 'property', targetId: propObjId },
        sessionOption
      );
      deletedReviewCount = reviewRes.deletedCount || 0;

      // 4. Delete all Reports submitted against this property
      const reportRes = await Report.deleteMany(
        { targetType: 'property', targetId: propObjId },
        sessionOption
      );
      deletedReportCount = reportRes.deletedCount || 0;

      // 5. Delete the primary Property document
      await Property.deleteOne({ _id: propObjId }, sessionOption);
    });

    logger.info(
      `[PropertyDeletionService] Property ${propIdStr} deleted. Cleaned up: ${deletedWishlistCount} wishlists, ${deletedRecentlyViewedCount} recently viewed, ${deletedReviewCount} reviews, ${deletedReportCount} reports.`
    );

    // Post-commit: Asynchronously clean up media and location documents if no other listings reference them
    if (attachedImages.length > 0) {
      cleanupUnreferencedImages(attachedImages).catch((err) =>
        logger.error(`[PropertyDeletionService] Failed to clean up images for property ${propIdStr}:`, err)
      );
    }

    if (attachedVideos.length > 0) {
      cleanupUnreferencedVideos(attachedVideos).catch((err) =>
        logger.error(`[PropertyDeletionService] Failed to clean up videos for property ${propIdStr}:`, err)
      );
    }

    if (attachedLocationId) {
      locationService.deleteLocationIfUnreferenced(attachedLocationId).catch((err) =>
        logger.error(`[PropertyDeletionService] Failed to clean up location ${attachedLocationId} for property ${propIdStr}:`, err)
      );
    }

    return {
      success: true,
      propertyId: propIdStr,
      deletedWishlistCount,
      deletedRecentlyViewedCount,
      deletedReviewCount,
      deletedReportCount,
    };
  }
}

export const propertyDeletionService = new PropertyDeletionService();
