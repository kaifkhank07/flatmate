import { Request, Response } from 'express';
import { Report, ReportTargetType, getTargetModelName } from '../../models/listing/report.model';
import { Property } from '../../models/listing/property.model';
import { FlatmateRequirement } from '../../models/listing/flatmateRequirements.model';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { Types } from 'mongoose';

/** Helper to verify if target property or flatmate post exists in database */
const verifyTargetExists = async (targetType: string, targetId: string): Promise<boolean> => {
  if (targetType === 'property') {
    const exists = await Property.exists({ _id: targetId });
    return !!exists;
  }
  if (targetType === 'flatmaterequirement') {
    const exists = await FlatmateRequirement.exists({ _id: targetId });
    return !!exists;
  }
  return false;
};

/** Create a report for a property or flatmate requirement */
export const createReport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;
    if (!userId) return sendError(res, 'Authentication required', 401);

    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return sendError(res, 'targetType, targetId, and reason are required', 400);
    }

    if (!['property', 'flatmaterequirement'].includes(targetType)) {
      return sendError(res, 'Invalid targetType', 400);
    }

    if (!Types.ObjectId.isValid(targetId)) {
      return sendError(res, 'Invalid targetId', 400);
    }

    const targetExists = await verifyTargetExists(targetType, targetId);
    if (!targetExists) {
      return sendError(
        res,
        `${targetType === 'property' ? 'Property' : 'Flatmate Requirement'} not found`,
        404
      );
    }

    const existingPending = await Report.findOne({
      userId,
      targetType,
      targetId,
      status: 'pending',
    });

    if (existingPending) {
      return sendError(
        res,
        'You have already submitted a pending report for this item',
        409
      );
    }

    const targetModel = getTargetModelName(targetType);

    const report = await Report.create({
      userId,
      targetType,
      targetModel,
      targetId,
      reason,
      description,
      status: 'pending',
    });

    logger.info(`User ${userId} reported ${targetType} ${targetId} for reason: ${reason}`);
    return sendSuccess(res, 'Report submitted successfully', report, 201);
  } catch (error: any) {
    logger.error('[Report] create error:', error);
    return sendError(res, 'Failed to submit report', 500);
  }
};

