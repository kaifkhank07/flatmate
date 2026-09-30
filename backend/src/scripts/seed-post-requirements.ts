import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { FlatmateRequirement } from '../models/listing/flatmateRequirements.model';
import { Image } from '../models/listing/image.model';
import { Video } from '../models/listing/video.model';
import { Location } from '../models/listing/location.model';
import { User } from '../models/auth/user.model';
import { UserPreference } from '../models/auth/userPreference.model';
import { logger } from '../utils/logger.util';

const SAMPLE_POST_REQUIREMENTS_DATA = [
  {
    title: 'Furnished Master Room Available in HSR Layout Sector 1',
    slug: 'furnished-master-room-available-in-hsr-layout-sector-1',
    description: 'Looking for a flatmate to share a 3BHK luxury apartment. Private room with attached bathroom and balcony. Maid and cook already available.',
    postType: 'property' as const,
    propertyType: 'room' as const,
    budget: 18000,
    occupationPreference: 'working_professional' as const,
    genderPreference: 'any' as const,
    moveInDate: new Date(Date.now() + 7 * 86400000),
    peopleCount: 1,
    status: 'approved' as const,
    locationData: {
      name: 'HSR Layout Sector 1, Bengaluru',
      slug: 'hsr-layout-sector-1-req-seed',
      formattedAddress: 'Sector 1, HSR Layout, Bengaluru, Karnataka 560102, India',
      latitude: 12.9121,
      longitude: 77.6445,
      address: {
        subLocality: 'HSR Layout Sector 1',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
      },
    },
    sampleImageUrls: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    ],
    sampleVideoUrls: [
      'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-tour-41566-large.mp4',
    ],
  },
  {
    title: 'Looking for a Flatmate in Indiranagar / Domlur',
    slug: 'looking-for-a-flatmate-in-indiranagar-domlur',
    description: 'Hi! Working software engineer looking for a chill, non-smoking flatmate to hunt for a 2BHK flat together near Indiranagar 100ft Road.',
    postType: 'partner' as const,
    partnerType: 'flatmate' as const,
    budget: 20000,
    occupationPreference: 'working_professional' as const,
    genderPreference: 'male' as const,
    moveInDate: new Date(Date.now() + 14 * 86400000),
    peopleCount: 1,
    status: 'approved' as const,
    locationData: {
      name: 'Indiranagar, Bengaluru',
      slug: 'indiranagar-bengaluru-req-seed',
      formattedAddress: 'Indiranagar 100ft Road, Bengaluru, Karnataka 560038, India',
      latitude: 12.9784,
      longitude: 77.6408,
      address: {
        subLocality: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
      },
    },
    sampleImageUrls: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    ],
    sampleVideoUrls: [
      'https://assets.mixkit.co/videos/preview/mixkit-view-of-a-living-room-in-a-modern-house-41570-large.mp4',
    ],
  },
  {
    title: 'Single Sharing PG Room in Gachibowli near DLF',
    slug: 'single-sharing-pg-room-in-gachibowli-near-dlf',
    description: 'Fully furnished single occupancy room in premium PG with 3-time food, high speed WiFi, laundry and maid service.',
    postType: 'property' as const,
    propertyType: 'pg' as const,
    budget: 13000,
    occupationPreference: 'student' as const,
    genderPreference: 'male' as const,
    moveInDate: new Date(Date.now() + 3 * 86400000),
    peopleCount: 1,
    status: 'closed' as const,
    locationData: {
      name: 'Gachibowli DLF, Hyderabad',
      slug: 'gachibowli-dlf-req-seed',
      formattedAddress: 'Near DLF Cyber City, Gachibowli, Hyderabad, Telangana 500032, India',
      latitude: 17.4435,
      longitude: 78.3582,
      address: {
        subLocality: 'Gachibowli DLF',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
      },
    },
    sampleImageUrls: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
    ],
    sampleVideoUrls: [
      'https://assets.mixkit.co/videos/preview/mixkit-interior-of-a-living-room-with-modern-decor-41568-large.mp4',
    ],
  },
  {
    title: 'Looking for Female Roommate for Shared Room in Powai',
    slug: 'looking-for-female-roommate-for-shared-room-in-powai',
    description: 'Looking for a friendly female flatmate to share a spacious 2BHK flat in Hiranandani Powai. Close to IIT Bombay.',
    postType: 'partner' as const,
    partnerType: 'roommate' as const,
    budget: 12000,
    occupationPreference: 'student' as const,
    genderPreference: 'female' as const,
    moveInDate: new Date(Date.now() + 10 * 86400000),
    peopleCount: 1,
    status: 'draft' as const,
    locationData: {
      name: 'Powai Hiranandani, Mumbai',
      slug: 'powai-hiranandani-req-seed',
      formattedAddress: 'Hiranandani Gardens, Powai, Mumbai, Maharashtra 400076, India',
      latitude: 19.1197,
      longitude: 72.9051,
      address: {
        subLocality: 'Powai',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      },
    },
    sampleImageUrls: [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=800&q=80',
    ],
    sampleVideoUrls: [
      'https://assets.mixkit.co/videos/preview/mixkit-camera-pan-of-a-living-room-interior-41567-large.mp4',
    ],
  },
  {
    title: 'Shared Apartment Bed Available in Cyber City Gurgaon',
    slug: 'shared-apartment-bed-available-in-cyber-city-gurgaon',
    description: 'One bed space available in a modern 3BHK flat near Cyber Hub. Swimming pool, gym, and power backup included.',
    postType: 'property' as const,
    propertyType: 'shared_apartment' as const,
    budget: 22000,
    occupationPreference: 'working_professional' as const,
    genderPreference: 'any' as const,
    moveInDate: new Date(Date.now() + 30 * 86400000),
    peopleCount: 2,
    status: 'closed' as const,
    locationData: {
      name: 'Cyber Hub, Gurgaon',
      slug: 'cyber-hub-gurgaon-req-seed',
      formattedAddress: 'Cyber Hub, DLF Phase 2, Gurgaon, Haryana 122002, India',
      latitude: 28.4962,
      longitude: 77.0877,
      address: {
        subLocality: 'Cyber Hub',
        city: 'Gurgaon',
        state: 'Haryana',
        country: 'India',
      },
    },
    sampleImageUrls: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    ],
    sampleVideoUrls: [
      'https://assets.mixkit.co/videos/preview/mixkit-dining-room-interior-design-tour-41569-large.mp4',
    ],
  },
];

