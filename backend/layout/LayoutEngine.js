const Page = require("./Page");

/**
 * LayoutEngine
 * 
 * Deterministic pagination engine with intelligent section splitting.
 * Distributes atomic blocks across physical A4 sheets, splitting multi-item
 * sections across page boundaries into closed, independent card containers
 * with identical section titles and zero continuation tags.
 */
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

    /**
     * Normalizes input into structured sections
     */
    _normalizeSections(input) {
        if (!Array.isArray(input) || input.length === 0) return [];

        // Check if already structured sections
        if (input[0] && Array.isArray(input[0].blocks)) {
            return input;
        }

        // Convert flat array of LayoutBlock into structured sections
        const sections = [];
        let currentSection = null;

        for (const block of input) {
            if (!currentSection || currentSection.type !== block.type) {
                currentSection = {
                    type: block.type,
                    title: block.type ? block.type.toUpperCase() : "SEÇÃO",
                    blocks: []
                };
                sections.push(currentSection);
            }
            currentSection.blocks.push(block);
        }

        return sections;
    }

    /**
     * Builds structured pages from a list of sections and blocks
     * @param {Array<{ type: string, title: string, blocks: Array<any> }>|Array<LayoutBlock>} input
     * @param {number} headerHeight - Height of candidate header on page 1
     * @returns {Array<Page>}
     */
    build(input = [], headerHeight = 0) {
        this.pages = [];
        const sections = this._normalizeSections(input);
        let currentPage = new Page(this.pageHeight, headerHeight);

        // Styling overhead constants in pixels
        const CARD_OVERHEAD = 56; // Card padding (28px) + Section Title (22px) + Gap (6px)
        const CARD_MARGIN_BOTTOM = 12; // Gap between different cards
        const ITEM_GAP = 10; // Gap between consecutive items in the same card

        this.log(`Starting pagination. Page budget: ${this.pageHeight}px, Page 1 Header: ${headerHeight}px`);

        for (const section of sections) {
            const { type: sectionType, title: sectionTitle, blocks = [] } = section;
            if (!blocks || blocks.length === 0) continue;

            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                const isFirstBlockOfSectionOnPage = currentPage.isEmpty() || 
                    (currentPage.cards.length === 0 || currentPage.cards[currentPage.cards.length - 1].type !== sectionType);

                const overhead = isFirstBlockOfSectionOnPage
                    ? (CARD_OVERHEAD + (currentPage.cards.length > 0 ? CARD_MARGIN_BOTTOM : 0))
                    : ITEM_GAP;

                const fitsOnCurrentPage = currentPage.canFit(block.height, overhead);

                this.log(`Section [${sectionType}] Item ${i + 1}/${blocks.length}: height=${block.height}px, overhead=${overhead}px, fits=${fitsOnCurrentPage}`);

                if (!currentPage.isEmpty() && !fitsOnCurrentPage) {
                    this.log(`  → Item does not fit. Moving to new Page ${this.pages.length + 2}`);
                    this.pages.push(currentPage);
                    currentPage = new Page(this.pageHeight, 0);

                    // On new page, this starts a new section card container with same title
                    const newPageOverhead = CARD_OVERHEAD;
                    currentPage.addBlockToCard(sectionType, sectionTitle, block, block.height + newPageOverhead);
                } else {
                    currentPage.addBlockToCard(sectionType, sectionTitle, block, block.height + overhead);
                }
            }
        }

        if (!currentPage.isEmpty()) {
            this.pages.push(currentPage);
        }

        this.log(`\n=== Pagination Complete: ${this.pages.length} Pages Created ===`);
        for (let idx = 0; idx < this.pages.length; idx++) {
            const p = this.pages[idx];
            this.log(`Page ${idx + 1}: ${p.cards.length} cards, used=${p.usedHeight}px / ${this.pageHeight}px`);
        }

        return this.pages;
    }
}

module.exports = LayoutEngine;