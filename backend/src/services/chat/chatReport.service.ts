import { Types } from 'mongoose';
import { ChatReport, ChatReportReason } from '../../models/chats/ChatReport';
import { User } from '../../models/auth/user.model';

export const createChatReport = async (
  reporterId: Types.ObjectId | string,
  reportedUserId: Types.ObjectId | string,
  reason: ChatReportReason,
  description?: string
) => {
  const reporterObj = new Types.ObjectId(reporterId.toString());
  const reportedUserObj = new Types.ObjectId(reportedUserId.toString());

  if (reporterObj.equals(reportedUserObj)) {
    throw new Error('You cannot report yourself');
  }

  const targetUser = await User.findById(reportedUserObj);
  if (!targetUser || targetUser.isDeleted) {
    throw new Error('Reported user does not exist or has been removed');
  }

  const report = await ChatReport.create({
    reporterId: reporterObj,
    reportedUserId: reportedUserObj,
    reason,
    description: description?.trim() || undefined,
    status: 'pending',
  });

  return report;
};

export const getChatReports = async (
  reporterId: Types.ObjectId | string,
  page: number = 1,
  limit: number = 20
) => {
  const reporterObj = new Types.ObjectId(reporterId.toString());
  const skip = (page - 1) * limit;

  const total = await ChatReport.countDocuments({ reporterId: reporterObj });
  const reports = await ChatReport.find({ reporterId: reporterObj })
    .populate('reportedUserId', 'email mobile userType accountStatus')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};