const seedPostRequirements = async (): Promise<void> => {
  try {
    await connectDB();
    logger.info('[Seed Script] Seeding sample post requirements with separate locations, images, and videos...');

    // 1. Fetch Existing Active Users
    const users = await User.find({ accountStatus: 'active' });
    logger.info(`[Seed Script] Found ${users.length} active users.`);

    if (users.length < 5) {
      throw new Error(
        `Insufficient active users found. Required at least 5 active users, but found ${users.length}.`
      );
    }

    // 2. Find Available User Preferences
    const preferencesList = await UserPreference.find({ isActive: true }).limit(3);
    const prefIds = preferencesList.map((p) => p._id);

    let insertedCount = 0;
    let skippedCount = 0;

    for (let index = 0; index < SAMPLE_POST_REQUIREMENTS_DATA.length; index++) {
      const data = SAMPLE_POST_REQUIREMENTS_DATA[index];
      const userDoc = users[index % users.length];

      const existing = await FlatmateRequirement.findOne({ slug: data.slug });
      if (existing) {
        skippedCount++;
        logger.info(`[Seed Script] Post requirement "${data.title}" already exists. Skipping.`);
        continue;
      }

      // Create separate, unique Location document for this requirement
      let locationDoc = await Location.findOne({ slug: data.locationData.slug });
      if (!locationDoc) {
        locationDoc = await Location.create({
          name: data.locationData.name,
          slug: data.locationData.slug,
          formattedAddress: data.locationData.formattedAddress,
          latitude: data.locationData.latitude,
          longitude: data.locationData.longitude,
          address: data.locationData.address,
          isActive: true,
        });
        logger.info(`[Seed Script] Created separate location for "${data.title}": ${locationDoc.name}`);
      }

      // Create separate, unique Image documents for this requirement
      const createdImageIds: mongoose.Types.ObjectId[] = [];
      for (let i = 0; i < data.sampleImageUrls.length; i++) {
        const img = await Image.create({
          url: data.sampleImageUrls[i],
          key: `images/req-${index + 1}-${i + 1}-${Date.now()}.jpg`,
        });
        createdImageIds.push(img._id);
      }

      // Create separate, unique Video documents for this requirement
      const createdVideoIds: mongoose.Types.ObjectId[] = [];
      for (let i = 0; i < data.sampleVideoUrls.length; i++) {
        const vid = await Video.create({
          url: data.sampleVideoUrls[i],
          key: `videos/req-${index + 1}-${i + 1}-${Date.now()}.mp4`,
        });
        createdVideoIds.push(vid._id);
      }

      await FlatmateRequirement.create({
        userId: userDoc._id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        postType: data.postType,
        propertyType: data.postType === 'property' ? data.propertyType : undefined,
        partnerType: data.postType === 'partner' ? data.partnerType : undefined,
        location: locationDoc._id,
        budget: data.budget,
        occupationPreference: data.occupationPreference,
        genderPreference: data.genderPreference,
        lifestylePreferences: prefIds,
        moveInDate: data.moveInDate,
        peopleCount: data.peopleCount,
        images: createdImageIds,
        videos: createdVideoIds,
        status: data.status,
      });

      insertedCount++;
      logger.info(
        `[Seed Script] Created post requirement: "${data.title}" (${data.status}) with distinct Location, ${createdImageIds.length} Images, and ${createdVideoIds.length} Videos. Assigned to user ${userDoc._id} (${userDoc.email || userDoc.mobile || 'User'})`
      );
    }

    logger.info(`[Seed Script] Completed seeding post requirements. Inserted: ${insertedCount}, Skipped: ${skippedCount}.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('[Seed Script] Error seeding post requirements:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedPostRequirements();
