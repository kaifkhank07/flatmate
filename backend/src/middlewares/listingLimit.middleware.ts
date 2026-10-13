import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';
import { logger } from '../utils/logger.util';
import { Property } from '../models/listing/property.model';
import { FlatmateRequirement } from '../models/listing/flatmateRequirements.model';

export const listingLimitMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response> => {
    try {
        // Allow admins to proceed without the user listing limit.
        if (req.admin) {
            return next();
        }

        const userId = req.user?._id;

        if (!userId) {
            return sendError(res, 'User authentication required', 401);
        }

        const [propertyCount, flatmateCount] = await Promise.all([
            Property.countDocuments({ userId }),
            FlatmateRequirement.countDocuments({ userId }),
        ]);

        const totalListings = propertyCount + flatmateCount;

        if (totalListings >= 3) {
            return res.status(403).json({
                success: false,
                message: 'You can create a maximum of 3 listings.',
                data: {
                    propertyCount,
                    flatmateCount,
                    totalListings,
                    maxListings: 3,
                    remainingListings: 0,
                },
            });
        }

        return next();
    } catch (error) {
        logger.error(
            'Listing limit validation failed',
            error instanceof Error ? error.message : error
        );
        return sendError(res, 'Failed to validate listing limit', 500);
    }
};
