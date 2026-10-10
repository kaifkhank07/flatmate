import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { UserPreference } from '../models/auth/userPreference.model';
import { logger } from '../utils/logger.util';

const SAMPLE_PREFERENCES: Array<{
  name: string;
  image?: string;
}> = [
    // Food Preferences
    { name: 'Vegetarian', image: 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png' },
    { name: 'Non-Vegetarian', image: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png' },
    { name: 'Eggetarian', image: 'https://cdn-icons-png.flaticon.com/512/833/833449.png' },
    { name: 'Vegan', image: 'https://cdn-icons-png.flaticon.com/512/1147/1147802.png' },
    { name: 'Jain Food', image: 'https://cdn-icons-png.flaticon.com/512/2515/2515228.png' },

    // Pet Preferences
    { name: 'Dog Lover', image: 'https://cdn-icons-png.flaticon.com/512/616/616408.png' },
    { name: 'Cat Lover', image: 'https://cdn-icons-png.flaticon.com/512/616/616430.png' },
    { name: 'No Pets Allowed', image: 'https://cdn-icons-png.flaticon.com/512/1581/1581884.png' },
    { name: 'Pet Friendly', image: 'https://cdn-icons-png.flaticon.com/512/1076/1076877.png' },

    // Drink & Lifestyle Preferences
    { name: 'Non-Smoker & Non-Drinker', image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' },
    { name: 'Social Drinker', image: 'https://cdn-icons-png.flaticon.com/512/924/924514.png' },
    { name: 'Teetotaler', image: 'https://cdn-icons-png.flaticon.com/512/2738/2738872.png' },
    { name: 'Occasional Smoking', image: 'https://cdn-icons-png.flaticon.com/512/2933/2933804.png' },
  ];

const seedUserPreferences = async (): Promise<void> => {
  try {
    await connectDB();

    // Sync indexes to ensure unique name index is enforced
    await UserPreference.syncIndexes();

    logger.info('[Seed Script] Seeding user preferences...');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of SAMPLE_PREFERENCES) {
      const escapedName = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await UserPreference.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
      });

      if (existing) {
        skippedCount++;
        logger.info(`[Seed Script] Preference "${item.name}" already exists. Skipping.`);
      } else {
        await UserPreference.create({
          name: item.name,
          image: item.image ? { url: item.image } : undefined,
          isActive: true,
        });
        insertedCount++;
        logger.info(`[Seed Script] Created user preference: ${item.name}`);
      }
    }

    logger.info(`[Seed Script] Completed seeding user preferences. Inserted: ${insertedCount}, Skipped: ${skippedCount}.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('[Seed Script] Error seeding user preferences:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedUserPreferences();

