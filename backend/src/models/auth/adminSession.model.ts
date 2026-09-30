import { Schema, model, Document, Types } from 'mongoose';

export interface IAdminSession extends Document {
  adminId: Types.ObjectId;
  refreshTokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  lastUsedAt?: Date;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const adminSessionSchema = new Schema<IAdminSession>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
    },
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

export const AdminSession = model<IAdminSession>('AdminSession', adminSessionSchema);
