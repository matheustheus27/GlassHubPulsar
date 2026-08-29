const TagProcessor = require('./TagProcessor');

/**
 * HeightEstimator
 * 
 * Accurately estimates rendered pixel heights for resume blocks on A4 paper
 * with Roboto typography (13px body text, 1.5 line-height = 19.5px/line, ~85 chars/line).
 */
class HeightEstimator {
    static CHARS_PER_LINE = 85;
    static LINE_HEIGHT_PX = 20;

    /**
     * Estimates summary text height
     */
    static estimateSummary(text = "") {
        const cleanText = TagProcessor.stripTags(text);
        const lineCount = this.lines(cleanText, this.CHARS_PER_LINE);
        return Math.round(lineCount * this.LINE_HEIGHT_PX) + 4;
    }

    /**
     * Estimates skills grid height (2 columns)
     */
    static estimateSkills(categories = []) {
        if (!Array.isArray(categories) || categories.length === 0) return 30;

        let totalLinearHeight = 0;
        for (const category of categories) {
            const skills = category.items || [];
            // In 2-column layout (~320px per column), ~3 chips per line
            const chipRows = Math.max(1, Math.ceil(skills.length / 3));
            const categoryHeaderHeight = 18;
            const categoryChipsHeight = chipRows * 26 + 4;
            totalLinearHeight += categoryHeaderHeight + categoryChipsHeight;
        }

        // Distributed across 2 columns
        const columnCount = categories.length > 1 ? 2 : 1;
        const gridHeight = Math.ceil(totalLinearHeight / columnCount);
        return Math.max(40, gridHeight + 8);
    }

    /**
     * Estimates an atomic experience item
     */
    static estimateExperience(exp = {}) {
        let height = 38; // Company + Role + Date header row + margin

        const bullets = exp.bullets || [];
        for (const bullet of bullets) {
            const cleanBullet = TagProcessor.stripTags(bullet);
            const lineCount = this.lines(cleanBullet, this.CHARS_PER_LINE - 6); // bullet indent deduction
            height += (lineCount * this.LINE_HEIGHT_PX) + 6; // line height + bullet gap
        }

        return Math.max(44, Math.round(height));
    }

    /**
     * Estimates an atomic education item
     */
    static estimateEducation(item = {}) {
        let height = 38; // School + Degree + Period row + margin

        if (item.description) {
            const cleanDescription = TagProcessor.stripTags(item.description);
            const lineCount = this.lines(cleanDescription, this.CHARS_PER_LINE);
            height += (lineCount * this.LINE_HEIGHT_PX) + 6;
        }

        return Math.max(38, Math.round(height));
    }

    /**
     * Estimates an atomic project item
     */
    static estimateProjects(proj = {}) {
        let height = 38; // Title + Link badge + Stack/Role row + margin

        const bullets = proj.bullets || [];
        for (const bullet of bullets) {
            const cleanBullet = TagProcessor.stripTags(bullet);
            const lineCount = this.lines(cleanBullet, this.CHARS_PER_LINE - 6);
            height += (lineCount * this.LINE_HEIGHT_PX) + 6;
        }

        return Math.max(44, Math.round(height));
    }

    /**
     * Estimates cover letter text height
     */
    static estimateCover(cover = {}) {
        let height = 40;

        if (cover.signature) height += 24;
        if (cover.valediction) height += 24;

        const bullets = cover.bullets || (cover.text ? (Array.isArray(cover.text) ? cover.text : [cover.text]) : []);
        for (const bullet of bullets) {
            const cleanBullet = TagProcessor.stripTags(bullet);
            const lineCount = this.lines(cleanBullet, this.CHARS_PER_LINE);
            height += (lineCount * this.LINE_HEIGHT_PX) + 8;
        }

        return Math.max(50, Math.round(height));
    }

    /**
     * Calculates line wrapping count with word wrap penalty
     */
    static lines(text = "", charsPerLine = 85) {
        if (!text) return 1;
        const baseLines = Math.ceil(text.length / charsPerLine);
        const wordWrapPenalty = text.length > 200 ? Math.floor(text.length / 300) : 0;
        return Math.max(1, baseLines + wordWrapPenalty);
    }
}

module.exports = HeightEstimator;