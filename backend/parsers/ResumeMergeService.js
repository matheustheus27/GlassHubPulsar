/**
 * ResumeMergeService
 * Safely merges structural extraction anchors with LLM semantic interpretations.
 * Rule: Structural/deterministic data guarantees zero data loss (e.g. empty LLM responses cannot wipe valid entries).
 */

class ResumeMergeService {
    static normalizeKey(str) {
        if (!str || typeof str !== 'string') return '';
        return str.toLowerCase().replace(/[^a-z0-9]/gi, '');
    }

    static mergeCandidate(det = {}, llm = {}) {
        const d = det || {};
        const l = llm || {};

        return {
            name: d.name || l.name || '',
            title: d.title || l.title || '',
            location: d.location || l.location || '',
            email: d.email || l.email || '',
            phone: d.phone || l.phone || '',
            linkedin: d.linkedin || l.linkedin || '',
            github: d.github || l.github || '',
            x: d.x || l.x || '',
            instagram: d.instagram || l.instagram || '',
            facebook: d.facebook || l.facebook || '',
            portfolio: d.portfolio || l.portfolio || ''
        };
    }

    static mergeSummary(detSummary = '', llmSummary = '') {
        return (detSummary && detSummary.trim()) ? detSummary.trim() : (llmSummary || '').trim();
    }

    static mergeSkills(detSkills = [], llmSkills = []) {
        const d = Array.isArray(detSkills) ? detSkills : [];
        const l = Array.isArray(llmSkills) ? llmSkills : [];

        if (d.length > 0 && l.length === 0) return d;
        if (d.length === 0 && l.length > 0) return l;
        if (d.length === 0 && l.length === 0) return [];

        const categoryMap = new Map();

        // 1. Add structural categories first
        for (const cat of d) {
            const catName = cat.category || cat.name || 'Competências';
            const key = this.normalizeKey(catName);
            categoryMap.set(key, {
                category: catName,
                items: [...(cat.items || [])]
            });
        }

        // 2. Enrich with LLM categories without duplicates
        for (const cat of l) {
            const catName = cat.category || cat.name || 'Competências';
            const key = this.normalizeKey(catName);
            if (categoryMap.has(key)) {
                const existing = categoryMap.get(key);
                const existingSet = new Set(existing.items.map(i => this.normalizeKey(i)));
                for (const item of (cat.items || [])) {
                    if (!existingSet.has(this.normalizeKey(item))) {
                        existing.items.push(item);
                        existingSet.add(this.normalizeKey(item));
                    }
                }
            } else {
                categoryMap.set(key, {
                    category: catName,
                    items: [...(cat.items || [])]
                });
            }
        }

        return Array.from(categoryMap.values());
    }

    static mergeExperiences(detExp = [], llmExp = []) {
        const d = Array.isArray(detExp) ? detExp : [];
        const l = Array.isArray(llmExp) ? llmExp : [];

        if (d.length > 0 && l.length === 0) return d;
        if (d.length === 0 && l.length > 0) return l;
        if (d.length === 0 && l.length === 0) return [];

        const expMap = new Map();

        // 1. Anchor with structural experiences
        for (const exp of d) {
            const key = `${this.normalizeKey(exp.company)}_${this.normalizeKey(exp.position)}`;
            expMap.set(key, {
                company: exp.company || '',
                position: exp.position || '',
                period: exp.period || '',
                generalDescription: exp.generalDescription || '',
                bullets: [...(exp.bullets || [])]
            });
        }

        // 2. Enrich with LLM experiences
        for (const exp of l) {
            const key = `${this.normalizeKey(exp.company)}_${this.normalizeKey(exp.position)}`;
            if (expMap.has(key)) {
                const existing = expMap.get(key);
                if (!existing.period && exp.period) existing.period = exp.period;
                if (!existing.generalDescription && exp.generalDescription && exp.generalDescription.toLowerCase() !== exp.position?.toLowerCase()) {
                    existing.generalDescription = exp.generalDescription;
                }
                if (existing.bullets.length === 0 && Array.isArray(exp.bullets) && exp.bullets.length > 0) {
                    existing.bullets = [...exp.bullets];
                }
            } else {
                expMap.set(key, {
                    company: exp.company || '',
                    position: exp.position || '',
                    period: exp.period || '',
                    generalDescription: (exp.generalDescription && exp.generalDescription.toLowerCase() !== exp.position?.toLowerCase()) ? exp.generalDescription : '',
                    bullets: [...(exp.bullets || [])]
                });
            }
        }

        return Array.from(expMap.values());
    }

