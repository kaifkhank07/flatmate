import { Schema, model, Document, Types } from 'mongoose';

export interface IAvatarImage {
  url: string;
  key: string;
}

export interface IAvatar extends Document {
  _id: Types.ObjectId;
  name: string;
  image: IAvatarImage;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const avatarSchema = new Schema<IAvatar>(
  {
    name: {
      type: String,
      required: [true, 'Avatar name is required'],
      trim: true,
    },
    image: {
      url: {
        type: String,
        required: [true, 'Avatar image URL is required'],
        trim: true,
      },
      key: {
        type: String,
        required: [true, 'Avatar image S3 key is required'],
        trim: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

avatarSchema.index({ name: 1 });
avatarSchema.index({ isActive: 1 });

export const Avatar = model<IAvatar>('Avatar', avatarSchema);
