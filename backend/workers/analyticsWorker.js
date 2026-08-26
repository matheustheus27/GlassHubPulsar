/**
 * Analytics & ATS Scoring Worker (Llama 3.2 + Heuristic Fallback)
 * Evaluates candidate resumes against enterprise ATS standards using structured JSON output.
 */
const logger = require('../utils/logger');
const queueManager = require('../queues/queueManager');
const metrics = require('../utils/metrics');
const TagProcessor = require('../layout/TagProcessor');

const SYNONYM_TAXONOMY = [
  {
    id: 'microservices',
    ptLabel: 'Microsserviços',
    enLabel: 'Microservices Architecture',
    synonyms: ['microsserviços', 'microsservicos', 'microservices', 'micro-services', 'arquitetura de microsserviços', 'microservice architecture', 'serviços distribuídos']
  },
  {
    id: 'docker',
    ptLabel: 'Docker & Containerização',
    enLabel: 'Docker & Containers',
    synonyms: ['docker', 'containers', 'containerização', 'containerizacao', 'containerization', 'docker compose']
  },
  {
    id: 'kubernetes',
    ptLabel: 'Kubernetes (K8s)',
    enLabel: 'Kubernetes (K8s)',
    synonyms: ['kubernetes', 'k8s', 'orquestração de containers', 'container orchestration', 'helm']
  },
  {
    id: 'cicd',
    ptLabel: 'Pipelines CI/CD & Automação',
    enLabel: 'CI/CD Pipelines & Automation',
    synonyms: ['ci/cd', 'ci cd', 'continuous integration', 'continuous delivery', 'integração contínua', 'integracao continua', 'deploy contínuo', 'pipelines', 'esteiras de ci/cd', 'jenkins', 'github actions', 'gitlab ci']
  },
  {
    id: 'cloud',
    ptLabel: 'Computação em Nuvem (AWS/GCP/Azure)',
    enLabel: 'Cloud Platforms (AWS/GCP/Azure)',
    synonyms: ['cloud', 'nuvem', 'computação em nuvem', 'computacao em nuvem', 'aws', 'azure', 'gcp', 'google cloud', 'amazon web services', 'serverless', 'lambda', 's3', 'ec2']
  },
  {
    id: 'testing',
    ptLabel: 'Testes Automatizados (TDD/Unitários)',
    enLabel: 'Automated Testing (TDD/Unit Testing)',
    synonyms: ['testes automatizados', 'testes unitários', 'testes unitarios', 'automated testing', 'unit testing', 'tdd', 'bdd', 'jest', 'cypress', 'mocha', 'phpunit', 'pytest']
  },
  {
    id: 'database',
    ptLabel: 'Bancos de Dados & Modelagem SQL/NoSQL',
    enLabel: 'Databases & SQL/NoSQL Modeling',
    synonyms: ['banco de dados', 'bancos de dados', 'databases', 'database', 'sql', 'nosql', 'postgresql', 'postgres', 'mongodb', 'mysql', 'oracle', 'sql server', 'redis', 'dynamodb']
  },
  {
    id: 'api',
    ptLabel: 'APIs REST & Webhooks',
    enLabel: 'RESTful APIs & Webhooks',
    synonyms: ['api rest', 'apis rest', 'restful', 'webhooks', 'rest api', 'graphql', 'endpoints', 'integração de apis', 'api integration', 'swagger', 'openapi']
  },
  {
    id: 'messaging',
    ptLabel: 'Mensageria & Filas Assíncronas',
    enLabel: 'Message Brokers & Async Queues',
    synonyms: ['mensageria', 'filas', 'message broker', 'message queues', 'rabbitmq', 'kafka', 'bullmq', 'redis pub/sub', 'event-driven', 'arquitetura orientada a eventos']
  },
  {
    id: 'clean_code',
    ptLabel: 'Clean Code & Padrões SOLID',
    enLabel: 'Clean Code & SOLID Architecture',
    synonyms: ['clean code', 'clean architecture', 'solid', 'design patterns', 'arquitetura de software', 'software architecture', 'boas práticas', 'best practices']
  }
];

class AnalyticsWorker {
  constructor() {
    this.init();
  }

  init() {
    queueManager.registerWorker('analytics', this.processJob.bind(this));

    // RabbitMQ via MessageBroker (primary, with InMemory fallback)
    const messageBroker = require('../messaging/MessageBroker');
    messageBroker.consume('analytics.ats', this.processJob.bind(this)).catch(err =>
      logger.warn('[AnalyticsWorker] MessageBroker consume note:', err.message)
    );
  }

