const express = require("express");
const BuilderController = require("../controllers/BuilderController");

module.exports = function setupBuilderRoutes(app) {
  const exportRouter = express.Router();
  
  // Synchronous generation
  exportRouter.post("/export", async (req, res) => BuilderController.exportPDF(req, res));
  exportRouter.post("/generate", async (req, res) => BuilderController.exportPDF(req, res));
  
  // Asynchronous Worker BullMQ Queue Generation & Download
  exportRouter.post("/job", async (req, res) => BuilderController.enqueuePDFJob(req, res));
  exportRouter.post("/export-async", async (req, res) => BuilderController.enqueuePDFJob(req, res));
  exportRouter.get("/download/:id", async (req, res) => BuilderController.downloadPDF(req, res));
  
  app.use("/pdf", exportRouter);
  app.use("/api/pdf", exportRouter);
  app.use("/builder", exportRouter);
  app.use("/api/builder", exportRouter);
};
