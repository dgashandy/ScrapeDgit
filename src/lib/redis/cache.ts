import getRedis from "./client";

const DEFAULT_TTL = 3600; // 1 hour in seconds

export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const redis = getRedis();
        const data = await redis.get(key);
        if (!data) return null;
        return JSON.parse(data) as T;
    } catch (error) {
        console.error("Cache get error:", error);
        return null;
    }
}

export async function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
        const redis = getRedis();
        await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
        console.error("Cache set error:", error);
    }
}

export async function deleteCache(key: string): Promise<void> {
    try {
        const redis = getRedis();
        await redis.del(key);
    } catch (error) {
        console.error("Cache delete error:", error);
    }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
    try {
        const redis = getRedis();
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        console.error("Cache pattern delete error:", error);
    }
}

// Cache key generators
export function searchCacheKey(keyword: string, source: string): string {
    return `search:${source}:${keyword.toLowerCase().replace(/\s+/g, "_")}`;
}

export function userSessionCacheKey(userId: string): string {
    return `user:session:${userId}`;
}

export function otpCacheKey(email: string): string {
    return `otp:${email.toLowerCase()}`;
}
