import { Schema, model, Document, Types } from 'mongoose';

export interface IRentalGuideImage {
    url?: string;
    key?: string;
}

export interface IRentalGuide extends Document {
    _id: Types.ObjectId;

    title: string;
    slug: string;
    description?: string;

    image?: IRentalGuideImage;
    content: string;

    isActive: boolean;

    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string[];
    };

    createdAt: Date;
    updatedAt: Date;
}

const rentalGuideSchema = new Schema<IRentalGuide>(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },

        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },

        content: {
            type: String,
            required: [true, 'Content is required'],
            trim: true,
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

        isActive: {
            type: Boolean,
            default: false,
            index: true,
        },

        seo: {
            metaTitle: { type: String, trim: true, },
            metaDescription: { type: String, trim: true, },
            keywords: [{ type: String, trim: true }],
        },
    },
    {
        timestamps: true,
    }
);


rentalGuideSchema.index({ isActive: 1, createdAt: -1, });

export const RentalGuide = model<IRentalGuide>('RentalGuide', rentalGuideSchema);