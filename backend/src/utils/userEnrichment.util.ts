import { UserProfile } from '../models/auth/userProfile.model';

/**
 * Utility to enrich listing items with full UserProfile details (name, gender, avatar/image, mobile/contact)
 * matches the user enrichment logic in listing.controller.ts
 */
export const enrichUserProfilesForListings = async (listings: any[]): Promise<any[]> => {
  if (!listings || listings.length === 0) return listings;

  const userIds = listings
    .map((item) => item?.userId?._id || item?.userId)
    .filter((id) => id !== null && id !== undefined);

  if (userIds.length === 0) return listings;

  const profiles = await UserProfile.find({ userId: { $in: userIds } })
    .populate('avatar')
    .lean();

  const profileMap = new Map(profiles.map((p: any) => [p.userId.toString(), p]));

  return listings.map((item) => {
    if (!item || !item.userId) return item;

    const user = item.userId;
    const uId = typeof user === 'object' && user._id ? user._id.toString() : user.toString();
    const profile = profileMap.get(uId);
    const userObj = typeof user === 'object' ? user : { _id: user };

    const firstName = profile?.firstName || '';
    const lastName = profile?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const gender = profile?.gender || (userObj as any).gender || '';
    const imageUrl = profile?.image?.url || (profile?.avatar as any)?.image?.url || null;

    const enrichedUser = {
      ...userObj,
      name: fullName || (userObj as any).name || (userObj as any).email || 'User',
      gender: gender || '',
      email: (userObj as any).email || '',
      contact: (userObj as any).mobile || (userObj as any).contact || '',
      mobile: (userObj as any).mobile || (userObj as any).contact || '',
      image: imageUrl,
      avatar: imageUrl,
      profileImage: imageUrl,
    };

    return {
      ...item,
      userId: enrichedUser,
    };
  });
};
