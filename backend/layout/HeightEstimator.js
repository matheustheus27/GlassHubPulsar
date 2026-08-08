const TagProcessor = require('./TagProcessor');

class HeightEstimator {

    static estimateSummary(text = "") {
        // 116px = Section Title (15px) + Border/Gap (11px) + Card Internal Padding (24px top + 24px bottom) + Block External Margin (42px)
        // Strip tags before calculating height (tags don't occupy visual space)
        const cleanText = TagProcessor.stripTags(text);
        return 116 + this.lines(cleanText, 105) * 20;
    }

    static estimateSkills(categories = []) {
        // 116px = Base structure of unified Glass Card (Margins, Section Title, Paddings)
        let height = 116;

        for (const category of categories) {
            height += 30; // Subcategory title (Languages, Methodologies, etc.)

            const skills = category.items || [];
            // Simulate flex-wrap: average of 4 badges per physical line in useful A4 width
            const rows = Math.ceil(skills.length / 4);

            height += rows * 38; // Badge height (28px) + Vertical gap (10px)
        }

        return height;
    }

    static estimateExperience(exp) {
        // 48px = Vertical internal padding of card (.glass-card has 24px top + 24px bottom)
        let height = 48;

        if (exp.role) height += 22;
        if (exp.company) height += 22;
        if (exp.date) height += 20;

        const bullets = exp.bullets || [];
        for (const bullet of bullets) {
            // At A4 width minus margins, text breaks around 82 characters per line
            // Strip tags before calculating (they don't occupy visual space)
            const cleanBullet = TagProcessor.stripTags(bullet);
            height += this.lines(cleanBullet, 82) * 20; 
        }

        // +20px gap between one employment block and another within the holder
        return height + 20;
    }

    static estimateEducation(item) {
        let height = 48; // Vertical internal padding of card

        if (item.role) height += 22;
        if (item.company) height += 22;
        if (item.date) height += 20;

        if (item.description) {
            // Strip tags before calculating (they don't occupy visual space)
            const cleanDescription = TagProcessor.stripTags(item.description);
            height += this.lines(cleanDescription, 85) * 20;
        }

        return height + 20;
    }

    static estimateProjects(proj) {
        // Base: Card internal padding (24px top + 24px bottom)
        let height = 48;

        // Project title (h3)
        if (proj.title) height += 22;

        // Project role/description
        if (proj.role) height += 22;

        // Internal gap between title and role (4px)
        if (proj.title || proj.role) height += 4;

        // Bullets
        const bullets = proj.bullets || [];
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            // Each bullet occupies height of lines + padding left of list
            // Increased from 20px to 24px per line to compensate for browser word-wrap
            // Strip tags before calculating (they don't occupy visual space)
            const cleanBullet = TagProcessor.stripTags(bullet);
            height += this.lines(cleanBullet, 82) * 24;
            // Gap between bullets (5px)
            if (i < bullets.length - 1) height += 5;
        }

        // Extra safety gap for flex container
        height += 14;

        // +20px gap between one project block and another within the holder
        return height + 20;
    }

    static estimateCover(cover) {
        // Base: Card internal padding (24px top + 24px bottom)
        let height = 48;

        // Cover signature
        if (cover.signature) height += 22;

        // Cover valediction
        if (cover.valediction) height += 22;

        // Internal gap between signature and valediction (4px)
        if (cover.signature || cover.valediction) height += 4;

        // Bullets
        const bullets = cover.bullets || [];
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            // Each bullet occupies height of lines + padding left of list
            // Increased from 20px to 24px per line to compensate for browser word-wrap
            // Strip tags before calculating (they don't occupy visual space)
            const cleanBullet = TagProcessor.stripTags(bullet);
            height += this.lines(cleanBullet, 82) * 24;
            // Gap between bullets (5px)
            if (i < bullets.length - 1) height += 5;
        }

        // Extra safety gap for flex container
        height += 14;

        // +20px gap between one project block and another within the holder
        return height + 20;
    }

    static lines(text = "", charsPerLine = 100) {
        if (!text) return 1;

        const baseLines = Math.ceil(text.length / charsPerLine);
        // Subtle mathematical penalty to compensate for browser 'word-wrap' (long words that jump to next line)
        const wordWrapPenalty = text.length > 150 ? Math.floor(text.length / 240) : 0;

        return Math.max(1, baseLines + wordWrapPenalty);
    }
}

module.exports = HeightEstimator;