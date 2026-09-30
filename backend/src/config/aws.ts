import dotenv from 'dotenv';
dotenv.config();

export interface AWSConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  cloudfrontUrl?: string;
}

export const awsConfig: AWSConfig = {
  region: process.env.AWS_REGION || '',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  bucket: process.env.AWS_S3_BUCKET || '',
  cloudfrontUrl: process.env.AWS_CLOUDFRONT_URL || undefined,
};
