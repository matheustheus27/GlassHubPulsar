const sseController = require('../controllers/SSEController');

function setupSSERoutes(app) {
  app.get('/api/events/stream', (req, res) => sseController.stream(req, res));
}

module.exports = setupSSERoutes;
