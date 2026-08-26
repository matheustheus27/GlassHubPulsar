const BlockFactory = require("../layout/BlockFactory");
const LayoutEngine = require("../layout/LayoutEngine");
const ContactLinkOptimizer = require("../layout/ContactLinkOptimizer");
const { getTheme } = require("../templates/themes");
const { getFontFaceStyles } = require("../layout/FontEmbedder");

class ResumeBuilderService {
  static build(resume, options = {}) {
    const settings = resume.settings || {};
    const debug = options.debug || false;
    const langBase = settings.language || resume.language || "pt";
    const cleanLang = langBase.split("-")[0];

    const p = resume.personalDetails || resume.personal?.personal || resume.personal || {};
    const summaryData = resume.summaryDetails || resume.summary || {};
    const skillsData = resume.skillsDetails || resume.skills || {};
    const experienceData = resume.experienceDetails || resume.experiences || {};
    const educationData = resume.educationDetails || resume.education || {};
    const projectsData = resume.projectDetails || resume.projects || {};

    // 1. Feed the sequential block queue for virtual pixel calculation
    const blocks = [];

    if (summaryData.summary) {
      blocks.push(BlockFactory.createSummary(summaryData));
    }

    const skillsList = skillsData.skills || (Array.isArray(skillsData) ? skillsData : []);
    if (skillsList.length > 0) {
      blocks.push(BlockFactory.createSkills({ skills: skillsList, title: skillsData.skillsTitle || skillsData.title || (cleanLang === 'pt' ? 'COMPETÊNCIAS & TECNOLOGIAS' : 'SKILLS & TECHNOLOGIES') }, settings));
    }

    const expList = experienceData.experiences || (Array.isArray(experienceData) ? experienceData : []);
    if (Array.isArray(expList)) {
      expList.forEach((exp) => {
        blocks.push(BlockFactory.createExperience(exp, settings));
      });
    }

    const eduList = educationData.educations || educationData.education || (Array.isArray(educationData) ? educationData : []);
    if (Array.isArray(eduList)) {
      eduList.forEach((edu) => {
        blocks.push(BlockFactory.createEducation(edu, settings));
      });
    }

    const projList = projectsData.projects || (Array.isArray(projectsData) ? projectsData : []);
    if (Array.isArray(projList)) {
      projList.forEach((proj) => {
        blocks.push(BlockFactory.createProjects(proj));
      });
    }

    // 2. Build header and calculate its realistic pixel height on Page 1
    const { headerHtml, headerHeight } = this.buildHeader(p, settings);

    // 3. Dynamic page height (safe A4 rendering budget of 960px prevents card overflowing bottom boundary)
    const pageHeight = options.pageHeight || this.calculatePageHeight(settings);
    const engine = new LayoutEngine(pageHeight, debug);
    const calculatedPages = engine.build(blocks, headerHeight);

    const summaryTitle = summaryData.summaryTitle || summaryData.title || (cleanLang === 'pt' ? 'RESUMO PROFISSIONAL' : 'PROFESSIONAL SUMMARY');
    const skillsTitle = skillsData.skillsTitle || skillsData.title || (cleanLang === 'pt' ? 'COMPETÊNCIAS & TECNOLOGIAS' : 'SKILLS & TECHNOLOGIES');
    const expTitle = experienceData.experienceTitle || experienceData.title || (cleanLang === 'pt' ? 'HISTÓRICO PROFISSIONAL' : 'PROFESSIONAL EXPERIENCE');
    const eduTitle = educationData.educationTitle || educationData.title || (cleanLang === 'pt' ? 'FORMAÇÃO ACADÊMICA' : 'ACADEMIC BACKGROUND');
    const projTitle = projectsData.projectTitle || projectsData.title || (cleanLang === 'pt' ? 'PROJETOS DE DESTAQUE' : 'FEATURED PROJECTS');

    // 4. HTML builder per physical sheet
    const pagesHtml = calculatedPages.map((page, index) => {
      const pageHeader = index === 0 ? `<div data-printable-section>${headerHtml}</div>` : "";

      let sectionsHtml = "";
      let currentType = null;
      let activeGroupHtml = "";

      page.sections.forEach((block) => {
        if (currentType !== block.type) {
          if (activeGroupHtml) {
            sectionsHtml += `<div class="glass-card" data-printable-section>${activeGroupHtml}</div>`;
            activeGroupHtml = "";
          }
          currentType = block.type;

          let sectionTitle = "";

          if (block.type === "summary") {
            sectionTitle = summaryTitle;
          } else if (block.type === "skills") {
            sectionTitle = skillsTitle;
          } else if (block.type === "experience") {
            sectionTitle = expTitle;
          } else if (block.type === "education") {
            sectionTitle = eduTitle;
          } else if (block.type === "projects") {
            sectionTitle = projTitle;
          }

          activeGroupHtml += `<div class="section-title" data-section-title>${sectionTitle}</div>`;
        }

        activeGroupHtml += `<div data-printable-item>${block.html}</div>`;
      });

      if (activeGroupHtml) {
        sectionsHtml += `<div class="glass-card" data-printable-section>${activeGroupHtml}</div>`;
      }

      return `
        <div class="a4-page">
          ${pageHeader}
          ${sectionsHtml}
        </div>
      `;
    }).join("");

    return `
      <!DOCTYPE html>
      <html lang="${cleanLang}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${p.name || "Curriculum"}</title>
        ${getFontFaceStyles()}
        ${this.styles(settings)}
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `;
  }

