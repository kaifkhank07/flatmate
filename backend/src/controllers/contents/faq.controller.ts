import { Request, Response } from 'express';
import { FAQ, FAQPage } from '../../models/contents/faqs.model';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { Types } from 'mongoose';

const VALID_PAGES: FAQPage[] = ['home', 'property', 'flatmate', 'rental', 'contact'];

/**
 * Create FAQ
 * POST /api/faqs
 */
export const createFAQ = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { question, answer, page, isActive } = req.body;

        if (!question || typeof question !== 'string' || !question.trim()) {
            return sendError(res, 'Question is required', 400);
        }

        if (!answer || typeof answer !== 'string' || !answer.trim()) {
            return sendError(res, 'Answer is required', 400);
        }

        if (!page || !VALID_PAGES.includes(page as FAQPage)) {
            return sendError(
                res,
                `Page is required and must be one of: ${VALID_PAGES.join(', ')}`,
                400
            );
        }

        const faq = await FAQ.create({
            question: question.trim(),
            answer: answer.trim(),
            page,
            isActive: isActive ?? true,
        });

        logger.info(`[FAQController] FAQ created successfully: ${faq._id}`);

        return sendSuccess(res, 'FAQ created successfully', faq, 201);
    } catch (error: any) {
        logger.error('[FAQController] Failed to create FAQ:', error);
        return sendError(res, error.message || 'Failed to create FAQ', 500);
    }
};

/**
 * Get FAQs (supporting page filter, search, pagination, isActive)
 * GET /api/faqs
 */
export const getFAQs = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const query: any = {};

        // Extract page filter vs pagination page number
        let pageFilter: FAQPage | undefined;
        let pageNumber = 1;

        const rawPageParam = (req.query.faqPage || req.query.page) as string | undefined;

        if (rawPageParam && VALID_PAGES.includes(rawPageParam as FAQPage)) {
            pageFilter = rawPageParam as FAQPage;
        }

        if (req.query.page && !isNaN(parseInt(req.query.page as string, 10))) {
            pageNumber = Math.max(1, parseInt(req.query.page as string, 10));
        }

        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
        const skip = (pageNumber - 1) * limit;

        if (pageFilter) {
            query.page = pageFilter;
        }

        const { search, isActive } = req.query;

        if (search && typeof search === 'string' && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { question: searchRegex },
                { answer: searchRegex },
            ];
        }

        if (isActive !== undefined) {
            query.isActive = String(isActive) === 'true';
        }

        const [faqs, total] = await Promise.all([
            FAQ.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            FAQ.countDocuments(query),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        return sendSuccess(res, 'FAQs fetched successfully', {
            faqs,
            pagination: {
                page: pageNumber,
                limit,
                total,
                totalPages,
            },
        });
    } catch (error: any) {
        logger.error('[FAQController] Failed to fetch FAQs:', error);
        return sendError(res, 'Failed to fetch FAQs', 500);
    }
};

/**
 * Get FAQs by Page
 * GET /api/faqs/page/:page
 */
export const getFAQsByPage = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { page } = req.params;

        if (!VALID_PAGES.includes(page as FAQPage)) {
            return sendError(res, `Invalid page parameter. Must be one of: ${VALID_PAGES.join(', ')}`, 400);
        }

        const faqs = await FAQ.find({
            page,
            isActive: true,
        })
            .sort({ createdAt: -1 })
            .lean();

        return sendSuccess(res, 'Page FAQs fetched successfully', faqs);
    } catch (error: any) {
        logger.error('[FAQController] Failed to fetch page FAQs:', error);
        return sendError(res, 'Failed to fetch page FAQs', 500);
    }
};

/**
 * Get FAQ by ID
 * GET /api/faqs/:faqId
 */
export const getFAQById = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { faqId } = req.params;

        if (!Types.ObjectId.isValid(faqId)) {
            return sendError(res, 'Invalid FAQ ID', 400);
        }

        const faq = await FAQ.findById(faqId).lean();

        if (!faq) {
            return sendError(res, 'FAQ not found', 404);
        }

        return sendSuccess(res, 'FAQ fetched successfully', faq);
    } catch (error: any) {
        logger.error('[FAQController] Failed to fetch FAQ:', error);
        return sendError(res, 'Failed to fetch FAQ', 500);
    }
};

/**
 * Update FAQ
 * PUT /api/faqs/:faqId or PATCH /api/faqs/:faqId
 */
export const updateFAQ = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { faqId } = req.params;

        if (!Types.ObjectId.isValid(faqId)) {
            return sendError(res, 'Invalid FAQ ID', 400);
        }

        const faq = await FAQ.findById(faqId);

        if (!faq) {
            return sendError(res, 'FAQ not found', 404);
        }

        const { question, answer, page, isActive } = req.body;

        if (page !== undefined) {
            if (!VALID_PAGES.includes(page as FAQPage)) {
                return sendError(
                    res,
                    `Page must be one of: ${VALID_PAGES.join(', ')}`,
                    400
                );
            }
            faq.page = page as FAQPage;
        }

        if (question !== undefined) {
            if (typeof question !== 'string' || !question.trim()) {
                return sendError(res, 'Question cannot be empty', 400);
            }
            faq.question = question.trim();
        }

        if (answer !== undefined) {
            if (typeof answer !== 'string' || !answer.trim()) {
                return sendError(res, 'Answer cannot be empty', 400);
            }
            faq.answer = answer.trim();
        }

        if (isActive !== undefined) {
            faq.isActive = Boolean(isActive === true || isActive === 'true');
        }

        await faq.save();

        logger.info(`[FAQController] FAQ updated: ${faqId}`);

        return sendSuccess(res, 'FAQ updated successfully', faq);
    } catch (error: any) {
        logger.error('[FAQController] Failed to update FAQ:', error);
        return sendError(res, error.message || 'Failed to update FAQ', 500);
    }
};

/**
 * Delete FAQ
 * DELETE /api/faqs/:faqId
 */
export const deleteFAQ = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { faqId } = req.params;

        if (!Types.ObjectId.isValid(faqId)) {
            return sendError(res, 'Invalid FAQ ID', 400);
        }

        const faq = await FAQ.findById(faqId);

        if (!faq) {
            return sendError(res, 'FAQ not found', 404);
        }

        await FAQ.deleteOne({ _id: faqId });

        logger.info(`[FAQController] FAQ deleted: ${faqId}`);

        return sendSuccess(res, 'FAQ deleted successfully');
    } catch (error: any) {
        logger.error('[FAQController] Failed to delete FAQ:', error);
        return sendError(res, 'Failed to delete FAQ', 500);
    }
};