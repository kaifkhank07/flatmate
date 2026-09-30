import { Request, Response } from 'express';
import { Types } from 'mongoose';
import path from 'path';

import { Blog, IBlogImage, IBlogSeo, IBlogFaq } from '../../models/contents/blog.model';
import { BlogCategory } from '../../models/contents/blogCategory.model';

import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { sanitizeFileName } from '../../utils/fileValidation.util';

import { uploadToS3, deleteFile, extractKeyFromUrl } from '../../services/aws/s3.service';

/**
 * Generate URL-friendly slug
 */
const generateSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Parse FAQs input from JSON object, array, or JSON string.
 */
const parseFaqsInput = (value: unknown): IBlogFaq[] | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  let faqsValue: any = value;
  if (typeof faqsValue === 'string') {
    try {
      faqsValue = JSON.parse(faqsValue);
    } catch {
      return undefined;
    }
  }

  if (!Array.isArray(faqsValue)) {
    return undefined;
  }

  const faqs: IBlogFaq[] = [];
  for (const item of faqsValue) {
    if (item && typeof item === 'object') {
      const question = item.question ? String(item.question).trim() : '';
      const answer = item.answer ? String(item.answer).trim() : '';
      if (question && answer) {
        faqs.push({ question, answer });
      }
    }
  }

  return faqs;
};

/**
 * Parse boolean values safely.
 *
 * Supports:
 * true
 * false
 * "true"
 * "false"
 * 1
 * 0
 */
const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  return undefined;
};

/**
 * Parse SEO input.
 *
 * Supports:
 * - JSON object
 * - JSON string from multipart/form-data
 */
const parseSeoInput = (value: unknown): IBlogSeo | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  let seoValue: any = value;

  /**
   * Multipart requests may send SEO
   * as a JSON string.
   */
  if (typeof seoValue === 'string') {
    try {
      seoValue = JSON.parse(seoValue);
    } catch {
      return undefined;
    }
  }

  if (typeof seoValue !== 'object' || Array.isArray(seoValue)) {
    return undefined;
  }

  const seo: IBlogSeo = {};

  if (seoValue.title !== undefined && seoValue.title !== null) {
    seo.title = String(seoValue.title).trim();
  }

  if (seoValue.description !== undefined && seoValue.description !== null) {
    seo.description = String(seoValue.description).trim();
  }

  if (Array.isArray(seoValue.keywords)) {
    seo.keywords = seoValue.keywords
      .map((keyword: unknown) => String(keyword).trim())
      .filter(Boolean);
  }

  return seo;
};

/**
 * Validate SEO values.
 */
const validateSeo = (seo: IBlogSeo | undefined): string | null => {
  if (!seo) {
    return null;
  }

  if (seo.title !== undefined && seo.title.length > 200) {
    return 'SEO title cannot exceed 200 characters';
  }

  if (seo.description !== undefined && seo.description.length > 500) {
    return 'SEO description cannot exceed 500 characters';
  }

  if (seo.keywords !== undefined && !Array.isArray(seo.keywords)) {
    return 'SEO keywords must be an array';
  }

  if (seo.keywords && seo.keywords.some((keyword) => typeof keyword !== 'string')) {
    return 'SEO keywords must contain only strings';
  }

  return null;
};

/**
 * Helper to parse image input from:
 *
 * - multipart file
 * - JSON object
 * - image URL string
 * - image.url / image.key multipart fields
 */
