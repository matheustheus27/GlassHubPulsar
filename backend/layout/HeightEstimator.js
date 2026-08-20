const TagProcessor = require('./TagProcessor');

class HeightEstimator {
    static estimateSummary(text = "") {
        const cleanText = TagProcessor.stripTags(text);
        const lineCount = this.lines(cleanText, 90);
        return Math.round(lineCount * 18);
    }

    static estimateSkills(categories = []) {
        let totalLinearHeight = 0;
        for (const category of categories) {
            const skills = category.items || [];
            // In 2 columns (each column ~330px wide), average 3-4 badges per line
            const rows = Math.max(1, Math.ceil(skills.length / 3.5));
            totalLinearHeight += 16 + (rows * 24 + 4);
        }
        // Divided across 2 parallel columns
        const gridHeight = Math.ceil(totalLinearHeight / (categories.length > 1 ? 1.85 : 1));
        return Math.max(36, gridHeight);
    }

    static estimateExperience(exp = {}) {
        let height = 28; // Company + Role + Date line

        const bullets = exp.bullets || [];
        for (const bullet of bullets) {
            const cleanBullet = TagProcessor.stripTags(bullet);
            const lineCount = this.lines(cleanBullet, 88);
            height += Math.round(lineCount * 18) + 3;
        }

        return Math.max(36, height);
    }

    static estimateEducation(item = {}) {
        let height = 28; // School + Degree + Period line

        if (item.description) {
            const cleanDescription = TagProcessor.stripTags(item.description);
            const lineCount = this.lines(cleanDescription, 88);
            height += Math.round(lineCount * 18) + 3;
        }

        return Math.max(32, height);
    }

    static estimateProjects(proj = {}) {
        let height = 28; // Title + Stack line

        const bullets = proj.bullets || [];
        for (const bullet of bullets) {
            const cleanBullet = TagProcessor.stripTags(bullet);
            const lineCount = this.lines(cleanBullet, 88);
            height += Math.round(lineCount * 18) + 3;
        }

        return Math.max(36, height);
    }

    static estimateCover(cover = {}) {
        let height = 36;

        if (cover.signature) height += 20;
        if (cover.valediction) height += 20;

        const bullets = cover.bullets || (cover.text ? (Array.isArray(cover.text) ? cover.text : [cover.text]) : []);
        for (const bullet of bullets) {
            const cleanBullet = TagProcessor.stripTags(bullet);
            const lineCount = this.lines(cleanBullet, 88);
            height += Math.round(lineCount * 18) + 6;
        }

        return Math.max(50, height);
    }

    static lines(text = "", charsPerLine = 88) {
        if (!text) return 1;
        const baseLines = Math.ceil(text.length / charsPerLine);
        const wordWrapPenalty = text.length > 200 ? Math.floor(text.length / 320) : 0;
        return Math.max(1, baseLines + wordWrapPenalty);
    }
}

module.exports = HeightEstimator;