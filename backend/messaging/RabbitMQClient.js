/**
 * RabbitMQClient
 * 
 * Singleton AMQP 0-9-1 connection manager with:
 * - Exponential backoff auto-reconnect
 * - Durable exchange + queue declarations
 * - Dead Letter Queue (DLQ) for failed messages
 * - Manual ACK/NACK consumption
 */
const logger = require('../utils/logger');

let amqplib = null;
try {
  amqplib = require('amqplib');
} catch (e) {
  logger.warn('[RabbitMQ] amqplib not installed — broker unavailable, falling back to InMemory queue.');
}

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const EXCHANGE_NAME = 'glasshub.direct';

// All GlassHub worker queues
const QUEUES = {
  PDF_RENDER:     'q.pdf.render',
  PDF_RESULT:     'q.pdf.result',
  TRANSLATION:    'q.translation',
  NOTIFICATION:   'q.notification',
  ANALYTICS_ATS:  'q.analytics.ats',
  OCR:            'q.ocr',
};

class RabbitMQClient {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectDelay = 2000;
    this.maxReconnectDelay = 30000;
    this._consumers = []; // store registered consumers for re-registration after reconnect
  }

  /**
   * Declare exchange, queues and DLQ bindings
   */
  async assertTopology(ch) {
    // Main exchange
    await ch.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });

    // Dead Letter Exchange for failed messages
    await ch.assertExchange('glasshub.dlx', 'direct', { durable: true });
    await ch.assertQueue('q.dead-letters', { durable: true });
    await ch.bindQueue('q.dead-letters', 'glasshub.dlx', '#');

    // Declare all worker queues with DLQ routing
    for (const queue of Object.values(QUEUES)) {
      await ch.assertQueue(queue, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'glasshub.dlx',
          'x-dead-letter-routing-key': queue,
          'x-message-ttl': 3600000, // 1 hour TTL
        }
      });
      await ch.bindQueue(queue, EXCHANGE_NAME, queue);
    }

    logger.info('[RabbitMQ] Topology asserted: exchanges, queues and DLQ bindings ready.');
  }

  async connect() {
    if (!amqplib) return false;

    try {
      logger.info(`[RabbitMQ] Connecting to ${RABBITMQ_URL.replace(/:[^:@]+@/, ':***@')}...`);
      this.connection = await amqplib.connect(RABBITMQ_URL);

      this.connection.on('error', (err) => {
        logger.error('[RabbitMQ] Connection error:', err.message);
        this.isConnected = false;
        this._scheduleReconnect();
      });

      this.connection.on('close', () => {
        logger.warn('[RabbitMQ] Connection closed. Scheduling reconnect...');
        this.isConnected = false;
        this._scheduleReconnect();
      });

      this.channel = await this.connection.createChannel();
      this.channel.prefetch(1); // Process one job at a time per consumer

      await this.assertTopology(this.channel);

      this.isConnected = true;
      this.reconnectDelay = 2000; // reset backoff

      // Re-register consumers after reconnect
      for (const { queue, handler } of this._consumers) {
        await this._bindConsumer(queue, handler);
      }

      logger.info('[RabbitMQ] Connected and ready.');
      return true;
    } catch (err) {
      logger.warn(`[RabbitMQ] Connection failed: ${err.message}. Will retry in ${this.reconnectDelay}ms.`);
      this.isConnected = false;
      this._scheduleReconnect();
      return false;
    }
  }

  _scheduleReconnect() {
    setTimeout(() => {
      this.connect().catch(() => {});
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  /**
   * Publish a JSON message to a queue via the main exchange.
   * @param {string} queue - Target queue name (use QUEUES constants)
   * @param {object} payload - JSON-serializable payload
   */
  async publish(queue, payload) {
    if (!this.isConnected || !this.channel) {
      throw new Error(`[RabbitMQ] Not connected. Cannot publish to ${queue}.`);
    }
    const msg = Buffer.from(JSON.stringify(payload));
    const ok = this.channel.publish(EXCHANGE_NAME, queue, msg, {
      persistent: true,          // Survive broker restart
      contentType: 'application/json',
      timestamp: Date.now(),
    });
    if (!ok) {
      throw new Error(`[RabbitMQ] Publish to ${queue} returned false (channel write buffer full).`);
    }
    logger.debug(`[RabbitMQ] Published to ${queue}: ${JSON.stringify(payload).slice(0, 120)}...`);
  }

  /**
   * Register a consumer on a queue with manual ACK.
   * Handler receives (parsedPayload). On success, message is ACKed.
   * On error, message is NACKed (sent to DLQ after maxAttempts).
   * @param {string} queue
   * @param {function} handler - async (payload) => void
   */
  async subscribe(queue, handler) {
    // Register for re-binding after reconnect
    if (!this._consumers.find(c => c.queue === queue)) {
      this._consumers.push({ queue, handler });
    }

    if (!this.isConnected || !this.channel) {
      logger.warn(`[RabbitMQ] Not connected yet, consumer for ${queue} will be registered after connect.`);
      return;
    }

    await this._bindConsumer(queue, handler);
  }

  async _bindConsumer(queue, handler) {
    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;
      let payload;
      try {
        payload = JSON.parse(msg.content.toString());
      } catch (parseErr) {
        logger.error(`[RabbitMQ] Failed to parse message from ${queue}:`, parseErr.message);
        this.channel.nack(msg, false, false); // discard malformed
        return;
      }

      try {
        await handler(payload);
        this.channel.ack(msg);
      } catch (err) {
        logger.error(`[RabbitMQ] Handler error for ${queue}:`, err.message);
        const attempts = (msg.properties.headers?.['x-delivery-count'] || 0) + 1;
        const requeue = attempts < 3; // retry up to 3 times, then DLQ
        this.channel.nack(msg, false, requeue);
      }
    }, { noAck: false });

    logger.info(`[RabbitMQ] Consumer registered on queue: ${queue}`);
  }

  /**
   * Get queue status stats
   */
  async getQueueStats(queue) {
    if (!this.isConnected || !this.channel) return null;
    try {
      return await this.channel.checkQueue(queue);
    } catch {
      return null;
    }
  }
}

const rabbitClient = new RabbitMQClient();

module.exports = { rabbitClient, QUEUES };
