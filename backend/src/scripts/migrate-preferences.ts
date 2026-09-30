import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { UserProfile } from '../models/auth/userProfile.model';
import { calculateProfileCompletion } from '../controllers/auth/profile.controller';
import { logger } from '../utils/logger.util';

const migratePreferences = async (): Promise<void> => {
  try {
    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      logger.error('[Migration Script] Database connection failed.');
      process.exit(1);
    }

    const collections = await db.listCollections({ name: 'mypreferences' }).toArray();

    if (collections.length === 0) {
      logger.info('[Migration Script] No legacy "mypreferences" collection found. Migration not required.');
      await mongoose.connection.close();
      process.exit(0);
    }

    const legacyDocs = await db.collection('mypreferences').find({}).toArray();
    logger.info(`[Migration Script] Found ${legacyDocs.length} legacy preference records.`);

    // Group preference ObjectIds by userId
    const userPrefMap = new Map<string, string[]>();

    for (const doc of legacyDocs) {
      if (doc.userId && doc.preferenceId) {
        const uId = doc.userId.toString();
        const pId = doc.preferenceId.toString();

        if (!userPrefMap.has(uId)) {
          userPrefMap.set(uId, []);
        }

        const list = userPrefMap.get(uId)!;
        if (!list.includes(pId)) {
          list.push(pId);
        }
      }
    }

    let updatedProfiles = 0;

    for (const [userIdStr, prefIds] of userPrefMap.entries()) {
      let profile = await UserProfile.findOne({ userId: userIdStr });
      if (!profile) {
        profile = new UserProfile({ userId: new mongoose.Types.ObjectId(userIdStr) });
      }

      const existingSet = new Set((profile.preferences || []).map((id) => id.toString()));
      prefIds.forEach((id) => existingSet.add(id));

      profile.preferences = Array.from(existingSet).map((id) => new mongoose.Types.ObjectId(id));
      profile.profileCompletion = calculateProfileCompletion(profile.toObject());
      await profile.save();

      updatedProfiles++;
    }

    logger.info(`[Migration Script] Successfully updated ${updatedProfiles} user profiles with preferences.`);

    // Drop legacy collection
    await db.collection('mypreferences').drop();
    logger.info('[Migration Script] Dropped legacy "mypreferences" collection.');

    await mongoose.connection.close();
    logger.info('[Migration Script] Migration complete. Connection closed.');
    process.exit(0);
  } catch (error) {
    logger.error('[Migration Script] Migration failed:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

migratePreferences();
