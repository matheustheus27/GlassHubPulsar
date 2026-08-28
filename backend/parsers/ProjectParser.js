/**
 * ProjectParser
 * Deterministically parses featured and personal project entries.
 * Extracts: name, technologies/description line, and bullet points verbatim.
 */

class ProjectParser {
    /**
     * Check if a line is a bullet item
     */
    static isBullet(line) {
        if (!line) return false;
        const trimmed = line.trim();
        return /^[\-•\*]\s+/.test(trimmed) || /^[•\-*]/.test(trimmed);
    }

    /**
     * Parse projects section into structured project objects.
     * @param {string} projectsSectionText
     * @returns {Array<{ name: string, description: string, bullets: string[] }>}
     */
    static parseProjects(projectsSectionText) {
        if (!projectsSectionText || typeof projectsSectionText !== 'string') {
            return [];
        }

        const lines = projectsSectionText.split('\n').map(l => l.trim());
        const projects = [];

        let currentProject = null;
        let readingBullets = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) {
                // Empty line might separate projects or bullets
                continue;
            }

            if (this.isBullet(line)) {
                // Bullet line
                const bulletText = line.replace(/^[\-•\*\s]+/, '').trim();
                if (bulletText) {
                    if (currentProject) {
                        currentProject.bullets.push(bulletText);
                        readingBullets = true;
                    }
                }
            } else {
                // Non-bullet line
                // If we were already reading bullets and encounter a new non-bullet line, this is a new project title!
                if (readingBullets && currentProject && currentProject.bullets.length > 0) {
                    projects.push(currentProject);
                    currentProject = {
                        name: line.replace(/^[#*\s]+/, '').replace(/[#*\s]+$/, '').trim(),
                        description: '',
                        bullets: []
                    };
                    readingBullets = false;
                } else if (!currentProject) {
                    // First project title
                    currentProject = {
                        name: line.replace(/^[#*\s]+/, '').replace(/[#*\s]+$/, '').trim(),
                        description: '',
                        bullets: []
                    };
                    readingBullets = false;
                } else if (!currentProject.description && currentProject.bullets.length === 0) {
                    // Line immediately following title before any bullets -> description/tech stack
                    currentProject.description = line;
                } else if (currentProject.description && currentProject.bullets.length === 0) {
                    // Additional description line or tech stack
                    currentProject.description += ` ${line}`;
                } else {
                    // New project encountered
                    projects.push(currentProject);
                    currentProject = {
                        name: line.replace(/^[#*\s]+/, '').replace(/[#*\s]+$/, '').trim(),
                        description: '',
                        bullets: []
                    };
                    readingBullets = false;
                }
            }
        }

        if (currentProject && (currentProject.name || currentProject.bullets.length > 0)) {
            projects.push(currentProject);
        }

        return projects.map(p => ({
            name: p.name.trim(),
            description: p.description.trim(),
            bullets: p.bullets.map(b => b.trim()).filter(Boolean)
        })).filter(p => p.name.length > 0);
    }
}

module.exports = ProjectParser;
