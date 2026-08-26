const redisClient = require('../config/redis');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 1 hour
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Reads from Redis cache
   */
  async get(key) {
    if (!redisClient.isReady()) {
      this.misses++;
      return null;
    }
    try {
      const data = await redisClient.get(key);
      if (data) {
        this.hits++;
        metrics.increment('cache.hits');
        return JSON.parse(data);
      }
      this.misses++;
      metrics.increment('cache.misses');
      return null;
    } catch (err) {
      logger.warn(`[CacheService] Error reading key ${key}:`, err.message);
      this.misses++;
      return null;
    }
  }

  /**
   * Sets value in Redis cache
   */
  async set(key, value, ttlSeconds = this.defaultTTL) {
    if (!redisClient.isReady()) return false;
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
      return true;
    } catch (err) {
      logger.warn(`[CacheService] Error setting key ${key}:`, err.message);
      return false;
    }
  }

  /**
   * Deletes key from Redis cache
   */
  async del(key) {
    if (!redisClient.isReady()) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      logger.warn(`[CacheService] Error deleting key ${key}:`, err.message);
      return false;
    }
  }

  /**
   * Invalidates all cache keys for a specific user
   */
  async invalidateUserCache(userId) {
    if (!userId) return;
    await this.del(`glasshub:cache:resume:${userId}`);
    await this.del(`glasshub:cache:notifs:${userId}`);
    logger.info(`[CacheService] Invalidated cache for user [${userId}]`);
  }

  /**
   * Gets Cache Hit / Miss stats for SRE Telemetry Cockpit
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRatioPercent = total > 0 ? Math.round((this.hits / total) * 100) : 100;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRatioPercent
    };
  }
}

module.exports = new CacheService();
