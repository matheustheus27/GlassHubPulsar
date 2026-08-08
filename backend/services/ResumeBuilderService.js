const BlockFactory = require("../layout/BlockFactory");
const LayoutEngine = require("../layout/LayoutEngine");

class ResumeBuilderService {
  static build(resume, options = {}) {
    const settings = resume.settings || {};
    const debug = options.debug || false;
    const langBase = settings.language || "pt";
    const cleanLang = langBase.split("-")[0];

    const p = resume.personal?.personal || {};
    const summaryData = resume.summary || {};
    const skillsData = resume.skills || {};
    const experienceData = resume.experiences || {};
    const educationData = resume.education || {};
    const projectsData = resume.projects || {};

    // 1. Feed the sequential block queue for virtual pixel calculation
    const blocks = [];

    if (summaryData.summary) {
      blocks.push(BlockFactory.createSummary(summaryData));
    }

    if (skillsData.skills) {
      blocks.push(BlockFactory.createSkills(skillsData, settings));
    }

    if (Array.isArray(experienceData.experiences)) {
      experienceData.experiences.forEach((exp) => {
        blocks.push(BlockFactory.createExperience(exp, settings));
      });
    }

    if (Array.isArray(educationData.education)) {
      educationData.education.forEach((edu) => {
        blocks.push(BlockFactory.createEducation(edu, settings));
      });
    }

    if (Array.isArray(projectsData.projects)) {
      projectsData.projects.forEach((proj) => {
        blocks.push(BlockFactory.createProjects(proj));
      });
    }

    // 2. Use dynamic page height, calibrated from actual A4 layout
    const pageHeight = options.pageHeight || this.calculatePageHeight(settings);
    const engine = new LayoutEngine(pageHeight, debug);
    const calculatedPages = engine.build(blocks);

    const headerHtml = this.header(p, settings);

    let isExperienceRenderedBefore = false;
    let isEducationRenderedBefore = false;
    let isProjectsRenderedBefore = false;

    // 3. HTML builder per physical sheet
    const pagesHtml = calculatedPages.map((page, index) => {
      const pageHeader = index === 0 ? headerHtml : "";

      let sectionsHtml = "";
      let currentType = null;
      let activeGroupHtml = "";

      page.sections.forEach((block) => {
        if (currentType !== block.type) {
          if (activeGroupHtml) {
            sectionsHtml += `<div class="glass-card">${activeGroupHtml}</div>`;
            activeGroupHtml = "";
          }
          currentType = block.type;

          let sectionTitle = "";

          if (block.type === "summary") {
            sectionTitle = summaryData.title;
          }

          if (block.type === "skills") {
            sectionTitle = skillsData.title;
          }

          if (block.type === "experience") {
            if (isExperienceRenderedBefore) {
              sectionTitle = `${experienceData.title} <em>(${cleanLang === 'pt' ? 'Continuação' : 'Continued'})</em>`;
            } else {
              sectionTitle = experienceData.title;
              isExperienceRenderedBefore = true;
            }
          }

          if (block.type === "education") {
            if (isEducationRenderedBefore) {
              sectionTitle = `${educationData.title} <em>(${cleanLang === 'pt' ? 'Continuação' : 'Continued'})</em>`;
            } else {
              sectionTitle = educationData.title;
              isEducationRenderedBefore = true;
            }
          }

          if (block.type === "projects") {
            if (isProjectsRenderedBefore) {
              sectionTitle = `${projectsData.title} <em>(${cleanLang === 'pt' ? 'Continuação' : 'Continued'})</em>`;
            } else {
              sectionTitle = projectsData.title;
              isProjectsRenderedBefore = true;
            }
          }

          activeGroupHtml += `<div class="section-title">${sectionTitle}</div>`;
        }

        activeGroupHtml += block.html;
      });

      if (activeGroupHtml) {
        sectionsHtml += `<div class="glass-card">${activeGroupHtml}</div>`;
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
        <title>${p.name || "Curriculum"}</title>
        ${this.styles(settings)}
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `;
  }

  static calculatePageHeight(settings = {}) {
    const pagePaddingTop = 22; // mm
    const pagePaddingBottom = 22; // mm
    const pagePaddingLeft = 18; // mm
    const pagePaddingRight = 18; // mm

    const a4HeightMm = 297;
    const a4WidthMm = 210;

    const contentHeightMm = a4HeightMm - pagePaddingTop - pagePaddingBottom;
    const contentWidthMm = a4WidthMm - pagePaddingLeft - pagePaddingRight;

    const pxPerMm = 3.7795275591;
    const contentHeightPx = contentHeightMm * pxPerMm;
    const contentWidthPx = contentWidthMm * pxPerMm;

    return Math.round(contentHeightPx);
  }

  static styles(s) {
    // Garante fallbacks para evitar erros de leitura de propriedades indefinidas
    const card = s.card || { borderColor: 'transparent', backgroundColor: 'transparent' };
    const title = s.title || { primary: {}, secondary: {} };
    const subtitle = s.subtitle || { primary: {}, secondary: {} };
    const caption = s.caption || { primary: {}, secondary: {} };
    const meta = s.meta || {};
    const chip = s.chip || {};

    return `
      <style>
        @page { size: A4; margin: 0mm !important; }
        * { box-sizing: border-box; }
        
        html, body {
          margin: 0 !important; padding: 0 !important; width: 210mm; height: 297mm;
          background: ${s.backgroundColor || '#030712'} !important;
          -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
        }

        body {
          font-family: ${caption.secondary.fontType || 'system-ui'};
          color: ${caption.secondary.fontColor || '#f8fafc'};
          font-size: ${caption.secondary.fontSize || '13px'};
          line-height: 1.5;
        }

        .a4-page {
          width: 210mm; height: 297mm; max-height: 297mm;
          page-break-after: always !important; break-after: always !important;
          background: ${s.backgroundColor || '#030712'} !important; 
          padding: 22mm 18mm;
          display: flex; flex-direction: column; gap: 14px;
          overflow: hidden; position: relative;
        }
        .a4-page:last-child { page-break-after: avoid !important; break-after: avoid !important; }

        .glass-card {
          background: ${card.backgroundColor} !important;
          border: 1px solid ${card.borderColor} !important;
          border-radius: 12px; padding: 24px;
          display: flex; flex-direction: column; gap: 14px; /* Mantém o gap vertical padrão */
        }

        h1 { 
          font-family: ${title.primary.fontType}; 
          font-size: ${title.primary.fontSize}; 
          color: ${title.primary.fontColor}; 
          font-weight: ${title.primary.fontWeight || '700'};
          margin: 0; padding: 0; text-transform: uppercase; tracking-tight;
        }

        h2.candidate-subtitle { 
          font-family: ${subtitle.primary.fontType}; 
          font-size: ${subtitle.primary.fontSize}; 
          color: ${subtitle.primary.fontColor}; 
          font-weight: ${subtitle.primary.fontWeight || '700'};
          margin: 0; text-transform: uppercase; tracking-widest;
        }

        .section-title { 
          font-family: ${title.secondary.fontType};
          font-size: ${title.secondary.fontSize}; 
          font-weight: ${title.secondary.fontWeight || '700'}; 
          color: ${title.secondary.fontColor}; 
          text-transform: uppercase; tracking-wide;
          border-bottom: 1px solid ${card.borderColor}; 
          padding-bottom: 6px; margin-bottom: 2px; 
        }

        .contacts-grid { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 14px; }
        .contacts-grid a { 
          font-family: ${meta.fontType};
          font-size: ${meta.fontSize};
          font-weight: ${meta.fontWeight || '700'};
          color: ${meta.fontColor}; 
          text-decoration: none; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; 
        }

        .skill-group-title {
          font-family: ${subtitle.secondary.fontType};
          font-size: ${subtitle.secondary.fontSize};
          font-weight: ${subtitle.secondary.fontWeight || '700'};
          color: ${subtitle.secondary.fontColor};
          text-transform: uppercase; margin-bottom: 8px; tracking-wider;
        }

        .badge {
          font-family: ${chip.fontType};
          font-size: ${chip.fontSize};
          font-weight: ${chip.fontWeight || '500'};
          color: ${chip.fontColor};
          background: ${chip.backgroundColor} !important;
          border: 1px solid ${chip.borderColor || 'transparent'} !important;
          padding: 4px 10px; border-radius: 6px; display: inline-flex;
        }

        .item-company {
          font-family: ${caption.primary.fontType};
          font-size: ${caption.primary.fontSize};
          font-weight: ${caption.primary.fontWeight || '700'};
          color: ${caption.primary.fontColor};
        }

        .item-role {
          font-family: ${subtitle.primary.fontType};
          font-size: ${subtitle.primary.fontSize};
          font-weight: ${subtitle.primary.fontWeight || '600'};
          color: ${subtitle.primary.fontColor};
          font-style: italic; margin-bottom: 4px;
        }

        .item-date { 
          font-family: ${meta.fontType};
          font-size: ${meta.fontSize};
          font-weight: ${meta.fontWeight || '700'};
          color: ${meta.fontColor}; 
        }

        .items-holder { 
          display: flex; 
          flex-direction: column; 
          gap: 14px; 
        }
        
        .item-block {
          width: 100%;
          margin: 0 !important;
          padding: 0 !important;
        }

        .description-text, ul { 
          font-family: ${caption.secondary.fontType};
          font-size: ${caption.secondary.fontSize};
          color: ${caption.secondary.fontColor}; 
          text-align: justify; margin: 0;
        }
        ul { margin-left: 18px; padding: 0; }
        li { margin-bottom: 5px; }
      </style>
    `;
  }

  static header(p, s) {
    const card = s.card || {};
    const meta = s.meta || {};

    const contactsHtml = (p.contact || []).map(c => {
      let icon = "🔗";
      if (c.link.includes("mailto")) icon = c.icon || "✉️";
      if (c.link.includes("wa.me") || c.link.includes("phone")) icon = c.icon || "📞";
      if (c.link.includes("github")) icon = c.icon || "🐙";
      if (c.link.includes("linkedin")) icon = c.icon || "💼";

      return `<a href="${c.link}" target="_blank">${icon} ${c.title}</a>`;
    }).join("");

    const locationHtml = p.location
      ? `<a href="${p.location.link}" target="_blank">${p.location.icon || "📍"} ${p.location.title}</a>`
      : "";

    return `
      <header style="margin-bottom: 6px; border-bottom: 1px solid ${card.borderColor}; padding-bottom: 16px;">
        <h1>${p.name || ""}</h1>
        <h2 class="candidate-subtitle">${p.title || ""}</h2>
        <div class="contacts-grid">
          ${locationHtml}
          ${contactsHtml}
        </div>
      </header>
    `;
  }

  static debugPagination(resume) {
    const settings = resume.settings || {};

    // 1. Instantiate the blocks using BlockFactory with the actual height estimates
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

    // 2. Calculate the usable height A4
    const pageHeight = this.calculatePageHeight(settings);

    // 3. Runs the engine with debug logging enabled
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