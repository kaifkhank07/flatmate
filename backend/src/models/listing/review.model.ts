import { Schema, model, Document, Types } from 'mongoose';

export type ReviewTargetType = 'user' | 'property' | 'flatmaterequirement';
export type ReviewTargetModel = 'User' | 'Property' | 'FlatmateRequirement';
export type ReviewStatus = 'pending' | 'published' | 'hidden' | 'rejected';

export interface IReview extends Document {
  _id: Types.ObjectId;
  reviewerId: Types.ObjectId;
  targetType: ReviewTargetType;
  targetModel: ReviewTargetModel;
  targetId: Types.ObjectId;
  rating: number;
  title?: string;
  comment?: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer ID is required'],
      index: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'property', 'flatmaterequirement'],
      required: [true, 'Target type is required'],
    },
    targetModel: {
      type: String,
      enum: ['User', 'Property', 'FlatmateRequirement'],
      required: [true, 'Target model is required'],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
      refPath: 'targetModel',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'published', 'hidden', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/** Helper to derive targetModel from targetType */
export const getReviewTargetModelName = (targetType: string): ReviewTargetModel => {
  if (targetType === 'user') return 'User';
  if (targetType === 'property') return 'Property';
  if (targetType === 'flatmaterequirement') return 'FlatmateRequirement';
  throw new Error(`Invalid review targetType: ${targetType}`);
};

/** Pre-validate hook to set targetModel automatically from targetType */
reviewSchema.pre('validate', function (next) {
  if (this.targetType) {
    this.targetModel = getReviewTargetModelName(this.targetType);
  }
  next();
});

// Enforce unique review per user per target
reviewSchema.index({ reviewerId: 1, targetType: 1, targetId: 1 }, { unique: true });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ targetType: 1, targetId: 1, status: 1 });

export const Review = model<IReview>('Review', reviewSchema);
