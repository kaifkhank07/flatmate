import { Schema, model, Document, Types } from 'mongoose';

export interface IImage extends Document {
  _id: Types.ObjectId;
  url: string;
  key: string;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<IImage>(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    key: {
      type: String,
      required: [true, 'Image key is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Image = model<IImage>('Image', imageSchema);
