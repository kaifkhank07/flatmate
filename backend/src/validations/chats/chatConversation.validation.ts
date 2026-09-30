import { z } from 'zod';
import { Types } from 'mongoose';

const objectIdString = z
  .string({ required_error: 'ID is required' })
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId',
  });

export const createConversationSchema = z.object({
  body: z.object({
    receiverId: objectIdString,
  }),
});

export const getConversationByIdSchema = z.object({
  params: z.object({
    conversationId: objectIdString,
  }),
});

export const getConversationsSchema = z.object({
  query: z.object({
    page: z.string().or(z.number()).optional(),
    limit: z.string().or(z.number()).optional(),
    search: z.string().optional(),
    user1Id: z.string().optional(),
    user2Id: z.string().optional(),
  }),
});
