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

    build(blocks, headerHeight = 0) {
        this.pages = [];
        let currentPage = new Page(this.pageHeight, headerHeight);
        this.log(`Starting pagination. Page height: ${this.pageHeight}px, Page 1 Header: ${headerHeight}px`);

        const NEW_CARD_OVERHEAD = 52; // Card padding (24px) + Section Title (22px) + Card gap (6px)
        const ITEM_GAP_OVERHEAD = 8;  // Gap between items within the same card

        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            const isNewSectionOnPage = currentPage.isEmpty() || currentPage.getLastSectionType() !== block.type;
            const overhead = isNewSectionOnPage ? NEW_CARD_OVERHEAD : ITEM_GAP_OVERHEAD;
            const canFit = currentPage.canFit(block.height, overhead);

            this.log(`Block ${i + 1} [${block.type}]: height=${block.height}px, overhead=${overhead}px, canFit=${canFit}`);
            this.log(`  Current page: used=${currentPage.usedHeight}px, remaining=${currentPage.remainingHeight()}px`);

            if (!currentPage.isEmpty() && !canFit) {
                this.log(`  → Jumping to new page`);
                this.pages.push(currentPage);
                currentPage = new Page(this.pageHeight, 0);
                this.log(`  Page ${this.pages.length + 1} created`);
                
                // On the new page, this block starts a new card
                currentPage.addSection(block, block.height + NEW_CARD_OVERHEAD);
            } else {
                currentPage.addSection(block, block.height + overhead);
            }

            this.log(`  Block ${i + 1} placed. Page used: ${currentPage.usedHeight}px / ${this.pageHeight}px`);
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