import { Schema, model, Document, Types } from 'mongoose';

export type ChatMessageType =
    | 'text'
    | 'image'
    | 'property'
    | 'flatmate-post';

export type ChatMessageStatus =
    | 'sent'
    | 'delivered'
    | 'read';

export interface IChatMessageAttachment {
    url: string;
    key?: string;
    name?: string;
    size?: number;
    mimeType?: string;
}

export interface IChatMessageProperty {
    propertyId: Types.ObjectId;
    title: string;
    slug: string;
    image?: string;
    rent?: number;
}

export interface IChatMessageFlatmate {
    flatmatePostId: Types.ObjectId;
    title: string;
    slug: string;
    image?: string;
    budget?: {
        min: number;
        max: number;
    };
}

export interface IChatMessage extends Document {
    conversationId: Types.ObjectId;

    senderId: Types.ObjectId;
    receiverId: Types.ObjectId;

    type: ChatMessageType;

    text?: string;

    attachment?: IChatMessageAttachment;

    property?: IChatMessageProperty;

    flatmate?: IChatMessageFlatmate;

    status: ChatMessageStatus;

    deliveredAt?: Date;
    readAt?: Date;

    isDeleted: boolean;
    deletedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'ChatConversation',
            required: true,
            index: true,
        },

        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        receiverId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: [
                'text',
                'image',
                'property',
                'flatmate-post',
            ],
            required: true,
            default: 'text',
        },

        text: {
            type: String,
            trim: true,
            maxlength: 5000,
        },

        attachment: {
            url: {
                type: String,
                trim: true,
            },
            key: {
                type: String,
                trim: true,
            },
            name: {
                type: String,
                trim: true,
            },
            size: {
                type: Number,
                min: 0,
            },
            mimeType: {
                type: String,
                trim: true,
            },
        },

        property: {
            propertyId: {
                type: Schema.Types.ObjectId,
                ref: 'Property',
            },
            title: {
                type: String,
                trim: true,
            },
            slug: {
                type: String,
                trim: true,
            },
            image: {
                type: String,
                trim: true,
            },
            rent: {
                type: Number,
                min: 0,
            },
        },

        flatmate: {
            flatmatePostId: {
                type: Schema.Types.ObjectId,
                ref: 'FlatmateRequirement',
            },
            title: {
                type: String,
                trim: true,
            },
            slug: {
                type: String,
                trim: true,
            },
            image: {
                type: String,
                trim: true,
            },
            budget: {
                min: {
                    type: Number,
                    min: 0,
                },
                max: {
                    type: Number,
                    min: 0,
                },
            },
        },

        status: {
            type: String,
            enum: [
                'sent',
                'delivered',
                'read',
            ],
            default: 'sent',
        },

        deliveredAt: {
            type: Date,
        },

        readAt: {
            type: Date,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },

        deletedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

chatMessageSchema.index({ conversationId: 1, createdAt: -1 });
chatMessageSchema.index({ receiverId: 1, status: 1 });

export const ChatMessage = model<IChatMessage>('ChatMessage', chatMessageSchema);