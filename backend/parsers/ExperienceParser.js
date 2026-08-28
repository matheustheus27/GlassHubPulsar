/**
 * ExperienceParser
 * Deterministically extracts and enriches professional experience entries and bullets.
 * Guarantees zero loss of bullet points without confusing descriptions or positions.
 */

class ExperienceParser {
    static PERIOD_REGEX = /(?:(?:(?:Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}\s*[-–—/]\s*(?:(?:(?:Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}|Presente|Present|Atual|Current)|\b\d{2}\/\d{4}\s*[-–—/]\s*(?:\d{2}\/\d{4}|Presente|Present|Atual|Current)\b|\b\d{4}\s*[-–—]\s*(?:\d{4}|Presente|Present|Atual)\b)/i;

    /**
     * Check if a line starts with an explicit bullet marker (- , • , * , – , — )
     */
    static isBullet(line) {
        if (!line || typeof line !== 'string') return false;
        const trimmed = line.trim();
        return /^[\-•\*–—]\s+/.test(trimmed) || /^[•\-*–—]/.test(trimmed);
    }

    /**
     * Extracts bullet items from any given text block.
     * Supports single-line and multi-line bullets.
     * Only returns bullets if explicit bullet markers (- , • , * , – , — ) exist.
     * @param {string} text 
     * @returns {string[]}
     */
    static extractBulletsFromText(text) {
        if (!text || typeof text !== 'string') return [];

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return [];

        // Check if there is at least one bullet marker in the text
        const hasBulletMarker = lines.some(l => this.isBullet(l));
        if (!hasBulletMarker) {
            return [];
        }

        const bullets = [];
        let currentBullet = '';

        for (const line of lines) {
            if (this.isBullet(line)) {
                if (currentBullet) {
                    bullets.push(currentBullet.trim());
                }
                currentBullet = line.replace(/^[\-•\*–—\s]+/, '').trim();
            } else if (currentBullet) {
                // Continuation of the previous multiline bullet
                currentBullet += ` ${line}`;
            }
        }

        if (currentBullet) {
            bullets.push(currentBullet.trim());
        }

        return bullets.filter(Boolean);
    }

    /**
     * Segments the raw experience section into individual experience blocks.
     * @param {string} experienceSectionText 
     * @returns {string[]}
     */
    static splitExperienceBlocks(experienceSectionText) {
        if (!experienceSectionText || typeof experienceSectionText !== 'string') return [];

        const lines = experienceSectionText.split('\n');
        const blocks = [];
        let currentBlockLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) {
                if (currentBlockLines.length > 0) {
                    currentBlockLines.push('');
                }
                continue;
            }

            // Check if this line looks like the start of a new experience:
            // 1. If we already have lines in currentBlock and have already seen bullets
            // 2. And this line is NOT a bullet
            // 3. And this line or one of next 2 lines contains a PERIOD_REGEX match (e.g. Set 2025 - Presente)
            const hasSeenBulletsInBlock = currentBlockLines.some(l => this.isBullet(l));
            const isBulletLine = this.isBullet(line);

            if (hasSeenBulletsInBlock && !isBulletLine) {
                const nextLines = lines.slice(i, i + 3).map(l => l.trim());
                const hasDateNearby = nextLines.some(l => this.PERIOD_REGEX.test(l));

                if (hasDateNearby) {
                    // Flush current block
                    blocks.push(currentBlockLines.join('\n').trim());
                    currentBlockLines = [line];
                    continue;
                }
            }

            currentBlockLines.push(line);
        }

        if (currentBlockLines.length > 0) {
            blocks.push(currentBlockLines.join('\n').trim());
        }

        return blocks.filter(Boolean);
    }

    /**
     * Parses an experience block into structured fields.
     */
    static parseSingleBlock(block) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return null;

        const headerLines = [];
        const bulletLines = [];
        let readingBullets = false;

        for (const line of lines) {
            if (this.isBullet(line)) {
                readingBullets = true;
                bulletLines.push(line);
            } else if (!readingBullets) {
                headerLines.push(line);
            } else {
                bulletLines.push(line);
            }
        }

        const bullets = this.extractBulletsFromText(bulletLines.join('\n'));

        let company = '';
        let position = '';
        let period = '';
        const descLines = [];

        // Extract period from header lines
        for (let i = 0; i < headerLines.length; i++) {
            let line = headerLines[i];
            const periodMatch = line.match(this.PERIOD_REGEX);

            if (periodMatch) {
                if (!period) {
                    period = periodMatch[0].trim();
                }
                line = line.replace(periodMatch[0], '').replace(/^[–\-|\s,]+|[–\-|\s,]+$/g, '').trim();
                headerLines[i] = line;
            }
        }

        const cleanHeaderLines = headerLines.filter(Boolean);

        if (cleanHeaderLines.length > 0) {
            company = cleanHeaderLines[0].replace(/^[#*\s]+|[#*\s]+$/g, '').trim();
        }
        if (cleanHeaderLines.length > 1) {
            position = cleanHeaderLines[1].replace(/^[#*\s]+|[#*\s]+$/g, '').trim();
        }
        if (cleanHeaderLines.length > 2) {
            for (let i = 2; i < cleanHeaderLines.length; i++) {
                descLines.push(cleanHeaderLines[i]);
            }
        }

        if (company && !position && company.includes(' - ')) {
            const parts = company.split(' - ');
            company = parts[0].trim();
            position = parts.slice(1).join(' - ').trim();
        }

        const generalDescription = descLines.join(' ').trim();

        if (company || position) {
            return {
                company,
                position,
                period,
                generalDescription: generalDescription.toLowerCase() === position.toLowerCase() ? '' : generalDescription,
                bullets
            };
        }

        return null;
    }

    /**
     * Parse professional experience section.
     * @param {string} experienceSectionText
     * @returns {Array<{ company: string, position: string, period: string, generalDescription: string, bullets: string[] }>}
     */
    static parseExperiences(experienceSectionText) {
        if (!experienceSectionText || typeof experienceSectionText !== 'string') {
            return [];
        }

        const blocks = this.splitExperienceBlocks(experienceSectionText);
        const experiences = [];

        for (const block of blocks) {
            const parsed = this.parseSingleBlock(block);
            if (parsed) {
                experiences.push(parsed);
            }
        }

        return experiences;
    }

    /**
     * Enriches experience objects (e.g. from LLM) with explicit bullets located in the original raw section text.
     * @param {Array} experiences 
     * @param {string} rawSectionText 
     * @returns {Array}
     */
    static enrichWithExplicitBullets(experiences = [], rawSectionText = '') {
        if (!Array.isArray(experiences) || experiences.length === 0) return experiences;
        if (!rawSectionText || typeof rawSectionText !== 'string') return experiences;

        const blocks = this.splitExperienceBlocks(rawSectionText);

        return experiences.map((exp, index) => {
            // Find corresponding block by company or index
            let matchingBlock = '';

            if (exp.company) {
                const normCompany = exp.company.toLowerCase().replace(/[^a-z0-9]/g, '');
                matchingBlock = blocks.find(b => b.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normCompany));
            }

            if (!matchingBlock && blocks[index]) {
                matchingBlock = blocks[index];
            }

            if (matchingBlock) {
                const explicitBullets = this.extractBulletsFromText(matchingBlock);
                if (explicitBullets.length > 0) {
                    return {
                        ...exp,
                        bullets: explicitBullets
                    };
                }
            }

            return exp;
        });
    }
}

module.exports = ExperienceParser;
