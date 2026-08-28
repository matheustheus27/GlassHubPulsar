/**
 * SkillsParser
 * Structurally extracts dynamic technical skills and competences without hardcoded category names.
 * Treats any structural heading line (uppercase title, colon-ending header, or line preceding bullets)
 * as an arbitrary dynamic category.
 */

class SkillsParser {
    /**
     * Check if a line represents a bullet item
     */
    static isBullet(line) {
        if (!line) return false;
        const trimmed = line.trim();
        return /^[\-•\*]\s+/.test(trimmed) || /^[•\-*]/.test(trimmed);
    }

    /**
     * Check if a line is a structural category header
     */
    static isStructuralCategoryHeader(line, nextLine = '') {
        if (!line) return false;
        const trimmed = line.trim();
        if (this.isBullet(trimmed)) return false;
        if (trimmed.length > 55 || trimmed.length < 2) return false;
        if (trimmed.endsWith('.') || trimmed.includes('. ')) return false;

        // 1. If next line is a bullet, this line is definitely a category header
        if (nextLine && this.isBullet(nextLine)) return true;

        // 2. If line ends with a colon, it's a category header
        if (trimmed.endsWith(':')) return true;

        // 3. If line is UPPERCASE (e.g. LINGUAGENS, MINHA STACK, BANCOS DE DADOS, DEVOPS)
        const isUppercase = trimmed === trimmed.toUpperCase() && /[A-ZÀ-ÖØ-ß]/.test(trimmed);
        const words = trimmed.split(/\s+/).filter(Boolean);
        if (isUppercase && words.length <= 6) return true;

        // 4. If line is a short title (<= 4 words, <= 35 chars) and next line exists with items/bullets
        if (words.length <= 4 && trimmed.length <= 35 && nextLine) {
            return true;
        }

        return false;
    }

    /**
     * Parse items from a skill content block
     */
    static parseItems(lines) {
        const items = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (this.isBullet(trimmed)) {
                // Bullet item
                const item = trimmed.replace(/^[\-•\*\s]+/, '').trim();
                if (item) items.push(item);
            } else if (trimmed.includes(',')) {
                // Comma separated items
                const splitItems = trimmed.split(',').map(s => s.trim()).filter(Boolean);
                items.push(...splitItems);
            } else {
                // Space separated or single item line
                const tokens = trimmed.split(/\s{2,}|\s(?=[A-Z0-9#+])/).map(s => s.trim()).filter(Boolean);
                if (tokens.length > 1 && !trimmed.includes('.')) {
                    items.push(...tokens);
                } else {
                    items.push(trimmed);
                }
            }
        }
        return items;
    }

    /**
     * Parse skills section into structured dynamic category-item array.
     * @param {string} skillsSectionText 
     * @returns {Array<{ category: string, items: string[] }>}
     */
    static parseSkills(skillsSectionText) {
        if (!skillsSectionText || typeof skillsSectionText !== 'string') {
            return [];
        }

        const lines = skillsSectionText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return [];

        const categories = [];
        let currentCategory = null;
        let currentLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const nextLine = i + 1 < lines.length ? lines[i + 1] : '';

            // 1. Check for inline category format like "MINHA STACK: PHP, Python" or "BACK-END: PHP, Laravel"
            const colonIndex = line.indexOf(':');
            if (colonIndex > 1 && colonIndex < 40 && !this.isBullet(line)) {
                const headerPart = line.slice(0, colonIndex).trim();
                const itemsPart = line.slice(colonIndex + 1).trim();

                if (this.isStructuralCategoryHeader(headerPart, itemsPart)) {
                    if (currentCategory && currentLines.length > 0) {
                        const parsedItems = this.parseItems(currentLines);
                        if (parsedItems.length > 0) {
                            categories.push({ category: currentCategory, items: parsedItems });
                        }
                    }
                    const parsedItems = itemsPart ? this.parseItems([itemsPart]) : [];
                    currentCategory = headerPart.replace(/^[#*\-•\s]+/, '').trim();
                    currentLines = [];
                    if (parsedItems.length > 0) {
                        categories.push({ category: currentCategory, items: parsedItems });
                        currentCategory = null;
                    }
                    continue;
                }
            }

            // 2. Check if this line is a standalone category header
            const isBulletLine = this.isBullet(line);
            const isHeader = this.isStructuralCategoryHeader(line, nextLine);

            if (isHeader && !isBulletLine) {
                // If we already have accumulated items in current category, flush it
                if (currentCategory && currentLines.length > 0) {
                    const parsedItems = this.parseItems(currentLines);
                    if (parsedItems.length > 0) {
                        categories.push({ category: currentCategory, items: parsedItems });
                    }
                }
                currentCategory = line.replace(/^[#*\-•\s]+/, '').replace(/[:*#]+$/, '').trim();
                currentLines = [];
            } else {
                if (!currentCategory) {
                    currentCategory = 'Competências Gerais';
                }
                currentLines.push(line);
            }
        }

        if (currentCategory && currentLines.length > 0) {
            const parsedItems = this.parseItems(currentLines);
            if (parsedItems.length > 0) {
                categories.push({ category: currentCategory, items: parsedItems });
            }
        }

        // Clean up and filter
        return categories.map(cat => ({
            category: cat.category,
            items: cat.items.map(it => it.replace(/^[\-•\*\s]+/, '').trim()).filter(Boolean)
        })).filter(cat => cat.items.length > 0);
    }
}

module.exports = SkillsParser;