/** Get grouped/paginated list of reports (Admin / Users) */
export const getReports = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;
    const adminId = req.admin?._id;

    if (!userId && !adminId) {
      return sendError(res, 'Authentication required', 401);
    }

    const targetType = req.query.targetType as string | undefined;
    const status = req.query.status as string | undefined;
    const targetStatus = req.query.targetStatus as string | undefined;
    const search = req.query.search as string | undefined;

    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit as string) || 20, 1),
      100
    );
    const skip = (page - 1) * limit;

    // ---------------------------------------------------------
    // Build match criteria
    // ---------------------------------------------------------
    const match: Record<string, any> = {};

    // Normal user can only see their own reports
    if (!adminId && userId) {
      match.userId = userId;
    }

    // Admin can optionally filter reports by reporter
    if (
      adminId &&
      req.query.userId &&
      Types.ObjectId.isValid(req.query.userId as string)
    ) {
      match.userId = new Types.ObjectId(req.query.userId as string);
    }

    // Target type filter
    if (targetType && ['property', 'flatmaterequirement'].includes(targetType)) {
      match.targetType = targetType;
    }

    // Report status filter (if explicitly passed as one of the report statuses)
    if (
      status &&
      ['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)
    ) {
      match.status = status;
    }

    // ---------------------------------------------------------
    // Aggregation Base Pipeline
    // ---------------------------------------------------------
    const basePipeline: any[] = [
      {
        $match: match,
      },

      // Sort first so $first gives us the latest report
      {
        $sort: {
          createdAt: -1,
          _id: -1,
        },
      },

      // Group all reports for the same target
      {
        $group: {
          _id: {
            targetId: '$targetId',
            targetType: '$targetType',
          },

          // Total number of reports for this target
          reportCount: {
            $sum: 1,
          },

          // Latest report
          latestReport: {
            $first: '$$ROOT',
          },

          // Keep all report IDs for the details view
          reportIds: {
            $push: '$_id',
          },
        },
      },

      // ---------------------------------------------------------
      // Lookup property
      // ---------------------------------------------------------
      {
        $lookup: {
          from: 'properties',
          let: {
            targetId: '$_id.targetId',
            targetType: '$_id.targetType',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$_id', '$$targetId'],
                    },
                    {
                      $eq: ['$$targetType', 'property'],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                title: 1,
                slug: 1,
                status: 1,
                location: 1,
                ownerId: 1,
                images: 1,
              },
            },
          ],
          as: 'propertyTarget',
        },
      },

      // ---------------------------------------------------------
      // Lookup flatmate requirement
      // ---------------------------------------------------------
      {
        $lookup: {
          from: 'flatmaterequirements',
          let: {
            targetId: '$_id.targetId',
            targetType: '$_id.targetType',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$_id', '$$targetId'],
                    },
                    {
                      $eq: ['$$targetType', 'flatmaterequirement'],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                title: 1,
                slug: 1,
                description: 1,
                postType: 1,
                propertyType: 1,
                partnerType: 1,
                location: 1,
                budget: 1,
                occupationPreference: 1,
                genderPreference: 1,
                moveInDate: 1,
                peopleCount: 1,
                status: 1,
                rejectionReason: 1,
                userId: 1,
                images: 1,
                videos: 1,
                expiresAt: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          as: 'flatmateTarget',
        },
      },

      // ---------------------------------------------------------
      // Select correct target
      // ---------------------------------------------------------
      {
        $addFields: {
          target: {
            $cond: [
              {
                $eq: ['$_id.targetType', 'property'],
              },
              {
                $arrayElemAt: ['$propertyTarget', 0],
              },
              {
                $arrayElemAt: ['$flatmateTarget', 0],
              },
            ],
          },
        },
      },
    ];

    // Post lookup filters (target status & search)
    const postLookupMatch: Record<string, any> = {};
    const effectiveTargetStatus = targetStatus || (status && !['pending', 'reviewed', 'resolved', 'dismissed'].includes(status) ? status : undefined);

    if (effectiveTargetStatus && effectiveTargetStatus !== 'all') {
      postLookupMatch['target.status'] = effectiveTargetStatus;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      postLookupMatch['$or'] = [
        { 'target.title': searchRegex },
        { 'target.slug': searchRegex },
        { 'latestReport.reason': searchRegex },
      ];
    }

    if (Object.keys(postLookupMatch).length > 0) {
      basePipeline.push({ $match: postLookupMatch });
    }

    const itemsPipeline: any[] = [
      ...basePipeline,

      // ---------------------------------------------------------
      // Final response structure
      // ---------------------------------------------------------
      {
        $project: {
          _id: 0,

          targetId: '$_id.targetId',
          targetType: '$_id.targetType',

          reportCount: 1,
          reportIds: 1,

          title: {
            $ifNull: ['$target.title', null],
          },

          slug: {
            $ifNull: ['$target.slug', null],
          },

          targetStatus: {
            $ifNull: ['$target.status', null],
          },

          target: 1,

          // Latest report information
          latestReport: {
            _id: '$latestReport._id',
            userId: '$latestReport.userId',
            reason: '$latestReport.reason',
            status: '$latestReport.status',
            createdAt: '$latestReport.createdAt',
            updatedAt: '$latestReport.updatedAt',
          },

          status: '$latestReport.status',
          createdAt: '$latestReport.createdAt',
          updatedAt: '$latestReport.updatedAt',
        },
      },

      // Highest reported items first
      {
        $sort: {
          reportCount: -1,
          createdAt: -1,
        },
      },

      // Pagination
      {
        $skip: skip,
      },

      {
        $limit: limit,
      },
    ];

    const items = await Report.aggregate(itemsPipeline);

    // ---------------------------------------------------------
    // Count distinct reported targets
    // ---------------------------------------------------------
    const countPipeline: any[] = [
      ...basePipeline,
      {
        $count: 'total',
      },
    ];

    const totalResult = await Report.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    return sendSuccess(res, 'Reports fetched successfully', {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    logger.error('[Report] get error:', error);
    return sendError(res, 'Failed to fetch reports', 500);
  }
};

