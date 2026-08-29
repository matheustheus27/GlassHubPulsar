/**
 * Translation Worker (TranslateGemma / Llama 3.2 / Heuristic Fallback)
 * Processes translation jobs asynchronously and streams progress via SSE.
 */
const logger = require('../utils/logger');
const queueManager = require('../queues/queueManager');
const prisma = require('../prisma/client');
const TagProcessor = require('../layout/TagProcessor');

class TranslationWorker {
  constructor() {
    this.sseEmitter = null;
    this.init();
  }

  setSSEEmitter(emitter) {
    this.sseEmitter = emitter;
  }

  emitProgress(jobId, percentage, stepName, currentData = null, targetLang = 'en-US') {
    if (this.sseEmitter) {
      this.sseEmitter({
        type: 'TRANSLATION_PROGRESS',
        jobId,
        progress: percentage,
        step: stepName,
        data: currentData,
        targetLang,
        timestamp: new Date().toISOString()
      });
    }
  }

  init() {
    queueManager.registerWorker('translation', this.processJob.bind(this));

    // RabbitMQ via MessageBroker (primary, with InMemory fallback)
    const messageBroker = require('../messaging/MessageBroker');
    messageBroker.consume('translation', this.processJob.bind(this)).catch(err =>
      logger.warn('[TranslationWorker] MessageBroker consume note:', err.message)
    );
  }

  getOllamaHosts() {
    const custom = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_HOST;
    const candidates = [
      custom,
      'http://localhost:11434',
      'http://127.0.0.1:11434',
      'http://ollama:11434'
    ].filter(Boolean);
    return Array.from(new Set(candidates));
  }

  /**
   * Fast, holistic JSON-to-JSON translation using Llama 3.2 / TranslateGemma without RAG overhead
   */
  async translateDocumentWithLlama(document, targetLang = 'en-US') {
    const isTargetEn = targetLang.startsWith('en');
    const isTargetEs = targetLang.startsWith('es');
    const isTargetFr = targetLang.startsWith('fr');
    const isTargetDe = targetLang.startsWith('de');
    const targetLangName = isTargetEn ? 'English (US)' : (isTargetEs ? 'Spanish' : (isTargetFr ? 'French' : (isTargetDe ? 'German' : 'Portuguese')));

    const prompt = `You are an executive resume translation engine (TranslateGemma / Llama 3.2).
Translate the following JSON resume document into fluent, natural, highly professional ${targetLangName} suitable for senior tech and executive resumes.

CRITICAL RULES:
1. Maintain the EXACT JSON structure and key names (e.g. "personalDetails", "summaryDetails", "skillsDetails", "experienceDetails", "educationDetails", "projectDetails").
2. Translate ALL human-readable Portuguese text into ${targetLangName} (titles, summaries, category names, experience positions/roles, period dates like "Set 2023 - Presente" -> "Sep 2023 - Present", bullet points, degrees, project descriptions).
3. Do NOT translate technical terms, libraries, or proper names (e.g. React, TypeScript, PHP, Python, Node.js, Docker, MongoDB, PostgreSQL, Redis, AWS, CEFET-MG, Teknisa, Azapfy, RabbitMQ, BullMQ, Puppeteer).
4. Preserve all formatting tags like <BOLD>, </BOLD>, <HIGHLIGHT>, </HIGHLIGHT>, <ITALIC>, </ITALIC> intact.
5. Return ONLY a valid, parseable JSON object matching the input structure without introductory/conversational text or markdown codeblocks.

JSON TO TRANSLATE:
${JSON.stringify(document, null, 2)}`;

    for (const host of this.getOllamaHosts()) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 40000);

        logger.info(`[TranslationWorker] Attempting holistic JSON translation via Ollama host: ${host}`);

