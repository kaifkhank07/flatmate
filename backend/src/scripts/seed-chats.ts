import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../models/auth/user.model';
import { UserProfile } from '../models/auth/userProfile.model';
import { ChatConversation } from '../models/chats/ChatConversation';
import { ChatMessage } from '../models/chats/ChatMessage';
import { Property } from '../models/listing/property.model';
import { FlatmateRequirement } from '../models/listing/flatmateRequirements.model';
import { normalizeParticipants } from '../services/chat/chatConversation.service';
import { hashPassword } from '../utils/password.util';
import { logger } from '../utils/logger.util';

const seedChats = async (): Promise<void> => {
  try {
    await connectDB();

    logger.info('[Seed Script] Starting Chat Data Seeding...');

    // 1. Find or create test users
    let userA = await User.findOne({ email: 'test1@gmail.com', isDeleted: false });
    let userB = await User.findOne({ email: 'test2@gmail.com', isDeleted: false });

    if (!userA) {
      const hashedPass = await hashPassword('test1@123');
      userA = await User.create({
        email: 'test1@gmail.com',
        password: hashedPass,
        userType: 'flatmate',
        accountStatus: 'active',
        emailVerified: true,
        mobileVerified: true,
        profileVerified: true,
      });
      await UserProfile.create({
        userId: userA._id,
        firstName: 'Rahul',
        lastName: 'Sharma',
        profileCompletion: 90,
      });
      logger.info(`[Seed Script] Created test user A: ${userA.email}`);
    }

    if (!userB) {
      const hashedPass = await hashPassword('test2@123');
      userB = await User.create({
        email: 'test2@gmail.com',
        password: hashedPass,
        userType: 'flatmate',
        accountStatus: 'active',
        emailVerified: true,
        mobileVerified: true,
        profileVerified: true,
      });
      await UserProfile.create({
        userId: userB._id,
        firstName: 'Priya',
        lastName: 'Patel',
        profileCompletion: 85,
      });
      logger.info(`[Seed Script] Created test user B: ${userB.email}`);
    }

    // 2. Normalize participant IDs and find or create conversation
    const normalizedParticipants = normalizeParticipants(userA._id, userB._id);

    let conversation = await ChatConversation.findOne({
      participants: normalizedParticipants,
    });

    if (!conversation) {
      conversation = await ChatConversation.create({
        participants: normalizedParticipants,
        unreadCounts: new Map<string, number>(),
        isActive: true,
      });
      logger.info(`[Seed Script] Created conversation: ${conversation._id}`);
    } else {
      logger.info(`[Seed Script] Found existing conversation: ${conversation._id}`);
    }

    // Check existing messages count
    const existingMessagesCount = await ChatMessage.countDocuments({
      conversationId: conversation._id,
    });

    if (existingMessagesCount >= 6) {
      logger.info(`[Seed Script] Conversation already has ${existingMessagesCount} messages. Skipping message insertion.`);
    } else {
      if (existingMessagesCount > 0) {
        await ChatMessage.deleteMany({ conversationId: conversation._id });
        logger.info('[Seed Script] Cleared partial messages to re-seed complete dataset.');
      }
      // Find sample property & flatmate requirement if available
      const sampleProperty = await Property.findOne({ isDeleted: { $ne: true } });
      const sampleFlatmate = await FlatmateRequirement.findOne({ status: 'active' });

      const now = new Date();
      const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const eightMinsAgo = new Date(now.getTime() - 8 * 60 * 1000);
      const sixMinsAgo = new Date(now.getTime() - 6 * 60 * 1000);
      const fourMinsAgo = new Date(now.getTime() - 4 * 60 * 1000);
      const twoMinsAgo = new Date(now.getTime() - 2 * 60 * 1000);

      // Seed realistic messages sequence
      const seededMessages = [];

      // Message 1: Text message User A -> User B
      const msg1 = await ChatMessage.create({
        conversationId: conversation._id,
        senderId: userA._id,
        receiverId: userB._id,
        type: 'text',
        text: 'Hey Priya, hope you are doing well! Are you still looking for a flatmate in HSR Layout?',
        status: 'read',
        readAt: tenMinsAgo,
        createdAt: tenMinsAgo,
        updatedAt: tenMinsAgo,
      });
      seededMessages.push(msg1);

      // Message 2: Text message User B -> User A
      const msg2 = await ChatMessage.create({
        conversationId: conversation._id,
        senderId: userB._id,
        receiverId: userA._id,
        type: 'text',
        text: 'Hi Rahul! Yes, I am actively looking for a 2BHK flatmate around HSR or Koramangala.',
        status: 'read',
        readAt: eightMinsAgo,
        createdAt: eightMinsAgo,
        updatedAt: eightMinsAgo,
      });
      seededMessages.push(msg2);

      // Message 3: Image attachment User A -> User B
      const msg3 = await ChatMessage.create({
        conversationId: conversation._id,
        senderId: userA._id,
        receiverId: userB._id,
        type: 'image',
        text: 'Awesome! Here is a picture of the room available in our flat.',
        attachment: {
          url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
          name: 'room_preview.jpg',
          size: 1024000,
          mimeType: 'image/jpeg',
        },
        status: 'read',
        readAt: sixMinsAgo,
        createdAt: sixMinsAgo,
        updatedAt: sixMinsAgo,
      });
      seededMessages.push(msg3);

      // Extract numeric rent safely if sampleProperty.rent is an object or number
      let propertyRent = 18000;
      if (sampleProperty && sampleProperty.rent) {
        if (typeof sampleProperty.rent === 'number') {
          propertyRent = sampleProperty.rent;
        } else if (typeof (sampleProperty.rent as any).amount === 'number') {
          propertyRent = (sampleProperty.rent as any).amount;
        }
      }

      // Message 4: Shared Property (or Property Card payload) User B -> User A
      const msg4 = await ChatMessage.create({
        conversationId: conversation._id,
        senderId: userB._id,
        receiverId: userA._id,
        type: 'property',
        text: 'That looks great! I also shortlisted this property nearby. What do you think?',
        property: {
          propertyId: sampleProperty ? sampleProperty._id : new mongoose.Types.ObjectId(),
          title: sampleProperty ? sampleProperty.title : 'Luxury 2BHK Apartment in HSR Layout',
          slug: sampleProperty ? sampleProperty.slug : 'luxury-2bhk-hsr-layout',
          image: sampleProperty?.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
          rent: propertyRent,
        },
        status: 'read',
        readAt: fourMinsAgo,
        createdAt: fourMinsAgo,
        updatedAt: fourMinsAgo,
      });
      seededMessages.push(msg4);

      // Message 5: Soft Deleted message User A -> User B
      const msg5 = await ChatMessage.create({
        conversationId: conversation._id,
        senderId: userA._id,
        receiverId: userB._id,
        type: 'text',
        text: 'Scratch that message, sent by mistake!',
        status: 'delivered',
        deliveredAt: twoMinsAgo,
        isDeleted: true,
        deletedAt: twoMinsAgo,
        createdAt: twoMinsAgo,
        updatedAt: twoMinsAgo,
      });
      seededMessages.push(msg5);

      // Message 6: Recent message User A -> User B (sent status, unread for User B)
      const msg6 = await ChatMessage.create({
        conversationId: conversation._id,
        senderId: userA._id,
        receiverId: userB._id,
        type: 'text',
        text: 'Can we schedule a visit tomorrow evening around 6 PM?',
        status: 'sent',
        createdAt: now,
        updatedAt: now,
      });
      seededMessages.push(msg6);

      // Update ChatConversation metadata
      const unreadMap = new Map<string, number>();
      unreadMap.set(userB._id.toString(), 1); // 1 unread message for user B

      conversation.lastMessageId = msg6._id as any;
      conversation.lastMessageAt = now;
      conversation.unreadCounts = unreadMap;
      conversation.isActive = true;
      await conversation.save();

      logger.info(`[Seed Script] Successfully seeded ${seededMessages.length} test messages.`);
    }

    logger.info('[Seed Script] Chat data seeding complete!');
    await mongoose.connection.close();
    logger.info('[Seed Script] Database connection closed.');
    process.exit(0);
  } catch (error) {
    logger.error('[Seed Script] Failed to seed chat data:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedChats();
