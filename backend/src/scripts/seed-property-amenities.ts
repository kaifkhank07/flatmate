import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { PropertyAmenity, AmenityCategory } from '../models/listing/propertyAmenity.model';
import { logger } from '../utils/logger.util';

const SAMPLE_AMENITIES: Array<{
  name: string;
  category: AmenityCategory;
  image?: string;
}> = [
    { name: 'High-Speed WiFi', category: 'basic', image: 'https://cdn-icons-png.flaticon.com/512/93/93158.png' },
    { name: 'Air Conditioner', category: 'basic', image: 'https://cdn-icons-png.flaticon.com/512/900/900782.png' },
    { name: 'Lift / Elevator', category: 'basic', image: 'https://cdn-icons-png.flaticon.com/512/2833/2833630.png' },
    { name: 'Television (TV)', category: 'basic', image: 'https://cdn-icons-png.flaticon.com/512/440/440560.png' },
    { name: '24/7 Security Guard', category: 'security', image: 'https://cdn-icons-png.flaticon.com/512/1067/1067357.png' },
    { name: 'CCTV Surveillance', category: 'security', image: 'https://cdn-icons-png.flaticon.com/512/709/709612.png' },
    { name: 'Covered Car Parking', category: 'parking', image: 'https://cdn-icons-png.flaticon.com/512/2833/2833315.png' },
    { name: 'Two-Wheeler Parking', category: 'parking', image: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png' },
    { name: 'Fully Equipped Gym', category: 'fitness', image: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png' },
    { name: 'Swimming Pool', category: 'fitness', image: 'https://cdn-icons-png.flaticon.com/512/3144/3144862.png' },
    { name: 'Clubhouse & Garden', category: 'recreation', image: 'https://cdn-icons-png.flaticon.com/512/619/619034.png' },
    { name: '24/7 Power Backup', category: 'utilities', image: 'https://cdn-icons-png.flaticon.com/512/2983/2983794.png' },
  ];

const seedPropertyAmenities = async (): Promise<void> => {
  try {
    await connectDB();

    // Drop stale legacy slug index if it exists in MongoDB
    try {
      await PropertyAmenity.collection.dropIndex('slug_1');
      logger.info('[Seed Script] Dropped legacy slug_1 index from MongoDB.');
    } catch {
      // Ignore if index does not exist
    }

    await PropertyAmenity.syncIndexes();

    logger.info('[Seed Script] Seeding property amenities...');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of SAMPLE_AMENITIES) {
      const escapedName = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await PropertyAmenity.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
      });

      if (existing) {
        skippedCount++;
        logger.info(`[Seed Script] Amenity "${item.name}" already exists. Skipping.`);
      } else {
        await PropertyAmenity.create({
          name: item.name,
          category: item.category,
          image: item.image ? { url: item.image } : undefined,
          isActive: true,
        });
        insertedCount++;
        logger.info(`[Seed Script] Created property amenity: ${item.name}`);
      }
    }

    logger.info(`[Seed Script] Completed seeding property amenities. Inserted: ${insertedCount}, Skipped: ${skippedCount}.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('[Seed Script] Error seeding property amenities:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedPropertyAmenities();
