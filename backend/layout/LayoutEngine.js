const Page = require("./Page");

class LayoutEngine {
    constructor(pageHeight = 980, debug = false) {
        this.pageHeight = pageHeight;
        this.pages = [];
        this.debug = debug;
    }

    log(message) {
        if (this.debug) {
            console.log(`[LayoutEngine] ${message}`);
        }
    }

    build(blocks) {
        this.pages = [];
        let currentPage = new Page(this.pageHeight);
        this.log(`Starting pagination. Page height: ${this.pageHeight}px`);

        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            const isNewSectionOnPage = currentPage.isEmpty() || currentPage.getLastSectionType() !== block.type;
            // Increased to 120px to include title (15px) + border (1px) + internal padding (24px*2) + margins and gaps
            const sectionOverhead = isNewSectionOnPage ? 120 : 0;
            // Add 30px safety margin for rendering errors and anti-alias
            const safetyMargin = 30;
            const totalHeightNeeded = block.height + sectionOverhead + safetyMargin;
            const canFit = currentPage.canFit(block.height, sectionOverhead + safetyMargin);

            this.log(`Block ${i + 1} [${block.type}]: height=${block.height}px, overhead=${sectionOverhead}px, total=${totalHeightNeeded}px, canFit=${canFit}`);
            this.log(`  Current page: used=${currentPage.usedHeight}px, remaining=${currentPage.remainingHeight()}px`);

            if (!currentPage.isEmpty() && !canFit) {
                this.log(`  \u2192 Jumping to new page`);
                this.pages.push(currentPage);
                currentPage = new Page(this.pageHeight);
                this.log(`  Page ${this.pages.length + 1} created`);
            }

            currentPage.addSection(block);
            this.log(`  Block ${i + 1} added. Page: ${currentPage.usedHeight}px / ${this.pageHeight}px`);
        }

        if (!currentPage.isEmpty()) {
            this.pages.push(currentPage);
        }

        this.log(`\n=== Pagination Complete ===`);
        this.log(`Total pages: ${this.pages.length}`);
        for (let i = 0; i < this.pages.length; i++) {
            this.log(`Page ${i + 1}: ${this.pages[i].sections.length} blocks, ${this.pages[i].usedHeight}px used`);
        }

        return this.pages;
    }
}

module.exports = LayoutEngine;