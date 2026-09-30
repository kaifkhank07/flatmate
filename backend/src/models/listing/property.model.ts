import { Schema, model, Document, Types } from 'mongoose';

export type ListingType =
  | 'flat'
  | 'room'
  | 'pg'
  | 'shared_apartment'
  | 'entire_property';

export type FurnishingType =
  | 'fully_furnished'
  | 'semi_furnished'
  | 'unfurnished';

export type GenderPreference = 'male' | 'female' | 'other' | 'any';

export type OccupationPreference =
  | 'student'
  | 'working_professional'
  | 'any';

export type MaintenanceFrequency =
  | 'monthly'
  | 'yearly'
  | 'included'
  | 'one_time';

export type PropertyStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'blocked'
  | 'closed'
  | 'expired';

export interface IProperty extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;

  title: string;
  slug: string;
  description: string;

  listingType: ListingType;

  location: Types.ObjectId;

  rent: number;

  securityDeposit: number;

  maintenanceCharges: {
    amount: number;
    frequency: MaintenanceFrequency;
  };

  furnishing: FurnishingType;

  availableFrom: Date;
  availableUntil?: Date;

  genderPreference: GenderPreference;
  occupationPreference: OccupationPreference;

  amenities: Types.ObjectId[];
  houseRules: string[];

  parking: {
    available: boolean;
  };

  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  floors?: number;

  area?: {
    value: number;
    unit: 'sqft' | 'sqm';
  };

  images: Types.ObjectId[];
  videos: Types.ObjectId[];

  status: PropertyStatus;
  rejectionReason?: string;

  favoriteCount: number;

  expiresAt?: Date;
  approvedAt?: Date;
  publishedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const propertySchema = new Schema<IProperty>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },

    listingType: {
      type: String,
      enum: ['flat', 'room', 'pg', 'shared_apartment', 'entire_property'],
      required: [true, 'Listing type is required'],
    },

    location: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location ID is required'],
      index: true,
    },

    rent: {
      type: Number,
      required: [true, 'Rent amount is required'],
      min: [0, 'Rent amount cannot be negative'],
    },

    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, 'Security deposit cannot be negative'],
    },

    maintenanceCharges: {
      amount: {
        type: Number,
        default: 0,
        min: [0, 'Maintenance amount cannot be negative'],
      },
      frequency: {
        type: String,
        enum: ['monthly', 'yearly', 'included', 'one_time'],
        default: 'monthly',
      },
    },

    furnishing: {
      type: String,
      enum: ['fully_furnished', 'semi_furnished', 'unfurnished'],
      required: [true, 'Furnishing status is required'],
    },

    availableFrom: {
      type: Date,
      required: [true, 'Available from date is required'],
    },

    availableUntil: {
      type: Date,
    },

    genderPreference: {
      type: String,
      enum: ['male', 'female', 'other', 'any'],
      default: 'any',
    },

    occupationPreference: {
      type: String,
      enum: ['student', 'working_professional', 'any'],
      default: 'any',
    },

    amenities: [
      {
        type: Schema.Types.ObjectId,
        ref: 'PropertyAmenity',
      },
    ],

    houseRules: [
      {
        type: String,
        trim: true,
      },
    ],

    parking: {
      available: {
        type: Boolean,
        default: false,
      },
    },

    bedrooms: {
      type: Number,
      min: 0,
    },

    bathrooms: {
      type: Number,
      min: 0,
    },

    balconies: {
      type: Number,
      min: 0,
    },

    floors: {
      type: Number,
      min: 0,
    },

    area: {
      value: {
        type: Number,
        min: 0,
      },
      unit: {
        type: String,
        enum: ['sqft', 'sqm'],
        default: 'sqft',
      },
    },

    images: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Image',
      },
    ],

    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],

    status: {
      type: String,
      enum: [
        'draft',
        'pending',
        'approved',
        'rejected',
        'blocked',
        'closed',
        'expired',
      ],
      default: 'pending',
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    favoriteCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    expiresAt: {
      type: Date,
    },

    approvedAt: {
      type: Date,
    },

    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
propertySchema.index({ status: 1 });
propertySchema.index({ listingType: 1 });
propertySchema.index({ rent: 1 });
propertySchema.index({ availableFrom: 1 });

export const Property = model<IProperty>('Property', propertySchema);