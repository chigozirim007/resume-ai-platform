import { rateLimit } from "express-rate-limit";

/**
 * Rate limiter for sensitive AI and extraction endpoints.
 * Limits users to 10 requests every 15 minutes.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: "Too many requests. Please try again after 15 minutes.",
  },
  // Ensure we don't block authenticated Pro users as strictly as anonymous ones
  skip: (req: any) => req.isAuthenticated() && req.user.plan === "pro",
});

/**
 * General API rate limiter for standard routes.
 * Limits users to 100 requests every 15 minutes.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
