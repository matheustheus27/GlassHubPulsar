const TagProcessor = require('../layout/TagProcessor');
const logger = require('../utils/logger');
const { validateAndCleanResumeData, normalizeToApplicationDTO } = require('../schemas/resumeSchema');
const ResumeSectionParser = require('../parsers/ResumeSectionParser');
const CandidateParser = require('../parsers/CandidateParser');
const SummaryParser = require('../parsers/SummaryParser');
const SkillsParser = require('../parsers/SkillsParser');
const ExperienceParser = require('../parsers/ExperienceParser');
const EducationParser = require('../parsers/EducationParser');
const ProjectParser = require('../parsers/ProjectParser');
const ResumeMergeService = require('../parsers/ResumeMergeService');

class OllamaService {
    static #sanitizeInputText(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .replace(/^%?PDF-[\d.]+/gi, '')
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '\n')
            .replace(/\u200B/g, '')
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

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

    /**
     * Resilient Header & Summary Extractor (Backward compatibility helper)
     */
    static #extractDeterministicFields(text) {
        const sections = ResumeSectionParser.parseSections(text);
        const candidate = CandidateParser.parseCandidate(sections.header, text);
        const professionalSummary = SummaryParser.parseSummary(sections.summary);

        return {
            candidate,
            professionalSummary
        };
    }

    /**
     * Calls Ollama API for semantic entity extraction
     */
    async #queryOllamaExtraction(promptText, options = {}) {
        const ollamaHost = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_HOST || "http://ollama:11434";
        const model = options.model || process.env.OLLAMA_MODEL || "llama3.2";
        const numCtx = Number(options.numCtx || process.env.OLLAMA_NUM_CTX || 8192);
        const numPredict = Number(options.numPredict || process.env.OLLAMA_NUM_PREDICT || 4096);

        const systemPrompt = `You are a high-precision resume information extraction engine.

This is an EXTRACTION task, not a generation task.

Extract ONLY information explicitly present in the provided text.

STRICT RULES:
1. Never invent information.
2. Never infer missing information.
3. Never rewrite extracted text.
4. Never summarize extracted text.
5. Never translate extracted text.
6. Never improve grammar.
7. Never create metrics.
8. Never create technologies.
9. Never create descriptions.
10. Never change company names.
11. Never change project names.
12. Never change dates.
13. Never convert URLs to Markdown.
14. Never convert URLs to HTML.
15. Preserve formatting tags such as <BOLD>, <ITALIC>, <UNDERLINE>, <HIGHLIGHT> and <STRIKETHROUGH>.
16. If a field does not exist, return an empty string "".
17. If there are no items, return an empty array [].
18. Preserve the original wording as closely as possible.
19. In "skills", capture the exact original category name in "name" (e.g. "MINHA STACK", "TECNOLOGIAS DE BACK-END", "LINGUAGENS") and all its items in "items".
20. In "experiences", relate company, position, period, generalDescription, and bullets. "generalDescription" MUST be "" unless there is an independent description paragraph separate from the position and bullets.
21. In "education", relate institution, degree/course, period/status (e.g. "Previsão de conclusão em 2028", "Concluído em 2015"), and full description.
22. In "projects", capture project title in "name", the technologies/summary line in "description", and each bullet item in "bullets".

Output ONLY valid JSON matching this schema:
{
  "skills": [{ "name": "string", "items": ["string"] }],
  "experiences": [{ "company": "string", "position": "string", "period": "string", "generalDescription": "string", "bullets": ["string"] }],
  "education": [{ "institution": "string", "degree": "string", "period": "string", "description": "string" }],
  "projects": [{ "name": "string", "description": "string", "bullets": ["string"] }]
}`;

        const controller = new AbortController();
        const timeoutMs = options.timeout || 30000;
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            logger.info(`[OllamaService] Semantic extraction via Ollama (model: ${model}, ctx: ${numCtx})`);
            const response = await fetch(`${ollamaHost}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model,
                    system: systemPrompt,
                    prompt: `### DOCUMENT TEXT TO EXTRACT:\n\n${promptText}`,
                    format: "json",
                    stream: false,
                    options: {
                        temperature: 0.1,
                        num_ctx: numCtx,
                        num_predict: numPredict
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                logger.warn(`[OllamaService] Ollama HTTP error ${response.status}`);
                return null;
            }

            const data = await response.json();
            if (data && data.response) {
                return JSON.parse(data.response.trim());
            }
            return null;
        } catch (err) {
            clearTimeout(timeout);
            logger.warn('[OllamaService] Semantic extraction unavailable or offline, utilizing structural extraction:', err.message);
            return null;
        }
    }

    async parseResumeWithStructuredSchema(rawText, options = {}) {
        if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
            throw new Error('Texto de currículo vazio para parsing.');
        }

        const sanitizedText = OllamaService.#sanitizeInputText(rawText);
        const targetLanguage = options.language || (/[ãõáéíóúâêîôûç]/i.test(sanitizedText) ? 'pt-BR' : 'en-US');

        // STAGE 1: URL Protection & Masking
        const { maskedText, urlMap } = CandidateParser.maskUrls(sanitizedText);

        // STAGE 2: Structural Section Detection
        const sections = ResumeSectionParser.parseSections(maskedText);
        logger.info(`[ResumeParser] Structural sections detected:\nsummary=${!!sections.summary}\nskills=${!!sections.skills}\nexperience=${!!sections.experience}\neducation=${!!sections.education}\nprojects=${!!sections.projects}`);

        // STAGE 3: Structural Extraction (Deterministic baseline)
        const structuralData = {
            candidate: CandidateParser.parseCandidate(sections.header, sanitizedText),
            professionalSummary: SummaryParser.parseSummary(sections.summary),
            skills: SkillsParser.parseSkills(sections.skills),
            experiences: ExperienceParser.parseExperiences(sections.experience),
            education: EducationParser.parseEducation(sections.education),
            projects: ProjectParser.parseProjects(sections.projects)
        };

        logger.info(`[ResumeParser] Structural baseline extraction:\nskills=${structuralData.skills.length}\nexperiences=${structuralData.experiences.length}\neducation=${structuralData.education.length}\nprojects=${structuralData.projects.length}`);

        // STAGE 4: Ollama Semantic Extraction & Interpretation
        let llmData = {};
        const llmResponse = await this.#queryOllamaExtraction(maskedText, options);

        if (llmResponse && typeof llmResponse === 'object') {
            // Restore any masked URL tokens in the LLM response
            llmData = CandidateParser.unmaskUrls(llmResponse, urlMap);
            logger.info(`[ResumeParser] LLM extraction completed:\nskills=${llmData.skills?.length || 0}\nexperiences=${llmData.experiences?.length || 0}\neducation=${llmData.education?.length || 0}\nprojects=${llmData.projects?.length || 0}`);
        }

        // STAGE 5: Controlled Merge (Structural anchor + LLM semantic interpretation)
        const mergedPayload = ResumeMergeService.mergeAll(structuralData, llmData, sections);

        // STAGE 6: Validation and Application DTO Normalization
        const cleaned = validateAndCleanResumeData(mergedPayload);
        return normalizeToApplicationDTO(cleaned, targetLanguage);
    }

    static async parseResumeWithStructuredSchema(rawText, options = {}) {
        const instance = new OllamaService();
        return instance.parseResumeWithStructuredSchema(rawText, options);
    }

    static async parseResumeFromRawText(rawText, options = {}) {
        const instance = new OllamaService();
        return instance.parseResumeWithStructuredSchema(rawText, options);
    }

    async parseResumeFromRawText(rawText, options = {}) {
        return this.parseResumeWithStructuredSchema(rawText, options);
    }

    async chatWithDocument(document, messages = [], userId = 'default_user') {
        return OllamaService.chatWithDocument(document, messages, userId);
    }

    static async chatWithDocument(document, messages = [], userId = 'default_user') {
        const RAGService = require('./RAGService');
        const ollamaHost = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_HOST || "http://ollama:11434";

        const language = document?.settings?.language || "pt-BR";
        const isPortuguese = language.toLowerCase().startsWith("pt");

        const languageInstruction = isPortuguese
            ? "The user's selected language is PORTUGUESE (pt-BR). Answer EXCLUSIVELY in Portuguese."
            : "The user's selected language is ENGLISH (en-US). Answer EXCLUSIVELY in English.";

        const cleanedDocument = OllamaService.#stripTagsFromObject(document);
        const lastUserMessage = (messages[messages.length - 1]?.content || "").trim();

        let ragContextText = '';
        if (lastUserMessage) {
            try {
                const ragChunks = await RAGService.queryRelevantContext(userId, lastUserMessage, 4);
                if (ragChunks && ragChunks.length > 0) {
                    ragContextText = `\nRETRIEVED VECTOR CONTEXT FROM CANDIDATE DOCUMENT (OLLAMA RAG):\n---\n${ragChunks.join('\n---\n')}\n---\n`;
                }
            } catch (ragErr) {
                logger.warn('[OllamaService] RAG context retrieval error:', ragErr.message);
            }
        }

        const systemPrompt = `
            You are a Senior Tech Recruiter and Executive Career Specialist at GlassHub.
            Your task is to answer the candidate's questions and analyze their document (CV or Cover Letter).
            
            DOCUMENT CONTEXT:
            ${JSON.stringify(cleanedDocument, null, 2)}
            ${ragContextText}
            INSTRUCTIONS:
            1. ${languageInstruction}
            2. Directly and specifically answer the user's exact question or prompt using the document details and retrieved RAG vector context above.
            3. Provide actionable suggestions with concrete examples.
            4. You MAY use formatting tags when helpful:
               - <BOLD>text</BOLD> for key terms, metrics, or technologies
               - <ITALIC>text</ITALIC> for subtle emphasis
               - <HIGHLIGHT>text</HIGHLIGHT> for critical takeaways
            5. Maintain a professional, highly encouraging and technical recruiter tone.
        `;

        const payload = {
            model: "llama3.2",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            stream: false
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        try {
            const response = await fetch(`${ollamaHost}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (response.ok) {
                const data = await response.json();
                if (data?.message?.content) {
                    logger.info('[OllamaService] Chat response successfully generated by Llama 3.2');
                    return data.message;
                }
            }
        } catch (err) {
            clearTimeout(timeout);
            logger.debug('[OllamaService] Ollama API offline or timed out, generating context-aware response:', err.message);
        }

        const q = lastUserMessage.toLowerCase();
        let replyContent = "";

        if (q.includes("resumo") || q.includes("summary") || q.includes("perfil")) {
            replyContent = isPortuguese
                ? `💡 <BOLD>Análise do seu Resumo Profissional:</BOLD>\n\nPara o cargo de <HIGHLIGHT>${cleanedDocument.personal?.title || 'Especialista'}</HIGHLIGHT>, recomendo a seguinte estrutura em 3 frases:\n1. <BOLD>Quem você é:</BOLD> Anos de experiência e especialidade técnica central.\n2. <BOLD>Principais diferenciais:</BOLD> Tecnologias e projetos de maior complexidade.\n3. <BOLD>Impacto no negócio:</BOLD> Redução de latência, escalabilidade, liderança ou redução de custos.\n\nEvite clichês como 'apaixonado por tecnologia' e priorize resultados mensuráveis!`
                : `💡 <BOLD>Summary Optimization Advice:</BOLD>\n\nFor your target role as <HIGHLIGHT>${cleanedDocument.personal?.title || 'Specialist'}</HIGHLIGHT>, structure your summary in 3 high-impact sentences:\n1. <BOLD>Core identity:</BOLD> Years of experience and primary engineering domain.\n2. <BOLD>Technical edge:</BOLD> Top technologies and distributed system achievements.\n3. <BOLD>Business impact:</BOLD> Latency reduction, high availability, or cost optimization.`;
        } else if (q.includes("ats") || q.includes("score") || q.includes("palavra") || q.includes("keyword")) {
            replyContent = isPortuguese
                ? `🎯 <BOLD>Estratégia para Pontuação Máxima no ATS:</BOLD>\n\nOs robôs de triagem buscam correlação direta entre o título da vaga e seu currículo. Certifique-se de:\n- Incluir palavras-chave essenciais: <HIGHLIGHT>TypeScript</HIGHLIGHT>, <HIGHLIGHT>Docker</HIGHLIGHT>, <HIGHLIGHT>PostgreSQL</HIGHLIGHT>, <HIGHLIGHT>CI/CD</HIGHLIGHT>, <HIGHLIGHT>Microsserviços</HIGHLIGHT>.\n- Distribuir as tecnologias tanto nas competências quanto dentro dos bullets de experiência profissional.\n- Evitar tabelas ou layouts não lineares.`
                : `🎯 <BOLD>ATS Keyword Alignment Strategy:</BOLD>\n\nApplicant Tracking Systems look for direct match density. Ensure you:\n- Include core tech: <HIGHLIGHT>TypeScript</HIGHLIGHT>, <HIGHLIGHT>Docker</HIGHLIGHT>, <HIGHLIGHT>PostgreSQL</HIGHLIGHT>, <HIGHLIGHT>CI/CD</HIGHLIGHT>, <HIGHLIGHT>Distributed Systems</HIGHLIGHT>.\n- Repeat key skills inside real experience bullet points with quantified outcomes.`;
        } else if (q.includes("experiência") || q.includes("bullet") || q.includes("trabalho") || q.includes("cargo") || q.includes("experience")) {
            replyContent = isPortuguese
                ? `💼 <BOLD>Fórmula de Ouro para Histórico Profissional:</BOLD>\n\nCada bullet deve seguir o padrão: <BOLD>[Verbo de Ação Forte]</BOLD> + <ITALIC>[Tecnologia/Desafio]</ITALIC> + <HIGHLIGHT>[Métrica de Resultado %]</HIGHLIGHT>.\n\n✨ <BOLD>Exemplo de Transformação:</BOLD>\n❌ *'Trabalhei com microsserviços e backend.'*\n✅ *'Liderou a arquitetura de microsserviços em <BOLD>Node.js e Redis</BOLD>, reduzindo o tempo de resposta das APIs em <HIGHLIGHT>38%</HIGHLIGHT> para mais de 100k usuários.'*`
                : `💼 <BOLD>Executive Bullet Formula:</BOLD>\n\nFormat each achievement as: <BOLD>[Strong Action Verb]</BOLD> + <ITALIC>[Tech / Scope]</ITALIC> + <HIGHLIGHT>[Quantified Outcome %]</HIGHLIGHT>.\n\n✨ <BOLD>Example Rewrite:</BOLD>\n❌ *'Worked on backend APIs.'*\n✅ *'Architected high-throughput microservices using <BOLD>Node.js & Redis</BOLD>, improving API latency by <HIGHLIGHT>38%</HIGHLIGHT> under peak traffic.'*`;
        } else if (q.includes("habilidade") || q.includes("skill") || q.includes("tecnologia") || q.includes("tech")) {
            replyContent = isPortuguese
                ? `⚡ <BOLD>Organização de Competências:</BOLD>\n\nRecomendo agrupar suas habilidades em 3 ou 4 categorias claras (ex: <BOLD>Backend & Nuvem</BOLD>, <BOLD>Frontend & UX</BOLD>, <BOLD>Bancos de Dados & Filas</BOLD>). Isso facilita a leitura rápida do recrutador humano e otimiza a indexação dos parsers ATS!`
                : `⚡ <BOLD>Skills Architecture:</BOLD>\n\nGroup skills into 3-4 distinct categories (e.g., <BOLD>Backend & Cloud</BOLD>, <BOLD>Frontend & UX</BOLD>, <BOLD>Databases & Queues</BOLD>). This maximizes recruiter readability and ATS keyword clustering.`;
        } else if (q.includes("projeto") || q.includes("project") || q.includes("portfólio") || q.includes("portfolio")) {
            replyContent = isPortuguese
                ? `🚀 <BOLD>Destaque de Projetos:</BOLD>\n\nAo apresentar projetos, inclua sempre o <BOLD>link direto</BOLD> (GitHub ou Live Demo), a motivação do projeto, as tecnologias utilizadas e qual problema real ele resolveu. Projetos com arquitetura completa (Front + Back + Docker) geram excelente impressão técnica.`
                : `🚀 <BOLD>Project Showcase Advice:</BOLD>\n\nAlways provide live repository links, specify the full stack (e.g., React, Node, Docker), and highlight the technical challenge solved.`;
        } else if (q.includes("carta") || q.includes("cover") || q.includes("apresentação")) {
            replyContent = isPortuguese
                ? `✉️ <BOLD>Dica para Carta de Apresentação:</BOLD>\n\nMantenha a carta concisa (3 a 4 parágrafos). No primeiro, cite a vaga e seu entusiasmo. No segundo, conte seu maior case de sucesso relevante. No terceiro, explique por que seus valores e habilidades se alinham à empresa!`
                : `✉️ <BOLD>Cover Letter Insights:</BOLD>\n\nKeep it tight (3-4 paragraphs). Hook the hiring team in paragraph 1, showcase your top relevant engineering achievement in paragraph 2, and align your values in paragraph 3.`;
        } else {
            replyContent = isPortuguese
                ? `✨ <BOLD>Consultoria do Recrutador:</BOLD>\n\nEntendi sua solicitação sobre: *"${lastUserMessage}"*.\n\nPara o seu perfil como <HIGHLIGHT>${cleanedDocument.personal?.title || 'Profissional de Tecnologia'}</HIGHLIGHT>, o ideal é focar na clareza dos dados e no impacto técnico mensurável. Se desejar, você pode me pedir para reescrever um resumo, sugerir bullets para uma experiência específica ou listar palavras-chave para sua área!`
                : `✨ <BOLD>Recruiter Career Guidance:</BOLD>\n\nRegarding your question: *"${lastUserMessage}"*.\n\nFor your target role as <HIGHLIGHT>${cleanedDocument.personal?.title || 'Technology Professional'}</HIGHLIGHT>, focus on quantifiable technical impact. You can ask me to rewrite specific summary paragraphs, optimize experience bullets, or recommend target ATS keywords!`;
        }

        return {
            role: "assistant",
            content: replyContent
        };
    }
}

const serviceInstance = new OllamaService();
serviceInstance.OllamaService = OllamaService;
serviceInstance.parseResumeFromRawText = serviceInstance.parseResumeFromRawText.bind(serviceInstance);
serviceInstance.parseResumeWithStructuredSchema = serviceInstance.parseResumeWithStructuredSchema.bind(serviceInstance);
serviceInstance.chatWithDocument = OllamaService.chatWithDocument.bind(OllamaService);

module.exports = serviceInstance;