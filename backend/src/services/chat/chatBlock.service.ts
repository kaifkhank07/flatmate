import { Types } from 'mongoose';
import { ChatBlock } from '../../models/chats/ChatBlock';
import { User } from '../../models/auth/user.model';

export const checkBlockStatus = async (
  userAId: Types.ObjectId | string,
  userBId: Types.ObjectId | string
): Promise<{ isBlocked: boolean; blockerId?: Types.ObjectId }> => {
  const userAObj = new Types.ObjectId(userAId.toString());
  const userBObj = new Types.ObjectId(userBId.toString());

  const block = await ChatBlock.findOne({
    $or: [
      { blockerId: userAObj, blockedUserId: userBObj },
      { blockerId: userBObj, blockedUserId: userAObj },
    ],
  });

  if (block) {
    return { isBlocked: true, blockerId: block.blockerId };
  }

  return { isBlocked: false };
};

export const blockUser = async (
  blockerId: Types.ObjectId | string,
  blockedUserId: Types.ObjectId | string,
  reason?: string
) => {
  const blockerObj = new Types.ObjectId(blockerId.toString());
  const blockedUserObj = new Types.ObjectId(blockedUserId.toString());

  if (blockerObj.equals(blockedUserObj)) {
    throw new Error('You cannot block yourself');
  }

  const targetUser = await User.findById(blockedUserObj);
  if (!targetUser || targetUser.isDeleted) {
    throw new Error('User to block does not exist or is deactivated');
  }

  const existingBlock = await ChatBlock.findOne({
    blockerId: blockerObj,
    blockedUserId: blockedUserObj,
  });

  if (existingBlock) {
    if (reason && existingBlock.reason !== reason) {
      existingBlock.reason = reason;
      await existingBlock.save();
    }
    return existingBlock;
  }

  const newBlock = await ChatBlock.create({
    blockerId: blockerObj,
    blockedUserId: blockedUserObj,
    reason,
  });

  return newBlock;
};

export const unblockUser = async (
  blockerId: Types.ObjectId | string,
  blockedUserId: Types.ObjectId | string
) => {
  const blockerObj = new Types.ObjectId(blockerId.toString());
  const blockedUserObj = new Types.ObjectId(blockedUserId.toString());

  const result = await ChatBlock.deleteOne({
    blockerId: blockerObj,
    blockedUserId: blockedUserObj,
  });

  return result.deletedCount > 0;
};

export const getBlockedUsers = async (
  blockerId: Types.ObjectId | string,
  page: number = 1,
  limit: number = 20
) => {
  const blockerObj = new Types.ObjectId(blockerId.toString());
  const skip = (page - 1) * limit;

  const total = await ChatBlock.countDocuments({ blockerId: blockerObj });
  const blocks = await ChatBlock.find({ blockerId: blockerObj })
    .populate({
      path: 'blockedUserId',
      select: 'email mobile role accountStatus profileVerified verificationStatus createdAt',
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    blockedUsers: blocks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};
