import { Schema, model, Document, Types } from 'mongoose';

export type ReportTargetType = 'property' | 'flatmaterequirement';
export type ReportTargetModel = 'Property' | 'FlatmateRequirement';
export type ReportReason = 'spam' | 'fraud' | 'inappropriate' | 'misleading' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface IReport extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  targetType: ReportTargetType;
  targetModel: ReportTargetModel;
  targetId: Types.ObjectId;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    targetType: {
      type: String,
      enum: ['property', 'flatmaterequirement'],
      required: [true, 'Target type is required'],
    },
    targetModel: {
      type: String,
      enum: ['Property', 'FlatmateRequirement'],
      required: [true, 'Target model is required'],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
      refPath: 'targetModel',
    },
    reason: {
      type: String,
      enum: ['spam', 'fraud', 'inappropriate', 'misleading', 'other'],
      required: [true, 'Report reason is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    resolutionNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helper function to derive targetModel from targetType
export const getTargetModelName = (targetType: string): ReportTargetModel => {
  if (targetType === 'property') return 'Property';
  if (targetType === 'flatmaterequirement') return 'FlatmateRequirement';
  throw new Error(`Invalid report targetType: ${targetType}`);
};

// Pre-validate hook to set targetModel automatically
reportSchema.pre('validate', function (next) {
  if (this.targetType) {
    this.targetModel = getTargetModelName(this.targetType);
  }
  next();
});

reportSchema.index({ userId: 1, targetType: 1, targetId: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

export const Report = model<IReport>('Report', reportSchema);
