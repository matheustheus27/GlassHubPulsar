/**
 * Server-Sent Events (SSE) Controller
 * Real-time event broadcasting for live translation progress, in-app notifications, and worker status.
 */
const logger = require('../utils/logger');
const translationWorker = require('../workers/translationWorker');
const notificationWorker = require('../workers/notificationWorker');

class SSEController {
  constructor() {
    this.clients = new Set();

    // Hook emitters into workers
    const broadcastEvent = this.broadcast.bind(this);
    translationWorker.setSSEEmitter(broadcastEvent);
    notificationWorker.setSSEEmitter(broadcastEvent);
  }

  stream(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx proxy buffering

    // Send initial handshake
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Stream Connected' })}\n\n`);

    const client = { id: Date.now(), res, userId: req.user?.id || null };
    this.clients.add(client);

    logger.debug(`[SSE] Client [${client.id}] connected. Active clients: ${this.clients.size}`);

    // Heartbeat every 20 seconds to prevent connection timeouts
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      this.clients.delete(client);
      logger.debug(`[SSE] Client [${client.id}] disconnected. Remaining: ${this.clients.size}`);
    });
  }

  broadcast(eventData) {
    const payload = `data: ${JSON.stringify(eventData)}\n\n`;
    for (const client of this.clients) {
      try {
        client.res.write(payload);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }
}

module.exports = new SSEController();
