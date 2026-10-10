import { Schema, model, Document, Types } from 'mongoose';

export interface IAmenityImage {
  url?: string;
  key?: string;
}

export interface IPropertyAmenity extends Document {
  _id: Types.ObjectId;
  name: string;
  image?: IAmenityImage;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const propertyAmenitySchema = new Schema<IPropertyAmenity>(
  {
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

propertyAmenitySchema.index({ name: 1 }, { unique: true });
propertyAmenitySchema.index({ isActive: 1 });

export const PropertyAmenity = model<IPropertyAmenity>(
  'PropertyAmenity',
  propertyAmenitySchema
);

