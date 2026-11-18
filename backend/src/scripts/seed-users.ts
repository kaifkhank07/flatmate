import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../models/auth/user.model';
import { UserProfile } from '../models/auth/userProfile.model';
import { hashPassword } from '../utils/password.util';
import { logger } from '../utils/logger.util';

const seedUsers = async (): Promise<void> => {
  try {
    await connectDB();

    const usersToCreate = [
      { email: 'test1@gmail.com', password: 'test1@123', firstName: 'Test', lastName: 'User 1' },
      { email: 'test2@gmail.com', password: 'test2@123', firstName: 'Test', lastName: 'User 2' },
      { email: 'test3@gmail.com', password: 'test3@123', firstName: 'Test', lastName: 'User 3' },
      { email: 'test4@gmail.com', password: 'test4@123', firstName: 'Test', lastName: 'User 4' },
      { email: 'test5@gmail.com', password: 'test5@123', firstName: 'Test', lastName: 'User 5' },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const u of usersToCreate) {
      const existingUser = await User.findOne({ email: u.email.toLowerCase(), isDeleted: false });

      if (existingUser) {
        logger.info(`[Seed Script] User ${u.email} already exists. Skipping.`);
        skippedCount++;
        continue;
      }

      const hashedPassword = await hashPassword(u.password);

      const user = await User.create({
        email: u.email.toLowerCase(),
        password: hashedPassword,
        userType: 'flatmate',
        accountStatus: 'active',
        emailVerified: true,
        mobileVerified: true,
        profileVerified: true,
      });

      await UserProfile.create({
        userId: user._id,
        firstName: u.firstName,
        lastName: u.lastName,
        profileCompletion: 80,
      });

      logger.info(`[Seed Script] Created user: ${u.email} (Password: ${u.password})`);
      createdCount++;
    }

    logger.info(`[Seed Script] Seeding complete. Created: ${createdCount}, Skipped: ${skippedCount}`);

    await mongoose.connection.close();
    logger.info('[Seed Script] Database connection closed.');
    process.exit(0);
  } catch (error) {
    logger.error('[Seed Script] Failed to seed test users:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedUsers();
