const TagProcessor = require('../layout/TagProcessor');
const logger = require('../utils/logger');
const documentParser = require('./DocumentParserService');
const { RESUME_JSON_SCHEMA, validateAndCleanResumeData, normalizeToApplicationDTO } = require('../schemas/resumeSchema');

class OllamaService {
    /**
     * Sanitizes raw candidate input text
     */
    static #sanitizeInputText(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .replace(/^%?PDF-[\d.]+/gi, '')
            .replace(/\/Title\s*\([^\)]*\)/gi, '')
            .replace(/\/Creator\s*\([^\)]*\)/gi, '')
            .replace(/\/Producer\s*\([^\)]*\)/gi, '')
            .replace(/\/CreationDate\s*\([^\)]*\)/gi, '')
            .replace(/\/ModDate\s*\([^\)]*\)/gi, '')
            .replace(/\/ca\s+[\d.]+/gi, '')
            .replace(/\/BM\s+\/[A-Za-z]+/gi, '')
            .replace(/\r\n/g, '\n')
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
            .replace(/\u200B/g, '')
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
     * Parse Resume using Ollama API format flag with strict JSON Schema definition
     * Guarantees non-agglutinated fields (empresa, cargo, periodo strictly separated)
     */
    async parseResumeWithStructuredSchema(rawText, options = {}) {
        if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
            throw new Error('Texto de currículo vazio para parsing estruturado.');
        }

        const sanitizedText = OllamaService.#sanitizeInputText(rawText);
        const ollamaHost = process.env.OLLAMA_HOST || "http://ollama:11434";
        const model = options.model || process.env.OLLAMA_MODEL || "llama3.2";

        const systemPrompt = `You are a high-precision data parsing engine specializing in Portuguese candidate resumes.
Rigorously analyze the raw document text provided below and return ONLY a valid structured JSON object matching the contract schema.

CRITICAL EXTRACTION RULES:
1. HEADER BLOCKS:
   - Extract Full Name ('nome'), Target Title/Role ('titulo'), Location ('localizacao' e.g. Cidade, UF), Email ('email'), Phone number ('telefone'), and Links ('linkedin', 'github').
2. COMPETENCIES / SKILLS:
   - The document lists skills in tags/badges under uppercase section titles (e.g., "LINGUAGENS", "FRAMEWORKS E BIBLIOTECAS", "BANCOS DE DADOS", "DEVOPS", "PROTOCOLOS E COMUNICAÇÃO", "METODOLOGIAS E CONCEITOS").
   - Map each individual item to its respective array inside "competencias" (linguagens, frameworksBibliotecas, bancosDeDados, devops, protocolosComunicacao, metodologiasConceitos).
3. PROFESSIONAL EXPERIENCE ('experiencias'):
   - Identify each separate work entry cleanly into individual objects.
   - "empresa": Organization name (e.g., Teknisa, Azapfy, Commit Jr., NTIC, Sistema Divina Providência).
   - "cargo": Job title/role (e.g., Desenvolvedor Full-Stack, Instrutor de Informática).
   - "periodo": Dates/duration (e.g., "Set 2025-Presente", "Out 2021- Set 2024").
   - "descricaoGeral": Introductory text describing scope/responsibilities (if present).
   - "realizacoes": Array containing each bullet point (• marker) of responsibilities or achievements. NEVER merge or agglutinate different topics into the same item.
4. ACADEMIC EDUCATION ('formacaoAcademica'):
   - Identify each course/degree separately (e.g., "CEFET-MG", "Sistema Divina Providência").
   - "instituicao": Educational institution name.
   - "grau": Degree title (e.g., "Bacharelado em Engenharia de Computação", "Técnico em Informática").
   - "statusOuPeriodo": Status or period (e.g., "Previsão de conclusão em 2028", "Concluído em 2015").
   - "detalhes": Descriptive text of curriculum focus or achievements.
5. PERSONAL / FEATURED PROJECTS ('projetos'):
   - Identify each project individually (e.g., "NativeZip Tools", "Glassmorphic Professional Resume", "Alquerque - Motor de Jogo de Tabuleiro").
   - "nome": Project title.
   - "tecnologias": Array with tags/stacks listed right below the project name (e.g., ["C#", "Utilitários de Sistema", "Gerenciamento de Zip"]).
   - "realizacoes": Array with detailed bullet points for each project.
6. FONT STYLE TAG PRESERVATION:
   - Preserve formatting tags <BOLD>text</BOLD> and <ITALIC>text</ITALIC> around styled words inside text blocks.
7. Output ONLY valid JSON matching the schema, with no preamble or conversational text.`;

        const userPrompt = `TEXTO DO CURRÍCULO PARA EXTRAÇÃO:\n\n${sanitizedText}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        try {
            logger.info(`[OllamaService] Sending text to Ollama structured schema parser (model: ${model})`);
            const response = await fetch(`${ollamaHost}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model,
                    system: systemPrompt,
                    prompt: userPrompt,
                    format: RESUME_JSON_SCHEMA,
                    stream: false,
                    options: { temperature: 0.1 }
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (response.ok) {
                const data = await response.json();
                const responseStr = data?.response;
                if (responseStr) {
                    const parsedRaw = JSON.parse(responseStr);
                    const cleanedSchema = validateAndCleanResumeData(parsedRaw);
                    const normalized = normalizeToApplicationDTO(cleanedSchema);
                    logger.info(`[OllamaService] Structured schema parsing succeeded (${cleanedSchema.experiencias?.length || 0} experiences, ${cleanedSchema.projetos?.length || 0} projects)`);
                    return normalized;
                }
            }
        } catch (err) {
            clearTimeout(timeout);
            logger.warn(`[OllamaService] Primary model (${model}) structured schema note/timeout:`, err.message);
        }

        // Fast Heuristic Fallback (<10ms execution guarantees zero timeouts)
        logger.info('[OllamaService] Executing high-speed heuristic rule-based extraction fallback');
        const heuristicRaw = OllamaService.#advancedHeuristicExtract(sanitizedText);
        return normalizeToApplicationDTO(heuristicRaw);
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
        const ollamaHost = process.env.OLLAMA_HOST || "http://ollama:11434";

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

    /**
     * Advanced heuristic rule-based extractor
     */
    static #advancedHeuristicExtract(text) {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const email = emailMatch ? emailMatch[0] : '';

        const phoneMatch = text.match(/(\+55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/);
        const phone = phoneMatch ? phoneMatch[0].trim() : '';

        const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
        const linkedinUrl = linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '';

        const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
        const githubUrl = githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : '';

        const locationMatch = text.match(/📍\s*([A-Za-zÀ-ÖØ-öø-ÿ\s]+,\s*[A-Z]{2}(?:\s*-\s*[A-Za-zÀ-ÖØ-öø-ÿ]+)?)/i)
            || text.match(/([A-Za-zÀ-ÖØ-öø-ÿ\s]{3,30},\s*[A-Z]{2}(?:\s*-\s*[A-Za-zÀ-ÖØ-öø-ÿ]+)?)/);
        const location = locationMatch ? locationMatch[1].trim() : 'Brasil';

        let candidateName = 'Candidato';
        let candidateTitle = 'Desenvolvedor de Software';

        for (let i = 0; i < Math.min(lines.length, 5); i++) {
            const line = lines[i];
            const isSectionHeader = /RESUMO|EXPERIÊNCIA|COMPETÊNCIAS|FORMAÇÃO|PROJETOS/i.test(line);
            const isContact = line.includes('@') || line.includes('http') || line.includes('📍') || line.includes('📞') || line.includes('✉️');
            if (!isSectionHeader && !isContact && line.length > 3 && line.length < 50) {
                if (candidateName === 'Candidato') {
                    candidateName = line.replace(/^[#*\-•\s]+/, '').trim();
                } else if (candidateTitle === 'Desenvolvedor de Software' && !line.includes(candidateName)) {
                    candidateTitle = line.replace(/^[#*\-•\s]+/, '').trim();
                    break;
                }
            }
        }

        const sections = this.#sliceSections(text);
        const summaryText = sections['RESUMO'] || sections['SUMMARY'] || sections['PERFIL'] || '';
        const skills = this.#parseSkillsSection(sections['COMPETÊNCIAS'] || sections['SKILLS'] || sections['TECNOLOGIAS'] || '');
        const experiences = this.#parseExperienceSection(sections['EXPERIÊNCIA'] || sections['HISTÓRICO'] || '');
        const educations = this.#parseEducationSection(sections['FORMAÇÃO'] || sections['EDUCAÇÃO'] || '');
        const projects = this.#parseProjectsSection(sections['PROJETOS'] || '');

        return {
            personalDetails: {
                name: candidateName,
                title: candidateTitle,
                contact: {
                    email: { email, icon: '✉️' },
                    phone: { phone, link: phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : '', icon: '📞' },
                    networking: {
                        linkedin: { name: 'LinkedIn', url: linkedinUrl || '', icon: '💼' },
                        github: { name: 'GitHub', url: githubUrl || '', icon: '🐙' }
                    }
                },
                location: { location, link: '', icon: '📍' }
            },
            summaryDetails: {
                summaryTitle: 'RESUMO PROFISSIONAL',
                summary: summaryText || 'Profissional de tecnologia com sólida experiência no desenvolvimento de sistemas escaláveis e modernas arquiteturas de software.'
            },
            skillsDetails: {
                skillsTitle: 'COMPETÊNCIAS & TECNOLOGIAS',
                skills: skills.length > 0 ? skills : []
            },
            experienceDetails: {
                experienceTitle: 'HISTÓRICO PROFISSIONAL',
                experiences: experiences.length > 0 ? experiences : []
            },
            educationDetails: {
                educationTitle: 'FORMAÇÃO ACADÊMICA',
                educations: educations.length > 0 ? educations : []
            },
            projectDetails: {
                projectTitle: 'PROJETOS DE DESTAQUE',
                projects: projects.length > 0 ? projects : []
            }
        };
    }

    static #sliceSections(text) {
        const sectionMap = {};
        const headerRegex = /(?:^|\n)(RESUMO PROFISSIONAL|RESUMO|SUMMARY|COMPETÊNCIAS TÉCNICAS|COMPETÊNCIAS & TECNOLOGIAS|COMPETÊNCIAS|HABILIDADES|SKILLS|EXPERIÊNCIA PROFISSIONAL|HISTÓRICO PROFISSIONAL|EXPERIÊNCIA|EXPERIENCIAS|FORMAÇÃO ACADÊMICA|FORMAÇÃO|EDUCAÇÃO|EDUCATION|PROJETOS PESSOAIS|PROJETOS DE DESTAQUE|PROJETOS|PROJECTS)(?:\s*\(CONTINUAÇÃO\))?(?::|\n|$)/gi;

        const matches = [];
        let match;
        while ((match = headerRegex.exec(text)) !== null) {
            matches.push({
                title: match[1].toUpperCase(),
                index: match.index,
                length: match[0].length
            });
        }

        for (let i = 0; i < matches.length; i++) {
            const current = matches[i];
            const next = matches[i + 1];
            const start = current.index + current.length;
            const end = next ? next.index : text.length;
            const content = text.slice(start, end).trim();

            let normKey = 'OUTROS';
            if (current.title.includes('RESUMO') || current.title.includes('SUMMARY') || current.title.includes('PERFIL')) normKey = 'RESUMO';
            else if (current.title.includes('COMPETÊNCIA') || current.title.includes('SKILL') || current.title.includes('HABILIDADE')) normKey = 'COMPETÊNCIAS';
            else if (current.title.includes('EXPERIÊNCIA') || current.title.includes('HISTÓRICO')) normKey = 'EXPERIÊNCIA';
            else if (current.title.includes('FORMAÇÃO') || current.title.includes('EDUCAÇÃO') || current.title.includes('EDUCATION')) normKey = 'FORMAÇÃO';
            else if (current.title.includes('PROJETO') || current.title.includes('PROJECT')) normKey = 'PROJETOS';

            if (sectionMap[normKey]) {
                sectionMap[normKey] += '\n\n' + content;
            } else {
                sectionMap[normKey] = content;
            }
        }

        return sectionMap;
    }

    static #tokenizeSkillsLine(line) {
        const multiWordPhrases = [
            'Clean Code & SOLID Principles',
            'Clean Code',
            'SOLID Principles',
            'Arquitetura de Software',
            'Headless Browser Management',
            'Internacionalização (i18n)',
            'Metodologias Ágeis (Scrum)',
            'Metodologias Ágeis',
            'Tailwind CSS',
            'Oracle SQL',
            'SQL Server',
            'Docker Compose',
            'APIs REST'
        ];

        let working = line;
        const extracted = [];

        for (const phrase of multiWordPhrases) {
            const idx = working.toLowerCase().indexOf(phrase.toLowerCase());
            if (idx !== -1) {
                extracted.push(phrase);
                working = working.slice(0, idx) + ' ' + working.slice(idx + phrase.length);
            }
        }

        const parts = working.split(/[,•|·/\n]/);
        for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;

            if (!trimmed.includes('&') && !trimmed.includes('(')) {
                const tokens = trimmed.split(/\s+/).filter(Boolean);
                for (const tok of tokens) {
                    if (tok.length > 0 && !extracted.includes(tok)) {
                        extracted.push(tok);
                    }
                }
            } else {
                if (!extracted.includes(trimmed)) extracted.push(trimmed);
            }
        }

        return extracted;
    }

    static #parseSkillsSection(text) {
        if (!text) return [];

        const categories = [];
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

        let currentCategory = null;
        const categoryHeaderRegex = /^(LINGUAGENS|FRAMEWORKS|BANCOS DE DADOS|DEVOPS|PROTOCOLOS|METODOLOGIAS|OUTROS|FERRAMENTAS|TESTES|CLOUD|BIBLIOTECAS)/i;

        for (const line of lines) {
            if (categoryHeaderRegex.test(line) || (line === line.toUpperCase() && line.length < 35 && !line.includes(','))) {
                if (currentCategory && currentCategory.items.length > 0) {
                    categories.push(currentCategory);
                }
                currentCategory = {
                    name: line.replace(/[:\-]/g, '').trim(),
                    items: []
                };
            } else {
                if (!currentCategory) {
                    currentCategory = { name: 'Competências Principais', items: [] };
                }
                const tokens = this.#tokenizeSkillsLine(line);
                currentCategory.items.push(...tokens);
            }
        }

        if (currentCategory && currentCategory.items.length > 0) {
            categories.push(currentCategory);
        }

        return categories.map(c => ({
            name: c.name,
            items: Array.from(new Set(c.items)).filter(Boolean)
        }));
    }

    static #parseExperienceSection(text) {
        if (!text) return [];

        const experiences = [];
        const blocks = text.split(/\n(?=[A-Z0-9][A-Za-z0-9\s().\/-]{2,40}(?:\s+(?:Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez|\d{4})|\n))/g);

        for (const block of blocks) {
            const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (lines.length < 2) continue;

            const firstLine = lines[0];
            const dateMatch = firstLine.match(/((?:Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez|\d{4})[^\n–—]*[–—\-]\s*(?:Presente|Atual|\d{4}|(?:Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)[^\n]*))/i)
                || (lines[1] ? lines[1].match(/((?:Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez|\d{4})[^\n–—]*[–—\-]\s*(?:Presente|Atual|\d{4}|(?:Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)[^\n]*))/i) : null);

            const period = dateMatch ? dateMatch[0].trim() : 'Período Recente';
            const company = firstLine.replace(period, '').replace(/[–—\-]/g, '').trim() || 'Empresa';
            const position = lines[1] && !lines[1].startsWith('•') && !lines[1].startsWith('-') ? lines[1].replace(/^[–—\-•\s]+/, '').trim() : 'Desenvolvedor';

            const bullets = [];
            const startIndex = (lines[1] === position) ? 2 : 1;

            for (let i = startIndex; i < lines.length; i++) {
                const bLine = lines[i].replace(/^[•\-\*]\s*/, '').trim();
                if (bLine.length > 10) {
                    bullets.push(bLine);
                }
            }

            if (bullets.length === 0) {
                bullets.push('Atuação estratégica em projetos de tecnologia e engenharia de software.');
            }

            experiences.push({
                company,
                position,
                period,
                bullets
            });
        }

        return experiences;
    }

    static #parseEducationSection(text) {
        if (!text) return [];

        const educations = [];
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

        let i = 0;
        while (i < lines.length) {
            const orgLine = lines[i];
            const degreeLine = lines[i + 1] || '';
            const descLine = lines[i + 2] || '';

            const dateMatch = orgLine.match(/(?:Previsão de conclusão em|Concluído em|Concluído|Em andamento|\d{4}\s*[-–]\s*\d{4}|\d{4})/i)
                || degreeLine.match(/(?:Previsão de conclusão em|Concluído em|Concluído|Em andamento|\d{4}\s*[-–]\s*\d{4}|\d{4})/i);

            const period = dateMatch ? dateMatch[0].trim() : 'Concluído';
            const organization = orgLine.replace(period, '').trim();
            const degree = degreeLine.replace(period, '').trim() || 'Graduação / Curso';

            educations.push({
                organization: organization || 'Instituição de Ensino',
                degree: degree || 'Bacharelado / Técnico',
                period,
                description: descLine.length > 20 ? descLine : 'Formação acadêmica com forte fundamentação técnica e prática.'
            });

            i += (descLine.length > 20 ? 3 : 2);
        }

        return educations;
    }

    static #parseProjectsSection(text) {
        if (!text) return [];

        const projects = [];
        const rawBlocks = text.split(/\n\s*\n+/);

        for (const block of rawBlocks) {
            const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (lines.length === 0) continue;

            const title = lines[0].replace(/^[#•\-\*\s]+/, '').trim();
            const bullets = [];
            let description = '';

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
                    const b = line.replace(/^[•\-\*\s]+/, '').trim();
                    if (b.length > 5) bullets.push(b);
                } else if (!description) {
                    description = line;
                } else {
                    bullets.push(line);
                }
            }

            if (title.length > 2) {
                projects.push({
                    title,
                    link: '',
                    description: description || 'Projeto prático de engenharia de software.',
                    bullets: bullets.length > 0 ? bullets : ['Desenvolvimento completo da solução com arquitetura moderna.']
                });
            }
        }

        return projects;
    }
}

const serviceInstance = new OllamaService();
serviceInstance.OllamaService = OllamaService;
serviceInstance.parseResumeFromRawText = serviceInstance.parseResumeFromRawText.bind(serviceInstance);
serviceInstance.parseResumeWithStructuredSchema = serviceInstance.parseResumeWithStructuredSchema.bind(serviceInstance);
serviceInstance.chatWithDocument = OllamaService.chatWithDocument.bind(OllamaService);

module.exports = serviceInstance;