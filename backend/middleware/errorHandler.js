import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  const requestId = req.id || 'req_unknown';

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong on our side. Please try again.';
  let fields = null;
  let retryable = false;

  if (err instanceof ApiError) {
    status = err.status;
    code = err.code;
    message = err.message;
    fields = err.fields;
    retryable = err.retryable;
  } else if (err.name === 'CastError') {
    status = 404;
    code = 'NOT_FOUND';
    message = 'Resource not found.';
  } else if (err.code === 11000) {
    status = 409;
    code = 'EMAIL_IN_USE';
    message = 'An account with this email already exists.';
    fields = { email: 'Email already registered.' };
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    code = 'UNAUTHENTICATED';
    message = 'Invalid or expired session. Please log in again.';
  } else {
    logger.error('Unhandled Server Exception', {
      requestId,
      errorName: err.name,
      errorMessage: err.message,
      stack: env.NODE_ENV === 'production' ? undefined : err.stack,
    });
  }

  const responseBody = {
    success: false,
    error: {
      code,
      message,
      ...(fields ? { fields } : {}),
      retryable,
      requestId,
    },
  };

  // If chat message failed after saving user message, attach preserved userMessage & conversation
  if (err.savedData) {
    responseBody.data = err.savedData;
  }

  res.status(status).json(responseBody);
}
