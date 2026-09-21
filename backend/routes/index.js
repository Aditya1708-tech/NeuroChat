import { Router } from 'express';
import authRoutes from './auth.routes.js';
import conversationRoutes from './conversation.routes.js';
import messageRoutes from './message.routes.js';
import userRoutes from './user.routes.js';
import healthRoutes from './health.routes.js';
import { generalLimiter } from '../middleware/rateLimiters.js';

const apiRouter = Router();

// Apply general rate limiter across API
apiRouter.use(generalLimiter);

// Mount health check route (unlimited)
apiRouter.use('/health', healthRoutes);

// Auth endpoints (A1-A5)
apiRouter.use('/auth', authRoutes);

// Message nested routes (/api/conversations/:id/messages)
conversationRoutes.use('/:id/messages', messageRoutes);

// Conversation endpoints (C1-C5)
apiRouter.use('/conversations', conversationRoutes);

// User profile endpoints (U1-U2)
apiRouter.use('/users', userRoutes);

export default apiRouter;
