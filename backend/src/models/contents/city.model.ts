import { Schema, model, Document, Types } from 'mongoose';

export interface ICityImage {
    url?: string;
    key?: string;
}

export interface ICity extends Document {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    image?: ICityImage;
    state: string;
    country: string;
    isPopular: boolean;
    isActive: boolean;
    seo?: {
        title?: string;
        description?: string;
        keywords?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

const citySchema = new Schema<ICity>(
    {
        name: {
            type: String,
            required: [true, 'City name is required'],
            trim: true,
        },

        slug: {
            type: String,
            required: [true, 'City slug is required'],
            unique: true,
            trim: true,
            lowercase: true,
        },

        image: {
            url: {
                type: String,
                trim: true,
            },
            key: {
                type: String,
                trim: true,
            },
        },

        state: {
            type: String,
            required: [true, 'State name is required'],
            trim: true,
        },

        country: {
            type: String,
            default: 'India',
            trim: true,
        },

        isPopular: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        seo: {
            title: {
                type: String,
                trim: true,
            },
            description: {
                type: String,
                trim: true,
            },
            keywords: [
                {
                    type: String,
                    trim: true,
                },
            ],
        },
    },
    {
        timestamps: true,
    }
);

citySchema.index({ name: 1 });
citySchema.index({ isActive: 1 });
citySchema.index({ isPopular: 1 });

export const City = model<ICity>('City', citySchema);