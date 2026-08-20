const express = require('express');
const userSettingsController = require('../controllers/UserSettingsController');
const { authenticate, requireAuth } = require('../middleware/auth');

function setupUserRoutes(app) {
  const router = express.Router();

  router.get('/settings', authenticate, (req, res) => userSettingsController.getSettings(req, res));
  router.put('/settings', authenticate, requireAuth, (req, res) => userSettingsController.saveSettings(req, res));
  router.post('/settings', authenticate, requireAuth, (req, res) => userSettingsController.saveSettings(req, res));

  app.use('/api/user', router);
}

module.exports = setupUserRoutes;
