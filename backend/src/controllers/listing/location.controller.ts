import { Request, Response } from 'express';
import { locationService } from '../../services/location/location.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';

/**
 * Save / Get Location by resolved Google location payload from frontend
 * Checks if location exists by placeId in MongoDB; if not, creates document.
 */
export const savePlaceLocation = async (req: Request, res: Response): Promise<Response> => {
  try {
    const location = await locationService.savePlaceLocation(req.body);
    if (!location) {
      return sendError(res, 'Unable to save location details', 400);
    }

    return sendSuccess(res, 'Location saved successfully', location, 201);
  } catch (error: any) {
    logger.error('[LocationController] savePlaceLocation error:', error);
    return sendError(res, error.message || 'Failed to save location', 500);
  }
};
