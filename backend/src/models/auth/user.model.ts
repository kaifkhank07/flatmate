import { Schema, model, Document, Types } from 'mongoose';

export type UserType = 'owner' | 'flatmate' | 'agent' | 'builder';
export type AccountStatus = 'active' | 'inactive';
export type VerificationStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email?: string;
  mobile?: string;
  password?: string;
  userType: UserType;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  mobileVerified: boolean;
  profileVerified: boolean;
  verificationStatus: VerificationStatus;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  isOnline: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  deactiveAt?: Date;
  deactiveBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    userType: {
      type: String,
      enum: ['owner', 'flatmate', 'agent', 'builder'],
      default: 'flatmate',
      required: true,
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    mobileVerified: {
      type: Boolean,
      default: false,
    },
    profileVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
    },
    lastLoginAt: {
      type: Date,
    },
    lastActiveAt: {
      type: Date,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    deactiveAt: {
      type: Date,
      default: null,
    },
    deactiveBy: {
      type: Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ createdAt: -1 });

export const User = model<IUser>('User', userSchema);
