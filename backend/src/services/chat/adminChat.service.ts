import { Types } from 'mongoose';
import { ChatConversation } from '../../models/chats/ChatConversation';
import { ChatMessage } from '../../models/chats/ChatMessage';
import { getParticipantSummary } from './chatConversation.service';

/**
 * Get paginated list of all platform conversations for admin monitoring
 */
export const getAdminConversations = async (
  page: number = 1,
  limit: number = 20,
  search?: string,
  user1Id?: string,
  user2Id?: string
) => {
  const skip = (page - 1) * limit;

  const query: any = {
    isActive: true,
  };

  const validUser1 = user1Id && Types.ObjectId.isValid(user1Id) ? new Types.ObjectId(user1Id) : null;
  const validUser2 = user2Id && Types.ObjectId.isValid(user2Id) ? new Types.ObjectId(user2Id) : null;

  if (validUser1 && validUser2) {
    query.participants = {
      $all: [validUser1, validUser2],
    };
  } else if (validUser1) {
    query.participants = validUser1;
  } else if (validUser2) {
    query.participants = validUser2;
  }

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
        otherParticipant: participantSummaries[1] || participantSummaries[0] || null,
        lastMessage,
        lastMessageAt: conv.lastMessageAt || conv.createdAt,
        unreadCounts: conv.unreadCounts,
        isActive: conv.isActive,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    })
  );

  // Filter by search term if provided
  let resultList = formattedConversations;
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    resultList = formattedConversations.filter((c) => {
      return (
        searchRegex.test(c._id.toString()) ||
        c.participants.some((p) => {
          if (!p) return false;
          const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
          return (
            searchRegex.test(fullName) ||
            searchRegex.test(p.email || '') ||
            searchRegex.test(p.mobile || '')
          );
        })
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
 * Get specific conversation details by ID for admin
 */
export const getAdminConversationById = async (conversationId: Types.ObjectId | string) => {
  const convObj = new Types.ObjectId(conversationId.toString());

  const conversation = await ChatConversation.findById(convObj).populate({
    path: 'lastMessageId',
    select: 'senderId receiverId type text attachment property flatmate status isDeleted createdAt',
  });

  if (!conversation || !conversation.isActive) {
    throw new Error('Conversation not found');
  }

  const participantSummaries = await Promise.all(
    conversation.participants.map((pId) => getParticipantSummary(pId))
  );

  return {
    _id: conversation._id,
    participants: participantSummaries,
    otherParticipant: participantSummaries[1] || participantSummaries[0] || null,
    lastMessage: conversation.lastMessageId || null,
    lastMessageAt: conversation.lastMessageAt || conversation.createdAt,
    unreadCounts: conversation.unreadCounts,
    isActive: conversation.isActive,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

/**
 * Get paginated list of messages for a conversation for admin monitoring
 */
export const getAdminConversationMessages = async (
  conversationId: Types.ObjectId | string,
  page: number = 1,
  limit: number = 50,
  before?: string
) => {
  const convObj = new Types.ObjectId(conversationId.toString());

  const conversation = await ChatConversation.findById(convObj);
  if (!conversation || !conversation.isActive) {
    throw new Error('Conversation not found');
  }

  const query: any = {
    conversationId: convObj,
  };

  if (before) {
    query._id = { $lt: new Types.ObjectId(before) };
  }

  const skip = (page - 1) * limit;
  const total = await ChatMessage.countDocuments({ conversationId: convObj });

  const messages = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Format messages (obscure content if soft deleted)
  const formattedMessages = messages.map((msg) => {
    const msgObj = msg.toObject();
    if (msgObj.isDeleted) {
      delete msgObj.text;
      delete msgObj.attachment;
      delete msgObj.property;
      delete msgObj.flatmate;
      msgObj.text = 'This message was deleted';
    }
    return msgObj;
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    messages: formattedMessages,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};
