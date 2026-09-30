import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Location } from '../models/listing/location.model';
import { logger } from '../utils/logger.util';

const SAMPLE_LOCATIONS = [
  {
    name: 'Bandra West',
    slug: 'bandra-west',
    formattedAddress: 'Bandra West, Mumbai, Maharashtra 400050, India',
    latitude: 19.0596,
    longitude: 72.8295,
    placeId: 'ChIJbU60yXA35zsRFiDocumentPlaceId_Bandra',
    locationType: 'sublocality_level_1',
    address: {
      subLocality: 'Bandra West',
      city: 'Mumbai',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      stateCode: 'MH',
      country: 'India',
      countryCode: 'IN',
      postalCode: '400050',
    },
    googleMaps: {
      placeId: 'ChIJbU60yXA35zsRFiDocumentPlaceId_Bandra',
      mapsUrl: 'https://maps.google.com/?q=Bandra+West+Mumbai',
      location: { lat: 19.0596, lng: 72.8295 },
    },
    isPopular: true,
    isActive: true,
    seo: {
      title: 'Flatmates in Bandra West Mumbai',
      description: 'Find rooms and flatmates in Bandra West, Mumbai',
      keywords: ['bandra west', 'mumbai', 'flatmate', 'room'],
    },
  },
  {
    name: 'Andheri East',
    slug: 'andheri-east',
    formattedAddress: 'Andheri East, Mumbai, Maharashtra 400069, India',
    latitude: 19.1136,
    longitude: 72.8697,
    placeId: 'ChIJbU60yXA35zsRFiDocumentPlaceId_Andheri',
    locationType: 'sublocality_level_1',
    address: {
      subLocality: 'Andheri East',
      city: 'Mumbai',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      stateCode: 'MH',
      country: 'India',
      countryCode: 'IN',
      postalCode: '400069',
    },
    googleMaps: {
      placeId: 'ChIJbU60yXA35zsRFiDocumentPlaceId_Andheri',
      mapsUrl: 'https://maps.google.com/?q=Andheri+East+Mumbai',
      location: { lat: 19.1136, lng: 72.8697 },
    },
    isPopular: true,
    isActive: true,
    seo: {
      title: 'Flatmates in Andheri East Mumbai',
      description: 'Find shared apartments and flatmates in Andheri East, Mumbai',
      keywords: ['andheri east', 'mumbai', 'flatmate', 'shared room'],
    },
  },
  {
    name: 'Koramangala',
    slug: 'koramangala',
    formattedAddress: 'Koramangala, Bengaluru, Karnataka 560034, India',
    latitude: 12.9352,
    longitude: 77.6245,
    placeId: 'ChIJbU60yXA35zsRFiDocumentPlaceId_Koramangala',
    locationType: 'sublocality_level_1',
    address: {
      subLocality: 'Koramangala',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      stateCode: 'KA',
      country: 'India',
      countryCode: 'IN',
      postalCode: '560034',
    },
    googleMaps: {
      placeId: 'ChIJbU60yXA35zsRFiDocumentPlaceId_Koramangala',
      mapsUrl: 'https://maps.google.com/?q=Koramangala+Bengaluru',
      location: { lat: 12.9352, lng: 77.6245 },
    },
    isPopular: true,
    isActive: true,
    seo: {
      title: 'Flatmates in Koramangala Bengaluru',
      description: 'Find rooms and PG in Koramangala Bengaluru',
      keywords: ['koramangala', 'bengaluru', 'flatmates'],
    },
  },
  {
    name: 'Indiranagar',
    slug: 'indiranagar',
    formattedAddress: 'Indiranagar, Bengaluru, Karnataka 560038, India',
    latitude: 12.9784,
    longitude: 77.6408,
    placeId: 'ChIJbU60yXA35zsRFiDocumentPlaceId_Indiranagar',
    locationType: 'sublocality_level_1',
    address: {
      subLocality: 'Indiranagar',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      stateCode: 'KA',
      country: 'India',
      countryCode: 'IN',
      postalCode: '560038',
    },
    googleMaps: {
      placeId: 'ChIJbU60yXA35zsRFiDocumentPlaceId_Indiranagar',
      mapsUrl: 'https://maps.google.com/?q=Indiranagar+Bengaluru',
      location: { lat: 12.9784, lng: 77.6408 },
    },
    isPopular: true,
    isActive: true,
    seo: {
      title: 'Flatmates in Indiranagar Bengaluru',
      description: 'Find flatmates and shared rooms in Indiranagar Bengaluru',
      keywords: ['indiranagar', 'bengaluru', 'roommates'],
    },
  },
  {
    name: 'Connaught Place',
    slug: 'connaught-place',
    formattedAddress: 'Connaught Place, New Delhi, Delhi 110001, India',
    latitude: 28.6315,
    longitude: 77.2167,
    placeId: 'ChIJbU60yXA35zsRFiDocumentPlaceId_ConnaughtPlace',
    locationType: 'sublocality_level_1',
    address: {
      subLocality: 'Connaught Place',
      city: 'New Delhi',
      district: 'New Delhi',
      state: 'Delhi',
      stateCode: 'DL',
      country: 'India',
      countryCode: 'IN',
      postalCode: '110001',
    },
    googleMaps: {
      placeId: 'ChIJbU60yXA35zsRFiDocumentPlaceId_ConnaughtPlace',
      mapsUrl: 'https://maps.google.com/?q=Connaught+Place+New+Delhi',
      location: { lat: 28.6315, lng: 77.2167 },
    },
    isPopular: true,
    isActive: true,
    seo: {
      title: 'Flatmates in Connaught Place New Delhi',
      description: 'Find rooms in Connaught Place New Delhi',
      keywords: ['connaught place', 'delhi', 'flatmates'],
    },
  },
  {
    name: 'Kharadi',
    slug: 'kharadi',
    formattedAddress: 'Kharadi, Pune, Maharashtra 411014, India',
    latitude: 18.5515,
    longitude: 73.9458,
    placeId: 'ChIJbU60yXA35zsRFiDocumentPlaceId_Kharadi',
    locationType: 'sublocality_level_1',
    address: {
      subLocality: 'Kharadi',
      city: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      stateCode: 'MH',
      country: 'India',
      countryCode: 'IN',
      postalCode: '411014',
    },
    googleMaps: {
      placeId: 'ChIJbU60yXA35zsRFiDocumentPlaceId_Kharadi',
      mapsUrl: 'https://maps.google.com/?q=Kharadi+Pune',
      location: { lat: 18.5515, lng: 73.9458 },
    },
    isPopular: true,
    isActive: true,
    seo: {
      title: 'Flatmates in Kharadi Pune',
      description: 'Find shared flats and rooms in Kharadi IT Park Pune',
      keywords: ['kharadi', 'pune', 'flatmate'],
    },
  },
];

const seedLocations = async (): Promise<void> => {
  try {
    await connectDB();

    logger.info('[Seed Script] Seeding locations...');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const loc of SAMPLE_LOCATIONS) {
      const existing = await Location.findOne({ placeId: loc.placeId });

      if (existing) {
        skippedCount++;
        logger.info(`[Seed Script] Location "${loc.name}" (${loc.placeId}) already exists. Skipping.`);
      } else {
        await Location.create({
          ...loc,
          geoLocation: {
            type: 'Point',
            coordinates: [loc.longitude, loc.latitude],
          },
        });
        insertedCount++;
        logger.info(`[Seed Script] Created location: ${loc.name}`);
      }
    }

    logger.info(`[Seed Script] Completed seeding locations. Inserted: ${insertedCount}, Skipped: ${skippedCount}.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('[Seed Script] Error seeding locations:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedLocations();
