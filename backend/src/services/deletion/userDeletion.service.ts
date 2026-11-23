import { Types, ClientSession } from 'mongoose';
import { User } from '../../models/auth/user.model';
import { UserProfile } from '../../models/auth/userProfile.model';
import { UserSession } from '../../models/auth/userSession.model';
import { OTP } from '../../models/auth/otp.model';
import { NotificationPreference } from '../../models/notification/notificationPreference.model';
import { Notification } from '../../models/notification/notification.model';
import { Property } from '../../models/listing/property.model';
import { FlatmateRequirement } from '../../models/listing/flatmateRequirements.model';
import { Wishlist } from '../../models/listing/wishlist.model';
import { RecentlyViewed } from '../../models/listing/recentlyViewed.model';
import { ChatBlock } from '../../models/chats/ChatBlock';
import { ChatConversation } from '../../models/chats/ChatConversation';
import { propertyDeletionService } from './propertyDeletion.service';
import { flatmateRequirementDeletionService } from './flatmateRequirementDeletion.service';
import { deleteFile } from '../aws/s3.service';
import { runInTransaction } from '../../utils/transaction.util';
import { logger } from '../../utils/logger.util';

export interface UserSoftDeletionResult {
  success: boolean;
  userId: string;
  closedPropertiesCount: number;
  closedRequirementsCount: number;
  revokedSessionsCount: number;
  deletedWishlistCount: number;
  deletedRecentlyViewedCount: number;
}

export interface UserHardDeletionResult {
  success: boolean;
  userId: string;
  deletedPropertiesCount: number;
  deletedRequirementsCount: number;
  deletedSessionsCount: number;
  deletedProfile: boolean;
}

/**
 * Service to execute cascading user account deletion.
 * Supports both soft deletion (the primary platform standard) and permanent hard deletion (for GDPR/testing).
 */
export class UserDeletionService {
  /**
   * Execute safe, cascading soft-deletion for a User.
   *
   * 1. Marks User as deleted (`isDeleted: true`, `deletedAt`, `deletedBy`, `accountStatus: 'inactive'`).
   * 2. Revokes all active user sessions (`isRevoked: true`).
   * 3. Prevents "Zombie Listings": Transitions all user's Property and FlatmateRequirement listings
   *    to `status: 'closed'` so they immediately disappear from public search results without destructive loss.
   * 4. Purges active OTPs, private Wishlists (decrementing favorite counts), and RecentlyViewed entries.
   * 5. Deactivates 1-on-1 chat conversations.
   *
   * @param userId The ObjectId string or Types.ObjectId of the user.
   * @param deletedBy The ObjectId of the actor performing the deletion (self or admin).
   */
  public async softDeleteUserCascade(
    userId: string | Types.ObjectId,
    deletedBy?: string | Types.ObjectId
  ): Promise<UserSoftDeletionResult> {
    const userIdStr = userId.toString();
    if (!Types.ObjectId.isValid(userIdStr)) {
      throw new Error('Invalid user ID format');
    }

    const userObjId = new Types.ObjectId(userIdStr);
    const user = await User.findById(userObjId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isDeleted) {
      logger.warn(`[UserDeletionService] User ${userIdStr} is already soft-deleted.`);
    }

    const deletedByObjId = deletedBy && Types.ObjectId.isValid(deletedBy.toString())
      ? new Types.ObjectId(deletedBy.toString())
      : userObjId;

    let closedPropertiesCount = 0;
    let closedRequirementsCount = 0;
    let revokedSessionsCount = 0;
    let deletedWishlistCount = 0;
    let deletedRecentlyViewedCount = 0;

    await runInTransaction(async (session: ClientSession | null) => {
      const sessionOption = session ? { session } : {};

      // 1. Mark User document as soft-deleted
      user.isDeleted = true;
      user.accountStatus = 'inactive';
      user.deletedAt = new Date();
      user.deletedBy = deletedByObjId;
      await user.save(sessionOption);

      // 2. Revoke all active sessions
      const sessionRes = await UserSession.updateMany(
        { userId: userObjId, isRevoked: false },
        { isRevoked: true },
        sessionOption
      );
      revokedSessionsCount = sessionRes.modifiedCount || 0;

      // 3. Cascade closure to user's Property listings (Close so they immediately disappear from public search)
      const propRes = await Property.updateMany(
        { userId: userObjId, status: { $in: ['pending', 'approved', 'draft'] } },
        {
          status: 'closed',
          rejectionReason: 'Account closed by user or admin',
        },
        sessionOption
      );
      closedPropertiesCount = propRes.modifiedCount || 0;

      // 4. Cascade closure to user's FlatmateRequirement listings
      const reqRes = await FlatmateRequirement.updateMany(
        { userId: userObjId, status: { $in: ['pending', 'approved', 'draft'] } },
        {
          status: 'closed',
          rejectionReason: 'Account closed by user or admin',
        },
        sessionOption
      );
      closedRequirementsCount = reqRes.modifiedCount || 0;

      // 5. Clean up active OTP codes for this user
      await OTP.deleteMany({ userId: userObjId }, sessionOption);

      // 6. Clean up user's own Wishlist entries and decrement favoriteCount on referenced properties
      const userWishlists = await Wishlist.find({ userId: userObjId }, null, sessionOption);
      for (const item of userWishlists) {
        if (item.targetType === 'property') {
          await Property.updateOne(
            { _id: item.targetId },
            { $inc: { favoriteCount: -1 } },
            sessionOption
          );
        }
      }
      const wishlistRes = await Wishlist.deleteMany({ userId: userObjId }, sessionOption);
      deletedWishlistCount = wishlistRes.deletedCount || 0;

      // 7. Clean up user's RecentlyViewed history
      const rvRes = await RecentlyViewed.deleteMany({ userId: userObjId }, sessionOption);
      deletedRecentlyViewedCount = rvRes.deletedCount || 0;

      // 8. Deactivate ChatConversations where user is a participant
      await ChatConversation.updateMany(
        { participants: userObjId, isActive: true },
        { isActive: false },
        sessionOption
      );
    });

    logger.info(
      `[UserDeletionService] User ${userIdStr} soft-deleted. Closed ${closedPropertiesCount} properties, ${closedRequirementsCount} flatmate posts. Revoked ${revokedSessionsCount} sessions. Deleted ${deletedWishlistCount} wishlists.`
    );

    return {
      success: true,
      userId: userIdStr,
      closedPropertiesCount,
      closedRequirementsCount,
      revokedSessionsCount,
      deletedWishlistCount,
      deletedRecentlyViewedCount,
    };
  }

