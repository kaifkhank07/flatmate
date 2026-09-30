import { Schema, model, Document, Types } from 'mongoose';

export interface ILocationAddress {
  streetNumber?: string;
  route?: string;
  subLocality?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  stateCode?: string;
  country?: string;
  countryCode?: string;
  postalCode?: string;
}

export interface IGoogleMapsData {
  placeId?: string;
  mapsUrl?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface IGeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude] in GeoJSON
}

export interface ILocation extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  geoLocation?: IGeoLocation;
  placeId?: string;
  locationType?: string;
  address: ILocationAddress;
  googleMaps?: IGoogleMapsData;
  providerResponse?: Record<string, any>;
  isPopular: boolean;
  isActive: boolean;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Location slug is required'],
      trim: true,
      lowercase: true,
    },
    formattedAddress: {
      type: String,
      required: [true, 'Formatted address is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180,
    },
    geoLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    placeId: {
      type: String,
      trim: true,
    },
    locationType: {
      type: String,
      trim: true,
    },
    address: {
      streetNumber: { type: String, trim: true },
      route: { type: String, trim: true },
      subLocality: { type: String, trim: true },
      locality: { type: String, trim: true },
      city: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
      stateCode: { type: String, trim: true, uppercase: true },
      country: { type: String, trim: true, default: 'India' },
      countryCode: { type: String, trim: true, uppercase: true, default: 'IN' },
      postalCode: { type: String, trim: true },
    },
    googleMaps: {
      placeId: { type: String, trim: true },
      mapsUrl: { type: String, trim: true },
      location: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    providerResponse: {
      type: Schema.Types.Mixed,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
      keywords: [{ type: String, trim: true }],
    },
  },
  {
    timestamps: true,
  }
);

// Slug auto-generation pre-validate hook
locationSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  // Synchronize GeoJSON point if latitude and longitude exist
  if (this.latitude !== undefined && this.longitude !== undefined) {
    this.geoLocation = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude],
    };
  }
  next();
});

// Database Indexes for Fast Querying and Spatial Searching
locationSchema.index({ placeId: 1 });
locationSchema.index({ slug: 1 });
locationSchema.index({ name: 1 });
locationSchema.index({ isActive: 1 });
locationSchema.index({ isPopular: 1 });
locationSchema.index({ latitude: 1, longitude: 1 });
locationSchema.index({ geoLocation: '2dsphere' });
locationSchema.index({ 'address.city': 1 });
locationSchema.index({ 'address.state': 1 });
locationSchema.index({ 'address.country': 1 });

export const Location = model<ILocation>('Location', locationSchema);

// Safely drop old unique placeId_1 index if present in MongoDB
Location.collection.dropIndex('placeId_1').catch(() => {
  // Index placeId_1 may not exist or may have already been dropped
});
