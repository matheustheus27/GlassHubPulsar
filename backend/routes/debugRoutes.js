// Debug endpoint for pagination diagnostics
const express = require("express");
const DebugController = require("../controllers/DebugController");

module.exports = function setupDebugRoutes(app) {
  const paginationRouter = express.Router();
    
  paginationRouter.post("/pagination", async (req, res) => DebugController.pagination(req, res));
    
  app.use("/debug", paginationRouter);
};
