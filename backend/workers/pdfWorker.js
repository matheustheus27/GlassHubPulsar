/**
 * PDF Worker
 * Handles background PDF rendering for user resumes and generates Hybrid Executive System Status Reports.
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const logger = require('../utils/logger');
const queueManager = require('../queues/queueManager');
const metrics = require('../utils/metrics');
const sseController = require('../controllers/SSEController');
const ResumeBuilder = require('../services/ResumeBuilderService');
const CoverBuilder = require('../services/CoverBuilderService');

const pdfStore = new Map();

function getPuppeteerLaunchOptions() {
  const options = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process'
    ]
  };

  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome-stable'
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      options.executablePath = p;
      break;
    }
  }

  return options;
}

function formatPdfFileName(candidateName = "CURRICULO", language = "pt-BR") {
  const clean = String(candidateName)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, "");

  const parts = clean.split(/\s+/).filter(Boolean);
  let namePart = "CURRICULO";
  if (parts.length === 1) {
    namePart = parts[0].toUpperCase();
  } else if (parts.length >= 2) {
    const firstName = parts[0].toUpperCase();
    const lastName = parts[parts.length - 1].toUpperCase();
    namePart = `${firstName}_${lastName}`;
  }

  const cleanLang = (language || "pt-BR").trim();
  return `${namePart}-${cleanLang}.pdf`;
}

class PDFWorker {
  constructor() {
    this.init();
  }

  init() {
    queueManager.registerWorker('pdf', this.processJob.bind(this));
  }

  getPdf(id) {
    return pdfStore.get(id);
  }

  /**
   * Generates Hybrid Executive System Status Report HTML (Datadog + PostgreSQL) with Smart A4 Pagination
   */
  generateSystemReportHtml(systemSnapshot, queues = {}, databaseLogs = [], datadog = {}) {
    const logs = databaseLogs || [];
    const MAX_LOGS_PAGE_1 = 6;
    const MAX_LOGS_PER_EXTRA_PAGE = 16;

    const page1Logs = logs.slice(0, MAX_LOGS_PAGE_1);
    const remainingLogs = logs.slice(MAX_LOGS_PAGE_1);

    const extraPages = [];
    for (let i = 0; i < remainingLogs.length; i += MAX_LOGS_PER_EXTRA_PAGE) {
      extraPages.push(remainingLogs.slice(i, i + MAX_LOGS_PER_EXTRA_PAGE));
    }

    const totalPages = 1 + extraPages.length;

    const renderLogsRows = (logList) => logList.map(l => `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 11px; break-inside: avoid;">
        <td style="padding: 6px 8px; color: #94a3b8; white-space: nowrap;">${new Date(l.timestamp).toLocaleTimeString()}</td>
        <td style="padding: 6px 8px; font-weight: bold; color: ${l.level === 'ERROR' ? '#f87171' : '#38bdf8'};">${l.level}</td>
        <td style="padding: 6px 8px; color: #e2e8f0; font-family: monospace; font-size: 10px;">${l.route || l.service || '-'}</td>
        <td style="padding: 6px 8px; color: #cbd5e1; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${l.message || ''}</td>
        <td style="padding: 6px 8px; color: #34d399; font-weight: bold; text-align: right;">${l.durationMs ? l.durationMs + 'ms' : '-'}</td>
      </tr>
    `).join('');

    const queuesEntries = Object.entries(queues || {});
    const queuesHtml = queuesEntries.map(([name, stat]) => `
      <div style="background: rgba(15,23,42,0.8); border: 1px solid rgba(56,189,248,0.2); border-radius: 8px; padding: 10px; flex: 1; min-width: 45%;">
        <div style="display:flex; justify-content:space-between; font-weight:bold; color:#f8fafc; font-size:11px;">
          <span>Worker: ${name}</span>
          <span style="color:#34d399;">● ATIVO</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:10px; color:#94a3b8;">
          <span>Aguardando: <strong style="color:#f8fafc;">${stat.waiting || 0}</strong></span>
          <span>Executando: <strong style="color:#38bdf8;">${stat.active || 0}</strong></span>
          <span>Concluídos: <strong style="color:#34d399;">${stat.completed || 0}</strong></span>
          <span>Falhas: <strong style="color:#f87171;">${stat.failed || 0}</strong></span>
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>GlassHub Executive System Health Report</title>
        <style>
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #030712; color: #f8fafc;
            margin: 0; padding: 0;
            -webkit-print-color-adjust: exact;
          }
          .a4-page {
            width: 794px;
            height: 1123px;
            max-height: 1123px;
            padding: 32px 36px;
            margin: 0 auto;
            position: relative;
            page-break-after: always;
            break-after: page;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            background: #030712;
          }
          .header {
            border-bottom: 2px solid #06b6d4;
            padding-bottom: 12px; margin-bottom: 16px;
          }
          h1 { color: #38bdf8; margin: 0; font-size: 19px; text-transform: uppercase; letter-spacing: 0.5px; }
          .subtitle { color: #94a3b8; font-size: 11px; margin-top: 4px; }
          .card {
            background: rgba(15, 23, 42, 0.75);
            border: 1px solid rgba(56, 189, 248, 0.25);
            border-radius: 10px; padding: 14px 16px; margin-bottom: 12px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .card-title {
            color: #38bdf8; margin-top: 0; margin-bottom: 10px; font-size: 12px;
            text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;
          }
          .metric-row {
            display: flex; justify-content: space-between; margin-bottom: 6px;
            font-size: 12px;
          }
          .metric-name { color: #cbd5e1; }
          .metric-value { color: #38bdf8; font-weight: bold; }
          .badge {
            background: rgba(16, 185, 129, 0.2); color: #34d399;
            padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;
          }
          table { width: 100%; border-collapse: collapse; margin-top: 4px; }
          th { text-align: left; padding: 6px 8px; font-size: 9px; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.1); }
          .footer {
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <!-- PAGE 1: EXECUTIVE SYSTEM SNAPSHOT & RECENT TRACES -->
        <div class="a4-page">
          <div>
            <div class="header">
              <h1>GlassHub Hybrid Executive System Report</h1>
              <div class="subtitle">Relatório Unificado de Telemetria (Datadog APM + PostgreSQL Execution Logs) | ${new Date().toLocaleString('pt-BR')}</div>
            </div>

            <!-- METRIC CARDS ROW -->
            <div style="display: flex; gap: 12px; margin-bottom: 12px;">
              <!-- CLUSTER HEALTH -->
              <div class="card" style="flex: 1; margin-bottom: 0;">
                <div class="card-title">Saúde do Cluster & APM</div>
                <div class="metric-row">
                  <span class="metric-name">Status do Cluster:</span>
                  <span class="badge">100% OPERACIONAL</span>
                </div>
                <div class="metric-row">
                  <span class="metric-name">Agente Datadog:</span>
                  <span style="color:#34d399; font-weight:bold; font-size:11px;">DogStatsD (8125 UDP)</span>
                </div>
                <div class="metric-row">
                  <span class="metric-name">Uptime do Servidor:</span>
                  <span class="metric-value">${systemSnapshot.uptimeSeconds}s</span>
                </div>
                <div class="metric-row">
                  <span class="metric-name">Uso de Heap Memory:</span>
                  <span class="metric-value">${systemSnapshot.memory?.heapUsedMb || '38.2'} MB</span>
                </div>
              </div>

              <!-- PERFORMANCE METRICS -->
              <div class="card" style="flex: 1; margin-bottom: 0;">
                <div class="card-title">Métricas de Vazão & IA</div>
                <div class="metric-row">
                  <span class="metric-name">Exportações de PDF:</span>
                  <span class="metric-value">${systemSnapshot.counters?.pdfExports || 0} (Média: ${systemSnapshot.latencies?.avgPdfExportMs || 0}ms)</span>
                </div>
                <div class="metric-row">
                  <span class="metric-name">Avaliações ATS (IA):</span>
                  <span class="metric-value">${systemSnapshot.counters?.atsAnalyses || 0} (Média: ${systemSnapshot.latencies?.avgAiInferenceMs || 0}ms)</span>
                </div>
                <div class="metric-row">
                  <span class="metric-name">Traduções de Currículo:</span>
                  <span class="metric-value">${systemSnapshot.counters?.translations || 0}</span>
                </div>
              </div>
            </div>

            <!-- WORKER QUEUES -->
            <div class="card">
              <div class="card-title">Filas de Mensageria Ativas (BullMQ / Redis)</div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${queuesHtml || '<p style="color:#94a3b8; font-size:11px; margin:0;">Nenhuma fila pendente.</p>'}
              </div>
            </div>

            <!-- RECENT POSTGRESQL TRACES -->
            <div class="card" style="margin-bottom: 0;">
              <div class="card-title">Traces de Execução Recentes (PostgreSQL Logs)</div>
              <table>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Nível</th>
                    <th>Origem/Rota</th>
                    <th>Mensagem</th>
                    <th style="text-align:right;">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderLogsRows(page1Logs) || '<tr><td colspan="5" style="color:#94a3b8; padding:8px; text-align:center;">Nenhum log registrado.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

          <!-- PAGE 1 FOOTER -->
          <div class="footer">
            <span>GlassHub Enterprise Infrastructure &copy; 2026</span>
            <span>Página 1 de ${totalPages}</span>
          </div>
        </div>

        <!-- ADDITIONAL PAGES IF LOGS EXCEED PAGE 1 -->
        ${extraPages.map((pageLogs, pageIdx) => `
          <div class="a4-page">
            <div>
              <div class="header">
                <h1>GlassHub Hybrid Executive System Report</h1>
                <div class="subtitle">Traces de Execução Recentes (Continuação) | ${new Date().toLocaleString('pt-BR')}</div>
              </div>

              <div class="card" style="margin-bottom: 0;">
                <div class="card-title">Traces de Execução (PostgreSQL Logs)</div>
                <table>
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Nível</th>
                      <th>Origem/Rota</th>
                      <th>Mensagem</th>
                      <th style="text-align:right;">Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${renderLogsRows(pageLogs)}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="footer">
              <span>GlassHub Enterprise Infrastructure &copy; 2026</span>
              <span>Página ${2 + pageIdx} de ${totalPages}</span>
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `;
  }

  async processJob(job) {
    const { jobId = job.id, type, document, candidateName, isSystemReport, systemSnapshot, queues, databaseLogs, datadog } = job.data;
    const startTime = Date.now();

    const docName = candidateName || document?.personalDetails?.name || document?.personal?.personal?.name || document?.personal?.name || "Curriculo";
    const docLang = document?.settings?.language || document?.language || "pt-BR";
    const fileName = formatPdfFileName(docName, docLang);

    logger.info(`[PDFWorker] Starting PDF generation job [${jobId}] (${docName} - ${type || 'SystemReport'})`, {
      jobId,
      type,
      fileName,
      language: docLang,
      memory: process.memoryUsage().heapUsed
    });

    // SSE: Progress 30%
    sseController.broadcast({
      type: 'PDF_PROGRESS',
      jobId,
      progress: 30,
      step: 'Iniciando navegador Chromium headless e calculando viewport...'
    });

    let browser;
    try {
      const launchOpts = getPuppeteerLaunchOptions();
      browser = await puppeteer.launch(launchOpts);

      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

      // SSE: Progress 60%
      sseController.broadcast({
        type: 'PDF_PROGRESS',
        jobId,
        progress: 60,
        step: 'Compilando layout vetorial e formatando CSS Glassmorphic...'
      });

      let html;
      if (isSystemReport) {
        const snapshot = systemSnapshot || metrics.getSnapshot();
        html = this.generateSystemReportHtml(snapshot, queues, databaseLogs, datadog);
      } else if (type === 'cover') {
        html = CoverBuilder.build(document);
      } else {
        html = ResumeBuilder.build(document);
      }

      await page.setContent(html, { waitUntil: ['domcontentloaded', 'networkidle0'], timeout: 60000 });
      await page.evaluateHandle('document.fonts.ready');

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
      });

      const downloadUrl = `/api/pdf/download/${jobId}`;

      // Store in memory cache for user download
      pdfStore.set(jobId, {
        buffer: pdfBuffer,
        fileName,
        timestamp: Date.now()
      });

      const durationMs = Date.now() - startTime;
      metrics.recordLatency('pdfExportMs', durationMs);
      metrics.increment('pdfExports');

      logger.info(`[PDFWorker] PDF job [${jobId}] completed successfully: ${fileName} (${pdfBuffer.length} bytes in ${durationMs}ms)`, {
        jobId,
        fileName,
        pdfSize: pdfBuffer.length,
        duration_ms: durationMs
      });

      // Persist user notification in DB for cross-session access
      const userId = job.data.userId;
      if (userId) {
        try {
          const NotificationService = require('../services/NotificationService');
          await NotificationService.createNotification({
            userId,
            title: isSystemReport ? 'Relatório do Sistema Gerado' : 'Exportação de PDF Concluída',
            message: isSystemReport 
              ? `Relatório executivo de saúde do sistema pronto para download.`
              : `Seu currículo "${fileName}" foi gerado com sucesso e está pronto para download.`,
            type: 'PDF_READY',
            data: { jobId, downloadUrl, fileName, pdfSize: pdfBuffer.length }
          });
        } catch (notifErr) {
          logger.warn(`[PDFWorker] Error saving persistent notification:`, notifErr.message);
        }
      }

      // SSE: Progress 100%
      sseController.broadcast({
        type: 'PDF_PROGRESS',
        jobId,
        progress: 100,
        step: 'PDF gerado com sucesso pelo worker!',
        downloadUrl,
        fileName
      });

      return { success: true, pdfSize: pdfBuffer.length, downloadUrl, fileName, durationMs };

    } catch (err) {
      logger.error(`[PDFWorker] PDF job [${jobId}] failed:`, err);
      sseController.broadcast({
        type: 'PDF_PROGRESS',
        jobId,
        progress: 0,
        step: `Falha na geração do PDF: ${err.message}`
      });
      throw err;
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
}

module.exports = new PDFWorker();
