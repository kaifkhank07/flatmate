import mongoose from 'mongoose';
import { config } from '../config/env';
import { connectDB } from '../config/db';
import { Admin } from '../models/auth/admin.model';
import { hashPassword } from '../utils/password.util';
import { logger } from '../utils/logger.util';

const seedSuperAdmin = async (): Promise<void> => {
  try {
    const { superAdminName, superAdminEmail, superAdminPassword } = config;

    if (!superAdminEmail || !superAdminPassword) {
      logger.error(
        '[Seed Script] Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in environment variables.'
      );
      process.exit(1);
    }

    await connectDB();

    const existingSuperAdmin = await Admin.findOne({
      $or: [{ email: superAdminEmail.toLowerCase() }, { role: 'super_admin' }],
    });

    if (existingSuperAdmin) {
      logger.info(
        `[Seed Script] Super Admin already exists in Admin model (${existingSuperAdmin.email}). Skipping seed.`
      );
      await mongoose.connection.close();
      process.exit(0);
    }

    const hashedPassword = await hashPassword(superAdminPassword);

    const superAdmin = await Admin.create({
      name: superAdminName || 'Super Admin',
      email: superAdminEmail.toLowerCase(),
      password: hashedPassword,
      role: 'super_admin',
      status: 'active',
    });

    logger.info(`[Seed Script] Super Admin account created successfully in Admin model (${superAdmin.email}).`);

    await mongoose.connection.close();
    logger.info('[Seed Script] Database connection closed.');
    process.exit(0);
  } catch (error) {
    logger.error('[Seed Script] Failed to seed Super Admin:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedSuperAdmin();
