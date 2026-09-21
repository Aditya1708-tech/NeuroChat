import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function originCheck(req, res, next) {
  // Only check state-changing methods
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    const origin = req.headers['origin'];
    const referer = req.headers['referer'];

    // In local development or testing, relax if missing (e.g. tools like Postman/curl)
    if (!origin && !referer && env.NODE_ENV !== 'production') {
      return next();
    }

    const requestOrigin = origin || (referer ? new URL(referer).origin : null);

    if (requestOrigin && env.CLIENT_URL) {
      const allowedOrigins = [
        env.CLIENT_URL,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5000',
      ];

      const isAllowed = allowedOrigins.some((allowed) => {
        try {
          return new URL(allowed).origin === requestOrigin;
        } catch {
          return false;
        }
      });

      if (!isAllowed) {
        return next(new ApiError(403, 'FORBIDDEN_ORIGIN', 'Cross-site request blocked.'));
      }
    }
  }

  next();
}
