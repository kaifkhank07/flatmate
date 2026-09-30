import { Schema, model, Document, Types } from 'mongoose';

export type RecentlyViewedTargetType = 'property' | 'flatmatepost';
export type RecentlyViewedTargetModel = 'Property' | 'FlatmatePost';

export interface IRecentlyViewed extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  targetType: RecentlyViewedTargetType;
  targetModel: RecentlyViewedTargetModel;
  targetId: Types.ObjectId;
  viewedAt: Date;
}

const recentlyViewedSchema = new Schema<IRecentlyViewed>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    targetType: {
      type: String,
      enum: ['property', 'flatmatepost'],
      required: [true, 'Target type is required'],
    },
    targetModel: {
      type: String,
      enum: ['Property', 'FlatmatePost'],
      required: [true, 'Target model is required'],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
      refPath: 'targetModel',
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Helper function to derive targetModel from targetType
export const getTargetModelName = (targetType: RecentlyViewedTargetType): RecentlyViewedTargetModel => {
  if (targetType === 'property') return 'Property';
  return 'FlatmatePost';
};

// Pre-validate hook to set targetModel automatically
recentlyViewedSchema.pre('validate', function (next) {
  if (this.targetType) {
    this.targetModel = getTargetModelName(this.targetType);
  }
  next();
});

recentlyViewedSchema.index({ userId: 1, viewedAt: -1 });
recentlyViewedSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

export const RecentlyViewed = model<IRecentlyViewed>(
  'RecentlyViewed',
  recentlyViewedSchema
);
