/**
 * In-memory rate limiter middleware.
 * Uses a Map to track request counts per key with automatic expiry cleanup.
 * No external dependencies (Redis, etc.) required.
 */

function createRateLimiter({ windowMs, maxRequests, keyFn, message }) {
  const hits = new Map(); // key -> { count, resetTime }

  // Clean up expired entries every 60 seconds to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now >= entry.resetTime) {
        hits.delete(key);
      }
    }
  }, 60_000);

  // Allow garbage collection if the process is shutting down
  if (cleanupInterval.unref) cleanupInterval.unref();

  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    let entry = hits.get(key);

    // If no entry or window has expired, start a new window
    if (!entry || now >= entry.resetTime) {
      entry = { count: 1, resetTime: now + windowMs };
      hits.set(key, entry);
      return next();
    }

    // Increment count within the current window
    entry.count += 1;

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      const retryMinutes = Math.ceil(retryAfter / 60);
      return res.status(429).json({
        message: message || `Too many requests. Please try again in ${retryMinutes} minute${retryMinutes !== 1 ? 's' : ''}.`,
        retryAfter,
      });
    }

    return next();
  };
}

// ── Auth routes: 10 attempts per 15 minutes, keyed by IP ──
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  keyFn: (req) => `auth:${req.ip}`,
  message: 'Too many login/register attempts. Please try again in 15 minutes.',
});

// ── Resume parser: 4 parses per hour, keyed by user ID ──
export const resumeParseLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 4,
  keyFn: (req) => `resume:${req.user?.id || req.ip}`,
  message: 'Resume parse limit reached (4 per hour). Please try again later.',
});

// ── Gap analysis: 10 analyses per hour, keyed by user ID ──
export const gapAnalysisLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  keyFn: (req) => `gap:${req.user?.id || req.ip}`,
  message: 'Gap analysis limit reached (10 per hour). Please try again later.',
});

// ── Evidence submission: 10 per hour, keyed by user ID ──
export const evidenceSubmitLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  keyFn: (req) => `evidence:${req.user?.id || req.ip}`,
  message: 'Evidence submission limit reached (10 per hour). Please try again later.',
});
