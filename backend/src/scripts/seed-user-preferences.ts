import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { UserPreference, PreferenceCategory } from '../models/auth/userPreference.model';
import { logger } from '../utils/logger.util';

const SAMPLE_PREFERENCES: Array<{
  name: string;
  category: PreferenceCategory;
  image?: string;
}> = [
    // Food Preferences
    { name: 'Vegetarian', category: 'food', image: 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png' },
    { name: 'Non-Vegetarian', category: 'food', image: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png' },
    { name: 'Eggetarian', category: 'food', image: 'https://cdn-icons-png.flaticon.com/512/833/833449.png' },
    { name: 'Vegan', category: 'food', image: 'https://cdn-icons-png.flaticon.com/512/1147/1147802.png' },
    { name: 'Jain Food', category: 'food', image: 'https://cdn-icons-png.flaticon.com/512/2515/2515228.png' },

    // Pet Preferences
    { name: 'Dog Lover', category: 'pets', image: 'https://cdn-icons-png.flaticon.com/512/616/616408.png' },
    { name: 'Cat Lover', category: 'pets', image: 'https://cdn-icons-png.flaticon.com/512/616/616430.png' },
    { name: 'No Pets Allowed', category: 'pets', image: 'https://cdn-icons-png.flaticon.com/512/1581/1581884.png' },
    { name: 'Pet Friendly', category: 'pets', image: 'https://cdn-icons-png.flaticon.com/512/1076/1076877.png' },

    // Drink & Lifestyle Preferences
    { name: 'Non-Smoker & Non-Drinker', category: 'drink', image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' },
    { name: 'Social Drinker', category: 'drink', image: 'https://cdn-icons-png.flaticon.com/512/924/924514.png' },
    { name: 'Teetotaler', category: 'drink', image: 'https://cdn-icons-png.flaticon.com/512/2738/2738872.png' },
    { name: 'Occasional Smoking', category: 'drink', image: 'https://cdn-icons-png.flaticon.com/512/2933/2933804.png' },
  ];

const seedUserPreferences = async (): Promise<void> => {
  try {
    await connectDB();

    // Sync indexes to ensure category + name unique index is enforced
    await UserPreference.syncIndexes();

    logger.info('[Seed Script] Seeding user preferences...');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of SAMPLE_PREFERENCES) {
      const escapedName = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await UserPreference.findOne({
        category: item.category,
        name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
      });

      if (existing) {
        skippedCount++;
        logger.info(`[Seed Script] Preference "${item.name}" (${item.category}) already exists. Skipping.`);
      } else {
        await UserPreference.create({
          category: item.category,
          name: item.name,
          image: item.image ? { url: item.image } : undefined,
          isActive: true,
        });
        insertedCount++;
        logger.info(`[Seed Script] Created user preference: ${item.name} (${item.category})`);
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
