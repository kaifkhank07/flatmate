import { Types } from 'mongoose';
import { ChatConversation, IChatConversation } from '../../models/chats/ChatConversation';
import { User } from '../../models/auth/user.model';
import { UserProfile } from '../../models/auth/userProfile.model';
import { checkBlockStatus } from './chatBlock.service';

/**
 * Normalizes participant IDs by sorting them deterministically to match unique index
 */
export const normalizeParticipants = (
  userAId: Types.ObjectId | string,
  userBId: Types.ObjectId | string
): [Types.ObjectId, Types.ObjectId] => {
  const idA = userAId.toString();
  const idB = userBId.toString();

  if (idA === idB) {
    throw new Error('A conversation must be between two different users');
  }

  const sorted = [idA, idB].sort();
  return [new Types.ObjectId(sorted[0]), new Types.ObjectId(sorted[1])];
};

/**
 * Helper to fetch summary info for participants (User basic info + UserProfile name/avatar)
 */
export const getParticipantSummary = async (userId: Types.ObjectId | string) => {
  const userObj = new Types.ObjectId(userId.toString());
  const user = await User.findById(userObj).select('email mobile role accountStatus profileVerified verificationStatus');
  if (!user) return null;

  const profile = await UserProfile.findOne({ userId: userObj }).select('firstName lastName image gender');

  return {
    _id: user._id,
    email: user.email,
    mobile: user.mobile,
    accountStatus: user.accountStatus,
    profileVerified: user.profileVerified,
    verificationStatus: user.verificationStatus,
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    image: profile?.image?.url || '',
    gender: profile?.gender,
  };
};

/**
 * Get or create a conversation between current user and target receiver
 */
export const getOrCreateConversation = async (
  userId: Types.ObjectId | string,
  receiverId: Types.ObjectId | string
): Promise<{ conversation: any; isNew: boolean }> => {
  const userObj = new Types.ObjectId(userId.toString());
  const receiverObj = new Types.ObjectId(receiverId.toString());

  if (userObj.equals(receiverObj)) {
    throw new Error('You cannot start a conversation with yourself');
  }

  const receiver = await User.findById(receiverObj);
  if (!receiver || receiver.isDeleted) {
    throw new Error('User not found or account deactivated');
  }

  // Check block status
  const blockStatus = await checkBlockStatus(userObj, receiverObj);
  if (blockStatus.isBlocked) {
    throw new Error('Cannot start conversation due to block status');
  }

  const normalizedParticipants = normalizeParticipants(userObj, receiverObj);

  let conversation = await ChatConversation.findOne({
    participants: normalizedParticipants,
  }).populate({
    path: 'lastMessageId',
    select: 'senderId receiverId type text attachment property flatmate status createdAt',
  });

  let isNew = false;
  if (!conversation) {
    conversation = await ChatConversation.create({
      participants: normalizedParticipants,
      unreadCounts: new Map<string, number>(),
      isActive: true,
    });
    isNew = true;
  }

  // Format response with participant summaries
  const participantSummaries = await Promise.all(
    conversation.participants.map((pId) => getParticipantSummary(pId))
  );

  const otherParticipant = participantSummaries.find(
    (p) => p && p._id.toString() !== userObj.toString()
  ) || null;

  const currentUnreadCount =
    conversation.unreadCounts && conversation.unreadCounts.get
      ? conversation.unreadCounts.get(userObj.toString()) || 0
      : (conversation.unreadCounts as any)?.[userObj.toString()] || 0;

  const formattedConversation = {
    _id: conversation._id,
    participants: participantSummaries,
    otherParticipant,
    lastMessage: conversation.lastMessageId || null,
    lastMessageAt: conversation.lastMessageAt || conversation.createdAt,
    unreadCount: currentUnreadCount,
    isActive: conversation.isActive,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };

  return { conversation: formattedConversation, isNew };
};

/**
 * Get paginated list of conversations for authenticated user
 */
