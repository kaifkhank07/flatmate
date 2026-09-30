import { Schema, model, Document, Types } from 'mongoose';

export interface IChatBlock extends Document {
    blockerId: Types.ObjectId;
    blockedUserId: Types.ObjectId;

    reason?: string;

    createdAt: Date;
    updatedAt: Date;
}

const chatBlockSchema = new Schema<IChatBlock>(
    {
        blockerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        blockedUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        reason: {
            type: String,
            trim: true,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
    }
);

chatBlockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true, });

export const ChatBlock = model<IChatBlock>('ChatBlock', chatBlockSchema);