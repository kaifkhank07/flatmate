import { Schema, model, Document, Types } from 'mongoose';

export type AdminRole = 'admin' | 'super_admin';
export type AdminStatus = 'active' | 'inactive';

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: AdminRole;
  status: AdminStatus;
  lastLoginAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'super_admin'],
      default: 'admin',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    lastLoginAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.index({ createdAt: -1 });

export const Admin = model<IAdmin>('Admin', adminSchema);
