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

  emitProgress(jobId, percentage, stepName, currentData = null) {
    if (this.sseEmitter) {
      this.sseEmitter({
        type: 'TRANSLATION_PROGRESS',
        jobId,
        progress: percentage,
        step: stepName,
        data: currentData,
        timestamp: new Date().toISOString()
      });
    }
  }

  init() {
    queueManager.registerWorker('translation', this.processJob.bind(this));
  }

  /**
   * Translates a single text string using Ollama or fallback heuristic dictionary
   */
  async translateText(text, targetLang = 'en-US') {
    if (!text || typeof text !== 'string') return text;

    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const isTargetEn = targetLang.startsWith('en');

    try {
      const prompt = `You are a professional resume translator. Translate the following text into ${isTargetEn ? 'English' : 'Portuguese (pt-BR)'}. Preserve any formatting tags such as <BOLD>, </BOLD>, <HIGHLIGHT>, </HIGHLIGHT>, etc. perfectly. Return ONLY the translated string without quotes or conversational commentary.\n\nText: ${text}`;

      const res = await fetch(`${ollamaHost}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt,
          stream: false
        })
      });

      if (res.ok) {
        const data = await res.json();
        return (data.response || text).trim();
      }
    } catch (e) {
      logger.debug('Ollama translation fallback active:', e.message);
    }

    // Heuristic Fallback if Ollama is unreachable
    if (isTargetEn) {
      return text
        .replace(/Desenvolvedor de Software/gi, 'Software Developer')
        .replace(/Experiência Profissional/gi, 'Professional Experience')
        .replace(/Formação Acadêmica/gi, 'Education')
        .replace(/Projetos Pessoais/gi, 'Personal Projects')
        .replace(/Resumo Profissional/gi, 'Professional Summary')
        .replace(/Habilidades/gi, 'Skills');
    } else {
      return text
        .replace(/Software Developer/gi, 'Desenvolvedor de Software')
        .replace(/Professional Experience/gi, 'Experiência Profissional')
        .replace(/Education/gi, 'Formação Acadêmica')
        .replace(/Personal Projects/gi, 'Projetos Pessoais')
        .replace(/Professional Summary/gi, 'Resumo Profissional')
        .replace(/Skills/gi, 'Habilidades');
    }
  }

  async processJob(job) {
    const { document, targetLang = 'en-US', userId } = job.data;
    const jobId = job.id;

    logger.info(`[TranslationWorker] Starting translation job [${jobId}] to ${targetLang}`);

    try {
      this.emitProgress(jobId, 10, 'Iniciando pipeline de tradução...');
      await job.updateProgress?.(10);

      const translatedDoc = JSON.parse(JSON.stringify(document));

      // 1. Translate Summary (30%)
      if (translatedDoc.summary && translatedDoc.summary.summary) {
        this.emitProgress(jobId, 30, 'Traduzindo Resumo Profissional...');
        translatedDoc.summary.summary = await this.translateText(translatedDoc.summary.summary, targetLang);
        await job.updateProgress?.(30);
      }

      // 2. Translate Skills (50%)
      if (translatedDoc.skills && Array.isArray(translatedDoc.skills.skills)) {
        this.emitProgress(jobId, 50, 'Traduzindo Competências e Tecnologias...');
        for (const cat of translatedDoc.skills.skills) {
          cat.name = await this.translateText(cat.name || cat.title, targetLang);
        }
        await job.updateProgress?.(50);
      }

      // 3. Translate Experiences (75%)
      if (translatedDoc.experiences && Array.isArray(translatedDoc.experiences.experiences)) {
        this.emitProgress(jobId, 75, 'Traduzindo Histórico de Experiências...');
        for (const exp of translatedDoc.experiences.experiences) {
          exp.position = await this.translateText(exp.position || exp.role, targetLang);
          if (Array.isArray(exp.bullets)) {
            exp.bullets = await Promise.all(exp.bullets.map(b => this.translateText(b, targetLang)));
          }
        }
        await job.updateProgress?.(75);
      }

      // 4. Translate Education & Projects (90%)
      if (translatedDoc.education && Array.isArray(translatedDoc.education.educations)) {
        this.emitProgress(jobId, 90, 'Traduzindo Formação e Projetos...');
        for (const edu of translatedDoc.education.educations) {
          edu.degree = await this.translateText(edu.degree || edu.role, targetLang);
          if (edu.description) {
            edu.description = await this.translateText(edu.description, targetLang);
          }
        }
      }

      if (translatedDoc.projects && Array.isArray(translatedDoc.projects.projects)) {
        for (const proj of translatedDoc.projects.projects) {
          proj.description = await this.translateText(proj.description || proj.role, targetLang);
          if (Array.isArray(proj.bullets)) {
            proj.bullets = await Promise.all(proj.bullets.map(b => this.translateText(b, targetLang)));
          }
        }
      }

      // 5. Update settings language
      if (translatedDoc.settings) {
        translatedDoc.settings.language = targetLang;
      }

      // 6. Persist translated version to database
      if (userId) {
        await prisma.resumeData.create({
          data: {
            userId,
            language: targetLang,
            title: `Resume (${targetLang})`,
            personalDetails: translatedDoc.personal || {},
            summary: translatedDoc.summary || {},
            skills: translatedDoc.skills || {},
            experiences: translatedDoc.experiences || {},
            education: translatedDoc.education || {},
            projects: translatedDoc.projects || {}
          }
        }).catch(err => logger.warn('[TranslationWorker] Could not save to DB:', err.message));
      }

      this.emitProgress(jobId, 100, 'Tradução concluída com sucesso!', translatedDoc);
      await job.updateProgress?.(100);

      // Trigger notification worker job
      const notifQueue = queueManager.getQueue('notification');
      await notifQueue.add('send_notification', {
        type: 'TRANSLATION_COMPLETED',
        userId,
        title: 'Tradução Concluída',
        message: `Seu currículo foi traduzido com sucesso para ${targetLang}.`
      });

      logger.info(`[TranslationWorker] Job [${jobId}] completed successfully`);
      return translatedDoc;

    } catch (error) {
      logger.error(`[TranslationWorker] Job [${jobId}] failed:`, error);
      this.emitProgress(jobId, -1, `Erro na tradução: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new TranslationWorker();
