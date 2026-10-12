import { Router } from 'express';

import {
    createBlog,
    getBlogs,
    getBlogById,
    getPublicBlogs,
    getPublicBlogBySlug,
    updateBlog,
    deleteBlog,
    toggleBlogStatus,
} from '../../controllers/contents/blog.controller';

import { authenticateUserOrAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploadSingleImage } from '../../middlewares/upload.middleware';

import {
    createBlogSchema,
    updateBlogSchema,
} from '../../validations/contents/blog.validation';

const router = Router();

// Public read-only routes (No auth required)
router.get('/public', getPublicBlogs);
router.get('/public/:slug', getPublicBlogBySlug);

// Authenticated / Admin routes
router.get(
    '/',
    authenticateUserOrAdmin,
    getBlogs
);

router.get(
    '/:blogId',
    authenticateUserOrAdmin,
    getBlogById
);

router.post(
    '/',
    authenticateUserOrAdmin,
    uploadSingleImage,
    validate(createBlogSchema),
    createBlog
);

router.patch(
    '/:blogId',
    authenticateUserOrAdmin,
    uploadSingleImage,
    validate(updateBlogSchema),
    updateBlog
);

router.patch(
    '/:blogId/toggle-status',
    authenticateUserOrAdmin,
    toggleBlogStatus
);

router.delete(
    '/:blogId',
    authenticateUserOrAdmin,
    deleteBlog
);

export default router;