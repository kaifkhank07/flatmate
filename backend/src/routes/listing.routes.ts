import { Router } from 'express';
import { getListings, getListingBySlug } from '../controllers/listing.controller';
import { validate } from '../middlewares/validate.middleware';
import { getListingsQuerySchema } from '../validations/listing.validation';

const router = Router();

/**
 * @route   GET /api/listings
 * @desc    Public unified listing discovery endpoint (Property + FlatmateRequirement)
 * @access  Public
 */
router.get('/', validate(getListingsQuerySchema), getListings);

/**
 * @route   GET /api/listings/slug/:slug
 * @route   GET /api/listings/:slug
 * @desc    Get unified listing details by slug or ID
 * @access  Public
 */
router.get('/slug/:slug', getListingBySlug);
router.get('/:slug', getListingBySlug);

export default router;
