import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { awsConfig } from '../../config/aws';
import { logger } from '../../utils/logger.util';

export interface UploadFileOptions {
  file: Buffer | Uint8Array | Blob | string;
  contentType: string;
  key?: string;
  folder?: string;
  subFolder?: string;
  fileName?: string;
}

export interface UploadResult {
  url: string;
  key: string;
}

export interface S3KeyOptions {
  key?: string;
  folder?: string;
  subFolder?: string;
  fileName?: string;
  defaultFolder?: string;
}

export interface PresignedUploadOptions {
  folder?: string;
  subFolder?: string;
  fileName?: string;
  key?: string;
  contentType: string;
  expiresInSeconds?: number;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

let s3ClientInstance: S3Client | null = null;

const getS3Client = (): S3Client => {
  if (!s3ClientInstance) {
    if (!awsConfig.region || !awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
      throw new Error(
        'AWS S3 Service error: AWS credentials or region are not configured in environment variables.'
      );
    }

    s3ClientInstance = new S3Client({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
      followRegionRedirects: true,
    });
  }

  return s3ClientInstance;
};

/**
 * Builds a clean, standardized S3 key using optional folder, subFolder, and fileName parameters.
 * Examples:
 * - { folder: 'users', subFolder: 'profile', fileName: 'profile-image.jpg' } => 'users/profile/profile-image.jpg'
 * - { folder: 'users', subFolder: 'preference', fileName: 'pets.png' } => 'users/preference/pets.png'
 */
export const buildS3Key = (options: S3KeyOptions): string => {
  const { key, folder, subFolder, fileName, defaultFolder = 'uploads' } = options;

  if (key && typeof key === 'string' && key.trim()) {
    const trimmedKey = key.trim().replace(/^\/+/, '');

    if ((folder || subFolder) && !trimmedKey.includes('/')) {
      const parts = [folder, subFolder, trimmedKey].filter((p): p is string => Boolean(p && p.trim()));
      return parts.map((p) => p.trim().replace(/^\/+|\/+$/g, '')).join('/');
    }

    return trimmedKey;
  }

  const folderPart = folder ? folder.trim().replace(/^\/+|\/+$/g, '') : undefined;
  const subFolderPart = subFolder ? subFolder.trim().replace(/^\/+|\/+$/g, '') : undefined;

  let filePart = fileName ? fileName.trim().replace(/^\/+/, '') : undefined;
  if (!filePart) {
    filePart = `file-${Date.now()}`;
  }

  const pathParts: string[] = [];

  if (folderPart) {
    pathParts.push(folderPart);
  } else if (!subFolderPart) {
    pathParts.push(defaultFolder);
  }

  if (subFolderPart) {
    pathParts.push(subFolderPart);
  }

  pathParts.push(filePart);

  return pathParts.join('/');
};

/**
 * Returns a permanent public URL for a given S3 key.
 * Uses CloudFront URL if available, otherwise standard S3 public bucket URL.
 */
export const getPublicUrl = (key: string): string => {
  const cleanKey = key.replace(/^\//, '');
  if (awsConfig.cloudfrontUrl) {
    const baseUrl = awsConfig.cloudfrontUrl.replace(/\/$/, '');
    return `${baseUrl}/${cleanKey}`;
  }

  if (awsConfig.bucket && awsConfig.region) {
    return `https://${awsConfig.bucket}.s3.${awsConfig.region}.amazonaws.com/${cleanKey}`;
  }

  return cleanKey;
};

/**
 * Generates a presigned PUT URL for client-side direct AWS S3 uploads into structured folders/subfolders.
 */
export const getPresignedUploadUrl = async (
  options: PresignedUploadOptions
): Promise<PresignedUploadResult> => {
  if (!awsConfig.bucket) {
    throw new Error('AWS S3 Service error: AWS_S3_BUCKET is not defined in environment variables.');
  }

  const { contentType, expiresInSeconds = 3600 } = options;
  const key = buildS3Key(options);
  const client = getS3Client();

  try {
    const command = new PutObjectCommand({
      Bucket: awsConfig.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    const publicUrl = getPublicUrl(key);

    return { uploadUrl, key, publicUrl };
  } catch (error) {
    logger.error('[S3Service] getPresignedUploadUrl error:', error);
    throw new Error(
      `Failed to generate presigned upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Uploads a file to AWS S3 and returns both the URL and object key.
 */
export const uploadToS3 = async (options: UploadFileOptions): Promise<UploadResult> => {
  if (!awsConfig.bucket) {
    throw new Error('AWS S3 Service error: AWS_S3_BUCKET is not defined in environment variables.');
  }

  const { file, contentType } = options;
  const key = buildS3Key(options);
  const client = getS3Client();

  try {
    const command = new PutObjectCommand({
      Bucket: awsConfig.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await client.send(command);
    const url = getPublicUrl(key);
    return { url, key };
  } catch (error) {
    logger.error('[S3Service] uploadToS3 error:', error);
    throw new Error(
      `Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Uploads a file to AWS S3 and returns the URL string.
 */
export const uploadFile = async (options: UploadFileOptions): Promise<string> => {
  const result = await uploadToS3(options);
  return result.url;
};

/**
 * Deletes a file from AWS S3 by object key.
 * Handles missing keys and S3 errors gracefully without crashing parent transactions.
 */
export const deleteFile = async (key?: string): Promise<void> => {
  if (!key || typeof key !== 'string' || key.trim() === '') {
    return;
  }

  if (!awsConfig.bucket) {
    logger.warn('[S3Service] deleteFile skipped: AWS_S3_BUCKET is not configured.');
    return;
  }

  const cleanKey = key.trim().replace(/^\//, '');

  try {
    const client = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: awsConfig.bucket,
      Key: cleanKey,
    });

    await client.send(command);
    logger.info(`[S3Service] Deleted object from S3: ${cleanKey}`);
  } catch (error) {
    logger.error(`[S3Service] Failed to delete file from S3 (Key: ${cleanKey}):`, error);
  }
};

/**
 * Helper to extract S3 key from full S3/CloudFront URL if key was not explicitly stored.
 */
export const extractKeyFromUrl = (url?: string): string | undefined => {
  if (!url || typeof url !== 'string') return undefined;

  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\//, '');
    return path || undefined;
  } catch {
    // If not a valid absolute URL, check if path itself looks like a key
    if (url.includes('/') && !url.startsWith('http')) {
      return url.replace(/^\//, '');
    }
    return undefined;
  }
};

/**
 * Gets a presigned file URL for a given S3 key.
 */
export const getFileUrl = async (
  key: string,
  expiresInSeconds: number = 3600
): Promise<string> => {
  if (awsConfig.cloudfrontUrl) {
    return getPublicUrl(key);
  }

  if (!awsConfig.bucket) {
    throw new Error('AWS S3 Service error: AWS_S3_BUCKET is not defined in environment variables.');
  }

  const client = getS3Client();

  try {
    const command = new GetObjectCommand({
      Bucket: awsConfig.bucket,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } catch (error) {
    throw new Error(
      `Failed to generate S3 URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
