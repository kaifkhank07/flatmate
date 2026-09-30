import { Schema, model, Document, Types } from 'mongoose';

export type ChatReportReason =
    | 'spam'
    | 'harassment'
    | 'inappropriate_content'
    | 'fraud'
    | 'fake_profile'
    | 'scam'
    | 'other';

export type ChatReportStatus =
    | 'pending'
    | 'reviewed'
    | 'resolved'
    | 'rejected';

export interface IChatReport extends Document {
    reporterId: Types.ObjectId;
    reportedUserId: Types.ObjectId;

    reason: ChatReportReason;

    description?: string;

    status: ChatReportStatus;

    adminNote?: string;

    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const chatReportSchema = new Schema<IChatReport>(
    {
        reporterId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        reportedUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        reason: {
            type: String,
            enum: [
                'spam',
                'harassment',
                'inappropriate_content',
                'fraud',
                'fake_profile',
                'scam',
                'other',
            ],
            required: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
        },

        status: {
            type: String,
            enum: [
                'pending',
                'reviewed',
                'resolved',
                'rejected',
            ],
            default: 'pending',
            index: true,
        },

        adminNote: {
            type: String,
            trim: true,
            maxlength: 1000,
        },

        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
        },

        reviewedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

chatReportSchema.index({ reportedUserId: 1, status: 1, createdAt: -1, });
chatReportSchema.index({ reporterId: 1, createdAt: -1, });

export const ChatReport = model<IChatReport>('ChatReport', chatReportSchema);