import { Request, Response } from 'express';
import { Types } from 'mongoose';

import { BlogCategory } from '../../models/contents/blogCategory.model';

import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';

/**
 * Generate slug from category name
 */
const generateSlug = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Create blog category
 * POST /api/blog-categories
 */
export const createBlogCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { name, isActive } = req.body;

    if (!name || !name.trim()) {
      return sendError(
        res,
        'Blog category name is required',
        400
      );
    }

    const trimmedName = name.trim();
    const slug = generateSlug(trimmedName);

    if (!slug) {
      return sendError(
        res,
        'Unable to generate slug from category name',
        400
      );
    }

    const existingCategory = await BlogCategory.findOne({
      $or: [
        { name: trimmedName },
        { slug },
      ],
    });

    if (existingCategory) {
      if (existingCategory.slug === slug) {
        return sendError(
          res,
          'Blog category with this name already exists',
          409
        );
      }

      return sendError(
        res,
        'Blog category with this name already exists',
        409
      );
    }

    const category = await BlogCategory.create({
      name: trimmedName,
      slug,
      isActive: isActive ?? true,
    });

    logger.info(
      `[BlogCategoryController] Blog category created: ${category._id}`
    );

    return sendSuccess(
      res,
      'Blog category created successfully',
      category
    );
  } catch (error) {
    logger.error(
      '[BlogCategoryController] Failed to create blog category:',
      error
    );

    return sendError(
      res,
      'Failed to create blog category',
      500
    );
  }
};

/**
 * Get all blog categories
 * GET /api/blog-categories
 */
export const getBlogCategories = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const page = Math.max(
      parseInt(req.query.page as string) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit as string) || 10,
        1
      ),
      100
    );

    const search = (req.query.search as string)?.trim();
    const isActive = req.query.isActive;

    const filter: any = {};

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          slug: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      BlogCategory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      BlogCategory.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      'Blog categories fetched successfully',
      {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    logger.error(
      '[BlogCategoryController] Failed to fetch blog categories:',
      error
    );

    return sendError(
      res,
      'Failed to fetch blog categories',
      500
    );
  }
};

/**
 * Get blog category by ID
 * GET /api/blog-categories/:categoryId
 */
export const getBlogCategoryById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { categoryId } = req.params;

    if (!Types.ObjectId.isValid(categoryId)) {
      return sendError(
        res,
        'Invalid category ID',
        400
      );
    }

    const category = await BlogCategory.findById(
      categoryId
    );

    if (!category) {
      return sendError(
        res,
        'Blog category not found',
        404
      );
    }

    return sendSuccess(
      res,
      'Blog category fetched successfully',
      category
    );
  } catch (error) {
    logger.error(
      '[BlogCategoryController] Failed to fetch blog category:',
      error
    );

    return sendError(
      res,
      'Failed to fetch blog category',
      500
    );
  }
};

/**
 * Update blog category
 * PATCH /api/blog-categories/:categoryId
 *
 * Slug is automatically regenerated when name changes.
 */
export const updateBlogCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { categoryId } = req.params;

    if (!Types.ObjectId.isValid(categoryId)) {
      return sendError(
        res,
        'Invalid category ID',
        400
      );
    }

    const category = await BlogCategory.findById(
      categoryId
    );

    if (!category) {
      return sendError(
        res,
        'Blog category not found',
        404
      );
    }

    const { name, isActive } = req.body;

    /*
     * Slug is never taken from req.body.
     * It is generated automatically from name.
     */
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return sendError(
          res,
          'Blog category name is required',
          400
        );
      }

      const trimmedName = name.trim();
      const newSlug = generateSlug(trimmedName);

      if (!newSlug) {
        return sendError(
          res,
          'Unable to generate slug from category name',
          400
        );
      }

      const existingCategory =
        await BlogCategory.findOne({
          _id: { $ne: categoryId },
          $or: [
            { name: trimmedName },
            { slug: newSlug },
          ],
        });

      if (existingCategory) {
        if (
          existingCategory.slug === newSlug
        ) {
          return sendError(
            res,
            'Blog category with this name already exists',
            409
          );
        }

        return sendError(
          res,
          'Blog category with this name already exists',
          409
        );
      }

      category.name = trimmedName;
      category.slug = newSlug;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return sendError(
          res,
          'isActive must be a boolean',
          400
        );
      }

      category.isActive = isActive;
    }

    await category.save();

    logger.info(
      `[BlogCategoryController] Blog category updated: ${category._id}`
    );

    return sendSuccess(
      res,
      'Blog category updated successfully',
      category
    );
  } catch (error) {
    logger.error(
      '[BlogCategoryController] Failed to update blog category:',
      error
    );

    return sendError(
      res,
      'Failed to update blog category',
      500
    );
  }
};

/**
 * Toggle blog category status
 * PATCH /api/blog-categories/:categoryId/status
 */
export const toggleBlogCategoryStatus = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { categoryId } = req.params;
    const { isActive } = req.body;

    if (!Types.ObjectId.isValid(categoryId)) {
      return sendError(
        res,
        'Invalid category ID',
        400
      );
    }

    if (typeof isActive !== 'boolean') {
      return sendError(
        res,
        'isActive must be a boolean',
        400
      );
    }

    const category =
      await BlogCategory.findByIdAndUpdate(
        categoryId,
        {
          $set: {
            isActive,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!category) {
      return sendError(
        res,
        'Blog category not found',
        404
      );
    }

    logger.info(
      `[BlogCategoryController] Blog category ${isActive ? 'activated' : 'deactivated'
      }: ${category._id}`
    );

    return sendSuccess(
      res,
      `Blog category ${isActive ? 'activated' : 'deactivated'
      } successfully`,
      category
    );
  } catch (error) {
    logger.error(
      '[BlogCategoryController] Failed to update blog category status:',
      error
    );

    return sendError(
      res,
      'Failed to update blog category status',
      500
    );
  }
};

/**
 * Delete blog category
 * DELETE /api/blog-categories/:categoryId
 */
export const deleteBlogCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { categoryId } = req.params;

    if (!Types.ObjectId.isValid(categoryId)) {
      return sendError(
        res,
        'Invalid category ID',
        400
      );
    }

    const category = await BlogCategory.findById(
      categoryId
    );

    if (!category) {
      return sendError(
        res,
        'Blog category not found',
        404
      );
    }

    await BlogCategory.findByIdAndDelete(
      categoryId
    );

    logger.info(
      `[BlogCategoryController] Blog category deleted: ${categoryId}`
    );

    return sendSuccess(
      res,
      'Blog category deleted successfully',
      null
    );
  } catch (error) {
    logger.error(
      '[BlogCategoryController] Failed to delete blog category:',
      error
    );

    return sendError(
      res,
      'Failed to delete blog category',
      500
    );
  }
};