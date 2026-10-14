import { Types } from 'mongoose';
import { User } from '../../models/auth/user.model';
import { UserProfile } from '../../models/auth/userProfile.model';
import { Admin } from '../../models/auth/admin.model';
import { Property, PropertyStatus } from '../../models/listing/property.model';
import { FlatmateRequirement, PostStatus } from '../../models/listing/flatmateRequirements.model';
import { Wishlist } from '../../models/listing/wishlist.model';
import { RecentlyViewed } from '../../models/listing/recentlyViewed.model';
import { Report } from '../../models/listing/report.model';
import { ChatReport } from '../../models/chats/ChatReport';
import { ChatMessage } from '../../models/chats/ChatMessage';
import { Review } from '../../models/listing/review.model';
import { Notification } from '../../models/notification/notification.model';
import { City } from '../../models/contents/city.model';
import { Blog } from '../../models/contents/blog.model';
import { FAQ } from '../../models/contents/faqs.model';
import { RentalGuide } from '../../models/contents/rentalGuide.model';
import { PropertyAmenity } from '../../models/listing/propertyAmenity.model';
import { UserPreference } from '../../models/auth/userPreference.model';
import { Avatar } from '../../models/auth/avatar.model';

const ALL_LISTING_STATUSES: Array<PropertyStatus | PostStatus> = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'blocked',
  'closed',
  'expired',
];

interface StatusCountMap {
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  blocked: number;
  closed: number;
  expired: number;
  total: number;
  totalFavorites: number;
}

const buildEmptyStatusMap = (): StatusCountMap => ({
  draft: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  blocked: 0,
  closed: 0,
  expired: 0,
  total: 0,
  totalFavorites: 0,
});

const populateStatusMap = (
  rawStatusAgg: Array<{ _id: string; count: number; favorites?: number }>
): StatusCountMap => {
  const map = buildEmptyStatusMap();
  for (const item of rawStatusAgg) {
    const status = item._id as PropertyStatus;
    if (status && status in map) {
      (map as any)[status] = item.count || 0;
      map.total += item.count || 0;
      map.totalFavorites += item.favorites || 0;
    }
  }
  return map;
};

const getRecentMonthsRange = (numMonths: number = 6) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - (numMonths - 1));
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  return startDate;
};

const formatMonthlyTrend = (
  rawTrend: Array<{ _id: { year: number; month: number }; count: number }>,
  numMonths: number = 6
) => {
  const result: Array<{ month: string; year: number; monthNumber: number; count: number }> = [];
  const now = new Date();

  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const monthNumber = d.getMonth() + 1;
    const monthStr = `${year}-${String(monthNumber).padStart(2, '0')}`;

    const match = rawTrend.find(
      (t) => t._id.year === year && t._id.month === monthNumber
    );

    result.push({
      month: monthStr,
      year,
      monthNumber,
      count: match ? match.count : 0,
    });
  }

  return result;
};

export const REVENUE_DISCLAIMER = {
  supported: false,
  message:
    'Payment and transaction tracking is not implemented in this backend. Rent, security deposits, and maintenance charges represent listing attributes, not platform revenue.',
};

/**
 * Service to aggregate platform-wide metrics for Super Admin
 */