const parseImageInput = async (
  req: Request,
  defaultFolder: string = 'blogs',
  defaultSubFolder: string = 'images'
): Promise<IBlogImage | undefined> => {
  /**
   * New uploaded file
   */
  const uploadedFile =
    req.file ||
    (req.files && Array.isArray(req.files) ? req.files[0] : undefined) ||
    (req.files && !Array.isArray(req.files)
      ? (req.files as any)?.image?.[0] || (req.files as any)?.file?.[0]
      : undefined);

  if (uploadedFile) {
    const ext = path.extname(uploadedFile.originalname) || '.jpg';
    const cleanFileName = sanitizeFileName(path.basename(uploadedFile.originalname, ext));

    const folder = (req.body.folder || req.query.folder) as string | undefined;
    const subFolder = (req.body.subFolder || req.query.subFolder || req.body.subfolder || req.query.subfolder) as string | undefined;
    const fileName = `img-${Date.now()}-${cleanFileName}${ext}`;

    const uploadRes = await uploadToS3({
      file: uploadedFile.buffer,
      folder: folder || defaultFolder,
      subFolder: subFolder !== undefined ? subFolder : folder ? undefined : defaultSubFolder,
      fileName,
      contentType: uploadedFile.mimetype,
    });

    return {
      url: uploadRes.url,
      key: uploadRes.key,
    };
  }

  /**
   * Image sent as JSON object
   * or URL string
   */
  if (req.body.image) {
    let imageVal = req.body.image;
    if (typeof imageVal === 'string') {
      try {
        imageVal = JSON.parse(imageVal);
      } catch {
        // Keep raw string if not JSON string
      }
    }

    if (typeof imageVal === 'object' && imageVal !== null) {
      return {
        url: imageVal.url ? String(imageVal.url).trim() : undefined,
        key: imageVal.key ? String(imageVal.key).trim() : undefined,
      };
    }

    if (typeof imageVal === 'string' && imageVal.trim()) {
      const urlStr = imageVal.trim();
      return {
        url: urlStr,
        key: extractKeyFromUrl(urlStr),
      };
    }
  }

  /**
   * Image sent as multipart fields:
   *
   * image.url
   * image.key
   */
  if (req.body['image.url'] || req.body['image.key']) {
    return {
      url: req.body['image.url'] ? String(req.body['image.url']).trim() : undefined,
      key: req.body['image.key'] ? String(req.body['image.key']).trim() : undefined,
    };
  }

  return undefined;
};

/**
 * Create blog
 *
 * POST /blogs
 */
