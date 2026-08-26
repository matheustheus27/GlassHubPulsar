/**
 * Redis Client Singleton Configuration
 * Provides resilient ioredis connection with lazy connect and auto-retry.
 */
const Redis = require('ioredis');
const logger = require('../utils/logger');

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

let redisClient = null;

try {
  redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
    lazyConnect: true,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 3000);
      return delay;
    }
  });

  redisClient.on('connect', () => {
    logger.info(`[Redis] Connected to Redis server at ${REDIS_HOST}:${REDIS_PORT}`);
  });

  redisClient.on('error', (err) => {
    logger.warn(`[Redis] Redis connection note: ${err.message}`);
  });

  redisClient.connect().catch(() => {});
} catch (e) {
  logger.warn(`[Redis] Failed to initialize Redis client: ${e.message}`);
}

class RedisWrapper {
  isReady() {
    return redisClient && redisClient.status === 'ready';
  }

  async get(key) {
    if (!this.isReady()) return null;
    return await redisClient.get(key);
  }

  async set(key, value, opts = {}) {
    if (!this.isReady()) return false;
    if (opts.EX) {
      await redisClient.set(key, value, 'EX', opts.EX);
    } else {
      await redisClient.set(key, value);
    }
    return true;
  }

  async del(key) {
    if (!this.isReady()) return false;
    await redisClient.del(key);
    return true;
  }
}

module.exports = new RedisWrapper();
