import { Schema, model, Document, Types } from 'mongoose';

export interface INotificationPreference extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  sms: boolean;
  email: boolean;
  chat: boolean;
  propertyAlert: boolean;
  flatmateAlert: boolean;
  contactRequest: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {  
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    sms: {
      type: Boolean,
      default: true,
    },
    email: {
      type: Boolean,
      default: true,
    },
    chat: {
      type: Boolean,
      default: true,
    },
    propertyAlert: {
      type: Boolean,
      default: true,
    },
    flatmateAlert: {
      type: Boolean,
      default: true,
    },
    contactRequest: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationPreference = model<INotificationPreference>(
  'NotificationPreference',
  notificationPreferenceSchema
);
