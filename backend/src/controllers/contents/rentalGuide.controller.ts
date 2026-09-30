import { Request, Response } from 'express';

import { RentalGuide } from '../../models/contents/rentalGuide.model';

import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';


const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

/**
 * Create Rental Guide
 * POST /api/rental-guides
 */
export const createRentalGuide = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const {
            title,
            description,
            content,
            image,
            isActive,
            seo,
        } = req.body;

        let slug = generateSlug(title);

        // Prevent duplicate slug
        const existingGuide = await RentalGuide.findOne({
            slug,
        });

        if (existingGuide) {
            slug = `${slug}-${Date.now()}`;
        }

        const rentalGuide = await RentalGuide.create({
            title,
            slug,
            description,
            content,
            image,
            isActive: isActive ?? false,
            seo,
        });

        logger.info(
            `Rental guide created successfully: ${rentalGuide._id}`
        );

        return sendSuccess(
            res,
            'Rental guide created successfully',
            rentalGuide,
            201
        );
    } catch (error) {
        logger.error(
            '[RentalGuideController] Failed to create rental guide:',
            error
        );

        return sendError(
            res,
            'Failed to create rental guide',
            500
        );
    }
};

/**
 * Get Rental Guides
 * GET /api/rental-guides
 */
export const getRentalGuides = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const page =
            parseInt(req.query.page as string, 10) || 1;

        const limit =
            parseInt(req.query.limit as string, 10) || 20;

        const skip = (page - 1) * limit;

        const {
            search,
            isActive,
        } = req.query;

        const query: any = {};

        if (search) {
            const searchRegex = new RegExp(
                search as string,
                'i'
            );

            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { content: searchRegex },
            ];
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const total =
            await RentalGuide.countDocuments(query);

        const rentalGuides =
            await RentalGuide.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

        const totalPages =
            Math.ceil(total / limit) || 1;

        return sendSuccess(
            res,
            'Rental guides fetched successfully',
            {
                rentalGuides,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            }
        );
    } catch (error) {
        logger.error(
            '[RentalGuideController] Failed to fetch rental guides:',
            error
        );

        return sendError(
            res,
            'Failed to fetch rental guides',
            500
        );
    }
};

/**
 * Get Rental Guide By ID
 * GET /api/rental-guides/:rentalGuideId
 */
export const getRentalGuideById = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { rentalGuideId } = req.params;

        const rentalGuide =
            await RentalGuide.findById(rentalGuideId);

        if (!rentalGuide) {
            return sendError(
                res,
                'Rental guide not found',
                404
            );
        }

        return sendSuccess(
            res,
            'Rental guide fetched successfully',
            rentalGuide
        );
    } catch (error) {
        logger.error(
            '[RentalGuideController] Failed to fetch rental guide:',
            error
        );

        return sendError(
            res,
            'Failed to fetch rental guide',
            500
        );
    }
};

/**
 * Update Rental Guide
 * PUT /api/rental-guides/:rentalGuideId
 */
export const updateRentalGuide = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { rentalGuideId } = req.params;

        const rentalGuide =
            await RentalGuide.findById(rentalGuideId);

        if (!rentalGuide) {
            return sendError(
                res,
                'Rental guide not found',
                404
            );
        }

        const {
            title,
            description,
            content,
            image,
            isActive,
            seo,
        } = req.body;

        if (title !== undefined && title !== rentalGuide.title) {
            let slug = generateSlug(title);

            const existingGuide =
                await RentalGuide.findOne({
                    slug,
                    _id: { $ne: rentalGuideId },
                });

            if (existingGuide) {
                slug = `${slug}-${Date.now()}`;
            }

            rentalGuide.title = title;
            rentalGuide.slug = slug;
        }

        if (description !== undefined) {
            rentalGuide.description = description;
        }

        if (content !== undefined) {
            rentalGuide.content = content;
        }

        if (image !== undefined) {
            rentalGuide.image = image;
        }

        if (isActive !== undefined) {
            rentalGuide.isActive = isActive;
        }

        if (seo !== undefined) {
            rentalGuide.seo = seo;
        }

        await rentalGuide.save();

        logger.info(
            `Rental guide updated: ${rentalGuideId}`
        );

        return sendSuccess(
            res,
            'Rental guide updated successfully',
            rentalGuide
        );
    } catch (error) {
        logger.error(
            '[RentalGuideController] Failed to update rental guide:',
            error
        );

        return sendError(
            res,
            'Failed to update rental guide',
            500
        );
    }
};

/**
 * Delete Rental Guide
 * DELETE /api/rental-guides/:rentalGuideId
 */
export const deleteRentalGuide = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { rentalGuideId } = req.params;

        const rentalGuide =
            await RentalGuide.findById(rentalGuideId);

        if (!rentalGuide) {
            return sendError(
                res,
                'Rental guide not found',
                404
            );
        }

        await RentalGuide.findByIdAndDelete(
            rentalGuideId
        );

        logger.info(
            `Rental guide deleted: ${rentalGuideId}`
        );

        return sendSuccess(
            res,
            'Rental guide deleted successfully'
        );
    } catch (error) {
        logger.error(
            '[RentalGuideController] Failed to delete rental guide:',
            error
        );

        return sendError(
            res,
            'Failed to delete rental guide',
            500
        );
    }
};