import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Report } from '../models/listing/report.model';
import { Property } from '../models/listing/property.model';
import { FlatmateRequirement } from '../models/listing/flatmateRequirements.model';
import { User } from '../models/auth/user.model';
import { logger } from '../utils/logger.util';

const SAMPLE_REPORTS_DATA = [
  {
    targetType: 'property' as const,
    targetIndex: 0,
    reportCount: 3,
    reason: 'spam' as const,
    status: 'pending' as const,
  },
  {
    targetType: 'property' as const,
    targetIndex: 1,
    reportCount: 2,
    reason: 'fraud' as const,
    status: 'pending' as const,
  },
  {
    targetType: 'property' as const,
    targetIndex: 2,
    reportCount: 1,
    reason: 'misleading' as const,
    status: 'reviewed' as const,
  },
  {
    targetType: 'flatmaterequirement' as const,
    targetIndex: 0,
    reportCount: 3,
    reason: 'fraud' as const,
    status: 'pending' as const,
  },
  {
    targetType: 'flatmaterequirement' as const,
    targetIndex: 1,
    reportCount: 2,
    reason: 'inappropriate' as const,
    status: 'reviewed' as const,
  },
  {
    targetType: 'flatmaterequirement' as const,
    targetIndex: 2,
    reportCount: 1,
    reason: 'misleading' as const,
    status: 'resolved' as const,
  },
];

const seedReports = async (): Promise<void> => {
  try {
    await connectDB();

    logger.info(
      '[Seed Script] Seeding sample reports for properties and flatmate requirements...'
    );

    // 1. Fetch Existing Active Users
    const users = await User.find({ accountStatus: 'active' });

    logger.info(
      `[Seed Script] Found ${users.length} active users.`
    );

    if (users.length < 5) {
      throw new Error(
        `Insufficient active users found. Required at least 5 active users, but found ${users.length}.`
      );
    }

    // 2. Fetch Existing Properties
    const properties = await Property.find({})
      .sort({ createdAt: 1 })
      .limit(3);

    logger.info(
      `[Seed Script] Found ${properties.length} properties.`
    );

    if (properties.length < 3) {
      throw new Error(
        `Insufficient properties found. Required at least 3 properties, but found ${properties.length}.`
      );
    }

    // 3. Fetch Existing Flatmate Requirements
    const flatmateRequirements = await FlatmateRequirement.find({})
      .sort({ createdAt: 1 })
      .limit(3);

    logger.info(
      `[Seed Script] Found ${flatmateRequirements.length} flatmate requirements.`
    );

    if (flatmateRequirements.length < 3) {
      throw new Error(
        `Insufficient flatmate requirements found. Required at least 3 flatmate requirements, but found ${flatmateRequirements.length}.`
      );
    }

    let insertedCount = 0;
    let skippedCount = 0;

    // 4. Create Reports
    for (const data of SAMPLE_REPORTS_DATA) {
      const target =
        data.targetType === 'property'
          ? properties[data.targetIndex]
          : flatmateRequirements[data.targetIndex];

      if (!target) {
        logger.warn(
          `[Seed Script] Target not found for ${data.targetType} index ${data.targetIndex}. Skipping.`
        );
        skippedCount++;
        continue;
      }

      // Check if reports already exist for this target
      const existingReportCount = await Report.countDocuments({
        targetId: target._id,
        targetType: data.targetType,
      });

      if (existingReportCount > 0) {
        skippedCount++;

        logger.info(
          `[Seed Script] Reports already exist for "${target.title || target._id}". Skipping.`
        );

        continue;
      }

      // 5. Create multiple reports for the same target
      for (let i = 0; i < data.reportCount; i++) {
        // Rotate through existing users
        const reporterUser =
          users[
          (insertedCount + i) % users.length
          ];

        await Report.create({
          targetId: target._id,
          targetType: data.targetType,
          userId: reporterUser._id,
          reason: data.reason,
          status: data.status,
          createdAt: new Date(
            Date.now() - i * 60 * 60 * 1000
          ),
          updatedAt: new Date(),
        });

        insertedCount++;

        logger.info(
          `[Seed Script] Created report ${i + 1}/${data.reportCount} for "${target.title || target._id}" | Type: ${data.targetType} | Reporter: ${reporterUser.email || reporterUser.mobile || reporterUser._id}`
        );
      }

      logger.info(
        `[Seed Script] Created ${data.reportCount} reports for "${target.title || target._id}".`
      );
    }

    logger.info(
      `[Seed Script] Completed seeding reports. Inserted: ${insertedCount}, Skipped: ${skippedCount}.`
    );

    await mongoose.connection.close();

    logger.info('[Seed Script] Database connection closed.');

    process.exit(0);
  } catch (error) {
    logger.error(
      '[Seed Script] Error seeding reports:',
      error
    );

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
};

seedReports();