/**
 * In-memory sliding-window Rate Limiter Middleware
 * Provides defensive brute-force mitigation for authentication endpoints
 * and general API flooding protection without requiring Redis.
 */

import { config } from '../config/env.js';

// Stores IP attempt tracking: { [ip]: { attempts: number, resetTime: number } }
const loginAttemptsMap = new Map();
const generalRequestsMap = new Map();

export const clearAllRateLimits = () => {
  loginAttemptsMap.clear();
  generalRequestsMap.clear();
};

// Periodic cleanup every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttemptsMap.entries()) {
    if (now > record.resetTime) {
      loginAttemptsMap.delete(ip);
    }
  }
  for (const [ip, record] of generalRequestsMap.entries()) {
    if (now > record.resetTime) {
      generalRequestsMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate Limiter for Authentication / Login endpoints
 * Defaults: Max 10 attempts per 15 minutes per IP
 */
export const loginRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const maxAttempts = options.maxAttempts || 10;

  return (req, res, next) => {
    // In development mode, allow test suite bypass header
    if (config.nodeEnv !== 'production' && req.headers['x-bypass-rate-limit'] === 'test-suite') {
      return next();
    }

    // Resolve client IP (supporting reverse proxies if configured)
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    let record = loginAttemptsMap.get(clientIp);

    if (!record || now > record.resetTime) {
      record = {
        attempts: 1,
        resetTime: now + windowMs,
      };
      loginAttemptsMap.set(clientIp, record);
    } else {
      record.attempts += 1;
    }

    const remaining = Math.max(0, maxAttempts - record.attempts);
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxAttempts);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.attempts > maxAttempts) {
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        message: `Too many login attempts from this IP. Please try again after ${Math.ceil(retryAfterSec / 60)} minutes.`,
        retryAfter: retryAfterSec,
      });
    }

    // Attach clear helper to req for successful logins
    req.clearLoginRateLimit = () => {
      loginAttemptsMap.delete(clientIp);
    };

    next();
  };
};

/**
 * General API Rate Limiter
 * Defaults: Max 300 requests per minute per IP
 */
export const generalRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const maxRequests = options.maxRequests || 300;

  return (req, res, next) => {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    let record = generalRequestsMap.get(clientIp);

    if (!record || now > record.resetTime) {
      record = {
        requests: 1,
        resetTime: now + windowMs,
      };
      generalRequestsMap.set(clientIp, record);
    } else {
      record.requests += 1;
    }

    if (record.requests > maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Too many requests sent to the server. Please slow down.',
        retryAfter: retryAfterSec,
      });
    }

    next();
  };
};