/** Get a single report by ID */
export const getReportById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { reportId } = req.params;

    if (!Types.ObjectId.isValid(reportId)) {
      return sendError(res, 'Invalid report ID', 400);
    }

    const report = await Report.findById(reportId)
      .populate({
        path: 'userId',
        select: 'name email mobile role accountStatus',
      })
      .populate({
        path: 'resolvedBy',
        select: 'name email mobile role',
      })
      .lean();

    if (!report) {
      return sendError(res, 'Report not found', 404);
    }

    // ---------------------------------------------------------
    // Populate target manually because target can be
    // Property OR FlatmateRequirement
    // ---------------------------------------------------------
    let target = null;

    if (report.targetType === 'property') {
      target = await Property.findById(report.targetId)
        .populate('location')
        .lean();
    } else if (report.targetType === 'flatmaterequirement') {
      target = await FlatmateRequirement.findById(report.targetId)
        .populate('location')
        .populate('userId', 'name email mobile')
        .lean();
    }

    return sendSuccess(res, 'Report fetched successfully', {
      ...report,
      target,
    });
  } catch (error: any) {
    logger.error('[Report] getById error:', error);
    return sendError(res, 'Failed to fetch report details', 500);
  }
};

/** Get all individual reports for a specific target */
export const getReportsByTarget = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { targetType, targetId } = req.params;

    if (!Types.ObjectId.isValid(targetId)) {
      return sendError(res, 'Invalid target ID', 400);
    }

    if (!['property', 'flatmaterequirement'].includes(targetType)) {
      return sendError(res, 'Invalid targetType', 400);
    }

    const reports = await Report.find({ targetType, targetId })
      .populate({
        path: 'userId',
        select: 'name email mobile role accountStatus',
      })
      .populate({
        path: 'resolvedBy',
        select: 'name email mobile role',
      })
      .sort({ createdAt: -1 })
      .lean();

    let target = null;
    if (targetType === 'property') {
      target = await Property.findById(targetId)
        .select('title slug status location images ownerId rent description')
        .populate('location')
        .lean();
    } else if (targetType === 'flatmaterequirement') {
      target = await FlatmateRequirement.findById(targetId)
        .select(
          'title slug description postType propertyType partnerType location budget occupationPreference genderPreference lifestylePreferences moveInDate peopleCount images videos expiresAt status rejectionReason userId createdAt updatedAt'
        )
        .populate('location')
        .populate('userId', 'name email mobile')
        .lean();
    }

    return sendSuccess(res, 'Target reports fetched successfully', {
      reports,
      target,
    });
  } catch (error: any) {
    logger.error('[Report] getReportsByTarget error:', error);
    return sendError(res, 'Failed to fetch target reports', 500);
  }
};

/** Update report status (Admin / Resolution) */
export const updateReportStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const resolverId = req.admin?._id || req.user?._id;
    if (!resolverId) return sendError(res, 'Authentication required', 401);

    const { reportId } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!Types.ObjectId.isValid(reportId)) return sendError(res, 'Invalid report ID', 400);

    const report = await Report.findById(reportId);
    if (!report) return sendError(res, 'Report not found', 404);

    report.status = status;
    if (resolutionNotes !== undefined) {
      report.resolutionNotes = resolutionNotes;
    }
    report.resolvedBy = resolverId;
    report.resolvedAt = new Date();

    await report.save();

    logger.info(`Report ${reportId} status updated to ${status} by ${resolverId}`);
    return sendSuccess(res, 'Report status updated successfully', report);
  } catch (error: any) {
    logger.error('[Report] updateStatus error:', error);
    return sendError(res, 'Failed to update report status', 500);
  }
};

/** Delete a report */
export const deleteReport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;
    const adminId = req.admin?._id;

    if (!userId && !adminId) return sendError(res, 'Authentication required', 401);

    const { reportId } = req.params;
    if (!Types.ObjectId.isValid(reportId)) return sendError(res, 'Invalid report ID', 400);

    const query: any = { _id: reportId };
    if (!adminId && userId) {
      query.userId = userId;
    }

    const result = await Report.deleteOne(query);
    if (result.deletedCount === 0) {
      return sendError(res, 'Report not found or unauthorized to delete', 404);
    }

    logger.info(`Report ${reportId} deleted`);
    return sendSuccess(res, 'Report deleted successfully');
  } catch (error: any) {
    logger.error('[Report] delete error:', error);
    return sendError(res, 'Failed to delete report', 500);
  }
};
