const TagProcessor = require('../layout/TagProcessor');

class OllamaService {
    /**
     * Recursively removes custom tags (<BOLD>, etc.) from any string 
     * present within objects or arrays to deliver a clean JSON payload to the AI.
     */
    static #stripTagsFromObject(obj) {
        if (typeof obj === "string" && obj.match(/<\/?(BOLD|ITALIC|UNDERLINE|HIGHLIGHT|STRIKETHROUGH)>/gi)) {
            return TagProcessor.stripTags(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.#stripTagsFromObject(item));
        }
        if (obj !== null && typeof obj === "object") {
            const cleaned = {};
            for (const key of Object.keys(obj)) {
                cleaned[key] = this.#stripTagsFromObject(obj[key]);
            }
            return cleaned;
        }
        return obj;
    }

    static async chatWithDocument(document, messages = []) {
        const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";

        // 1. Identifies the active language selected in settings (e.g., 'pt-BR' or 'en-US')
        const language = document?.settings?.language || "pt-BR";
        const isPortuguese = language.toLowerCase().startsWith("pt");

        const languageInstruction = isPortuguese
            ? "The user's selected language is PORTUGUESE (pt-BR). Answer EXCLUSIVELY in Portuguese."
            : "The user's selected language is ENGLISH (en-US). Answer EXCLUSIVELY in English.";

        // 2. Cleans custom layout tags from the entire document (Summary, Experience, Education, Projects, Cover Letter)
        const cleanedDocument = this.#stripTagsFromObject(document);

        // 3. Assembles the dynamic System Prompt
        const systemPrompt = `
            You are a Senior Tech Recruiter and HR Specialist.
            Your task is to analyze the candidate's complete document (CV or Cover Letter) and help them improve it.

            DOCUMENT DATA:
            ${JSON.stringify(cleanedDocument, null, 2)}

            STRICT INSTRUCTIONS:
            1. ${languageInstruction}
            2. Be direct, constructive, and friendly.
            3. When suggesting text rewrites or improvements, you MAY use the system's allowed custom tags when appropriate:
            - <BOLD>text</BOLD> for key terms or metrics
            - <ITALIC>text</ITALIC> for subtle emphasis
            - <HIGHLIGHT>text</HIGHLIGHT> for important highlights
            4. Keep feedback focused on impact, metrics, clarity, and tech-industry best practices.
        `;

        const payload = {
            model: "llama3.2",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            stream: false
        };

        const response = await fetch(`${ollamaHost}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Ollama communication failure: ${response.statusText}`);
        }

        const data = await response.json();
        return data.message;
    }
}

module.exports = OllamaService;