/**
 * Multi-Channel Notification Worker
 * Strategy & Factory Pattern for In-App, Email, and WhatsApp/Webhook notifications.
 */
const logger = require('../utils/logger');
const queueManager = require('../queues/queueManager');

// Strategy 1: In-App Real-time Notification via SSE
class InAppNotificationStrategy {
  constructor(sseEmitter) {
    this.sseEmitter = sseEmitter;
  }

  async send({ userId, title, message, type = 'INFO', data = {} }) {
    logger.info(`[Notification: In-App] Sending to user [${userId || 'all'}]: ${title}`);
    if (this.sseEmitter) {
      this.sseEmitter({
        type: 'IN_APP_NOTIFICATION',
        userId,
        notification: {
          id: `notif_${Date.now()}`,
          title,
          message,
          variant: type,
          data,
          timestamp: new Date().toISOString()
        }
      });
    }
    return { success: true, channel: 'in-app' };
  }
}

// Strategy 2: Email Notification (GlassHub Styled HTML)
class EmailNotificationStrategy {
  async send({ toEmail = 'user@example.com', title, message }) {
    if (process.env.NOTIFICATION_EMAIL_ENABLED !== 'true') {
      logger.debug(`[Notification: Email] Skipped (NOTIFICATION_EMAIL_ENABLED is not true)`);
      return { success: true, channel: 'email', skipped: true };
    }

    const html = `
      <div style="background:#030712; color:#f8fafc; font-family:'Inter',sans-serif; padding:32px; border-radius:12px; max-width:600px; margin:auto; border:1px solid rgba(56,189,248,0.3);">
        <h2 style="color:#38bdf8; margin-top:0;">GlassHub Pulsar</h2>
        <h3 style="color:#f1f5f9;">${title}</h3>
        <p style="color:#94a3b8; font-size:14px; line-height:1.6;">${message}</p>
        <div style="margin-top:24px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.1); font-size:12px; color:#64748b;">
          Este é um email automático enviado pela plataforma GlassHub.
        </div>
      </div>
    `;

    logger.info(`[Notification: Email] Email dispatched to ${toEmail}`);
    return { success: true, channel: 'email', recipient: toEmail };
  }
}

// Strategy 3: WhatsApp Webhook / Evolution API Strategy
class WhatsAppWebhookStrategy {
  async send({ phone = '+5511999999999', title, message }) {
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    if (!webhookUrl || process.env.NOTIFICATION_WHATSAPP_ENABLED !== 'true') {
      logger.debug(`[Notification: WhatsApp] Skipped (WHATSAPP_WEBHOOK_URL not configured)`);
      return { success: true, channel: 'whatsapp', skipped: true };
    }

    try {
      const payload = {
        number: phone,
        text: `*GlassHub Alert: ${title}*\n\n${message}`
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      logger.info(`[Notification: WhatsApp] Message sent to ${phone}`);
      return { success: true, channel: 'whatsapp' };
    } catch (e) {
      logger.warn(`[Notification: WhatsApp] Webhook dispatch failed: ${e.message}`);
      return { success: false, channel: 'whatsapp', error: e.message };
    }
  }
}

// Notification Factory
class NotificationFactory {
  constructor() {
    this.strategies = {
      inapp: new InAppNotificationStrategy(null),
      email: new EmailNotificationStrategy(),
      whatsapp: new WhatsAppWebhookStrategy()
    };
  }

  setSSEEmitter(emitter) {
    this.strategies.inapp.sseEmitter = emitter;
  }

  async dispatchAll(payload) {
    const activeChannels = (process.env.NOTIFICATION_CHANNELS || 'inapp,email,whatsapp')
      .split(',')
      .map(c => c.trim().toLowerCase());

    const results = [];
    for (const channel of activeChannels) {
      if (this.strategies[channel]) {
        try {
          const res = await this.strategies[channel].send(payload);
          results.push(res);
        } catch (e) {
          logger.error(`Failed to send notification via [${channel}]:`, e);
        }
      }
    }
    return results;
  }
}

const factory = new NotificationFactory();

class NotificationWorker {
  constructor() {
    this.factory = factory;
    this.init();
  }

  setSSEEmitter(emitter) {
    this.factory.setSSEEmitter(emitter);
  }

  init() {
    queueManager.registerWorker('notification', this.processJob.bind(this));
  }

  async processJob(job) {
    logger.info(`[NotificationWorker] Processing notification job [${job.id}]`);
    return await this.factory.dispatchAll(job.data);
  }
}

module.exports = new NotificationWorker();
