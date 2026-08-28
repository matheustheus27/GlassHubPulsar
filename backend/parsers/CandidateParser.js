/**
 * CandidateParser
 * Deterministically extracts candidate personal details, contacts, and pure social/portfolio URLs.
 * Strict URL preservation: Never outputs markdown or HTML link wrappers.
 * Includes URL masking and unmasking utility functions to protect URLs from LLM alteration.
 */

class CandidateParser {
    /**
     * Clean raw string value from markdown or icons
     */
    static cleanText(str) {
        if (!str || typeof str !== 'string') return '';
        return str
            .replace(/^[#*\-•\s]+/, '')
            .replace(/[#*\s]+$/, '')
            .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // emoji stripping from candidate name/title
            .trim();
    }

    /**
     * Masks URLs in text with placeholder tokens (__URL_0__, etc.) to prevent LLMs from formatting them into markdown or HTML.
     * @param {string} text 
     * @returns {{ maskedText: string, urlMap: Map<string, string> }}
     */
    static maskUrls(text) {
        if (!text || typeof text !== 'string') return { maskedText: '', urlMap: new Map() };

        const urlMap = new Map();
        let counter = 0;

        const urlRegex = /(https?:\/\/[^\s<>"'{}|\\^`]+|(?:www\.)?[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)+\/[^\s<>"'{}|\\^`]+)/gi;

        const maskedText = text.replace(urlRegex, (match) => {
            const token = `__URL_${counter++}__`;
            urlMap.set(token, match);
            return token;
        });

        return { maskedText, urlMap };
    }

    /**
     * Restores original URLs from placeholder tokens (__URL_0__) across strings, arrays, and nested objects.
     * @param {*} data 
     * @param {Map<string, string>} urlMap 
     * @returns {*}
     */
    static unmaskUrls(data, urlMap) {
        if (!data || !urlMap || urlMap.size === 0) return data;

        if (typeof data === 'string') {
            let result = data;
            // Also clean any markdown wrappers the LLM might have placed around the token e.g. [__URL_0__](__URL_0__)
            result = result.replace(/\[\s*(__URL_\d+__)\s*\]\([^)]+\)/g, '$1');
            for (const [token, originalUrl] of urlMap.entries()) {
                result = result.replace(new RegExp(token, 'g'), originalUrl);
            }
            return result;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.unmaskUrls(item, urlMap));
        }

        if (typeof data === 'object' && data !== null) {
            const unmaskedObj = {};
            for (const key of Object.keys(data)) {
                unmaskedObj[key] = this.unmaskUrls(data[key], urlMap);
            }
            return unmaskedObj;
        }

        return data;
    }

    /**
     * Parse candidate info from the header section or full text.
     * @param {string} headerText Header text section.
     * @param {string} fullText Complete document text (for contact matching fallback).
     * @returns {{ name: string, title: string, location: string, email: string, phone: string, linkedin: string, github: string, x: string, instagram: string, facebook: string, portfolio: string }}
     */
    static parseCandidate(headerText, fullText = '') {
        const textToSearch = (headerText ? `${headerText}\n${fullText}` : fullText) || '';
        const rawLines = (headerText || fullText || '')
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean);

        // 1. Email Extraction
        const emailMatch = textToSearch.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
        const email = emailMatch ? emailMatch[0].trim() : '';

        // 2. Phone Extraction (+55 (31) 99150-4604, +55 31 99150-4604, (11) 98765-4321, etc.)
        const phoneMatch = textToSearch.match(/(?:\+55\s*)?(?:\(?\d{2}\)?\s*)?9?\d{4,5}[-\s]?\d{4}/);
        const phone = phoneMatch ? phoneMatch[0].trim() : '';

        // 3. Social Networks & Portfolio (Literal Pure URLs)
        const linkedinMatch = textToSearch.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_.-]+/i);
        const linkedin = linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '';

        const githubMatch = textToSearch.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_.-]+/i);
        const github = githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : '';

        const xMatch = textToSearch.match(/(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/[a-zA-Z0-9_.-]+/i);
        const x = xMatch ? (xMatch[0].startsWith('http') ? xMatch[0] : `https://${xMatch[0]}`) : '';

        const instagramMatch = textToSearch.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9_.-]+\/?/i);
        const instagram = instagramMatch ? (instagramMatch[0].startsWith('http') ? instagramMatch[0] : `https://${instagramMatch[0]}`) : '';

        const facebookMatch = textToSearch.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9_.-]+\/?/i);
        const facebook = facebookMatch ? (facebookMatch[0].startsWith('http') ? facebookMatch[0] : `https://${facebookMatch[0]}`) : '';

        const portfolioMatch = textToSearch.match(/(?:https?:\/\/)[a-zA-Z0-9_.-]+\.github\.io\/?/i)
            || textToSearch.match(/(?:https?:\/\/)(?!(?:www\.)?(?:linkedin|github|x|twitter|instagram|facebook)\.com)[a-zA-Z0-9_.-]+\.[a-zA-Z]{2,}\/?/i);
        const portfolio = portfolioMatch ? portfolioMatch[0].trim() : '';

        // 4. Header Extraction: Name, Title, Location
        let name = '';
        let title = '';
        let location = '';

        const candidateLines = [];

        for (const line of rawLines) {
            // Stop header inspection if a major section heading is hit
            if (/^(RESUMO|COMPET[EÊ]NCIAS|HABILIDADES|HIST[OÓ]RICO|EXPERI[EÊ]NCIA|FORMA[CÇ][AÃ]O|EDUCA[CÇ][AÃ]O|PROJETOS|SUMMARY|SKILLS|EXPERIENCE|EDUCATION|PROJECTS)/i.test(line)) {
                break;
            }

            // Check for Location pattern: "City, UF" or "City - UF" or "City, Country"
            const locMatch = line.match(/([A-Za-zÀ-ÖØ-öø-ÿ\s]{2,30}\s*[,–-]\s*[A-Z]{2})/);
            if (locMatch && !location) {
                location = locMatch[1].replace(/–/g, '-').trim();
            }

            // Filter out lines that are strictly contacts, links, or metadata
            const isContactLine = line.includes('@')
                || /https?:\/\//i.test(line)
                || /linkedin\.com|github\.com|x\.com|instagram\.com|facebook\.com|\.io/i.test(line)
                || /\+55|\(?\d{2}\)?\s*9?\d{4}/.test(line);

            if (!isContactLine && line.replace(/[\s\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF},.-]/gu, '').length > 0) {
                const cleanedCandidate = this.cleanText(line);
                if (cleanedCandidate && !locMatch) {
                    candidateLines.push(cleanedCandidate);
                }
            }
        }

        if (candidateLines.length > 0) {
            name = candidateLines[0];
        }
        if (candidateLines.length > 1) {
            title = candidateLines[1];
        }

        return {
            name,
            title,
            location,
            email,
            phone,
            linkedin,
            github,
            x,
            instagram,
            facebook,
            portfolio
        };
    }
}

module.exports = CandidateParser;
