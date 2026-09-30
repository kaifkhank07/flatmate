import { Schema, model, Document, Types } from 'mongoose';

export interface IChatConversation extends Document {
    participants: [Types.ObjectId, Types.ObjectId];
    lastMessageId?: Types.ObjectId;
    lastMessageAt?: Date;
    unreadCounts: Map<string, number>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const chatConversationSchema = new Schema<IChatConversation>(
    {
        participants: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
            ],
            required: true,
            validate: {
                validator: (
                    value: Types.ObjectId[]
                ) =>
                    value.length === 2 &&
                    !value[0].equals(value[1]),
                message:
                    'A conversation must have exactly two different participants',
            },
        },

        lastMessageId: {
            type: Schema.Types.ObjectId,
            ref: 'ChatMessage',
        },

        lastMessageAt: {
            type: Date,
        },

        unreadCounts: {
            type: Map,
            of: Number,
            default: {},
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

// Prevent duplicate one-to-one conversations.
// Query should always sort participant IDs before creating.
chatConversationSchema.index({ participants: 1 }, { unique: true });
chatConversationSchema.index({ participants: 1, lastMessageAt: -1, });

export const ChatConversation = model<IChatConversation>('ChatConversation', chatConversationSchema);