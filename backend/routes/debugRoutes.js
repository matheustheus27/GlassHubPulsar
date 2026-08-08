// Debug endpoint for pagination diagnostics
const DebugController = require("../controllers/DebugController");

module.exports = function setupDebugRoutes(app) {
  app.post("/debug/pagination", async (req, res) => DebugController.pagination(req, res));
};
