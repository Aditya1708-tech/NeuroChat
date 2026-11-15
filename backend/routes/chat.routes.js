import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { messageLimiter } from '../middleware/rateLimiters.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AIProviderRouter } from '../services/ai/aiProviderRouter.js';
import { sendMessage } from '../services/chat.service.js';
import { Conversation } from '../models/Conversation.js';
import { fallbackTitle } from '../services/title.service.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

// GET /api/chat/models - List available chat models and status
router.get('/models', (req, res) => {
  res.status(200).json({
    success: true,
    data: AIProviderRouter.getModelStatus(),
  });
});

// All subsequent routes require authentication
router.use(requireAuth);

// POST /api/chat - Top-level chat message handler
router.post(
  '/',
  messageLimiter,
  asyncHandler(async (req, res) => {
    const { message, content, model = 'gemini', language = 'auto', conversationId, attachment } = req.body;
    const promptText = (content || message || '').trim();

    if (!promptText && !attachment) {
      throw new ApiError(400, 'MESSAGE_REQUIRED', 'Please provide a message or attachment.');
    }

    let targetConvId = conversationId;

    if (!targetConvId) {
      const initialTitle = fallbackTitle(promptText || 'New conversation');
      const conv = await Conversation.create({
        userId: req.user.id,
        title: initialTitle,
      });
      targetConvId = conv._id.toString();
    }

    const result = await sendMessage(req.user.id, targetConvId, {
      content: promptText,
      language,
      attachment,
      model,
    });

    res.status(201).json({
      success: true,
      data: {
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
        conversation: result.conversation,
      },
      meta: result.meta,
    });
  })
);

export default router;

