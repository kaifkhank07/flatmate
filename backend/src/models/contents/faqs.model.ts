import { Schema, model, Document, Types } from 'mongoose';

export type FAQPage =
    | 'home'
    | 'property'
    | 'flatmate'
    | 'rental'
    | 'contact';

export interface IFAQ extends Document {
    _id: Types.ObjectId;
    question: string;
    answer: string;
    page?: FAQPage;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>(
    {
        question: {
            type: String,
            required: [true, 'Question is required'],
            trim: true,
        },

        answer: {
            type: String,
            required: [true, 'Answer is required'],
            trim: true,
        },

        page: {
            type: String,
            enum: [
                'home',
                'property',
                'flatmate',
                'rental',
                'contact',
            ],
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

faqSchema.index({ page: 1, isActive: 1 });

export const FAQ = model<IFAQ>('FAQ', faqSchema);