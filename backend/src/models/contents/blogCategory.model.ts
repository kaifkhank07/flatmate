import { Schema, model, Document } from 'mongoose';

export interface IBlogCategory extends Document {
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const blogCategorySchema = new Schema<IBlogCategory>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
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

export const BlogCategory = model<IBlogCategory>(
    'BlogCategory',
    blogCategorySchema
);