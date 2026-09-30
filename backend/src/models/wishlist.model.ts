import { Schema, model, Document, Types } from 'mongoose';

export type WishlistTargetType = 'property' | 'flatmatepost';
export type WishlistTargetModel = 'Property' | 'FlatmatePost';

export interface IWishlist extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  targetType: WishlistTargetType;
  targetModel: WishlistTargetModel;
  targetId: Types.ObjectId;
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
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
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Helper function to derive targetModel from targetType
export const getTargetModelName = (targetType: WishlistTargetType): WishlistTargetModel => {
  if (targetType === 'property') return 'Property';
  return 'FlatmatePost';
};

// Pre-validate hook to set targetModel automatically
wishlistSchema.pre('validate', function (next) {
  if (this.targetType) {
    this.targetModel = getTargetModelName(this.targetType);
  }
  next();
});

// Compound unique index to prevent duplicate wishlists
wishlistSchema.index(
  { userId: 1, targetType: 1, targetId: 1 },
  { unique: true }
);

export const Wishlist = model<IWishlist>('Wishlist', wishlistSchema);