  static calculatePageHeight(settings = {}) {
    return 960;
  }

  static styles(settings = {}) {
    const activeTemplate = settings.template || settings.activeTemplate || "GlassModern";
    const themeModule = getTheme(activeTemplate);
    return themeModule.generateStyles(settings);
  }

  static buildHeader(p, settings = {}) {
    const card = settings.card || {};
    const contactItems = [];

    // Location
    if (p.location) {
      const locText = typeof p.location === 'string' ? p.location : (p.location.location || p.location.title || '');
      if (locText) {
        contactItems.push({
          title: locText,
          link: (typeof p.location === 'object' && p.location.link) ? p.location.link : `https://maps.google.com/?q=${encodeURIComponent(locText)}`,
          icon: "📍"
        });
      }
    }

    // Email & Phone
    if (p.contact?.email?.email) {
      contactItems.push({
        title: p.contact.email.email,
        link: `mailto:${p.contact.email.email}`,
        icon: "✉️"
      });
    }

    if (p.contact?.phone?.phone) {
      const cleanPhone = p.contact.phone.phone.replace(/\D/g, '');
      contactItems.push({
        title: p.contact.phone.phone,
        link: p.contact.phone.link || (cleanPhone ? `https://wa.me/${cleanPhone}` : '#'),
        icon: "📞"
      });
    }

    // Networking
    const net = p.contact?.networking || {};
    for (const [key, val] of Object.entries(net)) {
      if (val && (val.url || val.name)) {
        let displayTitle = val.name || key;
        let favicon = '';

        // If it's a portfolio or generic website link, extract the site name / domain
        if (val.url && (key.toLowerCase().includes('portfolio') || key.toLowerCase().includes('site') || key.toLowerCase().includes('web') || displayTitle.toLowerCase().includes('portfólio') || displayTitle.toLowerCase().includes('portfolio'))) {
          try {
            const parsed = new URL(val.url.startsWith('http') ? val.url : `https://${val.url}`);
            const domain = parsed.hostname.replace(/^www\./, '');
            displayTitle = (val.title && val.title !== 'Portfólio' && val.title !== 'Portfolio') ? val.title : domain;
            favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
          } catch (e) {
            displayTitle = val.url;
          }
        }

        contactItems.push({
          title: displayTitle,
          link: val.url || '#',
          icon: val.icon || key,
          favicon
        });
      }
    }

    // Direct Array contact fallback
    if (Array.isArray(p.contact)) {
      p.contact.forEach(c => {
        contactItems.push({
          title: c.title || c.name || c.email || c.phone || '',
          link: c.link || c.url || '#',
          icon: c.icon || ''
        });
      });
    }

    // Render balanced contact badges grid
    const contactsHtml = ContactLinkOptimizer.renderHtml(contactItems, 680, settings);
    const rows = ContactLinkOptimizer.balanceLinks(contactItems, 680);
    const badgesHeight = (rows.length * 28) + (rows.length > 1 ? (rows.length - 1) * 6 : 0);
    const headerHeight = Math.round(62 + badgesHeight + 14);

    const headerHtml = `
      <header style="margin-bottom: 6px; border-bottom: 1px solid ${card.borderColor || 'rgba(255,255,255,0.1)'}; padding-bottom: 10px;">
        <h1>${p.name || ""}</h1>
        <h2 class="candidate-subtitle">${p.title || ""}</h2>
        ${contactsHtml}
      </header>
    `;

    return { headerHtml, headerHeight };
  }

  static header(p, settings = {}) {
    return this.buildHeader(p, settings).headerHtml;
  }

  static debugPagination(resume) {
    const settings = resume.settings || {};

    const blocks = [];

    if (resume.summary?.summary) {
      blocks.push(BlockFactory.createSummary(resume.summary));
    }

    if (resume.skills?.skills) {
      blocks.push(BlockFactory.createSkills(resume.skills, settings));
    }

    if (Array.isArray(resume.experiences?.experiences)) {
      resume.experiences.experiences.forEach((exp) => {
        blocks.push(BlockFactory.createExperience(exp, settings));
      });
    }

    if (Array.isArray(resume.education?.education)) {
      resume.education.education.forEach((edu) => {
        blocks.push(BlockFactory.createEducation(edu, settings));
      });
    }

    if (Array.isArray(resume.projects?.projects)) {
      resume.projects.projects.forEach((proj) => {
        blocks.push(BlockFactory.createProjects(proj));
      });
    }

    const pageHeight = this.calculatePageHeight(settings);
    const engine = new LayoutEngine(pageHeight, true);
    const pages = engine.build(blocks);

    return {
      pageHeightPx: pageHeight,
      totalPages: pages.length,
      blocksCount: blocks.length,
      pagesSummary: pages.map((page, index) => ({
        pageNumber: index + 1,
        totalHeightPx: page.totalHeight,
        remainingSpacePx: pageHeight - page.totalHeight,
        blocks: page.sections.map(s => ({
          type: s.type,
          estimatedHeightPx: s.height
        }))
      }))
    };
  }
}

module.exports = ResumeBuilderService;