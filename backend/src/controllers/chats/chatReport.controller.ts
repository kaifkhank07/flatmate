import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { createChatReport, getChatReports } from '../../services/chat/chatReport.service';

/**
 * Submit report for a chat user/conversation
 * POST /api/chat-reports
 */
export const createChatReportHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const { reportedUserId, reason, description } = req.body;

    const report = await createChatReport(
      req.user._id,
      reportedUserId,
      reason,
      description
    );

    return sendSuccess(res, 'Report submitted successfully. Our team will review it.', report, 201);
  } catch (error: any) {
    logger.error('[ChatReportController] Failed to submit report:', error);
    const statusCode = error.message.includes('yourself')
      ? 400
      : error.message.includes('not exist')
      ? 404
      : 500;
    return sendError(res, error.message || 'Failed to submit report', statusCode);
  }
};

/**
 * Get current user's submitted chat reports
 * GET /api/chat-reports
 */
export const getMyChatReportsHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await getChatReports(req.user._id, page, limit);

    return sendSuccess(res, 'Reports fetched successfully', result);
  } catch (error: any) {
    logger.error('[ChatReportController] Failed to fetch reports:', error);
    return sendError(res, 'Failed to fetch reports', 500);
  }
};
