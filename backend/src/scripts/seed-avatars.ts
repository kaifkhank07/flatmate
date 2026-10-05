import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Avatar } from '../models/auth/avatar.model';
import { logger } from '../utils/logger.util';

const SAMPLE_AVATARS = [
  {
    name: 'Cool Guy',
    image: {
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CoolGuy',
      key: 'avatars/seed/cool-guy.svg',
    },
  },
  {
    name: 'Tech Enthusiast',
    image: {
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TechEnthusiast',
      key: 'avatars/seed/tech-enthusiast.svg',
    },
  },
  {
    name: 'Creative Artist',
    image: {
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CreativeArtist',
      key: 'avatars/seed/creative-artist.svg',
    },
  },
  {
    name: 'Fitness Pro',
    image: {
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FitnessPro',
      key: 'avatars/seed/fitness-pro.svg',
    },
  },
  {
    name: 'Friendly Explorer',
    image: {
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FriendlyExplorer',
      key: 'avatars/seed/friendly-explorer.svg',
    },
  },
  {
    name: 'Urban Professional',
    image: {
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=UrbanProfessional',
      key: 'avatars/seed/urban-professional.svg',
    },
  },
];

const seedAvatars = async (): Promise<void> => {
  try {
    await connectDB();

    await Avatar.syncIndexes();

    logger.info('[Seed Script] Seeding avatars...');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of SAMPLE_AVATARS) {
      const escapedName = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await Avatar.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
      });

      if (existing) {
        skippedCount++;
        logger.info(`[Seed Script] Avatar "${item.name}" already exists. Skipping.`);
      } else {
        await Avatar.create({
          name: item.name,
          image: item.image,
          isActive: true,
        });
        insertedCount++;
        logger.info(`[Seed Script] Created avatar: ${item.name}`);
      }
    }

    logger.info(`[Seed Script] Completed seeding avatars. Inserted: ${insertedCount}, Skipped: ${skippedCount}.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('[Seed Script] Error seeding avatars:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedAvatars();
