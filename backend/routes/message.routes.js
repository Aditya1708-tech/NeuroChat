import { Router } from 'express';
import { list, send, retry } from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { messageLimiter } from '../middleware/rateLimiters.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  listMessagesQuerySchema,
  sendMessageSchema,
} from '../validators/message.schemas.js';
import { conversationIdParamSchema } from '../validators/conversation.schemas.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// M1: List messages in conversation
router.get(
  '/',
  validate(conversationIdParamSchema, 'params'),
  validate(listMessagesQuerySchema, 'query'),
  asyncHandler(list)
);

// M2: Send new user message & get AI reply
router.post(
  '/',
  messageLimiter,
  validate(conversationIdParamSchema, 'params'),
  validate(sendMessageSchema),
  asyncHandler(send)
);

// M3: Retry / regenerate message
router.post(
  '/retry',
  messageLimiter,
  validate(conversationIdParamSchema, 'params'),
  asyncHandler(retry)
);

export default router;
