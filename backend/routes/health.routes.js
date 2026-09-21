import { Router } from 'express';
import { isDbConnected } from '../config/db.js';

const router = Router();

router.get('/', (req, res) => {
  const dbStatus = isDbConnected() ? 'up' : 'down';
  const statusCode = dbStatus === 'up' ? 200 : 503;

  res.status(statusCode).json({
    status: dbStatus === 'up' ? 'ok' : 'degraded',
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;
