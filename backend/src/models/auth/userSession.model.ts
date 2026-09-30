import { Schema, model, Document, Types } from 'mongoose';

export type DeviceType = 'web' | 'android' | 'ios';

export interface IUserSession extends Document {
  userId: Types.ObjectId;
  refreshTokenHash: string;
  deviceId?: string;
  deviceType: DeviceType;
  browser?: string;
  os?: string;
  ipAddress?: string;
  userAgent?: string;
  lastUsedAt?: Date;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSessionSchema = new Schema<IUserSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ['web', 'android', 'ios'],
      default: 'web',
    },
    browser: { type: String, trim: true },
    os: { type: String, trim: true },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const UserSession = model<IUserSession>('UserSession', userSessionSchema);
