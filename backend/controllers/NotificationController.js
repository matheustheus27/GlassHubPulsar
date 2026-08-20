/**
 * Notification Controller
 */
const notificationService = require('../services/NotificationService');
const logger = require('../utils/logger');

class NotificationController {
  static async list(req, res) {
    try {
      const userId = req.user?.id || req.query.userId || 'guest_user';
      const limit = parseInt(req.query.limit, 10) || 30;
      const data = await notificationService.getUserNotifications(userId, limit);
      return res.status(200).json({
        success: true,
        ...data
      });
    } catch (err) {
      logger.error('[NotificationController] Error listing notifications:', err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar notificações' });
    }
  }

  static async markRead(req, res) {
    try {
      const userId = req.user?.id || req.body.userId || 'guest_user';
      const { id } = req.params;
      const result = await notificationService.markAsRead(id, userId);
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      logger.error('[NotificationController] Error marking notification as read:', err);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar notificação' });
    }
  }

  static async markAllRead(req, res) {
    try {
      const userId = req.user?.id || req.body.userId || 'guest_user';
      const result = await notificationService.markAllAsRead(userId);
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      logger.error('[NotificationController] Error marking all notifications as read:', err);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar notificações' });
    }
  }

  static async delete(req, res) {
    try {
      const userId = req.user?.id || req.query.userId || 'guest_user';
      const { id } = req.params;
      const result = await notificationService.deleteNotification(id, userId);
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      logger.error('[NotificationController] Error deleting notification:', err);
      return res.status(500).json({ success: false, message: 'Erro ao remover notificação' });
    }
  }
}

module.exports = NotificationController;
