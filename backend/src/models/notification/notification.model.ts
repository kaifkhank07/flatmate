import { Schema, model, Document, Types } from 'mongoose';
import {
  RecipientType,
  NotificationPriority,
  NotificationChannel,
  NotificationCategory,
  NotificationEventType,
  IChannelDelivery,
  RECIPIENT_TYPES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CHANNELS,
  CHANNEL_DELIVERY_STATUSES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_EVENT_TYPES,
  EVENT_CATEGORY_MAP,
} from './notification.types';

export * from './notification.types';

/**
 * Interface representing a Notification document in MongoDB
 */
export interface INotification extends Document {
  _id: Types.ObjectId;
  recipientType: RecipientType;
  recipientModel: 'User' | 'Admin';
  recipientId: Types.ObjectId;
  eventType: NotificationEventType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  priority: NotificationPriority;
  channels: IChannelDelivery[];
  isRead: boolean;
  readAt?: Date | null;
  deduplicationKey?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Document Methods
  markAsRead(): Promise<INotification>;
  getChannel(channel: NotificationChannel): IChannelDelivery | undefined;
}

/**
 * Nested schema for multi-channel delivery tracking
 */
const channelDeliverySchema = new Schema<IChannelDelivery>(
  {
    channel: {
      type: String,
      enum: NOTIFICATION_CHANNELS,
      required: true,
    },
    status: {
      type: String,
      enum: CHANNEL_DELIVERY_STATUSES,
      default: 'PENDING',
      required: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    providerMessageId: {
      type: String,
      trim: true,
    },
    lastAttemptAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    providerMetadata: {
      type: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

/**
 * Mongoose Schema for Notification
 */
const notificationSchema = new Schema<INotification>(
  {
    recipientType: {
      type: String,
      enum: RECIPIENT_TYPES,
      required: [true, 'Recipient type is required'],
      index: true,
    },
    recipientModel: {
      type: String,
      enum: ['User', 'Admin'],
      default: function (this: any) {
        return this.recipientType === 'ADMIN' ? 'Admin' : 'User';
      },
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Recipient ID is required'],
      refPath: 'recipientModel',
      index: true,
    },
    eventType: {
      type: String,
      enum: NOTIFICATION_EVENT_TYPES,
      required: [true, 'Event type is required'],
      index: true,
    },
    category: {
      type: String,
      enum: NOTIFICATION_CATEGORIES,
      required: [true, 'Category is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 250,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: 2000,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITIES,
      default: 'NORMAL',
      index: true,
    },
    channels: {
      type: [channelDeliverySchema],
      default: () => [
        {
          channel: 'IN_APP',
          status: 'DELIVERED',
          attemptCount: 1,
          deliveredAt: new Date(),
        },
      ],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    deduplicationKey: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Derive category & recipientModel automatically if not explicitly provided
notificationSchema.pre('validate', function (next) {
  if (this.recipientType && !this.recipientModel) {
    this.recipientModel = this.recipientType === 'ADMIN' ? 'Admin' : 'User';
  }
  if (this.eventType && !this.category) {
    this.category = EVENT_CATEGORY_MAP[this.eventType];
  }
  next();
});

// Document instance methods
notificationSchema.methods.markAsRead = async function (
  this: INotification
): Promise<INotification> {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    const inApp = this.channels?.find((c: IChannelDelivery) => c.channel === 'IN_APP');
    if (inApp) {
      inApp.status = 'READ';
      inApp.readAt = this.readAt;
    }
    return (this as any).save();
  }
  return this;
};

notificationSchema.methods.getChannel = function (
  this: INotification,
  channel: NotificationChannel
): IChannelDelivery | undefined {
  return this.channels?.find((c: IChannelDelivery) => c.channel === channel);
};

// --------------------------------------------------------------------------
// Indexes
// --------------------------------------------------------------------------

// 1. Newest notifications for a recipient (standard paginated feed)
notificationSchema.index({ recipientType: 1, recipientId: 1, createdAt: -1 });

// 2. Unread notification counts and unread list filtering
notificationSchema.index({ recipientType: 1, recipientId: 1, isRead: 1, createdAt: -1 });

// 3. Category filtering (e.g. chat only, listing alerts only)
notificationSchema.index({ recipientType: 1, recipientId: 1, category: 1, createdAt: -1 });

// 4. Specific event type filtering
notificationSchema.index({ recipientType: 1, recipientId: 1, eventType: 1, createdAt: -1 });

// 5. Scoped deduplication index (partial index: only enforces uniqueness when deduplicationKey is a string)
notificationSchema.index(
  { recipientType: 1, recipientId: 1, deduplicationKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deduplicationKey: { $type: 'string' },
    },
  }
);

// 6. TTL auto-expiration index (automatically deletes expired notifications when expiresAt is set)
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

// 7. Background delivery worker index (for querying pending/processing dispatches)
notificationSchema.index({ 'channels.channel': 1, 'channels.status': 1 });

export const Notification = model<INotification>('Notification', notificationSchema);

// Safely drop legacy/faulty compound sparse index if it exists in MongoDB without partialFilterExpression
Notification.on('index', async () => {
  try {
    const indexes = await Notification.collection.indexes();
    const badIndex = indexes.find(
      (idx) =>
        idx.name === 'recipientType_1_recipientId_1_deduplicationKey_1' &&
        !idx.partialFilterExpression
    );
    if (badIndex && badIndex.name) {
      await Notification.collection.dropIndex(badIndex.name);
      await Notification.syncIndexes();
    }
  } catch {
    // Ignore if already dropped or index event completes
  }
});
