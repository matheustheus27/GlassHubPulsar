/**
 * Page
 * 
 * Represents a single physical A4 page in the PDF layout.
 * Organizes content into discrete, structured card containers.
 */
class Page {
    constructor(maxHeight = 1000, initialUsedHeight = 0) {
        this.maxHeight = maxHeight;
        this.usedHeight = initialUsedHeight;
        this.cards = []; // Array of { type, title, blocks: [] }
    }

    /**
     * Legacy getter for backward compatibility with tests accessing page.sections
     */
    get sections() {
        const flat = [];
        for (const card of this.cards) {
            for (const b of card.blocks) {
                flat.push(b);
            }
        }
        return flat;
    }

    /**
     * Check if a block + overhead fits on this page
     */
    canFit(blockHeight, overhead = 0) {
        return (this.usedHeight + blockHeight + overhead) <= this.maxHeight;
    }

    /**
     * Add a block to a specific section card on this page
     */
    addBlockToCard(sectionType, sectionTitle, block, consumedHeight) {
        let currentCard = this.cards.length > 0 ? this.cards[this.cards.length - 1] : null;

        if (!currentCard || currentCard.type !== sectionType) {
            currentCard = {
                type: sectionType,
                title: sectionTitle,
                blocks: []
            };
            this.cards.push(currentCard);
        }

        currentCard.blocks.push(block);
        this.usedHeight += consumedHeight;
    }

    /**
     * Remaining height in pixels
     */
    remainingHeight() {
        return Math.max(0, this.maxHeight - this.usedHeight);
    }

    /**
     * Is the page empty (no cards)?
     */
    isEmpty() {
        return this.cards.length === 0;
    }

    /**
     * Total count of blocks across all cards
     */
    get totalBlocks() {
        return this.cards.reduce((acc, card) => acc + card.blocks.length, 0);
    }

    toJSON() {
        return {
            usedHeight: this.usedHeight,
            remainingHeight: this.remainingHeight(),
            cardsCount: this.cards.length,
            cards: this.cards
        };
    }
}

module.exports = Page;