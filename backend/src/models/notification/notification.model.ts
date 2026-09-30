import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
  | 'SMS'
  | 'EMAIL'
  | 'CHAT'
  | 'PROPERTY_ALERT'
  | 'FLATMATE_ALERT'
  | 'CONTACT_REQUEST';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date | null;
  status: NotificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['SMS', 'EMAIL', 'CHAT', 'PROPERTY_ALERT', 'FLATMATE_ALERT', 'CONTACT_REQUEST'],
      required: [true, 'Notification type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
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
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'read'],
      default: 'sent',
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, type: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);
