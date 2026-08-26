/**
 * MessageBroker
 * 
 * Unified message dispatch abstraction for GlassHub Pulsar workers.
 * 
 * - Uses RabbitMQ when available (production mode)
 * - Falls back to InMemoryQueue (BullMQ/Redis or local) when RabbitMQ is unreachable
 * - Provides a single dispatch(workerType, payload) + consume(workerType, handler) API
 * 
 * Worker types map to RabbitMQ queue routing keys (QUEUES constants).
 */
const logger = require('../utils/logger');
const { rabbitClient, QUEUES } = require('./RabbitMQClient');

// Map logical worker names to queue routing keys
const WORKER_QUEUE_MAP = {
  'pdf.render':    QUEUES.PDF_RENDER,
  'pdf.result':    QUEUES.PDF_RESULT,
  'translation':   QUEUES.TRANSLATION,
  'notification':  QUEUES.NOTIFICATION,
  'analytics.ats': QUEUES.ANALYTICS_ATS,
  'ocr':           QUEUES.OCR,
};

class MessageBroker {
  constructor() {
    this._fallbackHandlers = new Map(); // workerType -> handler[]
    this._connected = false;
  }

  /**
   * Initialize: attempt RabbitMQ connection. Non-blocking.
   */
  async init() {
    try {
      this._connected = await rabbitClient.connect();
      if (this._connected) {
        logger.info('[MessageBroker] RabbitMQ mode active.');
      } else {
        logger.warn('[MessageBroker] RabbitMQ unavailable — InMemory fallback mode active.');
      }
    } catch (err) {
      logger.warn('[MessageBroker] Init error, using InMemory fallback:', err.message);
      this._connected = false;
    }
  }

  /**
   * Dispatch a job to the appropriate worker.
   * Uses RabbitMQ if connected, otherwise routes to local handler.
   * @param {string} workerType - e.g. 'pdf.render', 'translation', 'analytics.ats'
   * @param {object} payload
   */
  async dispatch(workerType, payload) {
    const queue = WORKER_QUEUE_MAP[workerType];

    if (!queue) {
      throw new Error(`[MessageBroker] Unknown worker type: "${workerType}". Valid types: ${Object.keys(WORKER_QUEUE_MAP).join(', ')}`);
    }

    if (this._connected && rabbitClient.isConnected) {
      await rabbitClient.publish(queue, { ...payload, _workerType: workerType, _dispatchedAt: Date.now() });
      logger.info(`[MessageBroker] Dispatched "${workerType}" job via RabbitMQ → ${queue}`);
      return;
    }

    // InMemory fallback: call registered handlers directly (async, fire-and-forget)
    const handlers = this._fallbackHandlers.get(workerType) || [];
    if (handlers.length > 0) {
      setImmediate(async () => {
        for (const handler of handlers) {
          try {
            await handler(payload);
          } catch (err) {
            logger.error(`[MessageBroker] InMemory handler error for "${workerType}":`, err.message);
          }
        }
      });
      logger.info(`[MessageBroker] Dispatched "${workerType}" job via InMemory fallback.`);
    } else {
      logger.warn(`[MessageBroker] No handler registered for "${workerType}" and RabbitMQ is unavailable.`);
    }
  }

  /**
   * Register a worker handler for a job type.
   * - In RabbitMQ mode: subscribes to the corresponding queue.
   * - In InMemory mode: registers a local handler.
   * @param {string} workerType
   * @param {function} handler - async (payload) => void
   */
  async consume(workerType, handler) {
    const queue = WORKER_QUEUE_MAP[workerType];

    if (!queue) {
      throw new Error(`[MessageBroker] Unknown worker type: "${workerType}"`);
    }

    // Always register InMemory fallback handler
    if (!this._fallbackHandlers.has(workerType)) {
      this._fallbackHandlers.set(workerType, []);
    }
    this._fallbackHandlers.get(workerType).push(handler);

    // Also register RabbitMQ consumer if connected
    if (this._connected || rabbitClient.isConnected) {
      await rabbitClient.subscribe(queue, handler);
    }

    logger.info(`[MessageBroker] Consumer registered for "${workerType}" (queue: ${queue})`);
  }

  /**
   * Get broker health status
   */
  getStatus() {
    return {
      mode: (this._connected && rabbitClient.isConnected) ? 'rabbitmq' : 'in-memory',
      rabbitmqConnected: rabbitClient.isConnected,
      registeredWorkers: Array.from(this._fallbackHandlers.keys()),
    };
  }
}

const broker = new MessageBroker();
module.exports = broker;
