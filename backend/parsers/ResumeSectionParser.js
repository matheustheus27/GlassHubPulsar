/**
 * ResumeSectionParser
 * Deterministically splits raw resume text into distinct semantic sections.
 * Supports English and Portuguese section headings with accent, whitespace, and formatting tolerance.
 */

class ResumeSectionParser {
    static SECTION_PATTERNS = [
        {
            key: 'summary',
            regex: /^(?:#{1,6}\s*)?(?:\*{1,3}|_{1,3})?(?:RESUMO\s+PROFISSIONAL|RESUMO|PERFIL\s+PROFISSIONAL|PERFIL|PROFESSIONAL\s+SUMMARY|SUMMARY|PROFILE)(?:\*{1,3}|_{1,3})?:?$/i
        },
        {
            key: 'skills',
            regex: /^(?:#{1,6}\s*)?(?:\*{1,3}|_{1,3})?(?:COMPET[EÊ]NCIAS\s*(?:&|E|\/|AND)\s*TECNOLOGIAS|COMPET[EÊ]NCIAS\s+T[EÉ]CNICAS|COMPET[EÊ]NCIAS|HABILIDADES|SKILLS\s*(?:&|\/|AND)\s*TECHNOLOGIES|TECHNICAL\s+SKILLS|SKILLS)(?:\*{1,3}|_{1,3})?:?$/i
        },
        {
            key: 'experience',
            regex: /^(?:#{1,6}\s*)?(?:\*{1,3}|_{1,3})?(?:HIST[OÓ]RICO\s+PROFISSIONAL|EXPERI[EÊ]NCIA\s+PROFISSIONAL|EXPERI[EÊ]NCIAS\s+PROFISSIONAIS|EXPERI[EÊ]NCIAS?|PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE|WORK\s+HISTORY|EXPERIENCE)(?:\*{1,3}|_{1,3})?:?$/i
        },
        {
            key: 'education',
            regex: /^(?:#{1,6}\s*)?(?:\*{1,3}|_{1,3})?(?:FORMA[CÇ][AÃ]O\s+ACAD[EÊ]MICA|FORMA[CÇ][AÃ]O|EDUCA[CÇ][AÃ]O|EDUCATION|ACADEMIC\s+BACKGROUND|ACADEMIC\s+EDUCATION)(?:\*{1,3}|_{1,3})?:?$/i
        },
        {
            key: 'projects',
            regex: /^(?:#{1,6}\s*)?(?:\*{1,3}|_{1,3})?(?:PROJETOS\s+DE\s+DESTAQUE|PROJETOS\s+PESSOAIS|PROJETOS|FEATURED\s+PROJECTS|PERSONAL\s+PROJECTS|PROJECTS)(?:\*{1,3}|_{1,3})?:?$/i
        }
    ];

    /**
     * Identify which section a given line might be a title for.
     */
    static identifySectionHeader(line) {
        if (!line || typeof line !== 'string') return null;
        const trimmed = line.trim();
        if (!trimmed || trimmed.length > 60) return null;

        for (const pattern of this.SECTION_PATTERNS) {
            if (pattern.regex.test(trimmed)) {
                return pattern.key;
            }
        }
        return null;
    }

    /**
     * Split document text into sections.
     * @param {string} text Sanitized raw resume text.
     * @returns {{ header: string, summary: string, skills: string, experience: string, education: string, projects: string, other: string }}
     */
    static parseSections(text) {
        const result = {
            header: '',
            summary: '',
            skills: '',
            experience: '',
            education: '',
            projects: '',
            other: ''
        };

        if (!text || typeof text !== 'string') {
            return result;
        }

        const lines = text.split(/\r?\n/);
        let currentSection = 'header';
        const sectionBuffers = {
            header: [],
            summary: [],
            skills: [],
            experience: [],
            education: [],
            projects: [],
            other: []
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const detectedKey = this.identifySectionHeader(line);

            if (detectedKey) {
                currentSection = detectedKey;
                continue; // Do not include the section title header itself in the section body
            }

            sectionBuffers[currentSection].push(line);
        }

        for (const key of Object.keys(result)) {
            result[key] = sectionBuffers[key].join('\n').trim();
        }

        return result;
    }
}

module.exports = ResumeSectionParser;
