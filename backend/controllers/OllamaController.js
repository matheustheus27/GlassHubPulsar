const Ollama = require("../services/OllamaService");

class OllamaController {
    async sendMessage(req, res) {
        try {
            const document = req.body.document;
            const messages = req.body.messages || [];

            const result = await Ollama.chatWithDocument(document, messages);

            return res.json({
                success: true,
                messages: result
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new OllamaController();