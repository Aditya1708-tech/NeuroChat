import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  logout,
  me,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
} from '../validators/auth.schemas.js';

const router = Router();

// A1: Register
router.post('/register', authLimiter, validate(registerSchema), asyncHandler(register));

// A2: Login
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(login));

// A3: Google Sign-in
router.post('/google', authLimiter, validate(googleAuthSchema), asyncHandler(googleAuth));

// A4: Logout
router.post('/logout', asyncHandler(logout));

// A5: Get current authenticated user
router.get('/me', requireAuth, asyncHandler(me));

export default router;
