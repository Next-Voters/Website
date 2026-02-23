import { betterAuth } from "better-auth";
import { db } from "./db";
import { Redis } from "ioredis";

// Lazy-load the Redis connection to prevent the CLI from hanging
let redis: Redis | null = null;
const getRedisClient = () => {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", { lazyConnect: true });
  }
  return redis;
};

export const auth = betterAuth({
  database: {
      db,
      type: "postgres"
  } as any,
  secondaryStorage: {
    get: async (key) => {
        const client = getRedisClient();
        const value = await client.get(key);
        return value ? value : null;
    },
    set: async (key, value, ttl) => {
        const client = getRedisClient();
        if (ttl) {
            await client.set(key, value, "EX", ttl);
        } else {
            await client.set(key, value);
        }
    },
    delete: async (key) => {
        const client = getRedisClient();
        await client.del(key);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }
  },
});
