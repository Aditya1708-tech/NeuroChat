import { z } from 'zod';

export const conversationIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid conversation ID format.'),
});

export const createConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title must be at least 1 character.')
    .max(100, 'Title cannot exceed 100 characters.')
    .optional()
    .default('New chat'),
});

export const updateConversationSchema = z.object({
  title: z
    .string({ required_error: 'Title is required.' })
    .trim()
    .min(1, 'Title cannot be empty.')
    .max(100, 'Title cannot exceed 100 characters.'),
});

export const listConversationsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  cursor: z.string().optional(),
  search: z.string().max(100).optional(),
  searchIn: z.enum(['titles', 'messages']).optional().default('titles'),
});
