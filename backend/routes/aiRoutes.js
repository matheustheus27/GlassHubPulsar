const express = require('express');
const aiController = require('../controllers/AIController');
const { aiLimiter } = require('../middleware/rateLimiter');

function setupAIRoutes(app) {
  const router = express.Router();

  router.post('/ats-analyze', aiLimiter, (req, res) => aiController.atsAnalyze(req, res));
  router.post('/messages', aiLimiter, (req, res) => aiController.sendMessage(req, res));
  router.post('/messages/send', aiLimiter, (req, res) => aiController.sendMessage(req, res));
  router.post('/quick-fill', aiLimiter, (req, res) => aiController.quickFill(req, res));
  router.post('/parse-resume-file', aiLimiter, (req, res) => aiController.parseResumeFile(req, res));

  app.use('/api/ai', router);
  app.use('/ai', router);
}

module.exports = setupAIRoutes;
