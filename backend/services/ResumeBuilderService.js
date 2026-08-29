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

    const summaryTitle = summaryData.summaryTitle || summaryData.title || (cleanLang === 'pt' ? 'RESUMO PROFISSIONAL' : 'PROFESSIONAL SUMMARY');
    const skillsTitle = skillsData.skillsTitle || skillsData.title || (cleanLang === 'pt' ? 'COMPETÊNCIAS & TECNOLOGIAS' : 'SKILLS & TECHNOLOGIES');
    const expTitle = experienceData.experienceTitle || experienceData.title || (cleanLang === 'pt' ? 'HISTÓRICO PROFISSIONAL' : 'PROFESSIONAL EXPERIENCE');
    const eduTitle = educationData.educationTitle || educationData.title || (cleanLang === 'pt' ? 'FORMAÇÃO ACADÊMICA' : 'ACADEMIC BACKGROUND');
    const projTitle = projectsData.projectTitle || projectsData.title || (cleanLang === 'pt' ? 'PROJETOS DE DESTAQUE' : 'FEATURED PROJECTS');

    // 1. Build Header and compute realistic pixel height on Page 1
    const { headerHtml, headerHeight } = this.buildHeader(p, settings);

    // 2. Assemble atomic block queues grouped by section
    const sections = [];

    // Summary
    if (summaryData.summary) {
      sections.push({
        type: "summary",
        title: summaryTitle,
        blocks: [BlockFactory.createSummary(summaryData)]
      });
    }

    // Skills
    const skillsList = skillsData.skills || (Array.isArray(skillsData) ? skillsData : []);
    if (skillsList.length > 0) {
      sections.push({
        type: "skills",
        title: skillsTitle,
        blocks: [BlockFactory.createSkills({ skills: skillsList, title: skillsTitle }, settings)]
      });
    }

    // Experience
    const expList = experienceData.experiences || (Array.isArray(experienceData) ? experienceData : []);
    if (Array.isArray(expList) && expList.length > 0) {
      sections.push({
        type: "experience",
        title: expTitle,
        blocks: expList.map(exp => BlockFactory.createExperience(exp, settings))
      });
    }

    // Education
    const eduList = educationData.educations || educationData.education || (Array.isArray(educationData) ? educationData : []);
    if (Array.isArray(eduList) && eduList.length > 0) {
      sections.push({
        type: "education",
        title: eduTitle,
        blocks: eduList.map(edu => BlockFactory.createEducation(edu, settings))
      });
    }

    // Projects
    const projList = projectsData.projects || (Array.isArray(projectsData) ? projectsData : []);
    if (Array.isArray(projList) && projList.length > 0) {
      sections.push({
        type: "projects",
        title: projTitle,
        blocks: projList.map(proj => BlockFactory.createProjects(proj))
      });
    }

    // 3. Deterministic Page Allocation with Section Splitting
    const pageHeight = options.pageHeight || this.calculatePageHeight(settings);
    const engine = new LayoutEngine(pageHeight, debug);
    const calculatedPages = engine.build(sections, headerHeight);

    // 4. Render HTML sheets per physical A4 page with closed, independent cards
    const pagesHtml = calculatedPages.map((page, pageIndex) => {
      const pageHeaderHtml = pageIndex === 0 ? `<div data-printable-section>${headerHtml}</div>` : "";

      const cardsHtml = page.cards.map((card) => {
        const itemsHtml = card.blocks.map(b => `<div class="item-block" data-printable-item>${b.html}</div>`).join("");

        return `
          <div class="glass-card glass-card-${card.type}" data-printable-section>
            <div class="section-title" data-section-title>${card.title}</div>
            <div class="items-holder">${itemsHtml}</div>
          </div>
        `;
      }).join("");

      return `
        <div class="a4-page">
          ${pageHeaderHtml}
          ${cardsHtml}
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
    // 297mm height at standard 96 DPI is ~1123px.
    // Margins (12mm top + 14mm bottom) is ~98px.
    // Usable printable content budget is ~1010px.
    return 1000;
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
          icon: "location"
        });
      }
    }

    // Email & Phone
    if (p.contact?.email?.email) {
      contactItems.push({
        title: p.contact.email.email,
        link: `mailto:${p.contact.email.email}`,
        icon: "email"
      });
    }

    if (p.contact?.phone?.phone) {
      const cleanPhone = p.contact.phone.phone.replace(/\D/g, '');
      contactItems.push({
        title: p.contact.phone.phone,
        link: p.contact.phone.link || (cleanPhone ? `https://wa.me/${cleanPhone}` : '#'),
        icon: "phone"
      });
    }

    // Networking
    const net = p.contact?.networking || {};
    for (const [key, val] of Object.entries(net)) {
      if (val && (val.url || val.name)) {
        let displayTitle = val.name || key;
        let favicon = '';

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
    const headerHeight = Math.round(60 + badgesHeight + 14);

    const headerHtml = `
      <header style="margin-bottom: 8px; border-bottom: 1px solid ${card.borderColor || 'rgba(255,255,255,0.1)'}; padding-bottom: 12px;">
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
    const summaryData = resume.summaryDetails || resume.summary || {};
    const skillsData = resume.skillsDetails || resume.skills || {};
    const experienceData = resume.experienceDetails || resume.experiences || {};
    const educationData = resume.educationDetails || resume.education || {};
    const projectsData = resume.projectDetails || resume.projects || {};

    const sections = [];

    if (summaryData.summary) {
      sections.push({
        type: "summary",
        title: summaryData.summaryTitle || "RESUMO PROFISSIONAL",
        blocks: [BlockFactory.createSummary(summaryData)]
      });
    }

    const skillsList = skillsData.skills || (Array.isArray(skillsData) ? skillsData : []);
    if (skillsList.length > 0) {
      sections.push({
        type: "skills",
        title: skillsData.skillsTitle || "COMPETÊNCIAS & TECNOLOGIAS",
        blocks: [BlockFactory.createSkills({ skills: skillsList }, settings)]
      });
    }

    const expList = experienceData.experiences || (Array.isArray(experienceData) ? experienceData : []);
    if (Array.isArray(expList) && expList.length > 0) {
      sections.push({
        type: "experience",
        title: experienceData.experienceTitle || "HISTÓRICO PROFISSIONAL",
        blocks: expList.map(exp => BlockFactory.createExperience(exp, settings))
      });
    }

    const eduList = educationData.educations || educationData.education || (Array.isArray(educationData) ? educationData : []);
    if (Array.isArray(eduList) && eduList.length > 0) {
      sections.push({
        type: "education",
        title: educationData.educationTitle || "FORMAÇÃO ACADÊMICA",
        blocks: eduList.map(edu => BlockFactory.createEducation(edu, settings))
      });
    }

    const projList = projectsData.projects || (Array.isArray(projectsData) ? projectsData : []);
    if (Array.isArray(projList) && projList.length > 0) {
      sections.push({
        type: "projects",
        title: projectsData.projectTitle || "PROJETOS DE DESTAQUE",
        blocks: projList.map(proj => BlockFactory.createProjects(proj))
      });
    }

    const { headerHeight } = this.buildHeader(resume.personalDetails || {}, settings);
    const pageHeight = this.calculatePageHeight(settings);
    const engine = new LayoutEngine(pageHeight, true);
    const pages = engine.build(sections, headerHeight);

    return {
      pageHeightPx: pageHeight,
      totalPages: pages.length,
      sectionsCount: sections.length,
      pagesSummary: pages.map((page, index) => ({
        pageNumber: index + 1,
        usedHeightPx: page.usedHeight,
        remainingSpacePx: page.remainingHeight(),
        cards: page.cards.map(c => ({
          type: c.type,
          title: c.title,
          blocksCount: c.blocks.length
        }))
      }))
    };
  }
}

module.exports = ResumeBuilderService;