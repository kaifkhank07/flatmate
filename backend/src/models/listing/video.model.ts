import { Schema, model, Document, Types } from 'mongoose';

export interface IVideo extends Document {
  _id: Types.ObjectId;
  url: string;
  key: string;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    url: {
      type: String,
      required: [true, 'Video URL is required'],
      trim: true,
    },
    key: {
      type: String,
      required: [true, 'Video key is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Video = model<IVideo>('Video', videoSchema);
