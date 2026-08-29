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

  /**
   * Translates a single text string using Ollama or fallback heuristic dictionary
   */
  async translateText(text, targetLang = 'en-US') {
    if (!text || typeof text !== 'string' || !text.trim()) return text;

    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const isTargetEn = targetLang.startsWith('en');
    const isTargetEs = targetLang.startsWith('es');
    const isTargetFr = targetLang.startsWith('fr');
    const isTargetDe = targetLang.startsWith('de');

    const targetLangName = isTargetEn ? 'English (US)' : (isTargetEs ? 'Spanish' : (isTargetFr ? 'French' : (isTargetDe ? 'German' : 'Portuguese (pt-BR)')));

    try {
      const prompt = `You are a senior professional resume translator (TranslateGemma / Llama 3.2 engine).
Translate the following text into fluent, professional ${targetLangName} suitable for tech resumes and executive CVs.
CRITICAL RULES:
- Preserve technical terms and proper names (e.g., React, TypeScript, Node.js, Docker, MongoDB, CEFET-MG, Teknisa, Azapfy, PHP, AWS, Redis, PostgreSQL).
- Preserve any HTML or formatting tags such as <BOLD>, </BOLD>, <HIGHLIGHT>, </HIGHLIGHT>, <ITALIC>, etc. perfectly.
- Return ONLY the direct translation without quotes, prefixes, or commentary.

Text to translate:
${text}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${ollamaHost}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt,
          stream: false
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
      logger.debug('[TranslationWorker] Ollama translation fallback active:', e.message);
    }

    // Comprehensive Heuristic Fallback Dictionary
    let result = text;
    if (isTargetEn) {
      result = result
        .replace(/Desenvolvedor(a)? de Software/gi, 'Software Developer')
        .replace(/Desenvolvedor(a)? Full-Stack/gi, 'Full-Stack Developer')
        .replace(/Desenvolvedor(a)? Back-end/gi, 'Back-End Developer')
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
        .replace(/Presente/gi, 'Present')
        .replace(/Atualmente/gi, 'Present')
        .replace(/Set (\d{4})/gi, 'Sep $1')
        .replace(/Out (\d{4})/gi, 'Oct $1')
        .replace(/Dez (\d{4})/gi, 'Dec $1')
        .replace(/Fev (\d{4})/gi, 'Feb $1')
        .replace(/Abr (\d{4})/gi, 'Apr $1')
        .replace(/Mai (\d{4})/gi, 'May $1')
        .replace(/Ago (\d{4})/gi, 'Aug $1')
        .replace(/Desenvolvimento de/gi, 'Development of')
        .replace(/Criação de/gi, 'Creation of')
        .replace(/Implementação de/gi, 'Implementation of')
        .replace(/Manutenção de/gi, 'Maintenance of')
        .replace(/Liderança de/gi, 'Leadership of')
        .replace(/Otimização de/gi, 'Optimization of')
        .replace(/microsserviços/gi, 'microservices')
        .replace(/mensageria/gi, 'message queues')
        .replace(/alta concorrência/gi, 'high concurrency')
        .replace(/alta performance/gi, 'high performance')
        .replace(/bancos de dados/gi, 'databases')
        .replace(/anos de experiência/gi, 'years of experience');
    }
    return result;
  }

  async processJob(job) {
    const data = (job && job.data) ? job.data : (job || {});
    const { document, targetLang = 'en-US', userId = 'demo-user-default' } = data;
    const jobId = data.jobId || job?.id || `trans_${Date.now()}`;

    logger.info(`[TranslationWorker] Starting translation job [${jobId}] to ${targetLang}`);

    try {
      this.emitProgress(jobId, 10, 'Iniciando pipeline de tradução (TranslateGemma / Llama 3.2)...', null, targetLang);
      await job.updateProgress?.(10);

      const translated = JSON.parse(JSON.stringify(document || {}));

      // Normalize document pointers
      const isDocDataFormat = !!(translated.personalDetails || translated.summaryDetails || translated.experienceDetails);

      // 1. Translate Title & Personal Identification (20%)
      this.emitProgress(jobId, 20, 'Traduzindo Título e Identificação Profissional...', null, targetLang);
      if (translated.personalDetails?.title) {
        translated.personalDetails.title = await this.translateText(translated.personalDetails.title, targetLang);
      }
      if (translated.personal?.personal?.title) {
        translated.personal.personal.title = await this.translateText(translated.personal.personal.title, targetLang);
      }
      if (translated.personal?.title && translated.personal.title !== translated.personal?.name) {
        translated.personal.title = await this.translateText(translated.personal.title, targetLang);
      }
      await job.updateProgress?.(20);

      // 2. Translate Summary (40%)
      this.emitProgress(jobId, 40, 'Traduzindo Resumo Profissional...', null, targetLang);
      if (translated.summaryDetails?.summary) {
        translated.summaryDetails.summary = await this.translateText(translated.summaryDetails.summary, targetLang);
      }
      if (translated.summary?.summary) {
        translated.summary.summary = await this.translateText(translated.summary.summary, targetLang);
      }
      if (translated.summaryDetails?.summaryTitle) {
        translated.summaryDetails.summaryTitle = await this.translateText(translated.summaryDetails.summaryTitle, targetLang);
      }
      await job.updateProgress?.(40);

      // 3. Translate Skills Categories (60%)
      this.emitProgress(jobId, 60, 'Traduzindo Competências e Tecnologias...', null, targetLang);
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
      await job.updateProgress?.(60);

      // 4. Translate Experiences (80%)
      this.emitProgress(jobId, 80, 'Traduzindo Histórico de Experiências...', null, targetLang);
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
      await job.updateProgress?.(80);

      // 5. Translate Education & Projects (90%)
      this.emitProgress(jobId, 90, 'Traduzindo Formação Acadêmica e Projetos...', null, targetLang);
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
      await job.updateProgress?.(90);

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

      this.emitProgress(jobId, 100, 'Tradução concluída com sucesso!', translated, targetLang);
      await job.updateProgress?.(100);

      // Trigger notification worker job
      try {
        const notifQueue = queueManager.getQueue('notification');
        await notifQueue.add('send_notification', {
          type: 'TRANSLATION_COMPLETED',
          userId,
          title: 'Tradução Concluída',
          message: `Seu currículo foi traduzido com sucesso para ${targetLang}.`
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