export const createBlog = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;

  try {
    const { title, content, categoryId, isActive } = req.body;

    /**
     * Validate title
     */
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return sendError(res, 'Blog title is required', 400);
    }

    if (title.trim().length > 200) {
      return sendError(res, 'Blog title cannot exceed 200 characters', 400);
    }

    /**
     * Validate content
     */
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return sendError(res, 'Blog content is required', 400);
    }

    /**
     * Validate category
     */
    if (!categoryId || !Types.ObjectId.isValid(categoryId)) {
      return sendError(res, 'Invalid category ID', 400);
    }

    const category = await BlogCategory.findById(categoryId);

    if (!category) {
      return sendError(res, 'Blog category not found', 404);
    }

    /**
     * Validate isActive
     */
    let activeValue = true;

    if (isActive !== undefined) {
      const parsed = parseBoolean(isActive);

      if (parsed === undefined) {
        return sendError(res, 'isActive must be a boolean', 400);
      }

      activeValue = parsed;
    }

    /**
     * Parse SEO
     */
    const seo = parseSeoInput(req.body.seo);

    const seoError = validateSeo(seo);

    if (seoError) {
      return sendError(res, seoError, 400);
    }

    const trimmedTitle = title.trim();

    /**
     * Generate slug
     */
    const slug = generateSlug(trimmedTitle);

    if (!slug) {
      return sendError(res, 'Unable to generate slug from title', 400);
    }

    /**
     * Check duplicate slug
     */
    const existingBlog = await Blog.findOne({ slug });

    if (existingBlog) {
      return sendError(res, `Blog '${trimmedTitle}' already exists`, 409);
    }

    /**
     * Upload image
     */
    const imageObj = await parseImageInput(req, 'blogs', 'images');

    if (imageObj?.key) {
      uploadedKey = imageObj.key;
    }

    /**
     * Parse FAQs
     */
    const faqs = parseFaqsInput(req.body.faqs);

    /**
     * Create blog
     */
    const blog = await Blog.create({
      title: trimmedTitle,
      slug,
      content: content.trim(),
      categoryId: new Types.ObjectId(categoryId),
      image: imageObj,
      isActive: activeValue,
      seo,
      faqs,
    });

    /**
     * Populate category
     */
    const populatedBlog = await Blog.findById(blog._id)
      .populate('categoryId', 'name slug')
      .lean();

    logger.info(`[BlogController] Blog created: ${blog._id}`);

    return sendSuccess(res, 'Blog created successfully', populatedBlog, 201);
  } catch (error: any) {
    /**
     * Rollback uploaded image
     * if DB operation fails
     */
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[BlogController] Rollback S3 image failed ${uploadedKey}:`, err)
      );
    }

    if (error.code === 11000) {
      return sendError(res, 'Duplicate blog record', 409);
    }

    logger.error('[BlogController] create error:', error);

    return sendError(res, error.message || 'Failed to create blog', 500);
  }
};

/**
 * Get paginated blogs
 *
 * GET /blogs
 */
export const getBlogs = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};

    /**
     * Search title / slug / content
     */
    const searchStr = (req.query.search || req.query.q) as string;

    if (searchStr && searchStr.trim()) {
      const search = searchStr.trim();

      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    /**
     * Category filter
     */
    if (req.query.categoryId) {
      const categoryId = req.query.categoryId as string;

      if (!Types.ObjectId.isValid(categoryId)) {
        return sendError(res, 'Invalid category ID', 400);
      }

      filter.categoryId = new Types.ObjectId(categoryId);
    }

    /**
     * Active filter
     *
     * Supports:
     * ?isActive=true
     * ?isActive=false
     */
    if (req.query.isActive !== undefined) {
      const parsed = parseBoolean(req.query.isActive);

      if (parsed === undefined) {
        return sendError(res, 'isActive must be a boolean', 400);
      }

      filter.isActive = parsed;
    }

    const [items, total] = await Promise.all([
      Blog.find(filter)
        .populate('categoryId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Blog.countDocuments(filter),
    ]);

    return sendSuccess(res, 'Blogs fetched successfully', {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: any) {
    logger.error('[BlogController] list error:', error);

    return sendError(res, 'Failed to fetch blogs', 500);
  }
};

/**
 * Get single blog by ID
 *
 * GET /blogs/:blogId
 */
export const getBlogById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { blogId } = req.params;

    if (!Types.ObjectId.isValid(blogId)) {
      return sendError(res, 'Invalid blog ID', 400);
    }

    const blog = await Blog.findById(blogId)
      .populate('categoryId', 'name slug')
      .lean();

    if (!blog) {
      return sendError(res, 'Blog not found', 404);
    }

    return sendSuccess(res, 'Blog fetched successfully', blog);
  } catch (error: any) {
    logger.error('[BlogController] getById error:', error);

    return sendError(res, 'Failed to fetch blog', 500);
  }
};

/**
 * Update blog
 *
 * PUT /blogs/:blogId
 * PATCH /blogs/:blogId
 */
export const updateBlog = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;

  try {
    const { blogId } = req.params;

    if (!Types.ObjectId.isValid(blogId)) {
      return sendError(res, 'Invalid blog ID', 400);
    }

    const blog = await Blog.findById(blogId);

    if (!blog) {
      return sendError(res, 'Blog not found', 404);
    }

    const { title, content, categoryId, isActive } = req.body;

    /**
     * Keep old image key
     * for cleanup after successful update.
     */
    const oldImageKey = blog.image?.key || extractKeyFromUrl(blog.image?.url);

    /**
     * Validate and update title
     */
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return sendError(res, 'Blog title cannot be empty', 400);
      }

      if (title.trim().length > 200) {
        return sendError(res, 'Blog title cannot exceed 200 characters', 400);
      }

      const trimmedTitle = title.trim();

      /**
       * Regenerate slug
       * when title changes.
       */
      if (trimmedTitle !== blog.title) {
        const newSlug = generateSlug(trimmedTitle);

        if (!newSlug) {
          return sendError(res, 'Unable to generate slug from title', 400);
        }

        const existingBlog = await Blog.findOne({
          slug: newSlug,
          _id: { $ne: blogId },
        });

        if (existingBlog) {
          return sendError(res, `Blog '${trimmedTitle}' already exists`, 409);
        }

        blog.title = trimmedTitle;
        blog.slug = newSlug;
      }
    }

    /**
     * Update content
     */
    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim() === '') {
        return sendError(res, 'Blog content cannot be empty', 400);
      }

      blog.content = content.trim();
    }

    /**
     * Validate and update category
     */
    if (categoryId !== undefined) {
      if (!Types.ObjectId.isValid(categoryId)) {
        return sendError(res, 'Invalid category ID', 400);
      }

      const category = await BlogCategory.findById(categoryId);

      if (!category) {
        return sendError(res, 'Blog category not found', 404);
      }

      blog.categoryId = new Types.ObjectId(categoryId);
    }

    /**
     * Validate and update isActive
     */
    if (isActive !== undefined) {
      const parsed = parseBoolean(isActive);

      if (parsed === undefined) {
        return sendError(res, 'isActive must be a boolean', 400);
      }

      blog.isActive = parsed;
    }

    /**
     * Parse SEO
     */
    if (req.body.seo !== undefined) {
      const seo = parseSeoInput(req.body.seo);

      const seoError = validateSeo(seo);

      if (seoError) {
        return sendError(res, seoError, 400);
      }

      blog.seo = seo;
    }

    /**
     * Parse FAQs
     */
    if (req.body.faqs !== undefined) {
      const faqs = parseFaqsInput(req.body.faqs);

      blog.faqs = faqs || [];
    }

    /**
     * Upload / parse image
     */
    const imageObj = await parseImageInput(req, 'blogs', 'images');

    if (imageObj !== undefined) {
      blog.image = imageObj;

      if (imageObj.key) {
        uploadedKey = imageObj.key;
      }
    }

    /**
     * Final duplicate slug check
     */
    const duplicate = await Blog.findOne({
      _id: { $ne: blogId },
      slug: blog.slug,
    });

    if (duplicate) {
      return sendError(res, `Blog '${blog.title}' already exists`, 409);
    }

    await blog.save();

    /**
     * Delete old image only
     * after successful DB update.
     */
    if (oldImageKey && blog.image?.key && oldImageKey !== blog.image.key) {
      deleteFile(oldImageKey).catch((err) =>
        logger.error(`[BlogController] Failed to delete old image ${oldImageKey}:`, err)
      );
    }

    const updatedBlog = await Blog.findById(blog._id)
      .populate('categoryId', 'name slug')
      .lean();

    logger.info(`[BlogController] Blog updated: ${blogId}`);

    return sendSuccess(res, 'Blog updated successfully', updatedBlog);
  } catch (error: any) {
    /**
     * Rollback newly uploaded image
     * when update fails.
     */
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[BlogController] Rollback S3 image failed ${uploadedKey}:`, err)
      );
    }

    if (error.code === 11000) {
      return sendError(res, 'Duplicate blog record', 409);
    }

    logger.error('[BlogController] update error:', error);

    return sendError(res, error.message || 'Failed to update blog', 500);
  }
};

