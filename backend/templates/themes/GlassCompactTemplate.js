/**
 * GlassCompactTemplate
 */

function generateStyles(s = {}) {
  const isLight = s.theme === 'light';
  const card = s.card || { borderColor: isLight ? '#cbd5e1' : 'rgba(56, 189, 248, 0.25)', backgroundColor: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.6)' };
  const title = s.title || { primary: {}, secondary: {} };
  const subtitle = s.subtitle || { primary: {}, secondary: {} };
  const caption = s.caption || { primary: {}, secondary: {} };
  const meta = s.meta || {};
  const chip = s.chip || {};

  return `
    <style>
      @page { size: A4; margin: 0 !important; }
      * { box-sizing: border-box; }
      
      html, body {
        margin: 0 !important; padding: 0 !important; width: 210mm;
        background: ${s.backgroundColor || (isLight ? '#ffffff' : '#030712')} !important;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
      }

      body {
        font-family: ${caption.secondary.fontType || "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"};
        color: ${caption.secondary.fontColor || (isLight ? '#334155' : '#e2e8f0')};
        font-size: ${caption.secondary.fontSize || '12px'};
        line-height: 1.4;
      }

      .a4-page {
        width: 210mm;
        height: 297mm;
        max-height: 297mm;
        padding: 10mm 12mm;
        box-sizing: border-box;
        page-break-after: always !important;
        break-after: always !important;
        overflow: hidden;
        background: ${s.backgroundColor || (isLight ? '#ffffff' : '#030712')} !important;
        display: flex;
        flex-direction: column;
        gap: 6px;
        position: relative;
      }

      .a4-page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }

      .glass-card {
        background: ${card.backgroundColor} !important;
        border: 1px solid ${card.borderColor} !important;
        border-radius: 8px;
        padding: 10px 14px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        box-shadow: none !important;
        position: relative;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      .item-block, .skill-group, .education-item, .experience-item, .project-item {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      h1 { 
        font-family: ${title.primary.fontType || "'Roboto', sans-serif"}; 
        font-size: ${title.primary.fontSize || '22px'}; 
        color: ${title.primary.fontColor || (isLight ? '#0284c7' : '#06b6d4')}; 
        font-weight: 800;
        margin: 0; padding: 0; text-transform: uppercase; letter-spacing: -0.3px;
        break-after: avoid !important; page-break-after: avoid !important;
      }

      h2.candidate-subtitle { 
        font-family: ${subtitle.primary.fontType || "'Roboto', sans-serif"}; 
        font-size: ${subtitle.primary.fontSize || '11px'}; 
        color: ${isLight ? '#0f172a' : (subtitle.primary.fontColor || '#38bdf8')}; 
        font-weight: 800;
        margin: 3px 0 0 0; text-transform: uppercase; letter-spacing: 1.2px;
      }

      .section-title { 
        font-family: ${title.secondary.fontType || "'Roboto', sans-serif"};
        font-size: ${title.secondary.fontSize || '12px'}; 
        font-weight: 700; 
        color: ${title.secondary.fontColor || (isLight ? '#0284c7' : '#38bdf8')}; 
        text-transform: uppercase; letter-spacing: 1.2px;
        border-bottom: 1px solid ${card.borderColor}; 
        padding-bottom: 3px; margin-bottom: 2px; 
        break-after: avoid !important; page-break-after: avoid !important;
        break-inside: avoid !important; page-break-inside: avoid !important;
      }

      .contacts-balanced-grid { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
      .contacts-row { display: flex; flex-wrap: nowrap; gap: 6px; align-items: center; }

      .contact-badge {
        font-family: ${meta.fontType || "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"};
        font-size: ${meta.fontSize || '10px'};
        font-weight: 600;
        color: ${isLight ? '#0f172a' : (meta.fontColor || '#f8fafc')};
        text-decoration: none;
        display: inline-flex; align-items: center; gap: 5px;
        background: ${isLight ? 'rgba(241, 245, 249, 0.9)' : 'rgba(15, 23, 42, 0.75)'};
        padding: 3px 7px; border-radius: 5px;
        border: 1px solid ${isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.15)'};
      }

      .contact-icon-glass {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 4px;
        background: ${isLight ? 'rgba(37, 99, 235, 0.12)' : 'rgba(56, 189, 248, 0.15)'};
        border: 1px solid ${isLight ? 'rgba(37, 99, 235, 0.25)' : 'rgba(56, 189, 248, 0.35)'};
        color: ${isLight ? '#2563eb' : (title.primary.fontColor || '#38bdf8')};
        flex-shrink: 0;
      }

      .svg-icon {
        display: block;
      }

      .project-link-badge {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 2px 5px;
        border-radius: 4px;
        background: ${isLight ? 'rgba(37, 99, 235, 0.1)' : 'rgba(6, 182, 212, 0.15)'};
        border: 1px solid ${isLight ? 'rgba(37, 99, 235, 0.25)' : 'rgba(6, 182, 212, 0.35)'};
        color: ${isLight ? '#2563eb' : '#38bdf8'} !important;
        font-size: 10px;
        font-weight: 600;
        text-decoration: none;
        vertical-align: middle;
      }

      .skill-group-title {
        font-family: ${subtitle.secondary.fontType || "'Roboto', sans-serif"};
        font-size: ${subtitle.secondary.fontSize || '10px'};
        font-weight: ${subtitle.secondary.fontWeight || '700'};
        color: ${isLight ? '#0f172a' : (subtitle.secondary.fontColor || '#cbd5e1')};
        text-transform: uppercase; margin-bottom: 3px; letter-spacing: 1px;
      }

      .badge {
        font-family: ${chip.fontType || "'Roboto', sans-serif"};
        font-size: ${chip.fontSize || '10px'};
        font-weight: 500;
        color: ${chip.fontColor || (isLight ? '#0f172a' : '#f1f5f9')};
        background: ${chip.backgroundColor || (isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.7)')} !important;
        border: 1px solid ${chip.borderColor || 'rgba(56, 189, 248, 0.3)'} !important;
        padding: 2px 6px; border-radius: 4px; display: inline-flex;
      }

      .item-company {
        font-family: ${caption.primary.fontType || "'Roboto', sans-serif"};
        font-size: ${caption.primary.fontSize || '13px'};
        font-weight: 700;
        color: ${caption.primary.fontColor || (isLight ? '#0f172a' : '#f8fafc')};
      }

      .item-role {
        font-family: ${subtitle.primary.fontType || "'Roboto', sans-serif"};
        font-size: ${subtitle.primary.fontSize || '11px'};
        font-weight: 600;
        color: ${isLight ? '#0284c7' : (subtitle.primary.fontColor || '#38bdf8')};
        font-style: italic; margin-bottom: 2px;
      }

      .item-date { 
        font-family: ${meta.fontType || "'Roboto', sans-serif"};
        font-size: ${meta.fontSize || '10px'};
        font-weight: 700;
        color: ${meta.fontColor || (isLight ? '#475569' : '#94a3b8')}; 
      }

      .items-holder { display: flex; flex-direction: column; gap: 8px; }
      .item-block { width: 100%; margin: 0 !important; padding: 0 !important; }

      .description-text, ul { 
        font-family: ${caption.secondary.fontType || "'Roboto', sans-serif"};
        font-size: ${caption.secondary.fontSize || '12px'};
        color: ${caption.secondary.fontColor || (isLight ? '#334155' : '#cbd5e1')}; 
        text-align: justify; margin: 0;
      }
      ul { margin-left: 16px; padding: 0; }
      li { margin-bottom: 3px; }
    </style>
  `;
}

module.exports = {
  name: 'GlassCompact',
  generateStyles
};
