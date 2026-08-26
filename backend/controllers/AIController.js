const analyticsWorker = require('../workers/analyticsWorker');
const ollamaService = require('../services/OllamaService');
const documentParserService = require('../services/DocumentParserService');
const RAGService = require('../services/RAGService');
const logger = require('../utils/logger');

class AIController {
  async atsAnalyze(req, res) {
    const startTime = Date.now();
    try {
      const { document, language = 'pt-BR' } = req.body;
      const userId = req.user?.id || req.body?.userId || 'default_user';

      if (!document) {
        return res.status(400).json({ success: false, error: 'Documento obrigatório para análise ATS' });
      }

      logger.info(`[AIController] Starting ATS evaluation request (${language})`, {
        language,
        hasPersonal: Boolean(document.personal)
      });

      // Index document in RAG service for ATS evaluation
      try {
        const docText = JSON.stringify(document);
        await RAGService.indexText(userId, docText);
      } catch (ragErr) {
        logger.warn('[AIController] Error indexing document in RAG service during ATS analyze:', ragErr.message);
      }

      const report = await analyticsWorker.processJob({
        id: `ats_${Date.now()}`,
        data: { document, language }
      });

      const durationMs = Date.now() - startTime;
      logger.info(`[AIController] ATS evaluation completed in ${durationMs}ms with score: ${report.overallScore}`, {
        duration_ms: durationMs,
        score: report.overallScore
      });

      return res.json({
        success: true,
        report
      });
    } catch (err) {
      logger.error('ATS evaluation error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async sendMessage(req, res) {
    const startTime = Date.now();
    try {
      const { document, messages = [], userId: bodyUserId } = req.body;
      const userId = req.user?.id || bodyUserId || 'default_user';

      logger.info(`[AIController] Processing AI Chat message (${messages.length} messages in history, user: ${userId})`, {
        messageCount: messages.length
      });

      const result = await ollamaService.chatWithDocument(document, messages, userId);

      const durationMs = Date.now() - startTime;
      logger.info(`[AIController] AI Chat message responded in ${durationMs}ms`, {
        duration_ms: durationMs
      });

      return res.json({
        success: true,
        messages: result,
        message: result
      });
    } catch (error) {
      logger.error('AI chat error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Parse Uploaded Resume File (.pdf or .docx)
   */
  async parseResumeFile(req, res) {
    const startTime = Date.now();
    try {
      const { fileBase64, fileName = '', rawText, userId: bodyUserId } = req.body;
      const userId = req.user?.id || bodyUserId || 'default_user';

      let extractedText = rawText || '';

      if (fileBase64) {
        const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        extractedText = await documentParserService.extractTextFromFile(buffer, fileName);
      }

      if (!extractedText || !extractedText.trim()) {
        return res.status(400).json({ success: false, error: 'Não foi possível extrair texto do arquivo fornecido.' });
      }

      logger.info(`[AIController] Parsing resume from text (${extractedText.length} chars, file: ${fileName})`);

      // Index in RAG Vector Store asynchronously in background (non-blocking)
      RAGService.indexText(userId, extractedText).catch(ragErr => {
        logger.warn('[AIController] Background error indexing parsed document in RAG store:', ragErr.message);
      });

      const structuredResume = await ollamaService.parseResumeFromRawText(extractedText);

      const durationMs = Date.now() - startTime;
      logger.info(`[AIController] Resume parsed successfully in ${durationMs}ms`);

      return res.json({
        success: true,
        message: 'Currículo extraído e estruturado com sucesso!',
        data: structuredResume,
        extractedTextSnippet: extractedText.slice(0, 300)
      });
    } catch (err) {
      logger.error('Error parsing resume file:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Quick Fill AI: Converts raw unstructured candidate text into structured Resume JSON
   */
  async quickFill(req, res) {
    const startTime = Date.now();
    try {
      const { rawText, language = 'pt-BR', userId: bodyUserId } = req.body;
      const userId = req.user?.id || bodyUserId || 'default_user';

      if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
        return res.status(400).json({ success: false, error: 'Texto bruto obrigatório para extração de dados.' });
      }

      // Index in RAG Vector Store
      try {
        await RAGService.indexText(userId, rawText);
      } catch (ragErr) {
        logger.warn('[AIController] Error indexing quickFill text in RAG store:', ragErr.message);
      }

      const structuredResume = await ollamaService.parseResumeFromRawText(rawText);

      const durationMs = Date.now() - startTime;
      logger.info('[AIController] Quick-fill extracted successfully', {
        name: structuredResume.personalDetails?.name,
        language,
        duration_ms: durationMs
      });

      return res.json({
        success: true,
        data: structuredResume
      });

    } catch (error) {
      logger.error('Quick fill error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AIController();
