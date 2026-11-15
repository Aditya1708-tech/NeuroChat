import { Router } from 'express';
import {
  create,
  list,
  getById,
  updateTitle,
  remove,
} from '../controllers/conversation.controller.js';
import { editFile } from '../controllers/artifact.controller.js';
import { editFileSchema } from '../validators/artifact.schemas.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createConversationSchema,
  listConversationsQuerySchema,
  updateConversationSchema,
  conversationIdParamSchema,
} from '../validators/conversation.schemas.js';

const router = Router();

// All conversation routes require authentication
router.use(requireAuth);

// C1: Create conversation
router.post('/', validate(createConversationSchema), asyncHandler(create));

// C2: List conversations
router.get('/', validate(listConversationsQuerySchema, 'query'), asyncHandler(list));

// C3: Get conversation by ID
router.get('/:id', validate(conversationIdParamSchema, 'params'), asyncHandler(getById));

// C4: Rename conversation
router.patch(
  '/:id',
  validate(conversationIdParamSchema, 'params'),
  validate(updateConversationSchema),
  asyncHandler(updateTitle)
);

// C5: Delete conversation
router.delete('/:id', validate(conversationIdParamSchema, 'params'), asyncHandler(remove));

// C6: Direct File Editing endpoint
router.post(
  '/:id/edit-file',
  validate(conversationIdParamSchema, 'params'),
  validate(editFileSchema),
  asyncHandler(editFile)
);

export default router;
