const ResumeBuilder = require("../services/ResumeBuilderService");
const CoverBuilder = require("../services/CoverBuilderService");
const puppeteer = require("puppeteer");

class BuilderController {
    /**
     * Public entry point for exporting PDFs.
     */
    async exportPDF(req, res) {
        let browser;

        try {
            const { type = "resume" } = req.query;
            const document = req.body;

            browser = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            });

            const page = await browser.newPage();
            await page.setDefaultNavigationTimeout(120000);
            await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

            // Optimizing resource loading
            await page.setRequestInterception(true);
            page.on("request", (request) => {
                if (["image", "font", "stylesheet", "media"].includes(request.resourceType())) {
                    return request.abort();
                }
                request.continue();
            });

            // Selects the generation logic based on the `type` parameter
            let finalHtml;
            if (type.toLowerCase() === "cover") {
                finalHtml = await this.#buildCover(page, document);
            } else {
                finalHtml = await this.#buildResume(page, document);
            }

            // Defines the final compiled HTML and renders the PDF
            await page.setContent(finalHtml, { waitUntil: "domcontentloaded", timeout: 120000 });

            const pdf = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" }
            });

            // Extract the name and format the file
            const candidateName = document.personal?.personal?.name || document.personal?.title || "Document";
            const fileName = `${candidateName.replace(/\s+/g, "_")}.pdf`;

            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName}"`
            });

            return res.send(pdf);

        } catch (error) {
            console.error("Erro na geração de PDF:", error);
            return res.status(500).json({ success: false, error: error.message });
        } finally {
            if (browser) {
                await browser.close().catch(() => {});
            }
        }
    }

    /**
     * Internal logic for calibrating and compiling the resume.
     */
    async #buildResume(page, document) {
        const initialHtml = ResumeBuilder.build(document);

        await page.setContent(initialHtml, { waitUntil: "domcontentloaded", timeout: 120000 });
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

    /**
     * Internal logic for calibrating and compiling the cover letter.
     */
    async #buildCover(page, document) {
        const initialHtml = CoverBuilder.build(document);

        await page.setContent(initialHtml, { waitUntil: "domcontentloaded", timeout: 120000 });
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