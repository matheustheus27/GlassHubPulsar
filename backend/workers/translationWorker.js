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
    this.workingOllamaHost = null;
    this.ollamaCheckedAt = 0;
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
   * Extracts ONLY pure human narrative strings from the candidate document,
   * completely stripping IDs, dates, URLs, numbers, styles, and boolean flags.
   */
  extractTranslatableFields(document = {}) {
    const personal = document.personalDetails || document.personal || {};
    const summary = document.summaryDetails || document.summary || {};
    const rawSkills = document.skillsDetails?.skills || document.skills?.skills || (Array.isArray(document.skills) ? document.skills : []);
    const rawExp = document.experienceDetails?.experiences || document.experiences?.experiences || (Array.isArray(document.experiences) ? document.experiences : []);
    const rawEdu = document.educationDetails?.educations || document.education?.education || (Array.isArray(document.education) ? document.education : []);
    const rawProj = document.projectDetails?.projects || document.projects?.projects || (Array.isArray(document.projects) ? document.projects : []);
    const cover = document.coverLetterDetails || document.coverLetter || {};

    const payload = {};

    // 1. Personal Title
    if (personal.title) {
      payload.personal = { title: personal.title };
    }

    // 2. Summary
    if (summary.summary || summary.summaryTitle) {
      payload.summary = {
        title: summary.summaryTitle || 'Resumo Profissional',
        content: summary.summary || ''
      };
    }

    // 3. Skills Categories (Only category titles, not tech buzzwords like Docker, React, etc.)
    if (rawSkills.length > 0) {
      payload.skillsCategories = rawSkills.map(c => c.category || c.name || c.title || '');
    }

    // 4. Experiences (Roles and achievement bullets)
    if (rawExp.length > 0) {
      payload.experiences = rawExp.map((exp, idx) => ({
        index: idx,
        position: exp.position || exp.role || '',
        bullets: Array.isArray(exp.bullets) ? exp.bullets : (exp.description ? [exp.description] : [])
      }));
    }

    // 5. Education (Degrees and descriptions)
    if (rawEdu.length > 0) {
      payload.education = rawEdu.map((edu, idx) => ({
        index: idx,
        degree: edu.degree || edu.role || '',
        description: edu.description || ''
      }));
    }

    // 6. Projects (Titles, summaries, bullets)
    if (rawProj.length > 0) {
      payload.projects = rawProj.map((proj, idx) => ({
        index: idx,
        title: proj.title || proj.name || '',
        description: proj.description || '',
        bullets: Array.isArray(proj.bullets) ? proj.bullets : []
      }));
    }

    // 7. Cover Letter (Greeting, paragraphs, valediction)
    const coverParagraphs = cover.text || cover.paragraphs || cover.bullets || [];
    if (cover.greeting || coverParagraphs.length > 0 || cover.valediction) {
      payload.coverLetter = {
        greeting: cover.greeting || '',
        paragraphs: Array.isArray(coverParagraphs) ? coverParagraphs : [String(coverParagraphs)],
        valediction: cover.valediction || ''
      };
    }

    return payload;
  }

  /**
   * Reconstructs the complete document by injecting translated fields back into original structure,
   * preserving all original IDs, links, contacts, dates, styles, and settings.
   */
  mergeTranslatedFields(originalDoc = {}, translated = {}) {
    const doc = JSON.parse(JSON.stringify(originalDoc || {}));

    if (!translated || typeof translated !== 'object') return doc;

    // 1. Personal Title
    if (translated.personal?.title) {
      if (!doc.personalDetails) doc.personalDetails = {};
      doc.personalDetails.title = translated.personal.title;
      if (doc.personal?.personal) doc.personal.personal.title = translated.personal.title;
      if (doc.personal) doc.personal.title = translated.personal.title;
    }

    // 2. Summary
    if (translated.summary) {
      if (!doc.summaryDetails) doc.summaryDetails = {};
      if (translated.summary.content) doc.summaryDetails.summary = translated.summary.content;
      if (translated.summary.title) doc.summaryDetails.summaryTitle = translated.summary.title;
      if (doc.summary) {
        if (translated.summary.content) doc.summary.summary = translated.summary.content;
        if (translated.summary.title) doc.summary.summaryTitle = translated.summary.title;
      }
    }

    // 3. Skills Categories
    if (Array.isArray(translated.skillsCategories)) {
      const skillsArr = doc.skillsDetails?.skills || doc.skills?.skills || (Array.isArray(doc.skills) ? doc.skills : []);
      translated.skillsCategories.forEach((catName, i) => {
        if (skillsArr[i] && catName) {
          if (skillsArr[i].category !== undefined) skillsArr[i].category = catName;
          if (skillsArr[i].name !== undefined) skillsArr[i].name = catName;
          if (skillsArr[i].title !== undefined) skillsArr[i].title = catName;
        }
      });
    }

    // 4. Experiences
    if (Array.isArray(translated.experiences)) {
      const expArr = doc.experienceDetails?.experiences || doc.experiences?.experiences || (Array.isArray(doc.experiences) ? doc.experiences : []);
      translated.experiences.forEach((tExp) => {
        const idx = tExp.index !== undefined ? tExp.index : -1;
        const target = idx >= 0 ? expArr[idx] : null;
        if (target) {
          if (tExp.position) {
            target.position = tExp.position;
            target.role = tExp.position;
          }
          if (Array.isArray(tExp.bullets) && tExp.bullets.length > 0) {
            target.bullets = tExp.bullets;
          }
        }
      });
    }

    // 5. Education
    if (Array.isArray(translated.education)) {
      const eduArr = doc.educationDetails?.educations || doc.education?.education || (Array.isArray(doc.education) ? doc.education : []);
      translated.education.forEach((tEdu) => {
        const idx = tEdu.index !== undefined ? tEdu.index : -1;
        const target = idx >= 0 ? eduArr[idx] : null;
        if (target) {
          if (tEdu.degree) target.degree = tEdu.degree;
          if (tEdu.description) target.description = tEdu.description;
        }
      });
    }

    // 6. Projects
    if (Array.isArray(translated.projects)) {
      const projArr = doc.projectDetails?.projects || doc.projects?.projects || (Array.isArray(doc.projects) ? doc.projects : []);
      translated.projects.forEach((tProj) => {
        const idx = tProj.index !== undefined ? tProj.index : -1;
        const target = idx >= 0 ? projArr[idx] : null;
        if (target) {
          if (tProj.title) target.title = tProj.title;
          if (tProj.description) target.description = tProj.description;
          if (Array.isArray(tProj.bullets) && tProj.bullets.length > 0) {
            target.bullets = tProj.bullets;
          }
        }
      });
    }

    // 7. Cover Letter
    if (translated.coverLetter) {
      if (!doc.coverLetterDetails) doc.coverLetterDetails = {};
      if (translated.coverLetter.greeting) doc.coverLetterDetails.greeting = translated.coverLetter.greeting;
      if (Array.isArray(translated.coverLetter.paragraphs)) {
        doc.coverLetterDetails.text = translated.coverLetter.paragraphs;
        doc.coverLetterDetails.paragraphs = translated.coverLetter.paragraphs;
      }
      if (translated.coverLetter.valediction) doc.coverLetterDetails.valediction = translated.coverLetter.valediction;

      if (doc.coverLetter) {
        if (translated.coverLetter.greeting) doc.coverLetter.greeting = translated.coverLetter.greeting;
        if (Array.isArray(translated.coverLetter.paragraphs)) {
          doc.coverLetter.text = translated.coverLetter.paragraphs;
          doc.coverLetter.paragraphs = translated.coverLetter.paragraphs;
        }
        if (translated.coverLetter.valediction) doc.coverLetter.valediction = translated.coverLetter.valediction;
      }
    }

    return doc;
  }

  /**
   * Fast, holistic JSON-to-JSON translation using Llama 3.2 / TranslateGemma on filtered text payload
   */
  async translateDocumentWithLlama(document, targetLang = 'en-US') {
    const isTargetEn = targetLang.startsWith('en');
    const isTargetEs = targetLang.startsWith('es');
    const isTargetFr = targetLang.startsWith('fr');
    const isTargetDe = targetLang.startsWith('de');
    const targetLangName = isTargetEn ? 'English (US)' : (isTargetEs ? 'Spanish' : (isTargetFr ? 'French' : (isTargetDe ? 'German' : 'Portuguese')));

    const filteredPayload = this.extractTranslatableFields(document);

    const prompt = `You are an executive resume and cover letter translation engine (TranslateGemma / Llama 3.2).
Translate the following structured JSON text into fluent, natural, highly professional ${targetLangName} suitable for senior tech and executive profiles.

CRITICAL RULES:
1. Maintain the EXACT JSON structure and key names ("personal", "summary", "skillsCategories", "experiences", "education", "projects", "coverLetter").
2. Translate ALL human-readable Portuguese text into ${targetLangName} (titles, summaries, category names, roles, bullets, degrees, and cover letter paragraphs).
3. Do NOT translate technical terms, libraries, or proper names (e.g. React, TypeScript, PHP, Python, Node.js, Docker, MongoDB, PostgreSQL, Redis, AWS, CEFET-MG, Teknisa, Azapfy, RabbitMQ, BullMQ, Puppeteer).
4. Preserve all formatting tags like <BOLD>, </BOLD>, <HIGHLIGHT>, </HIGHLIGHT>, <ITALIC>, </ITALIC> intact.
5. Return ONLY a valid, parseable JSON object matching the input structure without introductory text or markdown codeblocks.

JSON TO TRANSLATE:
${JSON.stringify(filteredPayload, null, 2)}`;

    for (const host of this.getOllamaHosts()) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        logger.info(`[TranslationWorker] Attempting optimized JSON translation via Ollama host: ${host}`);

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
              num_ctx: 4096,
              num_predict: 2048
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const cleanResp = (data.response || '').trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
          const parsed = JSON.parse(cleanResp);
          if (parsed && typeof parsed === 'object') {
            logger.info(`[TranslationWorker] Optimized JSON translation succeeded with host ${host}`);
            this.workingOllamaHost = host;
            this.ollamaCheckedAt = Date.now();
            return this.mergeTranslatedFields(document, parsed);
          }
        }
      } catch (e) {
        logger.debug(`[TranslationWorker] Ollama host ${host} note: ${e.message}`);
      }
    }
    this.workingOllamaHost = null;
    this.ollamaCheckedAt = Date.now();
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

    const hasOllama = this.workingOllamaHost || (Date.now() - this.ollamaCheckedAt > 60000);
    const candidateHosts = this.workingOllamaHost ? [this.workingOllamaHost] : (hasOllama ? this.getOllamaHosts() : []);

    for (const host of candidateHosts) {
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
        .replace(/sistemas distribuídos/gi, 'distributed systems')
        .replace(/Prezada Equipe de Recrutamento,?/gi, 'Dear Hiring Team,')
        .replace(/Prezado\(a\) Recrutador\(a\),?/gi, 'Dear Hiring Manager,')
        .replace(/Prezado\(a\) Gerente de Contratação,?/gi, 'Dear Hiring Manager,')
        .replace(/Prezados membros do comitê,?/gi, 'Dear Hiring Committee,')
        .replace(/Prezados,?/gi, 'Dear Hiring Team,')
        .replace(/Atenciosamente,?/gi, 'Sincerely,')
        .replace(/Cordialmente,?/gi, 'Best regards,')
        .replace(/Apresento minha candidatura à vaga de/gi, 'I submit my application for the position of')
        .replace(/Tenho ampla experiência com/gi, 'I have extensive experience with');
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

        // 5. Translate Education & Projects (90%)
        this.emitProgress(jobId, 90, isEn ? 'Translating education and featured projects...' : 'Traduzindo formação acadêmica e projetos...', null, targetLang);
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

        // 6. Translate Cover Letter (96%)
        this.emitProgress(jobId, 96, isEn ? 'Translating cover letter...' : 'Traduzindo carta de apresentação...', null, targetLang);
        const cover = translated.coverLetterDetails || translated.coverLetter || {};
        if (cover.greeting) {
          cover.greeting = await this.translateText(cover.greeting, targetLang);
        }
        const coverParagraphs = cover.text || cover.paragraphs || [];
        if (Array.isArray(coverParagraphs) && coverParagraphs.length > 0) {
          cover.text = await Promise.all(coverParagraphs.map(p => this.translateText(p, targetLang)));
          cover.paragraphs = cover.text;
        }
        if (cover.valediction) {
          cover.valediction = await this.translateText(cover.valediction, targetLang);
        }
        if (!translated.coverLetterDetails) translated.coverLetterDetails = {};
        translated.coverLetterDetails = {
          greeting: cover.greeting || (isEn ? 'Dear Hiring Committee,' : 'Prezados membros do comitê,'),
          text: cover.text || (isEn ? [''] : ['']),
          paragraphs: cover.text || (isEn ? [''] : ['']),
          valediction: cover.valediction || (isEn ? 'Sincerely,' : 'Atenciosamente,'),
          signature: cover.signature || translated.personalDetails?.name || translated.personal?.name || ''
        };
        await job.updateProgress?.(96);
      }

      // Update document language settings
      if (!translated.settings) translated.settings = {};
      translated.settings.language = targetLang;
      translated.language = targetLang;

      // 7. Persist translated version to database
      if (userId) {
        if (prisma.resumeData) {
          await prisma.resumeData.upsert({
            where: {
              userId_language: { userId, language: targetLang }
            },
            create: {
              userId,
              language: targetLang,
              title: translated.personalDetails?.title || `Resume (${targetLang})`,
              personalDetails: translated.personalDetails || translated.personal || {},
              summary: translated.summaryDetails || translated.summary || {},
              skills: translated.skillsDetails || translated.skills || {},
              experiences: translated.experienceDetails || translated.experiences || {},
              education: translated.educationDetails || translated.education || {},
              projects: translated.projectDetails || translated.projects || {}
            },
            update: {
              title: translated.personalDetails?.title || `Resume (${targetLang})`,
              personalDetails: translated.personalDetails || translated.personal || {},
              summary: translated.summaryDetails || translated.summary || {},
              skills: translated.skillsDetails || translated.skills || {},
              experiences: translated.experienceDetails || translated.experiences || {},
              education: translated.educationDetails || translated.education || {},
              projects: translated.projectDetails || translated.projects || {}
            }
          }).catch(err => logger.warn('[TranslationWorker] Could not save resume to DB:', err.message));
        }

        // Persist Cover Letter Data
        if (prisma.coverLetterData && (translated.coverLetterDetails || translated.coverLetter)) {
          const cl = translated.coverLetterDetails || translated.coverLetter || {};
          await prisma.coverLetterData.upsert({
            where: {
              userId_language: { userId, language: targetLang }
            },
            create: {
              userId,
              language: targetLang,
              greeting: cl.greeting || (isEn ? 'Dear Hiring Committee,' : 'Prezados membros do comitê,'),
              text: cl.text || cl.paragraphs || [''],
              signature: cl.signature || translated.personalDetails?.name || 'Candidate',
              valediction: cl.valediction || (isEn ? 'Sincerely,' : 'Atenciosamente,'),
              personalDetails: translated.personalDetails || translated.personal || {}
            },
            update: {
              greeting: cl.greeting || (isEn ? 'Dear Hiring Committee,' : 'Prezados membros do comitê,'),
              text: cl.text || cl.paragraphs || [''],
              signature: cl.signature || translated.personalDetails?.name || 'Candidate',
              valediction: cl.valediction || (isEn ? 'Sincerely,' : 'Atenciosamente,'),
              personalDetails: translated.personalDetails || translated.personal || {}
            }
          }).catch(err => logger.warn('[TranslationWorker] Could not save cover letter to DB:', err.message));
        }

        // Log to SystemExecutionLog
        if (prisma.systemExecutionLog) {
          await prisma.systemExecutionLog.create({
            data: {
              level: 'info',
              service: 'translationWorker',
              message: `Translation job [${jobId}] processed for user [${userId}] to [${targetLang}]`,
              metadata: {
                jobId,
                userId,
                targetLang,
                hasCoverLetter: Boolean(translated.coverLetterDetails || translated.coverLetter)
              }
            }
          }).catch(err => logger.warn('[TranslationWorker] Could not create execution log:', err.message));
        }
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