        const res = await fetch(`${host}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: process.env.OLLAMA_MODEL || 'llama3.2',
            prompt,
            format: 'json',
            stream: false,
            options: {
              temperature: 0.1,
              num_ctx: 8192,
              num_predict: 4096
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const cleanResp = (data.response || '').trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
          const parsed = JSON.parse(cleanResp);
          if (parsed && typeof parsed === 'object' && (parsed.personalDetails || parsed.personal || parsed.summaryDetails || parsed.experienceDetails)) {
            logger.info(`[TranslationWorker] Holistic JSON translation succeeded with host ${host}`);
            return parsed;
          }
        }
      } catch (e) {
        logger.debug(`[TranslationWorker] Ollama host ${host} note: ${e.message}`);
      }
    }
    return null;
  }

  /**
   * Translates a single text string/paragraph using Ollama or fallback heuristic dictionary
   */
  async translateText(text, targetLang = 'en-US') {
    if (!text || typeof text !== 'string' || !text.trim()) return text;

    const isTargetEn = targetLang.startsWith('en');
    const isTargetEs = targetLang.startsWith('es');
    const isTargetFr = targetLang.startsWith('fr');
    const isTargetDe = targetLang.startsWith('de');

    const targetLangName = isTargetEn ? 'English (US)' : (isTargetEs ? 'Spanish' : (isTargetFr ? 'French' : (isTargetDe ? 'German' : 'Portuguese (pt-BR)')));

    for (const host of this.getOllamaHosts()) {
      try {
        const prompt = `You are a senior professional resume translator (TranslateGemma / Llama 3.2 engine).
Translate the following text into fluent, professional ${targetLangName} suitable for tech resumes and executive CVs.
CRITICAL RULES:
- Translate all Portuguese narrative, achievements, roles, and descriptions into natural, high-impact ${targetLangName}.
- Preserve technical terms and proper names (e.g., React, TypeScript, Node.js, Docker, MongoDB, CEFET-MG, Teknisa, Azapfy, PHP, AWS, Redis, PostgreSQL).
- Preserve any HTML or formatting tags such as <BOLD>, </BOLD>, <HIGHLIGHT>, </HIGHLIGHT>, <ITALIC>, etc. perfectly.
- Return ONLY the direct translation without quotes, markdown, prefixes, or commentary.

Text to translate:
${text}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(`${host}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: process.env.OLLAMA_MODEL || 'llama3.2',
            prompt,
            stream: false,
            options: {
              temperature: 0.1,
              num_ctx: 4096,
              num_predict: 2048
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const translated = (data.response || '').trim();
          if (translated && !translated.startsWith('{') && !translated.toLowerCase().includes('here is the translation')) {
            return translated;
          }
        }
      } catch (e) {
        logger.debug(`[TranslationWorker] Ollama single-text fallback note: ${e.message}`);
      }
    }

    // Comprehensive Heuristic Fallback Dictionary
    let result = text;
    if (isTargetEn) {
      result = result
        .replace(/Desenvolvedor(a)? de Software Sênior/gi, 'Senior Software Developer')
        .replace(/Desenvolvedor(a)? de Software Pleno/gi, 'Mid-Level Software Developer')
        .replace(/Desenvolvedor(a)? de Software Júnior/gi, 'Junior Software Developer')
        .replace(/Desenvolvedor(a)? de Software/gi, 'Software Developer')
        .replace(/Desenvolvedor(a)? Full-Stack Sênior/gi, 'Senior Full-Stack Developer')
        .replace(/Desenvolvedor(a)? Full-Stack/gi, 'Full-Stack Developer')
        .replace(/Desenvolvedor(a)? Back-end Sênior/gi, 'Senior Back-End Developer')
        .replace(/Desenvolvedor(a)? Back-end/gi, 'Back-End Developer')
        .replace(/Desenvolvedor(a)? Front-end Sênior/gi, 'Senior Front-End Developer')
        .replace(/Desenvolvedor(a)? Front-end/gi, 'Front-End Developer')
        .replace(/Engenheiro(a)? de Software/gi, 'Software Engineer')
        .replace(/Engenheiro(a)? de Computação/gi, 'Computer Engineer')
        .replace(/Arquiteto(a)? de Software/gi, 'Software Architect')
        .replace(/Gerente de Projetos/gi, 'Project Manager')
        .replace(/Designer de Produto/gi, 'Product Designer')
        .replace(/Experiência Profissional/gi, 'Professional Experience')
        .replace(/Histórico Profissional/gi, 'Work Experience')
        .replace(/Competências & Tecnologias/gi, 'Skills & Technologies')
        .replace(/Competências e Tecnologias/gi, 'Skills & Technologies')
        .replace(/Formação Acadêmica/gi, 'Education')
        .replace(/Projetos de Destaque/gi, 'Featured Projects')
        .replace(/Projetos Pessoais/gi, 'Personal Projects')
        .replace(/Resumo Profissional/gi, 'Professional Summary')
        .replace(/Linguagens/gi, 'Languages')
        .replace(/Frameworks e Bibliotecas/gi, 'Frameworks & Libraries')
        .replace(/Bancos de Dados/gi, 'Databases')
        .replace(/Protocolos e Comunicação/gi, 'Protocols & Communication')
        .replace(/Metodologias Ágeis/gi, 'Agile Methodologies')
        .replace(/Engenharia de Computação/gi, 'Computer Engineering')
        .replace(/Ciência da Computação/gi, 'Computer Science')
        .replace(/Sistemas de Informação/gi, 'Information Systems')
        .replace(/Bacharelado em/gi, 'Bachelor of Science in')
        .replace(/Tecnólogo em/gi, 'Associate Degree in')
        .replace(/Pós-Graduação em/gi, 'Postgraduate Degree in')
        .replace(/Mestrado em/gi, 'Master of Science in')
        .replace(/Doutorado em/gi, 'Ph.D. in')
        .replace(/Concluído em/gi, 'Completed in')
        .replace(/Previsão de conclusão em/gi, 'Expected completion in')
        .replace(/Incompleto/gi, 'Incomplete')
        .replace(/Presente/gi, 'Present')
        .replace(/Atualmente/gi, 'Present')
        .replace(/Jan (\d{4})/gi, 'Jan $1')
        .replace(/Fev (\d{4})/gi, 'Feb $1')
        .replace(/Mar (\d{4})/gi, 'Mar $1')
        .replace(/Abr (\d{4})/gi, 'Apr $1')
        .replace(/Mai (\d{4})/gi, 'May $1')
        .replace(/Jun (\d{4})/gi, 'Jun $1')
        .replace(/Jul (\d{4})/gi, 'Jul $1')
        .replace(/Ago (\d{4})/gi, 'Aug $1')
        .replace(/Set (\d{4})/gi, 'Sep $1')
        .replace(/Out (\d{4})/gi, 'Oct $1')
        .replace(/Nov (\d{4})/gi, 'Nov $1')
        .replace(/Dez (\d{4})/gi, 'Dec $1')
        .replace(/Desenvolvimento de/gi, 'Development of')
        .replace(/Criação de/gi, 'Creation of')
        .replace(/Implementação de/gi, 'Implementation of')
        .replace(/Manutenção de/gi, 'Maintenance of')
        .replace(/Liderança de/gi, 'Leadership of')
        .replace(/Otimização de/gi, 'Optimization of')
        .replace(/Construção de/gi, 'Building of')
        .replace(/Integração de/gi, 'Integration of')
        .replace(/Arquitetura de/gi, 'Architecture of')
        .replace(/com foco em/gi, 'with focus on')
        .replace(/microsserviços/gi, 'microservices')
        .replace(/mensageria/gi, 'message queues')
        .replace(/alta concorrência/gi, 'high concurrency')
        .replace(/alta performance/gi, 'high performance')
        .replace(/bancos de dados/gi, 'databases')
        .replace(/anos de experiência/gi, 'years of experience')
        .replace(/atuação em/gi, 'working in')
        .replace(/sistemas distribuídos/gi, 'distributed systems');
    }
    return result;
  }

  async processJob(job) {
    const data = (job && job.data) ? job.data : (job || {});
    const { document, targetLang = 'en-US', userId = 'demo-user-default' } = data;
    const jobId = data.jobId || job?.id || `trans_${Date.now()}`;
    const isEn = targetLang.startsWith('en');

    logger.info(`[TranslationWorker] Starting translation job [${jobId}] to ${targetLang}`);

    try {
      this.emitProgress(jobId, 10, isEn ? 'Initializing AI translation pipeline (TranslateGemma / Llama 3.2)...' : 'Iniciando pipeline de tradução com IA...', null, targetLang);
      await job.updateProgress?.(10);

      // Attempt fast direct JSON-to-JSON translation with Llama 3.2
      const fullTranslated = await this.translateDocumentWithLlama(document, targetLang);
      let translated = fullTranslated || JSON.parse(JSON.stringify(document || {}));

      if (!fullTranslated) {
        // Fallback: translate section by section with Ollama
        // 1. Translate Title & Personal Identification (25%)
        this.emitProgress(jobId, 25, isEn ? 'Translating professional title and identification...' : 'Traduzindo título e identificação profissional...', null, targetLang);
        if (translated.personalDetails?.title) {
          translated.personalDetails.title = await this.translateText(translated.personalDetails.title, targetLang);
        }
        if (translated.personal?.personal?.title) {
          translated.personal.personal.title = await this.translateText(translated.personal.personal.title, targetLang);
        }
        if (translated.personal?.title && translated.personal.title !== translated.personal?.name) {
          translated.personal.title = await this.translateText(translated.personal.title, targetLang);
        }
        await job.updateProgress?.(25);

        // 2. Translate Summary (45%)
        this.emitProgress(jobId, 45, isEn ? 'Translating executive summary...' : 'Traduzindo resumo profissional...', null, targetLang);
        if (translated.summaryDetails?.summary) {
          translated.summaryDetails.summary = await this.translateText(translated.summaryDetails.summary, targetLang);
        }
        if (translated.summary?.summary) {
          translated.summary.summary = await this.translateText(translated.summary.summary, targetLang);
        }
        if (translated.summaryDetails?.summaryTitle) {
          translated.summaryDetails.summaryTitle = await this.translateText(translated.summaryDetails.summaryTitle, targetLang);
        }
        await job.updateProgress?.(45);

        // 3. Translate Skills Categories (65%)
        this.emitProgress(jobId, 65, isEn ? 'Translating technical skills & categories...' : 'Traduzindo competências e tecnologias...', null, targetLang);
        const skillsArr = translated.skillsDetails?.skills || translated.skills?.skills || (Array.isArray(translated.skills) ? translated.skills : []);
        for (const cat of skillsArr) {
          if (cat.category) {
            cat.category = await this.translateText(cat.category, targetLang);
          }
          if (cat.name) {
            cat.name = await this.translateText(cat.name, targetLang);
          }
          if (cat.title) {
            cat.title = await this.translateText(cat.title, targetLang);
          }
        }
        if (translated.skillsDetails?.skillsTitle) {
          translated.skillsDetails.skillsTitle = await this.translateText(translated.skillsDetails.skillsTitle, targetLang);
        }
        await job.updateProgress?.(65);

        // 4. Translate Experiences (85%)
        this.emitProgress(jobId, 85, isEn ? 'Translating work experience & achievements...' : 'Traduzindo histórico de experiências...', null, targetLang);
        const expArr = translated.experienceDetails?.experiences || translated.experiences?.experiences || (Array.isArray(translated.experiences) ? translated.experiences : []);
        for (const exp of expArr) {
          if (exp.position) {
            exp.position = await this.translateText(exp.position, targetLang);
          }
          if (exp.role) {
            exp.role = await this.translateText(exp.role, targetLang);
          }
          if (exp.period) {
            exp.period = await this.translateText(exp.period, targetLang);
          }
          if (Array.isArray(exp.bullets)) {
            exp.bullets = await Promise.all(exp.bullets.map(b => this.translateText(b, targetLang)));
          }
        }
        if (translated.experienceDetails?.experienceTitle) {
          translated.experienceDetails.experienceTitle = await this.translateText(translated.experienceDetails.experienceTitle, targetLang);
        }
        await job.updateProgress?.(85);

        // 5. Translate Education & Projects (95%)
        this.emitProgress(jobId, 95, isEn ? 'Translating education and featured projects...' : 'Traduzindo formação acadêmica e projetos...', null, targetLang);
        const eduArr = translated.educationDetails?.educations || translated.education?.education || translated.education?.educations || (Array.isArray(translated.education) ? translated.education : []);
        for (const edu of eduArr) {
          if (edu.degree) {
            edu.degree = await this.translateText(edu.degree, targetLang);
          }
          if (edu.role) {
            edu.role = await this.translateText(edu.role, targetLang);
          }
          if (edu.period) {
            edu.period = await this.translateText(edu.period, targetLang);
          }
          if (edu.description) {
            edu.description = await this.translateText(edu.description, targetLang);
          }
        }

        const projArr = translated.projectDetails?.projects || translated.projects?.projects || (Array.isArray(translated.projects) ? translated.projects : []);
        for (const proj of projArr) {
          if (proj.role) {
            proj.role = await this.translateText(proj.role, targetLang);
          }
          if (proj.description) {
            proj.description = await this.translateText(proj.description, targetLang);
          }
          if (Array.isArray(proj.bullets)) {
            proj.bullets = await Promise.all(proj.bullets.map(b => this.translateText(b, targetLang)));
          }
        }
        await job.updateProgress?.(95);
      }

      // Update document language settings
      if (!translated.settings) translated.settings = {};
      translated.settings.language = targetLang;
      translated.language = targetLang;

      // 6. Persist translated version to database
      if (userId && prisma.resumeData) {
        await prisma.resumeData.upsert({
          where: {
            userId_language: { userId, language: targetLang }
          },
          create: {
            userId,
            language: targetLang,
            title: `Resume (${targetLang})`,
            personalDetails: translated.personalDetails || translated.personal || {},
            summary: translated.summaryDetails || translated.summary || {},
            skills: translated.skillsDetails || translated.skills || {},
            experiences: translated.experienceDetails || translated.experiences || {},
            education: translated.educationDetails || translated.education || {},
            projects: translated.projectDetails || translated.projects || {}
          },
          update: {
            title: `Resume (${targetLang})`,
            personalDetails: translated.personalDetails || translated.personal || {},
            summary: translated.summaryDetails || translated.summary || {},
            skills: translated.skillsDetails || translated.skills || {},
            experiences: translated.experienceDetails || translated.experiences || {},
            education: translated.educationDetails || translated.education || {},
            projects: translated.projectDetails || translated.projects || {}
          }
        }).catch(err => logger.warn('[TranslationWorker] Could not save to DB:', err.message));
      }

      this.emitProgress(jobId, 100, isEn ? 'Translation completed successfully!' : 'Tradução concluída com sucesso!', translated, targetLang);
      await job.updateProgress?.(100);

      // Trigger notification worker job
      try {
        const notifQueue = queueManager.getQueue('notification');
        await notifQueue.add('send_notification', {
          type: 'TRANSLATION_COMPLETED',
          userId,
          title: isEn ? 'Translation Completed' : 'Tradução Concluída',
          message: isEn ? `Your resume has been successfully translated to ${targetLang}.` : `Seu currículo foi traduzido com sucesso para ${targetLang}.`
        });
      } catch (notifErr) {
        logger.debug('[TranslationWorker] Notification queue note:', notifErr.message);
      }

      logger.info(`[TranslationWorker] Job [${jobId}] completed successfully`);
      return { success: true, document: translated, targetLang };

    } catch (error) {
      logger.error(`[TranslationWorker] Job [${jobId}] failed:`, error);
      this.emitProgress(jobId, -1, `Erro na tradução: ${error.message}`, null, targetLang);
      throw error;
    }
  }
}

module.exports = new TranslationWorker();
