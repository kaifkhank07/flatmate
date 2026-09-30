import { Schema, model, Document, Types } from 'mongoose';

export type AmenityCategory =
  | 'basic'
  | 'security'
  | 'parking'
  | 'fitness'
  | 'recreation'
  | 'utilities'
  | 'other';

export interface IAmenityImage {
  url?: string;
  key?: string;
}

export interface IPropertyAmenity extends Document {
  _id: Types.ObjectId;
  name: string;
  image?: IAmenityImage;
  category: AmenityCategory;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const propertyAmenitySchema = new Schema<IPropertyAmenity>(
  {
    category: {
      type: String,
      enum: ['basic', 'security', 'parking', 'fitness', 'recreation', 'utilities', 'other'],
      default: 'basic',
    },
    name: {
      type: String,
      required: [true, 'Amenity name is required'],
      trim: true,
    },
    image: {
      url: { type: String, trim: true },
      key: { type: String, trim: true },
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

propertyAmenitySchema.index({ category: 1 });
propertyAmenitySchema.index({ isActive: 1 });

export const PropertyAmenity = model<IPropertyAmenity>(
  'PropertyAmenity',
  propertyAmenitySchema
);
