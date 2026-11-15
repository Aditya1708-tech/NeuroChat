import { Router } from 'express';
import authRoutes from './auth.routes.js';
import conversationRoutes from './conversation.routes.js';
import messageRoutes from './message.routes.js';
import userRoutes from './user.routes.js';
import artifactRoutes from './artifact.routes.js';
import healthRoutes from './health.routes.js';
import chatRoutes from './chat.routes.js';
import imageRoutes from './image.routes.js';
import { generalLimiter } from '../middleware/rateLimiters.js';

const apiRouter = Router();

// Apply general rate limiter across API
apiRouter.use(generalLimiter);

// Mount health check route (unlimited)
apiRouter.use('/health', healthRoutes);

// Auth endpoints (A1-A5)
apiRouter.use('/auth', authRoutes);

// Top-level chat endpoints (POST /api/chat, GET /api/chat/models)
apiRouter.use('/chat', chatRoutes);

// Dedicated Image Studio endpoints (POST /api/images/generate, GET /api/images/history, GET /api/images/raw/:id)
apiRouter.use('/images', imageRoutes);

// Message nested routes (/api/conversations/:id/messages)
conversationRoutes.use('/:id/messages', messageRoutes);

// Conversation endpoints (C1-C5)
apiRouter.use('/conversations', conversationRoutes);

// User profile endpoints (U1-U2)
apiRouter.use('/users', userRoutes);

// Artifacts & Library endpoints
apiRouter.use('/artifacts', artifactRoutes);

export default apiRouter;
