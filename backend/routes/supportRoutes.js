const express = require('express');
const supportController = require('../controllers/SupportController');
const { authenticate, requireRole } = require('../middleware/auth');

function setupSupportRoutes(app) {
  const router = express.Router();

  // Public account recovery route
  router.post('/recover-account', (req, res) => supportController.recoverAccount(req, res));

  // User & Admin ticket routes
  router.get('/tickets', authenticate, (req, res) => supportController.listTickets(req, res));
  router.post('/tickets', authenticate, (req, res) => supportController.createTicket(req, res));
  router.get('/tickets/:id', authenticate, (req, res) => supportController.getTicketById(req, res));
  router.post('/tickets/:id/messages', authenticate, (req, res) => supportController.sendMessage(req, res));
  router.get('/tickets/:ticketId/stream', (req, res) => supportController.connectLiveChatStream(req, res));

  // Admin exclusive ticket management
  router.post('/tickets/:id/accept', authenticate, requireRole('ADMIN'), (req, res) => supportController.acceptTicket(req, res));
  router.post('/tickets/:id/resolve', authenticate, requireRole('ADMIN'), (req, res) => supportController.resolveTicket(req, res));
  router.post('/account-deletion/execute', authenticate, requireRole('ADMIN'), (req, res) => supportController.executeAccountDeletion(req, res));

  app.use('/api/support', router);
}

module.exports = setupSupportRoutes;
