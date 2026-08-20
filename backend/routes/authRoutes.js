const express = require('express');
const authController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

function setupAuthRoutes(app) {
  const router = express.Router();

  router.post('/register', authLimiter, (req, res) => authController.register(req, res));
  router.post('/login', authLimiter, (req, res) => authController.login(req, res));
  router.post('/refresh', (req, res) => authController.refreshToken(req, res));
  router.post('/logout', (req, res) => authController.logout(req, res));
  router.get('/me', authenticate, (req, res) => authController.me(req, res));

  app.use('/api/auth', router);
}

module.exports = setupAuthRoutes;
