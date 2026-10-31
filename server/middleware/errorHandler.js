import { config } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Error Caught]:', err);

  // PostgreSQL Error Code 23505: Unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this identifier or unique field already exists.',
      detail: config.nodeEnv === 'development' ? err.detail : undefined,
    });
  }

  // PostgreSQL Error Code 23503: Foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced entity does not exist or cannot be modified due to dependent records.',
      detail: config.nodeEnv === 'development' ? err.detail : undefined,
    });
  }

  // PostgreSQL Error Code 22P02: Invalid input syntax (e.g. malformed UUID)
  if (err.code === '22P02') {
    return res.status(400).json({
      success: false,
      message: 'Invalid parameter syntax or data format provided.',
    });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // JWT authentication errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });
};
