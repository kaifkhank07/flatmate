import mongoose from 'mongoose';
import { config } from './env';

let connPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connPromise) {
    return connPromise;
  }

  try {
    connPromise = mongoose.connect(config.mongodbUri, {
      dbName: config.mongodbDbName,
      serverSelectionTimeoutMS: 5000,
    });
    await connPromise;
    console.log('[MongoDB] Connected successfully');
    console.log(`[MongoDB] Mode: ${config.nodeMode}`);
    console.log(`[MongoDB] Database: ${config.mongodbDbName}`);
    return mongoose;
  } catch (error) {
    connPromise = null;
    console.error('[MongoDB] Connection failed');
    if (error instanceof Error) {
      console.error(`[MongoDB] Error: ${error.message}`);
    } else {
      console.error('[MongoDB] Error:', error);
    }
    throw error;
  }
};

