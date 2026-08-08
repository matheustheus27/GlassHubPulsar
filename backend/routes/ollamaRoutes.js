const express = require("express");
const OllamaController = require("../controllers/OllamaController");

module.exports = function setupOllamaRoutes(app) {
    const aiRouter = express.Router();
    const messagesRouter = express.Router();

    messagesRouter.post("/send", async (req, res) => OllamaController.sendMessage(req, res));

    aiRouter.use("/messages", messagesRouter);

    app.use("/ai", aiRouter);
};