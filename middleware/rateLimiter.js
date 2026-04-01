import rateLimit from "express-rate-limit";

/**
 * Standard API rate limiter — 500 requests per 5 minutes
 * Applied globally to all /api routes. Raised from 100/15min because:
 * - Analytics pages fire 5+ parallel reads on mount
 * - All requests are cheap DB reads, not AI calls
 * - aiLimiter separately guards expensive AI routes
 */
export const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutes (resets faster)
  max: 500,                  // 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

/**
 * Strict auth limiter — 10 requests per 15 minutes for login/register
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts. Please wait 15 minutes." },
});

/**
 * AI route limiter — 20 requests per 15 minutes (expensive OpenAI calls)
 * Applied only to routes that call GPT: roadmap, resume, resources/refresh, analytics insights
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "AI rate limit exceeded. Please wait before generating more content." },
});
