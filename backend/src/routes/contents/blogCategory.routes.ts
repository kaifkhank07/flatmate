import { Router } from 'express';

import {
    createBlogCategory,
    getBlogCategories,
    getBlogCategoryById,
    updateBlogCategory,
    deleteBlogCategory,
    toggleBlogCategoryStatus,
} from '../../controllers/contents/blogCategory.controller';

import { authenticateUserOrAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

import {
    createBlogCategorySchema,
    updateBlogCategorySchema,
    toggleBlogCategoryStatusSchema,
} from '../../validations/contents/blogCategory.validation';

const router = Router();

router.get(
    '/',
    authenticateUserOrAdmin,
    getBlogCategories
);

router.get(
    '/:categoryId',
    authenticateUserOrAdmin,
    getBlogCategoryById
);

router.post(
    '/',
    authenticateUserOrAdmin,
    validate(createBlogCategorySchema),
    createBlogCategory
);

router.patch(
    '/:categoryId/status',
    authenticateUserOrAdmin,
    validate(toggleBlogCategoryStatusSchema),
    toggleBlogCategoryStatus
);

router.patch(
    '/:categoryId',
    authenticateUserOrAdmin,
    validate(updateBlogCategorySchema),
    updateBlogCategory
);

router.delete(
    '/:categoryId',
    authenticateUserOrAdmin,
    deleteBlogCategory
);

export default router;