export const getUserConversations = async (
  userId: Types.ObjectId | string,
  page: number = 1,
  limit: number = 20,
  search?: string
) => {
  const userObj = new Types.ObjectId(userId.toString());
  const skip = (page - 1) * limit;

  const query: any = {
    participants: userObj,
    isActive: true,
  };

  const total = await ChatConversation.countDocuments(query);
  const conversations = await ChatConversation.find(query)
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'lastMessageId',
      select: 'senderId receiverId type text attachment property flatmate status isDeleted createdAt',
    });

  const formattedConversations = await Promise.all(
    conversations.map(async (conv) => {
      const participantSummaries = await Promise.all(
        conv.participants.map((pId) => getParticipantSummary(pId))
      );

      const otherParticipant = participantSummaries.find(
        (p) => p && p._id.toString() !== userObj.toString()
      ) || null;

      const unreadCount =
        conv.unreadCounts && conv.unreadCounts.get
          ? conv.unreadCounts.get(userObj.toString()) || 0
          : (conv.unreadCounts as any)?.[userObj.toString()] || 0;

      let lastMessage: any = conv.lastMessageId || null;
      if (lastMessage && lastMessage.isDeleted) {
        lastMessage = {
          _id: lastMessage._id,
          senderId: lastMessage.senderId,
          receiverId: lastMessage.receiverId,
          type: lastMessage.type,
          text: 'This message was deleted',
          status: lastMessage.status,
          isDeleted: true,
          createdAt: lastMessage.createdAt,
        };
      }

      return {
        _id: conv._id,
        participants: participantSummaries,
        otherParticipant,
        lastMessage,
        lastMessageAt: conv.lastMessageAt || conv.createdAt,
        unreadCount,
        isActive: conv.isActive,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    })
  );

  // Filter by search term if provided (matches other participant's name/email)
  let resultList = formattedConversations;
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    resultList = formattedConversations.filter((c) => {
      if (!c.otherParticipant) return false;
      const fullName = `${c.otherParticipant.firstName || ''} ${c.otherParticipant.lastName || ''}`.trim();
      return (
        searchRegex.test(fullName) ||
        searchRegex.test(c.otherParticipant.email || '') ||
        searchRegex.test(c.otherParticipant.mobile || '')
      );
    });
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    conversations: resultList,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Get conversation details by ID for authenticated user
 */
export const getConversationById = async (
  conversationId: Types.ObjectId | string,
  userId: Types.ObjectId | string
) => {
  const convObj = new Types.ObjectId(conversationId.toString());
  const userObj = new Types.ObjectId(userId.toString());

  const conversation = await ChatConversation.findById(convObj).populate({
    path: 'lastMessageId',
    select: 'senderId receiverId type text attachment property flatmate status isDeleted createdAt',
  });

  if (!conversation || !conversation.isActive) {
    throw new Error('Conversation not found');
  }

  const isParticipant = conversation.participants.some((p) => p.equals(userObj));
  if (!isParticipant) {
    throw new Error('Unauthorized to view this conversation');
  }

  const participantSummaries = await Promise.all(
    conversation.participants.map((pId) => getParticipantSummary(pId))
  );

  const otherParticipant = participantSummaries.find(
    (p) => p && p._id.toString() !== userObj.toString()
  ) || null;

  const unreadCount =
    conversation.unreadCounts && conversation.unreadCounts.get
      ? conversation.unreadCounts.get(userObj.toString()) || 0
      : (conversation.unreadCounts as any)?.[userObj.toString()] || 0;

  return {
    _id: conversation._id,
    participants: participantSummaries,
    otherParticipant,
    lastMessage: conversation.lastMessageId || null,
    lastMessageAt: conversation.lastMessageAt || conversation.createdAt,
    unreadCount,
    isActive: conversation.isActive,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

/**
 * Verify user is a participant of a conversation
 */
export const verifyConversationParticipant = async (
  conversationId: Types.ObjectId | string,
  userId: Types.ObjectId | string
): Promise<IChatConversation> => {
  const convObj = new Types.ObjectId(conversationId.toString());
  const userObj = new Types.ObjectId(userId.toString());

  const conversation = await ChatConversation.findById(convObj);
  if (!conversation || !conversation.isActive) {
    throw new Error('Conversation not found');
  }

  const isParticipant = conversation.participants.some((p) => p.equals(userObj));
  if (!isParticipant) {
    throw new Error('Unauthorized access to conversation');
  }

  return conversation;
};