export const getSuperAdminDashboardData = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const sixMonthsAgo = getRecentMonthsRange(6);

  const [
    // 1. User metrics
    totalUsers,
    activeUsers,
    inactiveUsers,
    deletedUsers,
    verifiedUsers,
    pendingVerifications,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,

    // 2. Admin staff metrics (Super Admin only)
    totalAdmins,
    activeAdmins,
    inactiveAdmins,
    superAdmins,
    regularAdmins,

    // 3. Property Listing metrics
    propertyStatusAgg,
    propertiesToday,
    propertiesThisMonth,
    propertyTypeAgg,

    // 4. Flatmate Requirement Listing metrics
    flatmateStatusAgg,
    flatmatesToday,
    flatmatesThisMonth,
    flatmatePostTypeAgg,

    // 5. Moderation Reports
    listingReportsAgg,
    chatReportsAgg,

    // 6. Reviews
    reviewStatusAgg,

    // 7. Content & Masters
    totalCities,
    activeCities,
    totalBlogs,
    activeBlogs,
    totalFaqs,
    totalRentalGuides,
    activeAmenities,
    activePreferences,

    // 8. Trends
    userMonthlyTrendRaw,
    propertyMonthlyTrendRaw,
    flatmateMonthlyTrendRaw,

    // 9. Recent Activity
    recentPendingProperties,
    recentPendingFlatmates,
    recentUsersRaw,
    recentReports,
  ] = await Promise.all([
    // Users
    User.countDocuments({ isDeleted: false }),
    User.countDocuments({ accountStatus: 'active', isDeleted: false }),
    User.countDocuments({ accountStatus: 'inactive', isDeleted: false }),
    User.countDocuments({ isDeleted: true }),
    User.countDocuments({ profileVerified: true, isDeleted: false }),
    User.countDocuments({ verificationStatus: 'pending', isDeleted: false }),
    User.countDocuments({ createdAt: { $gte: todayStart }, isDeleted: false }),
    User.countDocuments({ createdAt: { $gte: weekStart }, isDeleted: false }),
    User.countDocuments({ createdAt: { $gte: monthStart }, isDeleted: false }),

    // Admins
    Admin.countDocuments({ isDeleted: false }),
    Admin.countDocuments({ status: 'active', isDeleted: false }),
    Admin.countDocuments({ status: 'inactive', isDeleted: false }),
    Admin.countDocuments({ role: 'super_admin', isDeleted: false }),
    Admin.countDocuments({ role: 'admin', isDeleted: false }),

    // Properties
    Property.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          favorites: { $sum: { $ifNull: ['$favoriteCount', 0] } },
        },
      },
    ]),
    Property.countDocuments({ createdAt: { $gte: todayStart } }),
    Property.countDocuments({ createdAt: { $gte: monthStart } }),
    Property.aggregate([
      {
        $group: {
          _id: '$propertyType',
          count: { $sum: 1 },
        },
      },
    ]),

    // Flatmate Requirements
    FlatmateRequirement.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          favorites: { $sum: { $ifNull: ['$favoriteCount', 0] } },
        },
      },
    ]),
    FlatmateRequirement.countDocuments({ createdAt: { $gte: todayStart } }),
    FlatmateRequirement.countDocuments({ createdAt: { $gte: monthStart } }),
    FlatmateRequirement.aggregate([
      {
        $group: {
          _id: '$postType',
          count: { $sum: 1 },
        },
      },
    ]),

    // Listing Reports
    Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // Chat Reports
    ChatReport.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // Reviews
    Review.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]),

    // Masters
    City.countDocuments(),
    City.countDocuments({ isActive: true }),
    Blog.countDocuments(),
    Blog.countDocuments({ isActive: true }),
    FAQ.countDocuments(),
    RentalGuide.countDocuments(),
    PropertyAmenity.countDocuments({ isActive: true }),
    UserPreference.countDocuments({ isActive: true }),

    // Monthly trends
    User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, isDeleted: false } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Property.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    FlatmateRequirement.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

    // Recent items
    Property.find({ status: 'pending' })
      .select('title slug propertyType rent location createdAt userId')
      .populate('userId', 'email mobile')
      .populate('location', 'name city')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    FlatmateRequirement.find({ status: 'pending' })
      .select('title slug postType propertyType partnerType rent location createdAt userId')
      .populate('userId', 'email mobile')
      .populate('location', 'name city')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    User.find({ isDeleted: false })
      .select('email mobile accountStatus verificationStatus profileVerified createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Report.find({ status: 'pending' })
      .select('targetType targetModel targetId reason status createdAt userId')
      .populate('userId', 'email mobile')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const propertyStatusMap = populateStatusMap(propertyStatusAgg);
  const flatmateStatusMap = populateStatusMap(flatmateStatusAgg);

  const combinedStatusMap: StatusCountMap = buildEmptyStatusMap();
  for (const status of ALL_LISTING_STATUSES) {
    combinedStatusMap[status] = propertyStatusMap[status] + flatmateStatusMap[status];
  }
  combinedStatusMap.total = propertyStatusMap.total + flatmateStatusMap.total;
  combinedStatusMap.totalFavorites =
    propertyStatusMap.totalFavorites + flatmateStatusMap.totalFavorites;

  // Moderation reports breakdown
  const listingReportsMap = { pending: 0, reviewed: 0, resolved: 0, dismissed: 0, total: 0 };
  for (const r of listingReportsAgg) {
    if (r._id in listingReportsMap) {
      (listingReportsMap as any)[r._id] = r.count;
      listingReportsMap.total += r.count;
    }
  }

  const chatReportsMap = { pending: 0, reviewed: 0, resolved: 0, rejected: 0, total: 0 };
  for (const cr of chatReportsAgg) {
    if (cr._id in chatReportsMap) {
      (chatReportsMap as any)[cr._id] = cr.count;
      chatReportsMap.total += cr.count;
    }
  }

  // Reviews breakdown
  const reviewsMap = { pending: 0, published: 0, hidden: 0, rejected: 0, total: 0, averageRating: 0 };
  let weightedRatingSum = 0;
  for (const rev of reviewStatusAgg) {
    if (rev._id in reviewsMap) {
      (reviewsMap as any)[rev._id] = rev.count;
      reviewsMap.total += rev.count;
      if (rev.avgRating) {
        weightedRatingSum += rev.avgRating * rev.count;
      }
    }
  }
  reviewsMap.averageRating =
    reviewsMap.total > 0 ? Math.round((weightedRatingSum / reviewsMap.total) * 10) / 10 : 0;

  // Charts format
  const userRegistrationTrend = formatMonthlyTrend(userMonthlyTrendRaw, 6);
  const propertyCreationTrend = formatMonthlyTrend(propertyMonthlyTrendRaw, 6);
  const flatmateCreationTrend = formatMonthlyTrend(flatmateMonthlyTrendRaw, 6);

  const combinedListingTrend = userRegistrationTrend.map((u, idx) => ({
    month: u.month,
    year: u.year,
    monthNumber: u.monthNumber,
    properties: propertyCreationTrend[idx]?.count || 0,
    flatmates: flatmateCreationTrend[idx]?.count || 0,
    totalListings:
      (propertyCreationTrend[idx]?.count || 0) + (flatmateCreationTrend[idx]?.count || 0),
  }));

  // Merge recent pending listings
  const pendingModerationListings = [
    ...recentPendingProperties.map((p) => ({ ...p, listingType: 'property' as const })),
    ...recentPendingFlatmates.map((f) => ({ ...f, listingType: 'flatmate_requirement' as const })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const superUserIds = recentUsersRaw.map((u) => u._id);
  const superProfiles = await UserProfile.find({ userId: { $in: superUserIds } })
    .select('userId firstName lastName image avatar')
    .populate({
      path: 'avatar',
      select: '_id name image',
    })
    .lean();
  const superProfileMap = new Map(superProfiles.map((p: any) => [p.userId.toString(), p]));

  const recentUsers = recentUsersRaw.map((u: any) => {
    const profile = superProfileMap.get(u._id.toString());
    const fullName = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : '';

    const customImageUrl =
      profile?.image?.url ||
      (typeof profile?.image === 'string' ? profile.image : null) ||
      null;

    const avatarImageUrl =
      (profile?.avatar as any)?.image?.url ||
      (profile?.avatar as any)?.url ||
      null;

    // A user has either a custom image or a predefined avatar
    const resolvedPhoto = customImageUrl || avatarImageUrl || null;

    return {
      _id: u._id,
      name: fullName || undefined,
      email: u.email,
      mobile: u.mobile,
      accountStatus: u.accountStatus,
      verificationStatus: u.verificationStatus,
      profileVerified: u.profileVerified,
      createdAt: u.createdAt,
      image: resolvedPhoto,
      avatar: avatarImageUrl,
      avatarName: (profile?.avatar as any)?.name || undefined,
    };
  });

  return {
    summary: {
      totalUsers,
      activeUsers,
      inactiveUsers,
      deletedUsers,
      verifiedUsers,
      pendingVerifications,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      totalAdmins,
      activeAdmins,
      inactiveAdmins,
      superAdmins,
      regularAdmins,
      totalListings: combinedStatusMap.total,
      activeListings: combinedStatusMap.approved,
      pendingListings: combinedStatusMap.pending,
      rejectedListings: combinedStatusMap.rejected,
      newListingsToday: propertiesToday + flatmatesToday,
      newListingsThisMonth: propertiesThisMonth + flatmatesThisMonth,
      pendingModerationCount:
        combinedStatusMap.pending + listingReportsMap.pending + chatReportsMap.pending,
    },
    breakdown: {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        deleted: deletedUsers,
        verified: verifiedUsers,
        pendingVerification: pendingVerifications,
      },
      admins: {
        total: totalAdmins,
        active: activeAdmins,
        inactive: inactiveAdmins,
        superAdminCount: superAdmins,
        regularAdminCount: regularAdmins,
      },
      listings: {
        combined: combinedStatusMap,
        property: {
          ...propertyStatusMap,
          byType: propertyTypeAgg.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {} as Record<string, number>),
        },
        flatmate: {
          ...flatmateStatusMap,
          byPostType: flatmatePostTypeAgg.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {} as Record<string, number>),
        },
      },
      moderation: {
        listingReports: listingReportsMap,
        chatReports: chatReportsMap,
        reviews: reviewsMap,
      },
      platformMasters: {
        cities: { total: totalCities, active: activeCities },
        blogs: { total: totalBlogs, active: activeBlogs },
        faqs: { total: totalFaqs },
        rentalGuides: { total: totalRentalGuides },
        amenities: { active: activeAmenities },
        preferences: { active: activePreferences },
      },
    },
    charts: {
      userRegistrationTrend,
      listingCreationTrend: combinedListingTrend,
      listingStatusDistribution: [
        { status: 'approved', label: 'Approved (Active)', count: combinedStatusMap.approved },
        { status: 'pending', label: 'Pending Moderation', count: combinedStatusMap.pending },
        { status: 'rejected', label: 'Rejected', count: combinedStatusMap.rejected },
        { status: 'draft', label: 'Draft', count: combinedStatusMap.draft },
        { status: 'expired', label: 'Expired', count: combinedStatusMap.expired },
        { status: 'closed', label: 'Closed', count: combinedStatusMap.closed },
        { status: 'blocked', label: 'Blocked', count: combinedStatusMap.blocked },
      ],
    },
    recentActivity: {
      pendingModerationListings,
      recentUsers,
      recentReports,
    },
    revenue: REVENUE_DISCLAIMER,
  };
};

