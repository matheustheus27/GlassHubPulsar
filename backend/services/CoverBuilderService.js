const BlockFactory = require("../layout/BlockFactory");
const LayoutEngine = require("../layout/LayoutEngine");
const ContactLinkOptimizer = require("../layout/ContactLinkOptimizer");
const { getTheme } = require("../templates/themes");

class CoverBuilderService {
  static build(cover, options = {}) {
    const settings = cover.settings || {};
    const debug = options.debug || false;
    const langBase = settings.language || "pt";
    const cleanLang = langBase.split("-")[0];
    
    const p = cover.personal?.personal || {};

    // 1. Feed the sequential block queue for virtual pixel calculation
    const blocks = [];

    if (cover) {
      blocks.push(BlockFactory.createCover(cover));
    }

    // 2. Use dynamic page height, calibrated from actual A4 layout
    const pageHeight = options.pageHeight || this.calculatePageHeight(settings);
    const engine = new LayoutEngine(pageHeight, debug);
    const calculatedPages = engine.build(blocks);

    const headerHtml = this.header(p, settings);

    // 3. HTML builder per physical sheet
    const pagesHtml = calculatedPages.map((page, index) => {
      const pageHeader = index === 0 ? headerHtml : "";
      
      let sectionsHtml = "";
      let activeGroupHtml = "";

      page.sections.forEach((block) => {
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
        <title>${p.name || "Cover Letter"}</title>
        ${this.styles(settings)}
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `;
  }

  static calculatePageHeight(settings = {}) {
    const pagePaddingTop = 20; // mm
    const pagePaddingBottom = 20; // mm
    const pagePaddingLeft = 18; // mm
    const pagePaddingRight = 18; // mm

    const a4HeightMm = 297;
    const contentHeightMm = a4HeightMm - pagePaddingTop - pagePaddingBottom;
    const pxPerMm = 3.7795275591;
    return Math.round(contentHeightMm * pxPerMm);
  }

  static styles(settings = {}) {
    const activeTemplate = settings.template || settings.activeTemplate || "GlassModern";
    const themeModule = getTheme(activeTemplate);
    return themeModule.generateStyles(settings);
  }

  static header(p, settings = {}) {
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

    if (Array.isArray(p.contact)) {
      p.contact.forEach(c => {
        contactItems.push({
          title: c.title || c.name || c.email || c.phone || '',
          link: c.link || c.url || '#',
          icon: c.icon || ''
        });
      });
    }

    const contactsHtml = ContactLinkOptimizer.renderHtml(contactItems, 680, settings);

    return `
      <header style="margin-bottom: 6px; border-bottom: 1px solid ${card.borderColor || 'rgba(255,255,255,0.1)'}; padding-bottom: 10px;">
        <h1>${p.name || ""}</h1>
        <h2 class="candidate-subtitle">${p.title || ""}</h2>
        ${contactsHtml}
      </header>
    `;
  }
}

module.exports = CoverBuilderService;