import mongoose from 'mongoose';
import { config } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodbUri, {
      dbName: config.mongodbDbName,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[MongoDB] Connected successfully');
    console.log(`[MongoDB] Mode: ${config.nodeMode}`);
    console.log(`[MongoDB] Database: ${config.mongodbDbName}`);
  } catch (error) {
    console.error('[MongoDB] Connection failed');
    if (error instanceof Error) {
      console.error(`[MongoDB] Error: ${error.message}`);
    } else {
      console.error('[MongoDB] Error:', error);
    }
    process.exit(1);
  }
};
