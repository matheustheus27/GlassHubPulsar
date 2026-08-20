class Page {
    constructor(maxHeight = 1000, initialUsedHeight = 0) {
        // Useful page height (A4 minus margins)
        this.maxHeight = maxHeight;

        // Currently used height (including header on page 1)
        this.usedHeight = initialUsedHeight;

        // Page sections
        this.sections = [];
    }

    /**
     * Check if a block fits on the page.
     * @param {number} height
     * @param {number} extraHeight
     * @returns {boolean}
     */
    canFit(height, extraHeight = 0) {
        return this.usedHeight + height + extraHeight <= this.maxHeight;
    }

    getLastSectionType() {
        return this.sections.length > 0 ? this.sections[this.sections.length - 1].type : null;
    }

    /**
     * Add a section with total consumed height
     * @param {Object} section
     * @param {number} consumedHeight
     */
    addSection(section, consumedHeight = null) {
        this.sections.push(section);
        this.usedHeight += (consumedHeight !== null ? consumedHeight : section.height);
    }

    /**
     * Remove the last added section.
     */
    removeLastSection() {
        const removed = this.sections.pop();

        if (removed) {
            this.usedHeight -= removed.height;
        }

        return removed;
    }

    /**
     * Remaining space.
     */
    remainingHeight() {
        return this.maxHeight - this.usedHeight;
    }

    /**
     * Is page empty?
     */
    isEmpty() {
        return this.sections.length === 0;
    }

    /**
     * Reset the page.
     */
    clear() {
        this.sections = [];
        this.usedHeight = 0;
    }

    /**
     * JSON used by ResumeBuilder.
     */
    toJSON() {
        return {
            usedHeight: this.usedHeight,
            remainingHeight: this.remainingHeight(),
            sections: this.sections
        };
    }
}

module.exports = Page;