    static mergeEducation(detEdu = [], llmEdu = []) {
        const d = Array.isArray(detEdu) ? detEdu : [];
        const l = Array.isArray(llmEdu) ? llmEdu : [];

        if (d.length > 0 && l.length === 0) return d;
        if (d.length === 0 && l.length > 0) return l;
        if (d.length === 0 && l.length === 0) return [];

        const eduMap = new Map();

        // 1. Anchor with structural education
        for (const edu of d) {
            const key = `${this.normalizeKey(edu.institution)}_${this.normalizeKey(edu.degree)}`;
            eduMap.set(key, {
                institution: edu.institution || '',
                degree: edu.degree || '',
                period: edu.period || '',
                description: edu.description || ''
            });
        }

        // 2. Enrich with LLM education
        for (const edu of l) {
            const key = `${this.normalizeKey(edu.institution)}_${this.normalizeKey(edu.degree)}`;
            if (eduMap.has(key)) {
                const existing = eduMap.get(key);
                if (!existing.period && edu.period) existing.period = edu.period;
                if (!existing.description && edu.description) existing.description = edu.description;
            } else {
                // If institution is empty, see if we can attach to an existing degree
                let matched = false;
                if (!edu.institution && edu.degree) {
                    for (const [, existing] of eduMap) {
                        if (this.normalizeKey(existing.degree) === this.normalizeKey(edu.degree)) {
                            if (!existing.period && edu.period) existing.period = edu.period;
                            if (!existing.description && edu.description) existing.description = edu.description;
                            matched = true;
                            break;
                        }
                    }
                }

                if (!matched) {
                    eduMap.set(key, {
                        institution: edu.institution || '',
                        degree: edu.degree || '',
                        period: edu.period || '',
                        description: edu.description || ''
                    });
                }
            }
        }

        return Array.from(eduMap.values());
    }

    static mergeProjects(detProj = [], llmProj = []) {
        const d = Array.isArray(detProj) ? detProj : [];
        const l = Array.isArray(llmProj) ? llmProj : [];

        if (d.length > 0 && l.length === 0) return d;
        if (d.length === 0 && l.length > 0) return l;
        if (d.length === 0 && l.length === 0) return [];

        const projectMap = new Map();

        // 1. Structural projects are the anchor
        for (const p of d) {
            const title = p.name || p.title || '';
            const key = this.normalizeKey(title);
            projectMap.set(key, {
                name: title,
                description: p.description || '',
                bullets: [...(p.bullets || [])]
            });
        }

        // 2. Enrich with LLM projects
        for (const p of l) {
            const title = p.name || p.title || '';
            const key = this.normalizeKey(title);
            if (projectMap.has(key)) {
                const existing = projectMap.get(key);
                if (!existing.description && p.description) {
                    existing.description = p.description;
                }
                if (existing.bullets.length === 0 && Array.isArray(p.bullets) && p.bullets.length > 0) {
                    existing.bullets = [...p.bullets];
                }
            } else {
                projectMap.set(key, {
                    name: title,
                    description: p.description || '',
                    bullets: [...(p.bullets || [])]
                });
            }
        }

        return Array.from(projectMap.values());
    }

    static mergeAll(detData = {}, llmData = {}, rawSections = {}) {
        let exps = this.mergeExperiences(detData.experiences, llmData.experiences);
        if (rawSections && rawSections.experience) {
            const ExperienceParser = require('./ExperienceParser');
            exps = ExperienceParser.enrichWithExplicitBullets(exps, rawSections.experience);
        }

        return {
            candidate: this.mergeCandidate(detData.candidate, llmData.candidate),
            professionalSummary: this.mergeSummary(detData.professionalSummary, llmData.professionalSummary),
            skills: this.mergeSkills(detData.skills, llmData.skills),
            experiences: exps,
            education: this.mergeEducation(detData.education, llmData.education),
            projects: this.mergeProjects(detData.projects, llmData.projects)
        };
    }
}

module.exports = ResumeMergeService;