/**
 * Service to aggregate operational metrics for regular Admin Staff
 * (Omits admin staff management counts and super-admin sensitive data)
 */
export const getAdminDashboardData = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const sixMonthsAgo = getRecentMonthsRange(6);

  const [
    // 1. User operational counts
    totalUsers,
    activeUsers,
    inactiveUsers,
    deletedUsers,
    verifiedUsers,
    pendingVerifications,
    newUsersToday,
    newUsersThisMonth,

    // 2. Property metrics
    propertyStatusAgg,
    propertiesToday,
    propertiesThisMonth,
    propertyTypeAgg,

    // 3. Flatmate Requirement metrics
    flatmateStatusAgg,
    flatmatesToday,
    flatmatesThisMonth,
    flatmatePostTypeAgg,

    // 4. Moderation
    pendingListingReportsCount,
    pendingChatReportsCount,
    pendingReviewsCount,

    // 5. Trends
    userMonthlyTrendRaw,
    propertyMonthlyTrendRaw,
    flatmateMonthlyTrendRaw,

    // 6. Recent Action Items
    recentPendingProperties,
    recentPendingFlatmates,
    recentPendingReports,
    recentPendingReviews,
    recentUsersRaw,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: false }),
    User.countDocuments({ accountStatus: 'active', isDeleted: false }),
    User.countDocuments({ accountStatus: 'inactive', isDeleted: false }),
    User.countDocuments({ isDeleted: true }),
    User.countDocuments({ profileVerified: true, isDeleted: false }),
    User.countDocuments({ verificationStatus: 'pending', isDeleted: false }),
    User.countDocuments({ createdAt: { $gte: todayStart }, isDeleted: false }),
    User.countDocuments({ createdAt: { $gte: monthStart }, isDeleted: false }),

    Property.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          favorites: { $sum: { $ifNull: ['$favoriteCount', 0] } },
        },
      },
    ]),
    Property.countDocuments({ createdAt: { $gte: todayStart } }),
    Property.countDocuments({ createdAt: { $gte: monthStart } }),
    Property.aggregate([
      {
        $group: {
          _id: '$propertyType',
          count: { $sum: 1 },
        },
      },
    ]),

    FlatmateRequirement.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          favorites: { $sum: { $ifNull: ['$favoriteCount', 0] } },
        },
      },
    ]),
    FlatmateRequirement.countDocuments({ createdAt: { $gte: todayStart } }),
    FlatmateRequirement.countDocuments({ createdAt: { $gte: monthStart } }),
    FlatmateRequirement.aggregate([
      {
        $group: {
          _id: '$postType',
          count: { $sum: 1 },
        },
      },
    ]),

    Report.countDocuments({ status: 'pending' }),
    ChatReport.countDocuments({ status: 'pending' }),
    Review.countDocuments({ status: 'pending' }),

    User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, isDeleted: false } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Property.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    FlatmateRequirement.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

    Property.find({ status: 'pending' })
      .select('title slug propertyType rent location createdAt userId')
      .populate('userId', 'email mobile')
      .populate('location', 'name city')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    FlatmateRequirement.find({ status: 'pending' })
      .select('title slug postType propertyType partnerType rent location createdAt userId')
      .populate('userId', 'email mobile')
      .populate('location', 'name city')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Report.find({ status: 'pending' })
      .select('targetType targetModel targetId reason status createdAt userId')
      .populate('userId', 'email mobile')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Review.find({ status: 'pending' })
      .select('reviewerId targetType targetModel targetId rating title comment createdAt')
      .populate('reviewerId', 'email mobile')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    User.find({ isDeleted: false })
      .select('email mobile accountStatus verificationStatus profileVerified createdAt')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
  ]);

  const propertyStatusMap = populateStatusMap(propertyStatusAgg);
  const flatmateStatusMap = populateStatusMap(flatmateStatusAgg);

  const combinedStatusMap: StatusCountMap = buildEmptyStatusMap();
  for (const status of ALL_LISTING_STATUSES) {
    combinedStatusMap[status] = propertyStatusMap[status] + flatmateStatusMap[status];
  }
  combinedStatusMap.total = propertyStatusMap.total + flatmateStatusMap.total;
  combinedStatusMap.totalFavorites =
    propertyStatusMap.totalFavorites + flatmateStatusMap.totalFavorites;

  const totalPendingWorkload =
    combinedStatusMap.pending +
    pendingListingReportsCount +
    pendingChatReportsCount +
    pendingReviewsCount;

  const userRegistrationTrend = formatMonthlyTrend(userMonthlyTrendRaw, 6);
  const propertyCreationTrend = formatMonthlyTrend(propertyMonthlyTrendRaw, 6);
  const flatmateCreationTrend = formatMonthlyTrend(flatmateMonthlyTrendRaw, 6);

  const combinedListingTrend = userRegistrationTrend.map((u, idx) => ({
    month: u.month,
    year: u.year,
    monthNumber: u.monthNumber,
    properties: propertyCreationTrend[idx]?.count || 0,
    flatmates: flatmateCreationTrend[idx]?.count || 0,
    totalListings:
      (propertyCreationTrend[idx]?.count || 0) + (flatmateCreationTrend[idx]?.count || 0),
  }));

  const pendingModerationListings = [
    ...recentPendingProperties.map((p) => ({ ...p, listingType: 'property' as const })),
    ...recentPendingFlatmates.map((f) => ({ ...f, listingType: 'flatmate_requirement' as const })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const adminUserIds = recentUsersRaw.map((u) => u._id);
  const adminProfiles = await UserProfile.find({ userId: { $in: adminUserIds } })
    .select('userId firstName lastName image avatar')
    .populate({
      path: 'avatar',
      select: '_id name image',
    })
    .lean();
  const adminProfileMap = new Map(adminProfiles.map((p: any) => [p.userId.toString(), p]));

  const recentUsers = recentUsersRaw.map((u: any) => {
    const profile = adminProfileMap.get(u._id.toString());
    const fullName = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : '';

    const customImageUrl =
      profile?.image?.url ||
      (typeof profile?.image === 'string' ? profile.image : null) ||
      null;

    const avatarImageUrl =
      (profile?.avatar as any)?.image?.url ||
      (profile?.avatar as any)?.url ||
      null;

    // A user has either a custom image or a predefined avatar
    const resolvedPhoto = customImageUrl || avatarImageUrl || null;

    return {
      _id: u._id,
      name: fullName || undefined,
      email: u.email,
      mobile: u.mobile,
      accountStatus: u.accountStatus,
      verificationStatus: u.verificationStatus,
      profileVerified: u.profileVerified,
      createdAt: u.createdAt,
      image: resolvedPhoto,
      avatar: avatarImageUrl,
      avatarName: (profile?.avatar as any)?.name || undefined,
    };
  });

  return {
    summary: {
      totalUsers,
      activeUsers,
      inactiveUsers,
      deletedUsers,
      verifiedUsers,
      pendingVerifications,
      newUsersToday,
      newUsersThisMonth,
      totalListings: combinedStatusMap.total,
      activeListings: combinedStatusMap.approved,
      pendingListings: combinedStatusMap.pending,
      rejectedListings: combinedStatusMap.rejected,
      expiredListings: combinedStatusMap.expired,
      newListingsToday: propertiesToday + flatmatesToday,
      newListingsThisMonth: propertiesThisMonth + flatmatesThisMonth,
      pendingListingReports: pendingListingReportsCount,
      pendingChatReports: pendingChatReportsCount,
      pendingReviews: pendingReviewsCount,
      totalPendingWorkload,
    },
    breakdown: {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        deleted: deletedUsers,
        verified: verifiedUsers,
        pendingVerification: pendingVerifications,
      },
      listings: {
        combined: combinedStatusMap,
        property: {
          ...propertyStatusMap,
          byType: propertyTypeAgg.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {} as Record<string, number>),
        },
        flatmate: {
          ...flatmateStatusMap,
          byPostType: flatmatePostTypeAgg.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {} as Record<string, number>),
        },
      },
      workload: {
        pendingListings: combinedStatusMap.pending,
        pendingListingReports: pendingListingReportsCount,
        pendingChatReports: pendingChatReportsCount,
        pendingReviews: pendingReviewsCount,
        totalPendingWorkload,
      },
    },
    charts: {
      userRegistrationTrend,
      listingCreationTrend: combinedListingTrend,
      listingStatusDistribution: [
        { status: 'approved', label: 'Approved (Active)', count: combinedStatusMap.approved },
        { status: 'pending', label: 'Pending Moderation', count: combinedStatusMap.pending },
        { status: 'rejected', label: 'Rejected', count: combinedStatusMap.rejected },
        { status: 'draft', label: 'Draft', count: combinedStatusMap.draft },
        { status: 'expired', label: 'Expired', count: combinedStatusMap.expired },
        { status: 'closed', label: 'Closed', count: combinedStatusMap.closed },
        { status: 'blocked', label: 'Blocked', count: combinedStatusMap.blocked },
      ],
    },
    recentActivity: {
      pendingModerationListings,
      pendingReports: recentPendingReports,
      pendingReviews: recentPendingReviews,
      recentUsers,
    },
  };
};

