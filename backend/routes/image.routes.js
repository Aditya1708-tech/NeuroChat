import { Router } from 'express';
import { generate, history, getRawImage } from '../controllers/image.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { messageLimiter } from '../middleware/rateLimiters.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/images/raw/:id - Serve raw image file (public / authenticated)
router.get('/raw/:id', asyncHandler(getRawImage));

// All subsequent routes require authentication
router.use(requireAuth);

// POST /api/images/generate - Dedicated AI image generation endpoint
router.post('/generate', messageLimiter, asyncHandler(generate));

// GET /api/images/history - User image generation history
router.get('/history', asyncHandler(history));

export default router;

