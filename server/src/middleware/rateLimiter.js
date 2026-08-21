// ─── Sliding-Window Memory Rate Limiter ───────────────────────────────────
//
// Limits client IP requests to `maxRequests` per `windowMs` to prevent abuse.
// ───────────────────────────────────────────────────────────────────────────

const ipRequestMap = new Map();

// Periodic cleanup of stale IP windows (unref so tests exit cleanly)
const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipRequestMap.entries()) {
        if (now > data.resetTime) {
            ipRequestMap.delete(ip);
        }
    }
}, 60000);

if (cleanupTimer && typeof cleanupTimer.unref === "function") {
    cleanupTimer.unref();
}

export function rateLimiter({ windowMs = 60000, maxRequests = 200 } = {}) {
    return (req, res, next) => {
        // Skip rate limiting in test environment
        if (process.env.NODE_ENV === "test") {
            return next();
        }

        const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
        const now = Date.now();

        const record = ipRequestMap.get(ip);

        if (!record || now > record.resetTime) {
            ipRequestMap.set(ip, {
                count: 1,
                resetTime: now + windowMs
            });
            res.setHeader("X-RateLimit-Limit", maxRequests);
            res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
            return next();
        }

        record.count++;

        res.setHeader("X-RateLimit-Limit", maxRequests);
        res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count));

        if (record.count > maxRequests) {
            return res.status(429).json({
                error: "Too many requests. Please slow down and try again later.",
                retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
            });
        }

        next();
    };
}

export default rateLimiter;