/**
 * Service to aggregate dashboard metrics scoped strictly to authenticated user
 */
export const getUserDashboardData = async (userObjectId: Types.ObjectId) => {
  const [
    // 1. User Account & Profile
    userDoc,
    profileDoc,

    // 2. User's Properties by status
    propertyStatusAgg,

    // 3. User's Flatmates by status
    flatmateStatusAgg,

    // 4. User's Wishlist, Views, Chats, Notifications, Reports
    wishlistCount,
    recentlyViewedCount,
    unreadMessagesCount,
    unreadNotificationsCount,
    myReportsCount,
    myReviewsCount,

    // 5. Recent items
    recentProperties,
    recentFlatmates,
    recentWishlist,
    recentViews,
    recentNotifications,
  ] = await Promise.all([
    User.findById(userObjectId)
      .select(
        'email mobile role accountStatus emailVerified mobileVerified profileVerified verificationStatus lastLoginAt createdAt'
      )
      .lean(),
    UserProfile.findOne({ userId: userObjectId })
      .select('firstName lastName gender occupation profileCompletion completedOnce image avatar')
      .populate('avatar', 'name url')
      .lean(),

    Property.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          favorites: { $sum: { $ifNull: ['$favoriteCount', 0] } },
        },
      },
    ]),

    FlatmateRequirement.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          favorites: { $sum: { $ifNull: ['$favoriteCount', 0] } },
        },
      },
    ]),

    Wishlist.countDocuments({ userId: userObjectId }),
    RecentlyViewed.countDocuments({ userId: userObjectId }),
    ChatMessage.countDocuments({
      receiverId: userObjectId,
      status: { $ne: 'read' },
      isDeletedFor: { $ne: userObjectId },
    }),
    Notification.countDocuments({
      user: userObjectId,
      isRead: false,
    }),
    Report.countDocuments({ userId: userObjectId }),
    Review.countDocuments({ reviewerId: userObjectId }),

    Property.find({ userId: userObjectId })
      .select('title slug propertyType rent status rejectionReason favoriteCount createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    FlatmateRequirement.find({ userId: userObjectId })
      .select(
        'title slug postType propertyType partnerType rent status rejectionReason favoriteCount createdAt'
      )
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Wishlist.find({ userId: userObjectId })
      .populate({
        path: 'targetId',
        select: 'title slug rent propertyType status images',
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    RecentlyViewed.find({ userId: userObjectId })
      .populate({
        path: 'targetId',
        select: 'title slug rent propertyType status images',
      })
      .sort({ viewedAt: -1 })
      .limit(5)
      .lean(),
    Notification.find({ user: userObjectId })
      .select('title message type isRead createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const propertyStatusMap = populateStatusMap(propertyStatusAgg);
  const flatmateStatusMap = populateStatusMap(flatmateStatusAgg);

  const combinedStatusMap: StatusCountMap = buildEmptyStatusMap();
  for (const status of ALL_LISTING_STATUSES) {
    combinedStatusMap[status] = propertyStatusMap[status] + flatmateStatusMap[status];
  }
  combinedStatusMap.total = propertyStatusMap.total + flatmateStatusMap.total;
  combinedStatusMap.totalFavorites =
    propertyStatusMap.totalFavorites + flatmateStatusMap.totalFavorites;

  // Merge recent listings
  const recentListings = [
    ...recentProperties.map((p) => ({ ...p, listingType: 'property' as const })),
    ...recentFlatmates.map((f) => ({ ...f, listingType: 'flatmate_requirement' as const })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    summary: {
      totalMyListings: combinedStatusMap.total,
      activeListings: combinedStatusMap.approved,
      pendingListings: combinedStatusMap.pending,
      rejectedListings: combinedStatusMap.rejected,
      draftListings: combinedStatusMap.draft,
      expiredListings: combinedStatusMap.expired,
      closedListings: combinedStatusMap.closed,
      totalFavoritesReceived: combinedStatusMap.totalFavorites,
      wishlistCount,
      recentlyViewedCount,
      unreadMessagesCount,
      unreadNotificationsCount,
      myReportsCount,
      myReviewsCount,
    },
    profile: {
      user: userDoc,
      profileDetails: profileDoc,
      completionPercentage: profileDoc?.profileCompletion || 0,
      completedOnce: Boolean(profileDoc?.completedOnce),
      verificationStatus: userDoc?.verificationStatus || 'not_submitted',
      emailVerified: Boolean(userDoc?.emailVerified),
      mobileVerified: Boolean(userDoc?.mobileVerified),
    },
    breakdown: {
      listings: {
        combined: combinedStatusMap,
        properties: propertyStatusMap,
        flatmates: flatmateStatusMap,
      },
    },
    recentActivity: {
      recentListings,
      recentWishlist: recentWishlist.filter((w) => w.targetId !== null),
      recentViews: recentViews.filter((v) => v.targetId !== null),
      recentNotifications,
    },
  };
};
