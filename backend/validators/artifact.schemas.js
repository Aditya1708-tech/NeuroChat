import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const artifactIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid artifact ID'),
});

export const listArtifactsQuerySchema = z.object({
  conversationId: z.string().regex(objectIdRegex, 'Invalid conversation ID').optional(),
  search: z.string().max(100).optional(),
  type: z.enum(['code', 'markdown', 'document', 'data', 'html', 'svg']).optional(),
  format: z.string().max(50).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  skip: z.coerce.number().min(0).optional().default(0),
});

export const createArtifactSchema = z.object({
  conversationId: z.string().regex(objectIdRegex, 'Invalid conversation ID').optional(),
  messageId: z.string().regex(objectIdRegex, 'Invalid message ID').optional(),
  title: z.string().trim().max(200).optional(),
  filename: z.string().trim().max(255).default('document.txt'),
  type: z.enum(['code', 'markdown', 'document', 'data', 'html', 'svg']).optional().default('code'),
  format: z.string().trim().max(50).optional(),
  mimeType: z.string().trim().max(128).optional(),
  content: z.string(),
  originalFileName: z.string().trim().max(255).optional(),
  originalFormat: z.string().trim().max(50).optional(),
});

export const updateArtifactSchema = z.object({
  title: z.string().trim().max(200).optional(),
  filename: z.string().trim().max(255).optional(),
  content: z.string().optional(),
  format: z.string().trim().max(50).optional(),
});

export const editFileSchema = z.object({
  fileContent: z.string().min(1, 'File content is required'),
  fileName: z.string().trim().max(255).default('document.txt'),
  mimeType: z.string().max(128).optional(),
  instructions: z.string().trim().max(4000).optional().default(''),
  targetFormat: z.string().trim().max(50).optional(),
});

