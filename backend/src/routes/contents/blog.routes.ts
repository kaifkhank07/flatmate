import { Router } from 'express';

import {
    createBlog,
    getBlogs,
    getBlogById,
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