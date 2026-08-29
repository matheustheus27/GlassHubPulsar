const ResumeBuilder = require("../services/ResumeBuilderService");
const CoverBuilder = require("../services/CoverBuilderService");
const puppeteer = require("puppeteer");
const fs = require("fs");
const logger = require("../utils/logger");
const metrics = require("../utils/metrics");
const queueManager = require("../queues/queueManager");
const pdfWorker = require("../workers/pdfWorker");
const sseController = require("../controllers/SSEController");

// Temporary in-memory cache for generated PDF downloads
const pdfCache = new Map();

function getPuppeteerLaunchOptions() {
    const options = {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote",
            "--single-process"
        ]
    };

    const candidates = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/usr/bin/google-chrome-stable"
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

class BuilderController {
    /**
     * Async Worker Export: Enqueues PDF generation job in Redis / BullMQ
     */
    async enqueuePDFJob(req, res) {
        const startTime = Date.now();
        try {
            const { type = "resume" } = req.query;
            const { document, candidateName } = req.body;

            const docName = candidateName || document?.personalDetails?.name || document?.personal?.personal?.name || document?.personal?.name || "Curriculo";
            const docLang = document?.settings?.language || document?.language || "pt-BR";
            const fileName = formatPdfFileName(docName, docLang);

            const jobId = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

            logger.info(`[BuilderController] Enqueuing async PDF job [${jobId}] for ${docName} (${type})`, {
                jobId,
                type,
                fileName,
                language: docLang
            });

            const userId = req.user?.id || req.body?.userId || null;

            logger.info('[PDF] Publishing render job', {
                jobId,
                queue: 'pdf.render',
                type,
                userId
            });

            // Dispatch via MessageBroker (RabbitMQ primary, InMemory fallback)
            const messageBroker = require('../messaging/MessageBroker');
            await messageBroker.dispatch('pdf.render', {
                jobId,
                type,
                document,
                candidateName: docName,
                fileName,
                language: docLang,
                userId
            });

            // Notify frontend immediately that the job is queued (progress 10)
            sseController.broadcast({
                type: 'PDF_PROGRESS',
                jobId,
                progress: 10,
                step: `Tarefa enfileirada no worker-pdf para renderização de "${fileName}"...`,
                fileName
            });

            return res.json({
                success: true,
                jobId,
                fileName,
                message: "Tarefa de renderização enviada com sucesso para o worker-pdf."
            });
        } catch (error) {
            logger.error("Erro ao enfileirar exportação assíncrona de PDF:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Download rendered PDF buffer by jobId
     */
    async downloadPDF(req, res) {
        try {
            const { id } = req.params;
            const entry = pdfWorker.getPdf(id) || pdfCache.get(id);

            if (!entry) {
                return res.status(404).json({ success: false, error: "Arquivo PDF expirado ou não encontrado." });
            }

            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${entry.fileName || 'Curriculo_GlassHub.pdf'}"`,
                "Content-Length": entry.buffer.length
            });

            logger.info(`[BuilderController] PDF downloaded successfully: ${entry.fileName} (${entry.buffer.length} bytes)`, {
                jobId: id,
                fileName: entry.fileName
            });

            return res.send(entry.buffer);
        } catch (error) {
            logger.error("Erro no download de PDF:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Synchronous Direct PDF Export
     */
    async exportPDF(req, res) {
        let browser;
        const startTime = Date.now();

        try {
            const { type = "resume" } = req.query;
            const document = req.body;

            const docName = document.personalDetails?.name || document.personal?.personal?.name || document.personal?.name || "Curriculo";
            const docLang = document.settings?.language || document.language || "pt-BR";
            const fileName = formatPdfFileName(docName, docLang);

            logger.info(`[BuilderController] Synchronous PDF export started for ${docName} (${type})`, {
                type,
                fileName,
                language: docLang
            });

            const launchOpts = getPuppeteerLaunchOptions();
            browser = await puppeteer.launch(launchOpts);

            const page = await browser.newPage();
            await page.setDefaultNavigationTimeout(60000);
            await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

            let finalHtml;
            if (type.toLowerCase() === "cover") {
                finalHtml = await this.#buildCover(page, document);
            } else {
                finalHtml = await this.#buildResume(page, document);
            }

            await page.setContent(finalHtml, { waitUntil: ["domcontentloaded", "networkidle0"], timeout: 60000 });
            await page.evaluateHandle('document.fonts.ready');

            const pdf = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" }
            });

            const durationMs = Date.now() - startTime;
            metrics.recordPdfExport(durationMs);

            logger.info(`[BuilderController] Synchronous PDF export completed: ${fileName} (${pdf.length} bytes in ${durationMs}ms)`, {
                duration_ms: durationMs,
                type,
                fileName
            });

            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName}"`,
                "Content-Length": pdf.length
            });

            return res.status(200).send(pdf);

        } catch (error) {
            logger.error("Erro na geração síncrona de PDF via Puppeteer:", error);
            return res.status(500).json({ success: false, error: error.message || "Falha ao gerar PDF" });
        } finally {
            if (browser) {
                await browser.close().catch(() => {});
            }
        }
    }

    async #buildResume(page, document) {
        const initialHtml = ResumeBuilder.build(document);
        await page.setContent(initialHtml, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.emulateMediaType("screen");

        const viewportHeight = await page.evaluate(() => {
            const pageElement = document.querySelector(".a4-page");
            if (!pageElement) return 0;
            const styles = window.getComputedStyle(pageElement);
            const paddingTop = parseFloat(styles.paddingTop) || 0;
            const paddingBottom = parseFloat(styles.paddingBottom) || 0;
            const height = pageElement.getBoundingClientRect().height;
            return Math.round(height + paddingTop + paddingBottom);
        });

        return ResumeBuilder.build(document, {
            pageHeight: viewportHeight || undefined,
            debug: true
        });
    }

    async #buildCover(page, document) {
        const initialHtml = CoverBuilder.build(document);
        await page.setContent(initialHtml, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.emulateMediaType("screen");

        const viewportHeight = await page.evaluate(() => {
            const pageElement = document.querySelector(".a4-page");
            if (!pageElement) return 0;
            const styles = window.getComputedStyle(pageElement);
            const paddingTop = parseFloat(styles.paddingTop) || 0;
            const paddingBottom = parseFloat(styles.paddingBottom) || 0;
            const height = pageElement.getBoundingClientRect().height;
            return Math.round(height + paddingTop + paddingBottom);
        });
        
        return CoverBuilder.build(document, {
            pageHeight: viewportHeight || undefined,
            debug: true
        });
    }
}

module.exports = new BuilderController();