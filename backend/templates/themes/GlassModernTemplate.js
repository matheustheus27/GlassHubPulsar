/**
 * GlassModernTemplate
 * 
 * High-tech glassmorphism with vivid cyan/indigo glowing accents,
 * specular translucent borders, and modern typography.
 */

function generateStyles(s = {}) {
  const isLight = s.theme === 'light';
  const card = s.card || { borderColor: 'rgba(56, 189, 248, 0.25)', backgroundColor: 'rgba(15, 23, 42, 0.65)' };
  const title = s.title || { primary: {}, secondary: {} };
  const subtitle = s.subtitle || { primary: {}, secondary: {} };
  const caption = s.caption || { primary: {}, secondary: {} };
  const meta = s.meta || {};
  const chip = s.chip || {};

  return `
    <style>
      /* Fonts resolved via system cascade — no network calls in Docker/Puppeteer */

      @page { size: A4; margin: 0mm !important; }
      * { box-sizing: border-box; }
      
      html, body {
        margin: 0 !important; padding: 0 !important; width: 210mm; height: 297mm;
        background: ${s.backgroundColor || (isLight ? '#f4f8fa' : '#030712')} !important;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
      }

      body {
        font-family: ${caption.secondary.fontType || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
        color: ${caption.secondary.fontColor || (isLight ? '#334155' : '#e2e8f0')};
        font-size: ${caption.secondary.fontSize || '13px'};
        line-height: 1.5;
      }

      .a4-page {
        width: 210mm; height: 297mm; max-height: 297mm;
        page-break-after: always !important; break-after: always !important;
        background: ${s.backgroundColor || (isLight ? '#f4f8fa' : '#030712')} !important; 
        padding: 12mm 14mm;
        display: flex; flex-direction: column; gap: 8px;
        overflow: hidden; position: relative;
      }
      .a4-page:last-child { page-break-after: avoid !important; break-after: avoid !important; }

      .glass-card {
        background: ${card.backgroundColor} !important;
        border: 1px solid ${card.borderColor} !important;
        border-radius: 8px; padding: 12px 16px;
        display: flex; flex-direction: column; gap: 6px;
        box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.2);
        position: relative;
        break-inside: avoid !important; page-break-inside: avoid !important;
      }

      .item-block, .skill-group, .education-item, .experience-item, .project-item {
        break-inside: avoid !important; page-break-inside: avoid !important;
      }

      h1 { 
        font-family: ${title.primary.fontType || "'Inter', sans-serif"}; 
        font-size: ${title.primary.fontSize || '24px'}; 
        color: ${title.primary.fontColor || '#06b6d4'}; 
        font-weight: ${title.primary.fontWeight || '800'};
        margin: 0; padding: 0; text-transform: uppercase; letter-spacing: -0.5px;
        break-after: avoid !important; page-break-after: avoid !important;
      }

      h2.candidate-subtitle { 
        font-family: ${subtitle.primary.fontType || "'Inter', sans-serif"}; 
        font-size: ${subtitle.primary.fontSize || '12px'}; 
        color: ${isLight ? '#0f172a' : (subtitle.primary.fontColor || '#38bdf8')}; 
        font-weight: 800;
        margin: 0; text-transform: uppercase; letter-spacing: 1.5px;
      }

      .section-title { 
        font-family: ${title.secondary.fontType || "'Inter', sans-serif"};
        font-size: ${title.secondary.fontSize || '13px'}; 
        font-weight: ${title.secondary.fontWeight || '700'}; 
        color: ${title.secondary.fontColor || '#38bdf8'}; 
        text-transform: uppercase; letter-spacing: 1.5px;
        border-bottom: 1px solid ${card.borderColor}; 
        padding-bottom: 4px; margin-bottom: 2px; 
        break-after: avoid !important; page-break-after: avoid !important;
        break-inside: avoid !important; page-break-inside: avoid !important;
      }

      .contacts-balanced-grid {
        display: flex; flex-direction: column; gap: 6px; margin-top: 8px;
      }

      .contacts-row {
        display: flex; flex-wrap: nowrap; gap: 8px; align-items: center;
      }

      .contact-badge {
        font-family: ${meta.fontType || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
        font-size: ${meta.fontSize || '11px'};
        font-weight: 600;
        color: ${isLight ? '#0f172a' : (meta.fontColor || '#e2e8f0')};
        text-decoration: none;
        display: inline-flex; align-items: center; gap: 6px;
        background: ${isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.05)'};
        padding: 3px 8px; border-radius: 6px;
        border: 1px solid ${isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.12)'};
      }

      .contact-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        color: ${title.primary.fontColor || (isLight ? '#0284c7' : '#38bdf8')};
        border-color: ${title.primary.fontColor ? `${title.primary.fontColor}50` : 'transparent'};
      }

      .svg-icon {
        width: 13px;
        height: 13px;
        display: block;
      }

      .contact-text {
        vertical-align: middle;
      }

      .skill-group-title {
        font-family: ${subtitle.secondary.fontType || "'Inter', sans-serif"};
        font-size: ${subtitle.secondary.fontSize || '11px'};
        font-weight: ${subtitle.secondary.fontWeight || '700'};
        color: ${isLight ? '#0f172a' : (subtitle.secondary.fontColor || '#cbd5e1')};
        text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;
      }

      .badge {
        font-family: ${chip.fontType || "'Inter', sans-serif"};
        font-size: ${chip.fontSize || '11px'};
        font-weight: ${chip.fontWeight || '500'};
        color: ${chip.fontColor || (isLight ? '#0f172a' : '#f1f5f9')};
        background: ${chip.backgroundColor || (isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.7)')} !important;
        border: 1px solid ${chip.borderColor || 'rgba(56, 189, 248, 0.3)'} !important;
        padding: 3px 9px; border-radius: 6px; display: inline-flex;
      }

      .item-company {
        font-family: ${caption.primary.fontType || "'Inter', sans-serif"};
        font-size: ${caption.primary.fontSize || '14px'};
        font-weight: ${caption.primary.fontWeight || '700'};
        color: ${caption.primary.fontColor || (isLight ? '#0f172a' : '#f8fafc')};
      }

      .item-role {
        font-family: ${subtitle.primary.fontType || "'Inter', sans-serif"};
        font-size: ${subtitle.primary.fontSize || '12px'};
        font-weight: ${subtitle.primary.fontWeight || '600'};
        color: ${isLight ? '#0284c7' : (subtitle.primary.fontColor || '#38bdf8')};
        font-style: italic; margin-bottom: 4px;
      }

      .item-date { 
        font-family: ${meta.fontType || "'Inter', sans-serif"};
        font-size: ${meta.fontSize || '11px'};
        font-weight: ${meta.fontWeight || '700'};
        color: ${meta.fontColor || (isLight ? '#475569' : '#94a3b8')}; 
      }

      .items-holder { display: flex; flex-direction: column; gap: 12px; }
      .item-block { width: 100%; margin: 0 !important; padding: 0 !important; }

      .description-text, ul { 
        font-family: ${caption.secondary.fontType || "'Inter', sans-serif"};
        font-size: ${caption.secondary.fontSize || '13px'};
        color: ${caption.secondary.fontColor || (isLight ? '#334155' : '#cbd5e1')}; 
        text-align: justify; margin: 0;
      }
      ul { margin-left: 18px; padding: 0; }
      li { margin-bottom: 4px; }
    </style>
  `;
}

module.exports = {
  name: 'GlassModern',
  generateStyles
};
