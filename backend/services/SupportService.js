/**
 * Support & Live Chat Real-Time Service
 * Manages WebSocket/SSE live messaging, ticket lifecycles, and 30-day account deletion grace period routines.
 */
const prisma = require('../prisma/client');
const logger = require('../utils/logger');
const crypto = require('crypto');

class SupportService {
  constructor() {
    // Active WebSocket / SSE client connections keyed by ticketId
    this.ticketRooms = new Map(); // ticketId -> Set of response/ws callbacks
    
    // Start automated background routine for scheduled permanent deletions (every 1 hour)
    this.startDeletionRoutine();
  }

  registerClient(ticketId, callback) {
    if (!this.ticketRooms.has(ticketId)) {
      this.ticketRooms.set(ticketId, new Set());
    }
    this.ticketRooms.get(ticketId).add(callback);
  }

  unregisterClient(ticketId, callback) {
    if (this.ticketRooms.has(ticketId)) {
      this.ticketRooms.get(ticketId).delete(callback);
      if (this.ticketRooms.get(ticketId).size === 0) {
        this.ticketRooms.delete(ticketId);
      }
    }
  }

  broadcastToTicket(ticketId, event, data) {
    const clients = this.ticketRooms.get(ticketId);
    if (clients) {
      clients.forEach(cb => {
        try {
          cb(event, data);
        } catch (e) {
          logger.warn(`Error broadcasting to client in ticket [${ticketId}]:`, e.message);
        }
      });
    }
  }

  /**
   * 30-Day Soft Deletion Flow
   * Deactivates the user and places in AccountDeletionQueue with a 30-day grace period.
   */
  async queueAccountDeletion(userId, adminName = 'System Admin') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const now = new Date();
    const scheduledDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const recoveryToken = crypto.randomBytes(32).toString('hex');

    // 1. Deactivate the user so they cannot login without recovering
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    // 2. Create entry in deletion queue
    const deletionEntry = await prisma.accountDeletionQueue.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        deletionRequestedAt: now,
        scheduledPermanentDeletionAt: scheduledDate,
        recoveryToken,
        status: 'PENDING_DELETION',
        executedByAdmin: adminName
      }
    });

    logger.info(`[SupportService] Account for ${user.email} queued for deletion. Permanent deletion scheduled for ${scheduledDate.toISOString()}`);

    return {
      success: true,
      userEmail: user.email,
      recoveryToken,
      scheduledDate,
      recoveryLink: `/recover-account?token=${recoveryToken}`
    };
  }

  /**
   * Account Recovery Flow
   * Restores user account before the 30-day grace period expires.
   */
  async recoverAccount(recoveryToken) {
    const entry = await prisma.accountDeletionQueue.findUnique({
      where: { recoveryToken }
    });

    if (!entry || entry.status !== 'PENDING_DELETION') {
      throw new Error('Token de recuperação inválido ou já utilizado');
    }

    if (new Date() > new Date(entry.scheduledPermanentDeletionAt)) {
      throw new Error('O prazo de 30 dias para recuperação desta conta já expirou');
    }

    // Reactivate user
    await prisma.user.update({
      where: { id: entry.userId },
      data: { isActive: true }
    });

    // Mark deletion queue entry as RECOVERED
    await prisma.accountDeletionQueue.update({
      where: { id: entry.id },
      data: { status: 'RECOVERED' }
    });

    logger.info(`[SupportService] User account [${entry.userEmail}] successfully recovered with token`);

    return {
      success: true,
      message: 'Conta recuperada com sucesso! Você já pode fazer login novamente.',
      userEmail: entry.userEmail
    };
  }

  /**
   * Automated Background Deletion Routine
   */
  startDeletionRoutine() {
    const checkDeletions = async () => {
      try {
        const pending = await prisma.accountDeletionQueue.findMany({
          where: { status: 'PENDING_DELETION' }
        });

        const now = new Date();
        for (const item of pending) {
          if (new Date(item.scheduledPermanentDeletionAt) <= now) {
            logger.warn(`[SupportService] 30-Day grace period expired for user [${item.userId} - ${item.userEmail}]. Deleting permanently...`);

            try {
              if (prisma.user.delete) {
                await prisma.user.delete({ where: { id: item.userId } });
              }
            } catch (err) {
              logger.warn(`Could not delete user row: ${err.message}`);
            }

            await prisma.accountDeletionQueue.update({
              where: { id: item.id },
              data: { status: 'PERMANENTLY_DELETED' }
            });
          }
        }
      } catch (e) {
        logger.error('Error in deletion cleanup routine:', e);
      }
    };

    // Run on startup and every 30 minutes
    setTimeout(checkDeletions, 5000);
    setInterval(checkDeletions, 30 * 60 * 1000);
  }
}

module.exports = new SupportService();
