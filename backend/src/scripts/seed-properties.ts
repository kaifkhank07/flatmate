import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Property } from '../models/listing/property.model';
import { Image } from '../models/listing/image.model';
import { Video } from '../models/listing/video.model';
import { Location } from '../models/listing/location.model';
import { PropertyAmenity } from '../models/listing/propertyAmenity.model';
import { User } from '../models/auth/user.model';
import { logger } from '../utils/logger.util';

const SAMPLE_PROPERTIES_DATA = [
  {
    title: 'Luxurious 3 BHK Apartment in Bandra West',
    slug: 'luxurious-3bhk-apartment-in-bandra-west',
    description: 'Fully furnished spacious 3 BHK apartment with sea view balcony, modern kitchen, and 24/7 security guard.',
    propertyType: 'flat' as const,
    rent: 45000,
    securityDeposit: 90000,
    maintenanceCharges: { amount: 3000, frequency: 'yearly' as const },
    furnishing: 'fully_furnished' as const,
    availableFrom: new Date(),
    genderPreference: 'any' as const,
    occupationPreference: 'working_professional' as const,
    area: 1450,
    houseRules: ['No smoking inside apartment', 'Quiet hours after 10 PM', 'No loud parties'],
    parking: true,
    status: 'approved' as const,
    locationData: {
      name: 'Bandra West, Mumbai',
      slug: 'bandra-west-mumbai-prop-seed',
      formattedAddress: 'Bandra West, Mumbai, Maharashtra 400050, India',
      latitude: 19.0596,
      longitude: 72.8295,
      address: {
        subLocality: 'Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      },
    },
    sampleImageUrls: [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    ],
    sampleVideoUrls: [
      'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-tour-41566-large.mp4',
    ],
  },
  {
    title: 'Spacious Private Room in Koramangala 5th Block',
    slug: 'spacious-private-room-in-koramangala-5th-block',
    description: 'Single private room available in a shared 3BHK flat near Sony World Signal. High-speed WiFi included.',
    propertyType: 'room' as const,
    rent: 16000,
    securityDeposit: 32000,
    maintenanceCharges: { amount: 1000, frequency: 'monthly' as const },
    furnishing: 'semi_furnished' as const,
    availableFrom: new Date(),
    genderPreference: 'female' as const,
    occupationPreference: 'student' as const,
    area: 350,
    houseRules: ['Vegetarian preferred', 'Guests allowed on weekends'],
    parking: true,
    status: 'approved' as const,
    locationData: {
      name: 'Koramangala 5th Block, Bengaluru',
      slug: 'koramangala-5th-block-prop-seed',
      formattedAddress: '5th Block, Koramangala, Bengaluru, Karnataka 560095, India',
      latitude: 12.9352,
      longitude: 77.6245,
      address: {
        subLocality: 'Koramangala 5th Block',
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
      'https://assets.mixkit.co/videos/preview/mixkit-view-of-a-living-room-in-a-modern-house-41570-large.mp4',
    ],
  },
  {
    title: 'Modern PG for Professionals in Gachibowli',
    slug: 'modern-pg-for-professionals-in-gachibowli',
    description: 'Twin sharing air-conditioned room with 3-time meals, daily housekeeping, and power backup.',
    propertyType: 'pg' as const,
    rent: 9500,
    securityDeposit: 15000,
    maintenanceCharges: { amount: 0, frequency: 'included' as const },
    furnishing: 'fully_furnished' as const,
    availableFrom: new Date(),
    genderPreference: 'male' as const,
    occupationPreference: 'working_professional' as const,
    area: 250,
    houseRules: ['Gate closing time 11 PM', 'No alcohol on premises'],
    parking: true,
    status: 'pending' as const,
    locationData: {
      name: 'Gachibowli, Hyderabad',
      slug: 'gachibowli-hyderabad-prop-seed',
      formattedAddress: 'Gachibowli, Hyderabad, Telangana 500032, India',
      latitude: 17.4401,
      longitude: 78.3489,
      address: {
        subLocality: 'Gachibowli',
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
    title: 'Independent 2 BHK Villa in Whitefield',
    slug: 'independent-2-bhk-villa-in-whitefield',
    description: 'Charming 2 BHK independent villa with private lawn, covered parking, and solar water heater.',
    propertyType: 'entire_property' as const,
    rent: 38000,
    securityDeposit: 76000,
    maintenanceCharges: { amount: 2500, frequency: 'monthly' as const },
    furnishing: 'semi_furnished' as const,
    availableFrom: new Date(),
    genderPreference: 'any' as const,
    occupationPreference: 'any' as const,
    area: 1200,
    houseRules: ['Pets welcome', 'Maintain lawn garden'],
    parking: true,
    status: 'closed' as const,
    locationData: {
      name: 'Whitefield, Bengaluru',
      slug: 'whitefield-bengaluru-prop-seed',
      formattedAddress: 'Whitefield, Bengaluru, Karnataka 560066, India',
      latitude: 12.9698,
      longitude: 77.7500,
      address: {
        subLocality: 'Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
      },
    },
    sampleImageUrls: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    ],
    sampleVideoUrls: [
      'https://assets.mixkit.co/videos/preview/mixkit-camera-pan-of-a-living-room-interior-41567-large.mp4',
    ],
  },
  {
    title: 'Studio Apartment near Cyber City Gurgaon',
    slug: 'studio-apartment-near-cyber-city-gurgaon',
    description: 'Compact studio flat suitable for single working executive. Close to IndusInd Bank Cyber City Metro Station.',
    propertyType: 'flat' as const,
    rent: 22000,
    securityDeposit: 44000,
    maintenanceCharges: { amount: 1500, frequency: 'monthly' as const },
    furnishing: 'fully_furnished' as const,
    availableFrom: new Date(),
    genderPreference: 'any' as const,
    occupationPreference: 'working_professional' as const,
    area: 550,
    houseRules: ['No commercial usage'],
    parking: true,
    status: 'rejected' as const,
    rejectionReason: 'Images attached are low quality and rent exceeds society benchmark guidelines.',
    locationData: {
      name: 'Cyber City, Gurgaon',
      slug: 'cyber-city-gurgaon-prop-seed',
      formattedAddress: 'DLF Cyber City, Gurgaon, Haryana 122002, India',
      latitude: 28.4950,
      longitude: 77.0895,
      address: {
        subLocality: 'Cyber City',
        city: 'Gurgaon',
        state: 'Haryana',
        country: 'India',
      },
    },
    sampleImageUrls: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=800&q=80',
    ],
    sampleVideoUrls: [
      'https://assets.mixkit.co/videos/preview/mixkit-dining-room-interior-design-tour-41569-large.mp4',
    ],
  },
];

const seedProperties = async (): Promise<void> => {
  try {
    await connectDB();
    logger.info('[Seed Script] Seeding sample properties with separate locations, images, and videos...');

    // 1. Fetch Existing Active Users
    const users = await User.find({ accountStatus: 'active' });
    logger.info(`[Seed Script] Found ${users.length} active users.`);

    if (users.length < 5) {
      throw new Error(
        `Insufficient active users found. Required at least 5 active users, but found ${users.length}.`
      );
    }

    // 2. Find Available Property Amenities
    const amenitiesList = await PropertyAmenity.find({ isActive: true }).limit(5);
    const amenityIds = amenitiesList.map((a) => a._id);

    let insertedCount = 0;
    let skippedCount = 0;

    for (let index = 0; index < SAMPLE_PROPERTIES_DATA.length; index++) {
      const data = SAMPLE_PROPERTIES_DATA[index];
      const ownerUser = users[index % users.length];

      const existing = await Property.findOne({ slug: data.slug });
      if (existing) {
        skippedCount++;
        logger.info(`[Seed Script] Property "${data.title}" already exists. Skipping.`);
        continue;
      }

      // Create separate, unique Location document for this property
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

      // Create separate, unique Image documents for this property
      const createdImageIds: mongoose.Types.ObjectId[] = [];
      for (let i = 0; i < data.sampleImageUrls.length; i++) {
        const img = await Image.create({
          url: data.sampleImageUrls[i],
          key: `images/prop-${index + 1}-${i + 1}-${Date.now()}.jpg`,
        });
        createdImageIds.push(img._id);
      }

      // Create separate, unique Video documents for this property
      const createdVideoIds: mongoose.Types.ObjectId[] = [];
      for (let i = 0; i < data.sampleVideoUrls.length; i++) {
        const vid = await Video.create({
          url: data.sampleVideoUrls[i],
          key: `videos/prop-${index + 1}-${i + 1}-${Date.now()}.mp4`,
        });
        createdVideoIds.push(vid._id);
      }

      await Property.create({
        userId: ownerUser._id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        propertyType: data.propertyType,
        location: locationDoc._id,
        rent: data.rent,
        securityDeposit: data.securityDeposit,
        maintenanceCharges: data.maintenanceCharges,
        furnishing: data.furnishing,
        availableFrom: data.availableFrom,
        genderPreference: data.genderPreference,
        occupationPreference: data.occupationPreference,
        area: data.area,
        houseRules: data.houseRules,
        parking: data.parking,
        amenities: amenityIds,
        images: createdImageIds,
        videos: createdVideoIds,
        status: data.status,
        rejectionReason: data.rejectionReason,
      });

      insertedCount++;
      logger.info(
        `[Seed Script] Created property: "${data.title}" (${data.status}) with distinct Location, ${createdImageIds.length} Images, and ${createdVideoIds.length} Videos. Assigned to user ${ownerUser._id} (${ownerUser.email || ownerUser.mobile || 'User'})`
      );
    }

    logger.info(`[Seed Script] Completed seeding properties. Inserted: ${insertedCount}, Skipped: ${skippedCount}.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('[Seed Script] Error seeding properties:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedProperties();
