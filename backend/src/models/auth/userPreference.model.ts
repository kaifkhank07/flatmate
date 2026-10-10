import { Schema, model, Document, Types } from 'mongoose';

export interface IPreferenceImage {
  url?: string;
  key?: string;
}

export interface IUserPreference extends Document {
  _id: Types.ObjectId;
  name: string;
  image?: IPreferenceImage;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userPreferenceSchema = new Schema<IUserPreference>(
  {
    name: {
      type: String,
      required: [true, 'Preference name is required'],
      trim: true,
    },
    image: {
      url: { type: String, trim: true },
      key: { type: String, trim: true },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

userPreferenceSchema.index({ name: 1 }, { unique: true });

export const UserPreference = model<IUserPreference>('UserPreference', userPreferenceSchema);

