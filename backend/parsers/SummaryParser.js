/**
 * SummaryParser
 * Deterministically extracts professional summary text, preserving rich formatting tags verbatim.
 */

class SummaryParser {
    /**
     * Parse professional summary section.
     * @param {string} summarySectionText The raw text inside the summary section.
     * @returns {string} Cleaned summary string with formatting tags preserved.
     */
    static parseSummary(summarySectionText) {
        if (!summarySectionText || typeof summarySectionText !== 'string') {
            return '';
        }

        // Clean any leading section title leftovers
        const cleaned = summarySectionText
            .replace(/^(?:RESUMO\s+PROFISSIONAL|RESUMO|PERFIL\s+PROFISSIONAL|PERFIL|PROFESSIONAL\s+SUMMARY|SUMMARY|PROFILE)\s*:?\s*/i, '')
            .trim();

        return cleaned;
    }
}

module.exports = SummaryParser;
