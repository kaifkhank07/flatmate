import { Router, Request, Response } from 'express';
import adminRoutes from './auth/admin.routes';
import userRoutes from './auth/user.routes';
import otpRoutes from './auth/otp.routes';
import mobileAuthRoutes from './auth/mobileAuth.routes';
import sessionRoutes from './auth/session.routes';
import profileRoutes from './auth/profile.routes';
import userPreferenceRoutes from './auth/userPreference.routes';
import avatarRoutes from './auth/avatar.routes';
import locationRoutes from './listing/location.routes';
import propertyAmenityRoutes from './listing/propertyAmenity.routes';
import propertyRoutes from './listing/property.routes';
import imageRoutes from './listing/image.routes';
import videoRoutes from './listing/video.routes';
import flatmateRequirementsRoutes from './listing/flatmateRequirements.routes';
import listingRoutes from './listing/listing.routes';
import wishlistRoutes from './listing/wishlist.routes';
import recentlyViewedRoutes from './listing/recentlyViewed.routes';
import reportRoutes from './listing/report.routes';
import chatConversationRoutes from './chats/chatConversation.routes';
import chatMessageRoutes from './chats/chatMessage.routes';
import chatBlockRoutes from './chats/chatBlock.routes';
import chatReportRoutes from './chats/chatReport.routes';
import adminChatRoutes from './chats/adminChat.routes';

import notificationRoutes from './notification/notification.routes';
import reviewRoutes from './listing/review.routes';

import blogCategoryRoutes from './contents/blogCategory.routes';
import blogRoutes from './contents/blog.routes';
import faqRoutes from './contents/faq.routes';
import rentalGuideRoutes from './contents/rentalGuide.routes';
import cityRoutes from './contents/city.routes';
import dashboardRoutes from './dashboard/dashboard.routes';

const router = Router();

// API Health Check Endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
  });
});

// Register Module Routes
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/otp', otpRoutes);
router.use('/auth/mobile', mobileAuthRoutes);
router.use('/sessions', sessionRoutes);
router.use('/profile', profileRoutes);
router.use('/user-preferences', userPreferenceRoutes);
router.use('/avatars', avatarRoutes);
router.use('/cities', cityRoutes);
router.use('/locations', locationRoutes);
router.use('/property-amenities', propertyAmenityRoutes);
router.use('/properties', propertyRoutes);
router.use('/images', imageRoutes);
router.use('/videos', videoRoutes);
router.use('/flatmate-requirements', flatmateRequirementsRoutes);
router.use('/listings', listingRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/recently-viewed', recentlyViewedRoutes);
router.use('/reports', reportRoutes);
router.use('/reviews', reviewRoutes);
router.use('/chat-conversations', chatConversationRoutes);
router.use('/chat-messages', chatMessageRoutes);
router.use('/chat-blocks', chatBlockRoutes);
router.use('/chat-reports', chatReportRoutes);
router.use('/admin-chats', adminChatRoutes);
router.use('/notifications', notificationRoutes);

router.use('/blog-categories', blogCategoryRoutes);
router.use('/blogs', blogRoutes);

router.use('/faqs', faqRoutes);
router.use('/rental-guides', rentalGuideRoutes);

export default router;


