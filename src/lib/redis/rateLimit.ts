import getRedis from "./client";

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number;
}

// Sliding window rate limiter
export async function checkRateLimit(
    key: string,
    maxRequests: number = 10,
    windowSeconds: number = 60
): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const redisKey = `ratelimit:${key}`;

    try {
        const redis = getRedis();

        // Remove old entries
        await redis.zremrangebyscore(redisKey, 0, windowStart);

        // Count current requests
        const count = await redis.zcard(redisKey);

        if (count >= maxRequests) {
            // Get the oldest request in window to calculate reset time
            const oldest = await redis.zrange(redisKey, 0, 0, "WITHSCORES");
            const resetIn = oldest.length >= 2
                ? Math.ceil((parseInt(oldest[1]) + windowSeconds * 1000 - now) / 1000)
                : windowSeconds;

            return {
                allowed: false,
                remaining: 0,
                resetIn,
            };
        }

        // Add current request
        await redis.zadd(redisKey, now, `${now}-${Math.random()}`);
        await redis.expire(redisKey, windowSeconds);

        return {
            allowed: true,
            remaining: maxRequests - count - 1,
            resetIn: windowSeconds,
        };
    } catch (error) {
        console.error("Rate limit check error:", error);
        // Allow request on error to prevent blocking
        return {
            allowed: true,
            remaining: maxRequests,
            resetIn: windowSeconds,
        };
    }
}

// Rate limit for scraper (more restrictive)
export async function checkScraperRateLimit(source: string): Promise<RateLimitResult> {
    // 5 requests per 30 seconds per source
    return checkRateLimit(`scraper:${source}`, 5, 30);
}

// Rate limit for API endpoints
export async function checkApiRateLimit(ip: string): Promise<RateLimitResult> {
    // 100 requests per minute per IP
    return checkRateLimit(`api:${ip}`, 100, 60);
}

// Rate limit for auth endpoints (stricter)
export async function checkAuthRateLimit(ip: string): Promise<RateLimitResult> {
    // 10 requests per minute per IP for auth
    return checkRateLimit(`auth:${ip}`, 10, 60);
}
