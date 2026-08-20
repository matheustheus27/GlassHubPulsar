/**
 * Notification Service
 * 
 * Manages persistent user notifications with PostgreSQL (Prisma) backing
 * and real-time Server-Sent Events (SSE) broadcasting.
 */
const prisma = require('../prisma/client');
const logger = require('../utils/logger');
const sseController = require('../controllers/SSEController');

// Resilient in-memory storage fallback if database is restarting
const inMemoryNotifications = new Map();

class NotificationService {
  /**
   * Creates and persists a user notification, broadcasting via SSE
   * @param {Object} params - { userId, title, message, type, data }
   * @returns {Promise<Object>} Created notification
   */
  static async createNotification({ userId, title, message, type = 'INFO', data = null }) {
    if (!userId) {
      logger.warn('[NotificationService] Attempted to create notification without userId');
      return null;
    }

    const notificationPayload = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId,
      title,
      message,
      type, // 'PDF_READY' | 'ATS_ANALYSIS_COMPLETED' | 'TRANSLATION_COMPLETED' | 'SYSTEM' | 'INFO'
      data: data || {},
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 1. Try persisting in PostgreSQL via Prisma
    let persistedRecord = null;
    try {
      if (prisma && prisma.notification) {
        persistedRecord = await prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type,
            data: data || {},
            read: false
          }
        });
        logger.info(`[NotificationService] Persisted notification [${persistedRecord.id}] (${type}) for user ${userId}`);
      }
    } catch (err) {
      logger.warn(`[NotificationService] DB notification save fallback to memory for user ${userId}:`, err.message);
    }

    const finalNotification = persistedRecord || notificationPayload;

    // 2. Always maintain in-memory cache
    if (!inMemoryNotifications.has(userId)) {
      inMemoryNotifications.set(userId, []);
    }
    const userNotifs = inMemoryNotifications.get(userId);
    userNotifs.unshift(finalNotification);
    if (userNotifs.length > 50) userNotifs.pop(); // keep last 50

    // 3. Broadcast real-time SSE event to user if online
    try {
      sseController.sendToUser(userId, 'NOTIFICATION', finalNotification);
      sseController.sendToUser(userId, 'NOTIFICATION_BADGE', { unreadCount: await this.getUnreadCount(userId) });
    } catch (sseErr) {
      // User may be offline
    }

    return finalNotification;
  }

  /**
   * Retrieves notifications for a user with unread count
   * @param {string} userId 
   * @param {number} limit 
   * @returns {Promise<{ notifications: Array, unreadCount: number }>}
   */
  static async getUserNotifications(userId, limit = 30) {
    if (!userId) return { notifications: [], unreadCount: 0 };

    try {
      if (prisma && prisma.notification) {
        const notifications = await prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit
        });

        const unreadCount = await prisma.notification.count({
          where: { userId, read: false }
        });

        return { notifications, unreadCount };
      }
    } catch (err) {
      logger.warn(`[NotificationService] Error fetching notifications from DB, using memory fallback:`, err.message);
    }

    const memoryList = inMemoryNotifications.get(userId) || [];
    const unreadCount = memoryList.filter(n => !n.read).length;
    return { notifications: memoryList.slice(0, limit), unreadCount };
  }

  /**
   * Gets unread count for badge counters
   */
  static async getUnreadCount(userId) {
    if (!userId) return 0;
    try {
      if (prisma && prisma.notification) {
        return await prisma.notification.count({ where: { userId, read: false } });
      }
    } catch (err) {}
    const list = inMemoryNotifications.get(userId) || [];
    return list.filter(n => !n.read).length;
  }

  /**
   * Marks a notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      if (prisma && prisma.notification) {
        await prisma.notification.updateMany({
          where: { id: notificationId, userId },
          data: { read: true }
        });
      }
    } catch (err) {
      logger.warn(`[NotificationService] Error marking notification as read in DB:`, err.message);
    }

    const list = inMemoryNotifications.get(userId) || [];
    const target = list.find(n => n.id === notificationId);
    if (target) target.read = true;

    return { success: true, unreadCount: await this.getUnreadCount(userId) };
  }

  /**
   * Marks all user notifications as read
   */
  static async markAllAsRead(userId) {
    try {
      if (prisma && prisma.notification) {
        await prisma.notification.updateMany({
          where: { userId, read: false },
          data: { read: true }
        });
      }
    } catch (err) {
      logger.warn(`[NotificationService] Error marking all notifications read in DB:`, err.message);
    }

    const list = inMemoryNotifications.get(userId) || [];
    list.forEach(n => n.read = true);

    return { success: true, unreadCount: 0 };
  }

  /**
   * Deletes a notification
   */
  static async deleteNotification(notificationId, userId) {
    try {
      if (prisma && prisma.notification) {
        await prisma.notification.deleteMany({
          where: { id: notificationId, userId }
        });
      }
    } catch (err) {
      logger.warn(`[NotificationService] Error deleting notification from DB:`, err.message);
    }

    if (inMemoryNotifications.has(userId)) {
      const filtered = inMemoryNotifications.get(userId).filter(n => n.id !== notificationId);
      inMemoryNotifications.set(userId, filtered);
    }

    return { success: true, unreadCount: await this.getUnreadCount(userId) };
  }
}

module.exports = NotificationService;