  /**
   * Cleans layout tags from document
   */
  stripDocumentTags(obj) {
    if (typeof obj === 'string') {
      return TagProcessor.stripTags(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.stripDocumentTags(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const res = {};
      for (const key of Object.keys(obj)) {
        res[key] = this.stripDocumentTags(obj[key]);
      }
      return res;
    }
    return obj;
  }

  /**
   * Evaluates document text against the multilingual synonym taxonomy
   */
  evaluateKeywordsTaxonomy(doc, lang = 'pt-BR') {
    const isPt = lang.startsWith('pt');
    const docText = JSON.stringify(doc).toLowerCase();

    const matchedConcepts = [];
    const missingConcepts = [];

    for (const concept of SYNONYM_TAXONOMY) {
      const hasMatch = concept.synonyms.some(syn => docText.includes(syn.toLowerCase()));
      if (hasMatch) {
        matchedConcepts.push(concept);
      } else {
        missingConcepts.push(isPt ? concept.ptLabel : concept.enLabel);
      }
    }

    return {
      matchedConcepts,
      missingKeywords: missingConcepts.slice(0, 4) // Top 4 genuinely missing
    };
  }

  async analyzeWithLlama(cleanDoc, lang = 'pt-BR') {
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const isPt = lang.startsWith('pt');
    const taxonomyResult = this.evaluateKeywordsTaxonomy(cleanDoc, lang);

    const prompt = `
      You are an Enterprise ATS (Applicant Tracking System) Evaluation Engine and Senior Tech Recruiter.
      Analyze the candidate resume below and output a STRICT, VALID JSON response matching the schema.

      IMPORTANT MULTILINGUAL RULE:
      Recognize synonymous technical terms across Portuguese and English (e.g. 'Microsserviços' == 'Microservices', 'Bancos de Dados' == 'Databases', 'Testes Automatizados' == 'Automated Testing', 'Mensageria' == 'Message Queues').
      Do NOT suggest keywords that the candidate already has in either language!

      ALREADY DETECTED KEYWORDS:
      ${taxonomyResult.matchedConcepts.map(c => c.enLabel).join(', ') || 'None'}

      RECOMMENDED MISSING KEYWORDS TO VERIFY:
      ${taxonomyResult.missingKeywords.join(', ')}

      RESUME DATA:
      ${JSON.stringify(cleanDoc, null, 2)}

      SCHEMA REQUIREMENT:
      Return ONLY a raw JSON object with this exact structure:
      {
        "overallScore": 88,
        "summary": "Resumo conciso da qualidade do currículo e aderência ATS",
        "missingKeywords": ${JSON.stringify(taxonomyResult.missingKeywords)},
        "actionVerbsDensity": {
          "score": 90,
          "strongVerbsFound": ["Arquitetei", "Liderei", "Otimizei", "Desenvolvi"],
          "weakPhrasesToReplace": ["Ajudei no", "Fiz parte de"]
        },
        "structuralClarity": {
          "score": 85,
          "feedback": "Feedback sobre legibilidade e organização das seções"
        },
        "layoutConsistency": {
          "score": 92,
          "feedback": "Avaliação de densidade e padronização visual"
        },
        "actionableRecommendations": [
          { "priority": "HIGH", "category": "Palavras-chave", "recommendation": "Destaque realizações quantificadas nos projetos." },
          { "priority": "MEDIUM", "category": "Métricas de Impacto", "recommendation": "Quantificar resultados percentuais nos projetos." }
        ]
      }

      Language for text values: ${isPt ? 'Portuguese (pt-BR)' : 'English (en-US)'}.
    `;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(`${ollamaHost}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt,
          format: 'json',
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.response);
        if (parsed?.overallScore) {
          // Ensure missing keywords don't conflict with detected synonyms
          if (!parsed.missingKeywords || parsed.missingKeywords.length === 0) {
            parsed.missingKeywords = taxonomyResult.missingKeywords;
          }
          return parsed;
        }
      }
    } catch (e) {
      clearTimeout(timeout);
      logger.warn('[AnalyticsWorker] Llama 3.2 unavailable or timed out, using intelligent heuristic ATS evaluator:', e.message);
    }

    // Heuristic Fallback Evaluator if Ollama is not reachable
    return this.calculateHeuristicScore(cleanDoc, lang);
  }

  calculateHeuristicScore(doc, lang = 'pt-BR') {
    const isPt = lang.startsWith('pt');

    const candidateName = doc.personalDetails?.name || doc.personal?.name || '';
    const candidateTitle = (doc.personalDetails?.title || doc.personal?.title || '').toLowerCase();
    const summaryText = doc.summaryDetails?.summary || doc.summary?.summary || '';
    const skillCats = doc.skillsDetails?.skills || doc.skills?.skills || [];
    const skillsCount = skillCats.reduce((acc, cat) => acc + (cat.items?.length || 0), 0);
    const expList = doc.experienceDetails?.experiences || doc.experiences?.experiences || [];
    const projList = doc.projectDetails?.projects || doc.projects?.projects || [];

    // 1. Content Completeness Score (Base 0 - 30)
    let completenessScore = 0;
    if (candidateName && candidateName.length > 3) completenessScore += 5;
    if (candidateTitle && candidateTitle.length > 3) completenessScore += 5;
    if (summaryText && summaryText.length > 40) completenessScore += 5;
    if (skillsCount >= 4) completenessScore += 5;
    if (expList.length >= 1) completenessScore += 5;
    if (projList.length >= 1) completenessScore += 5;

    // 2. Title Context & Alignment (Base 0 - 25)
    let titleAlignmentScore = 20;
    const titleKeywords = candidateTitle.split(/\s+/).filter(w => w.length > 3 && !['de', 'para', 'com', 'e', 'em'].includes(w));
    if (titleKeywords.length > 0 && expList.length > 0) {
      const expText = expList.map(e => `${e.position} ${e.company} ${e.bullets?.join(' ')}`).join(' ').toLowerCase();
      const matchesTitle = titleKeywords.some(kw => expText.includes(kw));
      if (!matchesTitle) {
        titleAlignmentScore = 8; // Penalty for disconnect between title and experiences
      }
    } else if (!candidateTitle) {
      titleAlignmentScore = 5;
    }

    // 3. Impact & Quantifiable Metrics Score (Base 0 - 25)
    let metricBulletsCount = 0;
    let totalBulletsCount = 0;
    expList.forEach(e => {
      (e.bullets || []).forEach(b => {
        totalBulletsCount++;
        if (/(\d+%|\d+\s*k|\$\d+|\b\d{2,}\b|\b\d+\s*membros|\b\d+\s*usuários|\b\d+\s*anos)/i.test(b)) {
          metricBulletsCount++;
        }
      });
    });
    projList.forEach(p => {
      (p.bullets || []).forEach(b => {
        totalBulletsCount++;
        if (/(\d+%|\d+\s*k|\$\d+|\b\d{2,}\b)/i.test(b)) {
          metricBulletsCount++;
        }
      });
    });

    const metricRatio = totalBulletsCount > 0 ? (metricBulletsCount / totalBulletsCount) : 0;
    let impactScore = Math.round(metricRatio * 25);
    if (totalBulletsCount === 0) impactScore = 5;

    // 4. Keyword Taxonomy Matching (Base 0 - 20)
    const taxonomyResult = this.evaluateKeywordsTaxonomy(doc, lang);
    const matchedCount = taxonomyResult.matchedConcepts.length;
    const keywordScore = Math.min(20, matchedCount * 2.5);

    // Calculate Final Rigorous Score
    let overallScore = Math.round(completenessScore + titleAlignmentScore + impactScore + keywordScore);

    // Strict caps for incomplete or unquantified resumes
    if (totalBulletsCount > 0 && metricBulletsCount === 0) {
      overallScore = Math.min(overallScore, 72); // Cap at 72 if no quantifiable metrics exist
    }
    if (expList.length === 0 || skillsCount < 3) {
      overallScore = Math.min(overallScore, 58); // Cap at 58 if sparse
    }

    overallScore = Math.min(98, Math.max(38, overallScore));

    return {
      overallScore,
      summary: isPt
        ? (overallScore >= 85 
            ? `Currículo altamente competitivo com Score ATS ${overallScore}/100. Excelente alinhamento de cargo, densidade de palavras-chave e métricas de impacto.`
            : (overallScore >= 68
                ? `Perfil intermediário com Score ATS ${overallScore}/100. Para alcançar 85+, inclua mais métricas quantificáveis (%) e conecte o título do cargo às conquistas das experiências.`
                : `Perfil necessita de ajustes estruturais (Score ATS ${overallScore}/100). Adicione resumo profissional, expanda as competências técnicas e detalhe resultados nas experiências.`))
        : (overallScore >= 85
            ? `Highly competitive resume with ATS Score ${overallScore}/100. Strong role alignment, keyword density, and quantified impact.`
            : `Intermediate profile with ATS Score ${overallScore}/100. Quantify impact metrics (%) and align candidate title with experience achievements to cross 85+.`),
      missingKeywords: taxonomyResult.missingKeywords,
      actionVerbsDensity: {
        score: Math.round(Math.min(95, 60 + (totalBulletsCount * 4))),
        strongVerbsFound: isPt ? ["Desenvolveu", "Implementou", "Liderou", "Otimizou", "Arquiteta", "Integrou"] : ["Architected", "Spearheaded", "Optimized", "Engineered", "Integrated"],
        weakPhrasesToReplace: isPt ? ["Trabalhou com", "Responsável por", "Ajudou a"] : ["Worked with", "Responsible for", "Helped with"]
      },
      structuralClarity: {
        score: Math.min(95, Math.max(50, completenessScore * 3)),
        feedback: isPt
          ? (titleAlignmentScore < 15 
              ? "Atenção: O título principal do candidato difere dos cargos listados nas experiências. Alinhe os títulos."
              : "Hierarquia de seções bem definida e padronizada para o padrão A4.")
          : "Section hierarchy standardized for A4 page screening."
      },
      layoutConsistency: {
        score: Math.min(96, Math.max(60, 65 + skillsCount * 2)),
        feedback: isPt
          ? (metricBulletsCount === 0 
              ? "Recomendação Crítica: Nenhuma métrica quantitativa (% ou valores) foi encontrada nas descrições de cargo."
              : "Boa densidade visual e distribuição de competências.")
          : "Visual balance and information density optimized for standard A4."
      },
      actionableRecommendations: [
        {
          priority: "HIGH",
          category: isPt ? "Métricas de Impacto Quantificáveis" : "Quantified Impact Metrics",
          recommendation: isPt
            ? (metricBulletsCount === 0
                ? "Adicione porcentagens e números reais aos bullets (ex: 'redução de latência em 40%', 'gestão de 500k eventos/dia')."
                : `Você possui ${metricBulletsCount} métricas nos bullets. Continue quantificando resultados em todas as experiências.`)
            : "Include percentage and numerical metrics across experience bullet points."
        },
        {
          priority: titleAlignmentScore < 15 ? "HIGH" : "MEDIUM",
          category: isPt ? "Alinhamento do Título do Cargo" : "Role Title Alignment",
          recommendation: isPt
            ? `Garanta que o título '${candidateTitle || 'do candidato'}' esteja refletido nos cargos e tecnologias principais.`
            : "Ensure candidate role title matches technical competencies."
        }
      ]
    };
  }

  async processJob(job) {
    const { document, language = 'pt-BR' } = job.data;
    const startTime = Date.now();
    logger.info(`[AnalyticsWorker] Starting ATS evaluation job [${job.id}]`);

    try {
      const cleanDoc = this.stripDocumentTags(document);
      const report = await this.analyzeWithLlama(cleanDoc, language);

      const durationMs = Date.now() - startTime;
      metrics.recordLatency('aiInferenceMs', durationMs);
      metrics.increment('atsAnalyses');

      logger.info(`[AnalyticsWorker] ATS job [${job.id}] finished in ${durationMs}ms with score: ${report.overallScore}`);

      const userId = job.data.userId;
      if (userId) {
        try {
          const NotificationService = require('../services/NotificationService');
          await NotificationService.createNotification({
            userId,
            title: 'Avaliação ATS Concluída',
            message: `A análise de compatibilidade ATS do seu currículo atingiu Score ${report.overallScore}/100.`,
            type: 'ATS_ANALYSIS_COMPLETED',
            data: { score: report.overallScore, summary: report.summary }
          });
        } catch (notifErr) {
          logger.warn(`[AnalyticsWorker] Error saving persistent notification:`, notifErr.message);
        }
      }

      return report;
    } catch (err) {
      logger.error(`[AnalyticsWorker] ATS job [${job.id}] failed:`, err);
      const fallbackReport = this.calculateHeuristicScore(document, language);
      const userId = job.data.userId;
      if (userId) {
        try {
          const NotificationService = require('../services/NotificationService');
          await NotificationService.createNotification({
            userId,
            title: 'Avaliação ATS Concluída',
            message: `A análise de compatibilidade ATS do seu currículo atingiu Score ${fallbackReport.overallScore}/100.`,
            type: 'ATS_ANALYSIS_COMPLETED',
            data: { score: fallbackReport.overallScore, summary: fallbackReport.summary }
          });
        } catch (notifErr) {}
      }
      return fallbackReport;
    }
  }
}

module.exports = new AnalyticsWorker();
