import { Types, ClientSession } from 'mongoose';
import { Admin } from '../../models/auth/admin.model';
import { AdminSession } from '../../models/auth/adminSession.model';
import { Notification } from '../../models/notification/notification.model';
import { NotificationPreference } from '../../models/notification/notificationPreference.model';
import { runInTransaction } from '../../utils/transaction.util';
import { logger } from '../../utils/logger.util';

export interface AdminHardDeletionResult {
  success: boolean;
  adminId: string;
  deletedSessionsCount: number;
}

/**
 * Service to execute cascading hard deletion for Admin staff accounts.
 * Permanently removes the Admin document, revokes/purges all admin sessions,
 * and cleans up admin notification preferences and notifications.
 */
export class AdminDeletionService {
  /**
   * Permanently hard-delete an Admin staff account.
   *
   * @param adminId The ObjectId string or Types.ObjectId of the admin to delete.
   * @param requesterAdminId Optional ID of the super admin performing the deletion.
   */
  public async hardDeleteAdminCascade(
    adminId: string | Types.ObjectId,
    requesterAdminId?: string | Types.ObjectId
  ): Promise<AdminHardDeletionResult> {
    const adminIdStr = adminId.toString();
    if (!Types.ObjectId.isValid(adminIdStr)) {
      throw new Error('Invalid admin ID format');
    }

    if (requesterAdminId && adminIdStr === requesterAdminId.toString()) {
      const error: any = new Error('Cannot delete your own super admin account');
      error.statusCode = 400;
      throw error;
    }

    const adminObjId = new Types.ObjectId(adminIdStr);
    const adminToDelete = await Admin.findById(adminObjId);

    if (!adminToDelete) {
      const error: any = new Error('Admin account not found');
      error.statusCode = 404;
      throw error;
    }

    // Safety constraint: Prevent deleting the only remaining Super Admin account
    if (adminToDelete.role === 'super_admin') {
      const superAdminCount = await Admin.countDocuments({ role: 'super_admin', isDeleted: false });
      if (superAdminCount <= 1) {
        const error: any = new Error('Cannot delete the only Super Admin account');
        error.statusCode = 400;
        throw error;
      }
    }

    let deletedSessionsCount = 0;

    // Execute atomic hard deletion of admin and dependent records
    await runInTransaction(async (session: ClientSession | null) => {
      const sessionOption = session ? { session } : {};

      const sessionRes = await AdminSession.deleteMany({ adminId: adminObjId }, sessionOption);
      deletedSessionsCount = sessionRes.deletedCount || 0;

      await NotificationPreference.deleteMany({ ownerId: adminObjId, ownerModel: 'Admin' }, sessionOption);
      await Notification.deleteMany({ recipientId: adminObjId, recipientModel: 'Admin' }, sessionOption);

      await Admin.deleteOne({ _id: adminObjId }, sessionOption);
    });

    logger.info(
      `[AdminDeletionService] Admin ${adminIdStr} permanently hard-deleted. Purged ${deletedSessionsCount} sessions.`
    );

    return {
      success: true,
      adminId: adminIdStr,
      deletedSessionsCount,
    };
  }
}

export const adminDeletionService = new AdminDeletionService();
