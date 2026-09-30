import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { logger } from '../utils/logger.util';

const migrateRentAndBudget = async (): Promise<void> => {
  try {
    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      logger.error('[Migration Script] Database connection failed.');
      process.exit(1);
    }

    logger.info('[Migration Script] Starting Property rent and FlatmateRequirement budget migration...');

    // 1. Migrate Property Rent
    const propertiesCollection = db.collection('properties');
    const legacyProperties = await propertiesCollection.find({ 'rent.amount': { $exists: true } }).toArray();

    logger.info(`[Migration Script] Found ${legacyProperties.length} legacy Property records with object rent structure.`);

    let migratedProperties = 0;
    for (const doc of legacyProperties) {
      const amount = doc.rent?.amount ?? 0;
      await propertiesCollection.updateOne(
        { _id: doc._id },
        {
          $set: { rent: amount },
        }
      );
      migratedProperties++;
    }
    logger.info(`[Migration Script] Successfully updated ${migratedProperties} Property documents to numeric rent.`);

    // Drop legacy index on properties if exists
    try {
      await propertiesCollection.dropIndex('rent.amount_1');
      logger.info('[Migration Script] Dropped legacy index "rent.amount_1".');
    } catch (err: any) {
      if (err?.codeName !== 'IndexNotFound') {
        logger.warn(`[Migration Script] Note on dropping property index: ${err.message}`);
      }
    }

    // 2. Migrate FlatmateRequirement Budget
    const requirementsCollection = db.collection('flatmaterequirements');
    const legacyRequirements = await requirementsCollection.find({
      $or: [{ 'budget.max': { $exists: true } }, { 'budget.min': { $exists: true } }],
    }).toArray();

    logger.info(`[Migration Script] Found ${legacyRequirements.length} legacy FlatmateRequirement records with object budget structure.`);

    let migratedRequirements = 0;
    for (const doc of legacyRequirements) {
      // Preference rule: use budget.max if available, fallback to budget.min, fallback to 0
      const budgetValue = doc.budget?.max ?? doc.budget?.min ?? 0;
      await requirementsCollection.updateOne(
        { _id: doc._id },
        {
          $set: { budget: budgetValue },
        }
      );
      migratedRequirements++;
    }
    logger.info(`[Migration Script] Successfully updated ${migratedRequirements} FlatmateRequirement documents to numeric budget.`);

    // Drop legacy indexes on flatmaterequirements if exist
    try {
      await requirementsCollection.dropIndex('budget.min_1');
      logger.info('[Migration Script] Dropped legacy index "budget.min_1".');
    } catch (err: any) {
      if (err?.codeName !== 'IndexNotFound') {
        logger.warn(`[Migration Script] Note on dropping requirement index: ${err.message}`);
      }
    }
    try {
      await requirementsCollection.dropIndex('budget.max_1');
      logger.info('[Migration Script] Dropped legacy index "budget.max_1".');
    } catch (err: any) {
      if (err?.codeName !== 'IndexNotFound') {
        logger.warn(`[Migration Script] Note on dropping requirement index: ${err.message}`);
      }
    }

    logger.info('[Migration Script] Migration complete!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    logger.error(`[Migration Script] Migration failed: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

migrateRentAndBudget();
