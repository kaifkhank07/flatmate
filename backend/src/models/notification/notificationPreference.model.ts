import { Schema, model, Document, Types } from 'mongoose';
import {
  RecipientType,
  NotificationChannel,
  NotificationCategory,
  NotificationEventType,
  IChannelPreferences,
  ICategoryPreferences,
  IPropertyMatchPreferences,
  RECIPIENT_TYPES,
  DEFAULT_GLOBAL_CHANNEL_PREFERENCES,
  DEFAULT_PROPERTY_MATCH_PREFERENCES,
  MANDATORY_TRANSACTIONAL_EVENTS,
} from './notification.types';

export * from './notification.types';

/**
 * Interface representing a NotificationPreference document in MongoDB
 */
export interface INotificationPreference extends Document {
  _id: Types.ObjectId;
  ownerType: RecipientType;
  ownerModel: 'User' | 'Admin';
  ownerId: Types.ObjectId;
  channels: IChannelPreferences;
  categories: ICategoryPreferences;
  propertyMatch: IPropertyMatchPreferences;
  createdAt: Date;
  updatedAt: Date;

  // Document Methods
  isChannelEnabled(
    category: NotificationCategory,
    channel: NotificationChannel,
    eventType?: NotificationEventType
  ): boolean;
}

/**
 * Mapping between channel enum and preference key
 */
export const CHANNEL_KEY_MAP: Record<NotificationChannel, keyof IChannelPreferences> = {
  IN_APP: 'inApp',
  EMAIL: 'email',
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
};

/**
 * Mapping between category enum and preference key
 */
export const CATEGORY_KEY_MAP: Record<NotificationCategory, keyof ICategoryPreferences> = {
  ACCOUNT_AND_VERIFICATION: 'accountAndVerification',
  LISTING_UPDATES: 'listingUpdates',
  PROPERTY_MATCH: 'propertyMatch',
  CHAT: 'chat',
  INQUIRIES_AND_REQUESTS: 'inquiriesAndRequests',
  REPORTS_AND_REVIEWS: 'reportsAndReviews',
  ADMINISTRATIVE: 'administrative',
  SYSTEM: 'system',
};

/**
 * Nested schema for channel preferences
 */
const channelPreferencesSchema = new Schema<IChannelPreferences>(
  {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
  },
  { _id: false }
);

/**
 * Nested schema for property matching preferences
 */
const propertyMatchPreferencesSchema = new Schema<IPropertyMatchPreferences>(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    cities: {
      type: [String],
      default: [],
    },
    localities: {
      type: [String],
      default: [],
    },
    budget: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
    },
    propertyTypes: {
      type: [String],
      enum: ['flat', 'room', 'pg', 'shared_apartment', 'entire_property'],
      default: [],
    },
    furnishing: {
      type: [String],
      enum: ['fully_furnished', 'semi_furnished', 'unfurnished'],
      default: [],
    },
    availableFrom: {
      type: Date,
    },
    immediateOnly: {
      type: Boolean,
      default: false,
    },
    genderPreference: {
      type: String,
      enum: ['male', 'female', 'other', 'any'],
      default: 'any',
    },
    occupationPreference: {
      type: String,
      enum: [
        'student',
        'working_professional',
        'self_employed',
        'business_owner',
        'freelancer',
        'other',
        'any',
      ],
      default: 'any',
    },
    amenities: [
      {
        type: Schema.Types.ObjectId,
        ref: 'PropertyAmenity',
      },
    ],
    postType: {
      type: String,
      enum: ['property', 'partner', 'both'],
      default: 'both',
    },
  },
  { _id: false }
);

/**
 * Mongoose Schema for NotificationPreference
 */
const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    ownerType: {
      type: String,
      enum: RECIPIENT_TYPES,
      required: [true, 'Owner type is required'],
      index: true,
    },
    ownerModel: {
      type: String,
      enum: ['User', 'Admin'],
      default: function (this: any) {
        return this.ownerType === 'ADMIN' ? 'Admin' : 'User';
      },
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Owner ID is required'],
      refPath: 'ownerModel',
      index: true,
    },
    channels: {
      type: channelPreferencesSchema,
      default: () => ({ ...DEFAULT_GLOBAL_CHANNEL_PREFERENCES }),
    },
    categories: {
      accountAndVerification: {
        type: channelPreferencesSchema,
        default: () => ({ inApp: true, email: true, sms: true, whatsapp: false }),
      },
      listingUpdates: {
        type: channelPreferencesSchema,
        default: () => ({ inApp: true, email: true, sms: false, whatsapp: true }),
      },
      propertyMatch: {
        type: channelPreferencesSchema,
        default: () => ({ inApp: true, email: true, sms: false, whatsapp: true }),
      },
      chat: {
        type: channelPreferencesSchema,
        default: () => ({ inApp: true, email: false, sms: false, whatsapp: true }),
      },
      inquiriesAndRequests: {
        type: channelPreferencesSchema,
        default: () => ({ inApp: true, email: true, sms: true, whatsapp: true }),
      },
      reportsAndReviews: {
        type: channelPreferencesSchema,
        default: () => ({ inApp: true, email: true, sms: false, whatsapp: false }),
      },
      administrative: {
        type: channelPreferencesSchema,
        default: () => ({ inApp: true, email: true, sms: false, whatsapp: false }),
      },
      system: {
        type: channelPreferencesSchema,
        default: () => ({ inApp: true, email: true, sms: false, whatsapp: false }),
      },
    },
    propertyMatch: {
      type: propertyMatchPreferencesSchema,
      default: () => ({ ...DEFAULT_PROPERTY_MATCH_PREFERENCES }),
    },
  },
  {
    timestamps: true,
  }
);

// Derive ownerModel automatically if not explicitly provided
notificationPreferenceSchema.pre('validate', function (next) {
  if (this.ownerType && !this.ownerModel) {
    this.ownerModel = this.ownerType === 'ADMIN' ? 'Admin' : 'User';
  }
  next();
});

// Document instance method to check if a specific channel is enabled
notificationPreferenceSchema.methods.isChannelEnabled = function (
  category: NotificationCategory,
  channel: NotificationChannel,
  eventType?: NotificationEventType
): boolean {
  // 1. Mandatory security & transactional events bypass category opt-out
  if (eventType && MANDATORY_TRANSACTIONAL_EVENTS.includes(eventType)) {
    return true;
  }

  const channelKey = CHANNEL_KEY_MAP[channel];
  if (!channelKey) return false;

  // 2. Check global channel master toggle
  if (this.channels && this.channels[channelKey] === false) {
    return false;
  }

  // 3. Check granular category toggle
  const categoryKey = CATEGORY_KEY_MAP[category];
  if (this.categories && categoryKey && this.categories[categoryKey]) {
    const categoryChannelValue = this.categories[categoryKey][channelKey];
    if (typeof categoryChannelValue === 'boolean') {
      return categoryChannelValue;
    }
  }

  return true;
};

// Compound unique index ensuring exactly one preference record per user or admin
notificationPreferenceSchema.index({ ownerType: 1, ownerId: 1 }, { unique: true });

export const NotificationPreference = model<INotificationPreference>(
  'NotificationPreference',
  notificationPreferenceSchema
);

// Safely remove legacy 'user_1' index if it lingers in MongoDB from previous schema versions
NotificationPreference.on('index', () => {
  NotificationPreference.collection.dropIndex('user_1').catch(() => {
    // Ignore IndexNotFound if already dropped
  });
});
