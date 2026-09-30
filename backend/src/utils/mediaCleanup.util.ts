import { Types } from 'mongoose';
import { Property } from '../models/listing/property.model';
import { FlatmateRequirement } from '../models/listing/flatmateRequirements.model';
import { Image } from '../models/listing/image.model';
import { Video } from '../models/listing/video.model';
import { deleteFile } from '../services/aws/s3.service';
import { logger } from './logger.util';

/**
 * Safely clean up unreferenced Image documents and their corresponding S3 objects.
 * Verifies that the image is NOT referenced by any Property or FlatmateRequirement document before deletion.
 */
export const cleanupUnreferencedImages = async (
  imageIds: (string | Types.ObjectId)[]
): Promise<void> => {
  if (!imageIds || imageIds.length === 0) return;

  for (const rawId of imageIds) {
    if (!rawId) continue;
    const imgIdStr = rawId.toString();
    if (!Types.ObjectId.isValid(imgIdStr)) continue;

    try {
      // Check if any property or flatmate requirement still references this image ID
      const [isPropReferenced, isReqReferenced] = await Promise.all([
        Property.exists({ images: imgIdStr }),
        FlatmateRequirement.exists({ images: imgIdStr }),
      ]);

      if (!isPropReferenced && !isReqReferenced) {
        const imageDoc = await Image.findById(imgIdStr);
        if (imageDoc) {
          await Image.deleteOne({ _id: imgIdStr });
          if (imageDoc.key) {
            await deleteFile(imageDoc.key).catch((err) =>
              logger.error(`[MediaCleanup] S3 image delete failed ${imageDoc.key}:`, err)
            );
          }
          logger.info(`[MediaCleanup] Deleted unreferenced Image ${imgIdStr}`);
        }
      }
    } catch (error: any) {
      logger.error(`[MediaCleanup] Error checking/deleting Image ${imgIdStr}:`, error);
    }
  }
};

/**
 * Safely clean up unreferenced Video documents and their corresponding S3 objects.
 * Verifies that the video is NOT referenced by any Property or FlatmateRequirement document before deletion.
 */
export const cleanupUnreferencedVideos = async (
  videoIds: (string | Types.ObjectId)[]
): Promise<void> => {
  if (!videoIds || videoIds.length === 0) return;

  for (const rawId of videoIds) {
    if (!rawId) continue;
    const vidIdStr = rawId.toString();
    if (!Types.ObjectId.isValid(vidIdStr)) continue;

    try {
      // Check if any property or flatmate requirement still references this video ID
      const [isPropReferenced, isReqReferenced] = await Promise.all([
        Property.exists({ videos: vidIdStr }),
        FlatmateRequirement.exists({ videos: vidIdStr }),
      ]);

      if (!isPropReferenced && !isReqReferenced) {
        const videoDoc = await Video.findById(vidIdStr);
        if (videoDoc) {
          await Video.deleteOne({ _id: vidIdStr });
          if (videoDoc.key) {
            await deleteFile(videoDoc.key).catch((err) =>
              logger.error(`[MediaCleanup] S3 video delete failed ${videoDoc.key}:`, err)
            );
          }
          logger.info(`[MediaCleanup] Deleted unreferenced Video ${vidIdStr}`);
        }
      }
    } catch (error: any) {
      logger.error(`[MediaCleanup] Error checking/deleting Video ${vidIdStr}:`, error);
    }
  }
};
