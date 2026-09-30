import { Schema, model, Document, Types } from 'mongoose';

export interface IBlogImage {
    url?: string;
    key?: string;
}

export interface IBlogSeo {
    title?: string;
    description?: string;
    keywords?: string[];
}

export interface IBlogFaq {
    question: string;
    answer: string;
}

export interface IBlog extends Document {
    title: string;
    slug: string;
    content: string;
    categoryId: Types.ObjectId;
    image?: IBlogImage;
    isActive: boolean;
    seo?: IBlogSeo;
    faqs?: IBlogFaq[];
    createdAt: Date;
    updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        content: {
            type: String,
            required: true,
        },

        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'BlogCategory',
            required: true,
            index: true,
        },

        image: {
            url: { type: String, trim: true },
            key: { type: String, trim: true },
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        seo: {
            title: { type: String, trim: true },
            description: { type: String, trim: true },
            keywords: [{ type: String, trim: true }],
        },

        faqs: [
            {
                question: {
                    type: String,
                    required: true,
                    trim: true,
                },
                answer: {
                    type: String,
                    required: true,
                    trim: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

blogSchema.index({
    categoryId: 1,
    isActive: 1,
});

export const Blog = model<IBlog>(
    'Blog',
    blogSchema
);