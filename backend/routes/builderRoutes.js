const express = require("express");
const BuilderController = require("../controllers/BuilderController");

module.exports = function setupBuilderRoutes(app) {
  const exportRouter = express.Router();
  
  exportRouter.post("/export", async (req, res) => BuilderController.exportPDF(req, res));
  
  app.use("/pdf", exportRouter);
};
