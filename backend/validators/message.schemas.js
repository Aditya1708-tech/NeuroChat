import { z } from 'zod';

export const listMessagesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  before: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid message ID').optional(),
});

export const sendMessageSchema = z
  .object({
    content: z
      .string()
      .trim()
      .max(4000, 'Message cannot exceed 4,000 characters.')
      .default(''),
    language: z.enum(['en', 'hi', 'auto']).nullish().or(z.literal('')),
    attachment: z
      .object({
        type: z.enum(['image', 'file']),
        name: z.string().max(255).default('attachment'),
        mimeType: z.string().max(128),
        size: z.number().max(20 * 1024 * 1024), // Max 20MB
        dataUrl: z.string(),
      })
      .nullable()
      .optional(),
  })
  .refine(
    (data) => (data.content && data.content.length > 0) || Boolean(data.attachment),
    {
      message: 'Message content or attachment is required.',
      path: ['content'],
    }
  );
