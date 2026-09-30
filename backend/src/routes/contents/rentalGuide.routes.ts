import { Router } from 'express';

import { createRentalGuide, getRentalGuides, getRentalGuideById, updateRentalGuide, deleteRentalGuide } from '../../controllers/contents/rentalGuide.controller';

import { createRentalGuideSchema, updateRentalGuideSchema, rentalGuideIdParamSchema, getRentalGuidesSchema } from '../../validations/contents/rentalGuide.validation';

import { validate } from '../../middlewares/validate.middleware';
import { authenticateUserOrAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Admin CRUD routes
router.post(
    '/',
    authenticateUserOrAdmin,
    validate(createRentalGuideSchema),
    createRentalGuide
);

router.get(
    '/',
    authenticateUserOrAdmin,
    validate(getRentalGuidesSchema),
    getRentalGuides
);

router.get(
    '/:rentalGuideId',
    authenticateUserOrAdmin,
    validate(rentalGuideIdParamSchema),
    getRentalGuideById
);

router.put(
    '/:rentalGuideId',
    authenticateUserOrAdmin,
    validate(rentalGuideIdParamSchema),
    validate(updateRentalGuideSchema),
    updateRentalGuide
);

router.delete(
    '/:rentalGuideId',
    authenticateUserOrAdmin,
    validate(rentalGuideIdParamSchema),
    deleteRentalGuide
);

export default router;