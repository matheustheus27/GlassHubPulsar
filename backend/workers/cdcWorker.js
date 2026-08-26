/**
 * CDC (Change Data Capture) Worker
 * Consumes change events from PostgreSQL/Prisma mutations and synchronizes Redis cache reactively.
 */
const logger = require('../utils/logger');
const queueManager = require('../queues/queueManager');
const cacheService = require('../services/CacheService');
const metrics = require('../utils/metrics');

class CDCWorker {
  constructor() {
    this.processedEvents = 0;
    this.init();
  }

  init() {
    queueManager.registerWorker('cdc', this.processJob.bind(this));
  }

  async processJob(job) {
    const { model, action, userId, id, data } = job.data;
    const startTime = Date.now();

    logger.info(`[CDCWorker] Processing CDC event [${action}] on model [${model}] for user [${userId || id || 'global'}]`);

    try {
      if (model === 'ResumeData' || model === 'resumeData') {
        if (userId) {
          // If update/upsert, populate/invalidate cache
          if (action === 'delete') {
            await cacheService.del(`glasshub:cache:resume:${userId}`);
          } else if (data) {
            await cacheService.set(`glasshub:cache:resume:${userId}`, data, 3600);
          } else {
            await cacheService.del(`glasshub:cache:resume:${userId}`);
          }
        }
      } else if (model === 'Notification' || model === 'notification') {
        if (userId) {
          await cacheService.del(`glasshub:cache:notifs:${userId}`);
        }
      } else if (model === 'SystemMetric') {
        await cacheService.del(`glasshub:cache:metrics`);
      }

      this.processedEvents++;
      metrics.increment('cdc.events_processed');

      const durationMs = Date.now() - startTime;
      logger.info(`[CDCWorker] CDC sync finished in ${durationMs}ms for [${model}]`);

      return { success: true, durationMs, processedEvents: this.processedEvents };
    } catch (err) {
      logger.error(`[CDCWorker] Error processing CDC event:`, err);
      throw err;
    }
  }
}

module.exports = new CDCWorker();
