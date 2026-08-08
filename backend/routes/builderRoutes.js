const BuilderController = require("../controllers/BuilderController");

module.exports = function setupBuilderRoutes(app) {
  app.post("/pdf/export", async (req, res) => BuilderController.exportPDF(req, res));
};
