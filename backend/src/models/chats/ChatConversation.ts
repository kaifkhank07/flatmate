import { Schema, model, Document, Types } from 'mongoose';

export interface IChatConversation extends Document {
    participants: [Types.ObjectId, Types.ObjectId];
    conversationKey?: string;
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

        conversationKey: {
            type: String,
            trim: true,
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

// Deterministically generate conversationKey before validation to enforce 1-to-1 uniqueness
chatConversationSchema.pre('validate', function (next) {
    if (this.participants && this.participants.length === 2) {
        const sorted = [this.participants[0].toString(), this.participants[1].toString()].sort();
        this.conversationKey = `${sorted[0]}_${sorted[1]}`;
    }
    next();
});

// Prevent duplicate one-to-one conversations via unique conversationKey
chatConversationSchema.index({ conversationKey: 1 }, { unique: true, sparse: true });
// Index participants array without uniqueness so multiple conversations per user are allowed
chatConversationSchema.index({ participants: 1 });
chatConversationSchema.index({ participants: 1, lastMessageAt: -1 });

export const ChatConversation = model<IChatConversation>('ChatConversation', chatConversationSchema);