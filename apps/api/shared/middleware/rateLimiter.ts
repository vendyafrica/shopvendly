import rateLimit from "express-rate-limit";

/**
 * Strict limiter for sensitive endpoints (internal keys, payout initiation, etc.)
 * 20 requests per 15 minutes per IP.
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
    code: "RATE_LIMITED",
  },
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === "development";
  },
});

/**
 * Standard limiter for public-facing API routes (storefront checkout, payments, etc.)
 * 120 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
    code: "RATE_LIMITED",
  },
  skip: (req) => {
    return process.env.NODE_ENV === "development";
  },
});

/**
 * Relaxed limiter for webhook endpoints (Meta, Collecto callbacks).
 * Webhooks can burst but should still be protected.
 * 300 requests per minute per IP.
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests.",
    code: "RATE_LIMITED",
  },
  skip: (req) => {
    return process.env.NODE_ENV === "development";
  },
});
