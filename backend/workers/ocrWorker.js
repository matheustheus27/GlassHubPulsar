/**
 * OCR Worker (Llama 3.2 Vision 11B Multimodal + Heuristic Layout Fallback)
 * Processes scanned resume images and PDF document pages to extract structured markdown text.
 */
const logger = require('../utils/logger');
const queueManager = require('../queues/queueManager');
const metrics = require('../utils/metrics');
const sseController = require('../controllers/SSEController');
const documentParser = require('../services/DocumentParserService');

class OCRWorker {
  constructor() {
    this.init();
  }

  init() {
    queueManager.registerWorker('ocr', this.processJob.bind(this));
  }

  /**
   * Calls Ollama Llama 3.2 Vision (11B) with base64 image data
   */
  async extractWithLlamaVision(imageBase64) {
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const prompt = `
      You are a high-precision Multimodal OCR & Resume Parsing Engine for Portuguese candidate CV documents.
      Extract ALL candidate text from this resume document image with 100% precision.

      CRITICAL EXTRACTION & STRUCTURING RULES:
      1. HEADER BLOCKS:
         - Extract Full Name, Target Title/Role, Location (City, State/UF), Email, Phone number, and Links (e.g., GitHub, LinkedIn, Portfolio).
      2. COMPETENCIES / SKILLS:
         - The document lists skills under uppercase category titles (e.g., "LINGUAGENS", "FRAMEWORKS E BIBLIOTECAS", "BANCOS DE DADOS", "DEVOPS", "PROTOCOLOS E COMUNICAÇÃO", "METODOLOGIAS E CONCEITOS").
         - Group each individual skill item under its respective section.
      3. PROFESSIONAL EXPERIENCE:
         - Identify each separate work entry cleanly.
         - Extract "empresa" (Organization name, e.g., Teknisa, Azapfy, Commit Jr., NTIC, Sistema Divina Providência).
         - Extract "cargo" (Job title/role, e.g., Desenvolvedor Full-Stack, Instrutor de Informática).
         - Extract "periodo" (Dates/duration, e.g., "Set 2025 - Presente", "Out 2021 - Set 2024").
         - Extract "realizacoes" (Array containing each bullet point • marker). NEVER merge or agglutinate different bullet points.
      4. ACADEMIC EDUCATION:
         - Identify each educational institution/degree separately (e.g., "CEFET-MG", "Sistema Divina Providência").
         - Extract degree title (e.g., "Bacharelado em Engenharia de Computação", "Técnico em Informática"), status/period, and details.
      5. FEATURED PROJECTS:
         - Identify each project separately (e.g., "NativeZip Tools", "Glassmorphic Professional Resume", "Alquerque").
         - Extract tech stack array and detailed bullet points for each project.
      6. FONT STYLE TAGGING:
         - Detect bold and italic text styles in the document image:
           - Wrap bold words/phrases in <BOLD>text</BOLD> tags.
           - Wrap italic words/phrases in <ITALIC>text</ITALIC> tags.
      
      Output clean, structured markdown. Do not summarize or omit technical details.
    `;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${ollamaHost}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2-vision',
          prompt,
          images: [imageBase64],
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (data?.response && data.response.trim().length > 30) {
          logger.info(`[OCRWorker] Extracted ${data.response.length} chars using Llama 3.2 Vision (11B)`);
          return data.response.trim();
        }
      }
    } catch (err) {
      clearTimeout(timeout);
      logger.warn('[OCRWorker] Llama 3.2 Vision unavailable or timed out, using layout text extraction fallback:', err.message);
    }

    return null;
  }

  async processJob(job) {
    const { jobId = job.id, fileBuffer, imageBase64, rawText, fileName, userId } = job.data;
    const startTime = Date.now();
    const ollamaService = require('../services/OllamaService');

    logger.info(`[OCRWorker] Starting hybrid extraction job [${jobId}] (${fileName || 'document'})`);

    sseController.broadcast({
      type: 'OCR_PROGRESS',
      jobId,
      progress: 20,
      step: 'Iniciando extração em pipeline híbrido (Texto Nativo / OCR)...'
    });

    try {
      let extractedText = rawText || '';
      let extractionMethod = 'RAW_TEXT';

      // STAGE 1: Native Text Extraction from PDF/DOCX Buffer
      if (!extractedText && fileBuffer) {
        try {
          const buf = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer, 'base64');
          const nativeText = await documentParser.extractTextFromFile(buf, fileName || 'document.pdf');
          if (nativeText && nativeText.trim().length > 50) {
            extractedText = nativeText.trim();
            extractionMethod = 'NATIVE_TEXT';
            logger.info(`[OCRWorker] Stage 1 succeeded: Extracted ${extractedText.length} native text chars`);
          }
        } catch (nativeErr) {
          logger.warn('[OCRWorker] Stage 1 native text extraction error, moving to Stage 2:', nativeErr.message);
        }
      }

      // STAGE 2: Fallback Multimodal OCR Engine (Images / Scanned PDFs)
      if ((!extractedText || extractedText.length <= 50) && imageBase64) {
        sseController.broadcast({
          type: 'OCR_PROGRESS',
          jobId,
          progress: 45,
          step: 'Executando OCR por visão multimodal (Llama 3.2 Vision)...'
        });

        const visionText = await this.extractWithLlamaVision(imageBase64);
        if (visionText && visionText.trim().length > 30) {
          extractedText = visionText.trim();
          extractionMethod = 'VISION_OCR';
          logger.info(`[OCRWorker] Stage 2 succeeded: Extracted ${extractedText.length} chars via Llama 3.2 Vision`);
        }
      }

      if (!extractedText || extractedText.length === 0) {
        throw new Error('Falha ao extrair texto do documento fornecido (PDF/Imagem em formato não reconhecido).');
      }

      sseController.broadcast({
        type: 'OCR_PROGRESS',
        jobId,
        progress: 75,
        step: 'Sintetizando e validando entidades com JSON Schema estruturado...'
      });

      // STAGE 3: Structured Entity Extraction via Ollama JSON Schema
      const structuredResume = await ollamaService.parseResumeWithStructuredSchema(extractedText);

      // Index in RAG Vector Store
      if (userId) {
        try {
          const RAGService = require('../services/RAGService');
          await RAGService.indexText(userId, extractedText);
        } catch (ragErr) {
          logger.warn('[OCRWorker] Error indexing text in RAG vector store:', ragErr.message);
        }
      }

      const durationMs = Date.now() - startTime;
      metrics.recordLatency('ocrProcessingMs', durationMs);
      metrics.increment('ocrJobsCompleted');

      logger.info(`[OCRWorker] Hybrid OCR job [${jobId}] completed in ${durationMs}ms via ${extractionMethod}`);

      // Persist notification for user
      if (userId) {
        try {
          const NotificationService = require('../services/NotificationService');
          await NotificationService.createNotification({
            userId,
            title: 'Extração OCR Concluída',
            message: `Currículo extraído e desmembrado com sucesso (${structuredResume.experienceDetails?.experiences?.length || 0} experiências).`,
            type: 'OCR_COMPLETED',
            data: { jobId, extractionMethod, charCount: extractedText.length }
          });
        } catch (notifErr) {}
      }

      sseController.broadcast({
        type: 'OCR_PROGRESS',
        jobId,
        progress: 100,
        step: 'Processamento de OCR e desmembramento de entidades concluído!',
        extractedText,
        structuredData: structuredResume,
        data: structuredResume
      });

      return {
        success: true,
        extractedText,
        structuredData: structuredResume,
        data: structuredResume,
        charCount: extractedText.length,
        extractionMethod,
        durationMs
      };

    } catch (err) {
      logger.error(`[OCRWorker] OCR job [${jobId}] failed:`, err);
      sseController.broadcast({
        type: 'OCR_PROGRESS',
        jobId,
        progress: 0,
        step: `Falha na extração por OCR: ${err.message}`
      });
      throw err;
    }
  }
}

module.exports = new OCRWorker();
