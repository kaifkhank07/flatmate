import { Router } from 'express';
import {
    getListings,
    getListingBySlug,
    getMyListings,
} from '../../controllers/listing/listing.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
    getListingsQuerySchema,
    getMyListingsQuerySchema,
} from '../../validations/listing/listing.validation';
import { authenticateUser } from '../../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/listings
 * @desc    Public unified listing discovery endpoint (Property + FlatmateRequirement)
 * @access  Public
 */
router.get('/', validate(getListingsQuerySchema), getListings);

/**
 * @route   GET /api/listings/my-listings
 * @desc    Get authenticated user's own listings
 * @access  Private
 *
 * IMPORTANT:
 * This route must be before /:slug.
 */
router.get(
    '/my-listings',
    authenticateUser,
    validate(getMyListingsQuerySchema),
    getMyListings
);

/**
 * @route   GET /api/listings/slug/:slug
 * @route   GET /api/listings/:slug
 * @desc    Get unified listing details by slug or ID
 * @access  Public
 */
router.get('/slug/:slug', getListingBySlug);
router.get('/:slug', getListingBySlug);

export default router;