  /**
   * Execute permanent, cascading hard-deletion for a User.
   * Completely purges the user and cascades hard-deletion across all exclusively owned models:
   * properties, flatmate requirements, profile, sessions, notifications, preferences, and private history.
   *
   * @param userId The ObjectId string or Types.ObjectId of the user.
   */
  public async hardDeleteUserCascade(
    userId: string | Types.ObjectId
  ): Promise<UserHardDeletionResult> {
    const userIdStr = userId.toString();
    if (!Types.ObjectId.isValid(userIdStr)) {
      throw new Error('Invalid user ID format');
    }

    const userObjId = new Types.ObjectId(userIdStr);
    const user = await User.findById(userObjId);

    if (!user) {
      throw new Error('User not found');
    }

    // 1. Delete all properties owned by this user (including media & references)
    const userProperties = await Property.find({ userId: userObjId }).select('_id');
    for (const prop of userProperties) {
      await propertyDeletionService.deletePropertyCascade(prop._id, undefined, true);
    }

    // 2. Delete all flatmate requirements owned by this user (including media & references)
    const userRequirements = await FlatmateRequirement.find({ userId: userObjId }).select('_id');
    for (const req of userRequirements) {
      await flatmateRequirementDeletionService.deleteFlatmateRequirementCascade(req._id, undefined, true);
    }

    // 3. Check for UserProfile custom S3 image
    const userProfile = await UserProfile.findOne({ userId: userObjId });
    const profileImageKey = userProfile?.image?.key || null;

    let deletedSessionsCount = 0;

    // 4. Execute atomic deletion of remaining exclusively owned documents
    await runInTransaction(async (session: ClientSession | null) => {
      const sessionOption = session ? { session } : {};

      await UserProfile.deleteOne({ userId: userObjId }, sessionOption);

      const sessionRes = await UserSession.deleteMany({ userId: userObjId }, sessionOption);
      deletedSessionsCount = sessionRes.deletedCount || 0;

      await OTP.deleteMany({ userId: userObjId }, sessionOption);
      await NotificationPreference.deleteMany({ ownerId: userObjId, ownerModel: 'User' }, sessionOption);
      await Notification.deleteMany({ recipientId: userObjId, recipientModel: 'User' }, sessionOption);
      await Wishlist.deleteMany({ userId: userObjId }, sessionOption);
      await RecentlyViewed.deleteMany({ userId: userObjId }, sessionOption);
      await ChatBlock.deleteMany({ $or: [{ blockerId: userObjId }, { blockedUserId: userObjId }] }, sessionOption);

      await User.deleteOne({ _id: userObjId }, sessionOption);
    });

    // 5. Post-commit: delete S3 profile image if present
    if (profileImageKey) {
      deleteFile(profileImageKey).catch((err) =>
        logger.error(`[UserDeletionService] Failed to delete S3 profile image ${profileImageKey}:`, err)
      );
    }

    logger.info(
      `[UserDeletionService] User ${userIdStr} permanently hard-deleted with ${userProperties.length} properties and ${userRequirements.length} flatmate requirements.`
    );

    return {
      success: true,
      userId: userIdStr,
      deletedPropertiesCount: userProperties.length,
      deletedRequirementsCount: userRequirements.length,
      deletedSessionsCount,
      deletedProfile: !!userProfile,
    };
  }

  /**
   * Restore a soft-deleted user account.
   * Resets soft-deletion flags and reactivates the account.
   * Note: Listings (Property, FlatmateRequirement) intentionally remain in status: 'closed'
   * so obsolete listings are not automatically published without explicit user review.
   *
   * @param userId The ObjectId string or Types.ObjectId of the user.
   */
  public async restoreUserCascade(
    userId: string | Types.ObjectId
  ): Promise<boolean> {
    const userIdStr = userId.toString();
    if (!Types.ObjectId.isValid(userIdStr)) {
      throw new Error('Invalid user ID format');
    }

    const userObjId = new Types.ObjectId(userIdStr);
    const user = await User.findById(userObjId);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isDeleted && user.accountStatus === 'active') {
      logger.info(`[UserDeletionService] User ${userIdStr} is already active.`);
      return true;
    }

    user.isDeleted = false;
    user.accountStatus = 'active';
    user.deletedAt = undefined;
    user.deletedBy = undefined;
    user.deactiveAt = undefined;
    user.deactiveBy = undefined;
    await user.save();

    logger.info(`[UserDeletionService] User ${userIdStr} restored successfully.`);
    return true;
  }
}

export const userDeletionService = new UserDeletionService();