/**
 * Toggle blog active status
 *
 * PATCH /blogs/:blogId/toggle-status
 */
export const toggleBlogStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { blogId } = req.params;

    if (!Types.ObjectId.isValid(blogId)) {
      return sendError(res, 'Invalid blog ID', 400);
    }

    const blog = await Blog.findById(blogId);

    if (!blog) {
      return sendError(res, 'Blog not found', 404);
    }

    blog.isActive = !blog.isActive;

    await blog.save();

    const updatedBlog = await Blog.findById(blog._id)
      .populate('categoryId', 'name slug')
      .lean();

    logger.info(
      `[BlogController] Blog status toggled: ${blogId} -> ${
        blog.isActive ? 'active' : 'inactive'
      }`
    );

    return sendSuccess(
      res,
      `Blog ${blog.isActive ? 'activated' : 'deactivated'} successfully`,
      updatedBlog
    );
  } catch (error: any) {
    logger.error('[BlogController] toggle status error:', error);

    return sendError(res, 'Failed to update blog status', 500);
  }
};

/**
 * Delete blog
 *
 * DELETE /blogs/:blogId
 */
export const deleteBlog = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { blogId } = req.params;

    if (!Types.ObjectId.isValid(blogId)) {
      return sendError(res, 'Invalid blog ID', 400);
    }

    const blog = await Blog.findById(blogId);

    if (!blog) {
      return sendError(res, 'Blog not found', 404);
    }

    /**
     * Store image key before
     * deleting DB record.
     */
    const imageKey = blog.image?.key || extractKeyFromUrl(blog.image?.url);

    await Blog.deleteOne({ _id: blogId });

    /**
     * Delete S3 image.
     */
    if (imageKey) {
      deleteFile(imageKey).catch((err) =>
        logger.error(`[BlogController] Failed to delete S3 image ${imageKey}:`, err)
      );
    }

    logger.info(`[BlogController] Blog deleted: ${blogId}`);

    return sendSuccess(res, 'Blog deleted successfully');
  } catch (error: any) {
    logger.error('[BlogController] delete error:', error);

    return sendError(res, 'Failed to delete blog', 500);
  }
};