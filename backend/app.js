import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { requestId } from './middleware/requestId.js';
import { originCheck } from './middleware/originCheck.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

export function createApp() {
  const app = express();

  // Reverse proxy support
  if (env.TRUST_PROXY) {
    app.set('trust proxy', 1);
  }

  // 1. Request ID tracking
  app.use(requestId);

  // 2. Security HTTP headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // 3. CORS configuration (with credentials)
  app.use(
    cors({
      origin: [
        env.CLIENT_URL,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5000',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );

  // 4. Body parser with 25mb limit for multimodal file/image attachments
  app.use(express.json({ limit: '25mb' }));

  // 5. Cookie parser for session tokens
  app.use(cookieParser());

  // 6. CSRF Origin validation on state mutations
  app.use(originCheck);

  // 7. Mount API router under /api
  app.use('/api', apiRouter);

  // 8. 404 handler
  app.use(notFound);

  // 9. Central error handler (last)
  app.use(errorHandler);

  return app;
}
