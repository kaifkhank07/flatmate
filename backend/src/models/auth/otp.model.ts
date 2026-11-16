import { Schema, model, Document, Types } from 'mongoose';

export type OTPType =
  | 'mobile_login'
  | 'email_login'
  | 'forgot_password'
  | 'mobile_verification'
  | 'email_verification'
  | 'account_deletion';

export interface IOTP extends Document {
  userId?: Types.ObjectId;
  identifier: string;
  type: OTPType;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  verifiedAt?: Date;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    identifier: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'mobile_login',
        'email_login',
        'forgot_password',
        'mobile_verification',
        'email_verification',
        'account_deletion',
      ],
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verifiedAt: {
      type: Date,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for automatic deletion after expiration
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ identifier: 1, type: 1, createdAt: -1 });

export const OTP = model<IOTP>('OTP', otpSchema);
