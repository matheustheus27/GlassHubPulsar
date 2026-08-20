const express = require('express');
const adminController = require('../controllers/AdminController');
const { authenticate, requireRole } = require('../middleware/auth');

function setupAdminRoutes(app) {
  const router = express.Router();

  // Hidden admin routes protected by RBAC
  router.get('/health', authenticate, requireRole('ADMIN'), (req, res) => adminController.getSystemHealth(req, res));
  router.get('/queues', authenticate, requireRole('ADMIN'), (req, res) => adminController.getQueueStats(req, res));
  router.post('/queues/:name/:action', authenticate, requireRole('ADMIN'), (req, res) => adminController.controlQueue(req, res));
  router.post('/report/pdf', authenticate, requireRole('ADMIN'), (req, res) => adminController.generateExecutiveReport(req, res));
  
  // User account management & profile
  router.get('/users', authenticate, requireRole('ADMIN'), (req, res) => adminController.listUsers(req, res));
  router.post('/users', authenticate, requireRole('ADMIN'), (req, res) => adminController.createUser(req, res));
  router.put('/profile', authenticate, requireRole('ADMIN'), (req, res) => adminController.updateProfile(req, res));

  app.use('/api/admin', router);
}

module.exports = setupAdminRoutes;
