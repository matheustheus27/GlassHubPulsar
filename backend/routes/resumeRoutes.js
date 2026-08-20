const express = require('express');
const resumeController = require('../controllers/ResumeController');
const { authenticate } = require('../middleware/auth');

function setupResumeRoutes(app) {
  const router = express.Router();

  router.get('/', authenticate, (req, res) => resumeController.getResume(req, res));
  router.post('/', authenticate, (req, res) => resumeController.saveResume(req, res));
  router.post('/translate', authenticate, (req, res) => resumeController.translateAsync(req, res));

  app.use('/api/resume', router);
}

module.exports = setupResumeRoutes;
