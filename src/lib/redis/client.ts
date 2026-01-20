import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
    if (!redis) {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });

        redis.on("error", (err) => {
            console.error("Redis Client Error:", err.message);
        });

        redis.on("connect", () => {
            console.log("Redis Client Connected");
        });
    }

    return redis;
}

// Optional: disconnect function for cleanup
export async function disconnectRedis(): Promise<void> {
    if (redis) {
        await redis.quit();
        redis = null;
    }
}

export default getRedis;
