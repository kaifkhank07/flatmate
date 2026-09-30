import { Router } from 'express';

import {
    createFAQ,
    getFAQs,
    getFAQById,
    updateFAQ,
    deleteFAQ,
    getFAQsByPage,
} from '../../controllers/contents/faq.controller';

import {
    createFAQSchema,
    updateFAQSchema,
    faqIdParamSchema,
    getFAQsSchema,
    faqPageParamSchema,
} from '../../validations/contents/faq.validation';

import { validate } from '../../middlewares/validate.middleware';
import { authenticateUserOrAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Public route for page FAQs
router.get(
    '/page/:page',
    validate(faqPageParamSchema),
    getFAQsByPage
);

// Admin & Auth CRUD routes
router.post(
    '/',
    authenticateUserOrAdmin,
    validate(createFAQSchema),
    createFAQ
);

router.get(
    '/',
    authenticateUserOrAdmin,
    validate(getFAQsSchema),
    getFAQs
);

router.get(
    '/:faqId',
    authenticateUserOrAdmin,
    validate(faqIdParamSchema),
    getFAQById
);

router.put(
    '/:faqId',
    authenticateUserOrAdmin,
    validate(faqIdParamSchema),
    validate(updateFAQSchema),
    updateFAQ
);

router.patch(
    '/:faqId',
    authenticateUserOrAdmin,
    validate(faqIdParamSchema),
    validate(updateFAQSchema),
    updateFAQ
);

router.delete(
    '/:faqId',
    authenticateUserOrAdmin,
    validate(faqIdParamSchema),
    deleteFAQ
);

export default router;