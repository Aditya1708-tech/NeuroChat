import { Router } from 'express';
import {
  updateProfile,
  updatePassword,
  listMemories,
  createMemory,
  removeMemory,
  removeAllMemories,
} from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  updateProfileSchema,
  updatePasswordSchema,
} from '../validators/user.schemas.js';

const router = Router();

router.use(requireAuth);

// U1: Update profile and preferences
router.patch('/me', validate(updateProfileSchema), asyncHandler(updateProfile));

// U2: Change or set password
router.patch('/me/password', validate(updatePasswordSchema), asyncHandler(updatePassword));

// U3: Memory Management (ChatGPT-style Memory)
router.get('/me/memories', asyncHandler(listMemories));
router.post('/me/memories', asyncHandler(createMemory));
router.delete('/me/memories/:id', asyncHandler(removeMemory));
router.delete('/me/memories', asyncHandler(removeAllMemories));

export default router;
