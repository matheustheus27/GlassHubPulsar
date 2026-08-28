/**
 * EducationParser
 * Deterministically extracts academic education entries.
 * Extracts: institution, degree, period/status, and description.
 */

class EducationParser {
    static PERIOD_REGEX = /(?:Previs[aã]o\s+de\s+conclus[aã]o(?:\s+em)?\s+\d{4}|Previs[aã]o(?:\s+de\s+t[eé]rmino)?\s+\d{4}|Conclu[ií]do(?:\s+em)?\s+\d{4}|Conclu[ií]do|Em\s+andamento|Expected\s+graduation\s+\d{4}|Expected\s+completion\s+\d{4}|Completed\s+in\s+\d{4}|Graduated\s+\d{4}|(?:19\d{2}|20\d{2})\s*[-–—]\s*(?:(?:19\d{2}|20\d{2})|Presente|Present|Atual)|\b(?:19\d{2}|20\d{2})\b)/i;

    static DEGREE_INDICATORS = /^(?:Bacharelado|Licenciatura|Gradua[cç][aã]o|P[oó]s-Gradua[cç][aã]o|Mestrado|Doutorado|T[eé]cnico|Tecn[oó]logo|Ensino\s+M[eé]dio|Especializa[cç][aã]o|MBA|Bachelor|Master|PhD|B\.S\.|M\.S\.|Associate|Diploma)/i;

    /**
     * Check if a line is exclusively or primarily a period string
     */
    static isPeriodLine(line) {
        if (!line) return false;
        const match = line.match(this.PERIOD_REGEX);
        if (!match) return false;
        const remainder = line.replace(match[0], '').replace(/^[–\-,\s]+|[–\-,\s]+$/g, '').trim();
        return remainder.length === 0;
    }

    /**
     * Check if a line is a degree title (short, not a long paragraph)
     */
    static isDegreeTitle(line) {
        if (!line) return false;
        const trimmed = line.trim();
        if (trimmed.length > 60 || trimmed.includes('. ') || trimmed.endsWith('.')) {
            return false;
        }
        return this.DEGREE_INDICATORS.test(trimmed);
    }

    /**
     * Parse education section into structured education array.
     * @param {string} educationSectionText
     * @returns {Array<{ institution: string, degree: string, period: string, description: string }>}
     */
    static parseEducation(educationSectionText) {
        if (!educationSectionText || typeof educationSectionText !== 'string') {
            return [];
        }

        const lines = educationSectionText.split(/\r?\n/).map(l => l.trim());
        const educations = [];

        let currentEdu = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            const isDegree = this.isDegreeTitle(line);
            const isPeriod = this.isPeriodLine(line);
            const hasInlinePeriod = this.PERIOD_REGEX.test(line);

            // A short header line is a clean line <= 60 chars that isn't a long paragraph sentence
            const isShortHeader = line.length <= 60 && !line.includes('. ') && !line.endsWith('.');

            if (!currentEdu) {
                currentEdu = { institution: '', degree: '', period: '', descriptionLines: [] };
            } else if (currentEdu.institution && (currentEdu.degree || currentEdu.period)) {
                // Check if this line starts a NEXT education block:
                // Lookahead: is this line or next line a degree/period of a new institution?
                const nextLine = (i + 1 < lines.length) ? lines[i + 1].trim() : '';
                const nextIsDegree = this.isDegreeTitle(nextLine);
                const nextIsPeriod = this.isPeriodLine(nextLine) || this.PERIOD_REGEX.test(nextLine);

                if ((isShortHeader && (nextIsDegree || nextIsPeriod)) || (isDegree && currentEdu.degree)) {
                    educations.push(this.#finalizeEdu(currentEdu));
                    currentEdu = { institution: '', degree: '', period: '', descriptionLines: [] };
                }
            }

            // Assign line content into currentEdu
            if (isPeriod) {
                const match = line.match(this.PERIOD_REGEX);
                currentEdu.period = match ? match[0].trim() : line;
            } else if (hasInlinePeriod && isShortHeader && !currentEdu.period) {
                const match = line.match(this.PERIOD_REGEX);
                currentEdu.period = match ? match[0].trim() : '';
                const cleanLine = line.replace(match[0], '').replace(/^[–\-,\s]+|[–\-,\s]+$/g, '').trim();
                if (cleanLine) {
                    if (!currentEdu.institution) {
                        currentEdu.institution = cleanLine;
                    } else if (!currentEdu.degree) {
                        currentEdu.degree = cleanLine;
                    } else {
                        currentEdu.descriptionLines.push(cleanLine);
                    }
                }
            } else if (!currentEdu.institution && !isDegree && isShortHeader) {
                currentEdu.institution = line;
            } else if (!currentEdu.degree && isDegree) {
                currentEdu.degree = line;
            } else if (!currentEdu.degree && isShortHeader && !currentEdu.period) {
                currentEdu.degree = line;
            } else if (!currentEdu.period && hasInlinePeriod && isShortHeader) {
                const match = line.match(this.PERIOD_REGEX);
                currentEdu.period = match ? match[0].trim() : '';
                const cleanLine = line.replace(match[0], '').replace(/^[–\-,\s]+|[–\-,\s]+$/g, '').trim();
                if (cleanLine) {
                    currentEdu.descriptionLines.push(cleanLine);
                }
            } else {
                currentEdu.descriptionLines.push(line);
            }
        }

        if (currentEdu && (currentEdu.institution || currentEdu.degree)) {
            educations.push(this.#finalizeEdu(currentEdu));
        }

        return educations;
    }

    static #finalizeEdu(edu) {
        return {
            institution: (edu.institution || '').replace(/^[#*\s]+|[#*\s]+$/g, '').trim(),
            degree: (edu.degree || '').replace(/^[#*\s]+|[#*\s]+$/g, '').trim(),
            period: (edu.period || '').trim(),
            description: (edu.descriptionLines || []).join(' ').trim()
        };
    }
}

module.exports = EducationParser;
