/**
 * GlassCompactTemplate
 */

function generateStyles(s = {}) {
  const isLight = s.theme === 'light';
  const card = s.card || { borderColor: 'rgba(56, 189, 248, 0.25)', backgroundColor: 'rgba(15, 23, 42, 0.6)' };
  const title = s.title || { primary: {}, secondary: {} };
  const subtitle = s.subtitle || { primary: {}, secondary: {} };
  const caption = s.caption || { primary: {}, secondary: {} };
  const meta = s.meta || {};
  const chip = s.chip || {};

  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Outfit:wght@100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');

      @page { size: A4; margin: 0mm !important; }
      * { box-sizing: border-box; }
      
      html, body {
        margin: 0 !important; padding: 0 !important; width: 210mm; height: 297mm;
        background: ${s.backgroundColor || (isLight ? '#f8fafc' : '#030712')} !important;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
      }

      body {
        font-family: ${caption.secondary.fontType || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
        color: ${caption.secondary.fontColor || (isLight ? '#334155' : '#cbd5e1')};
        font-size: 11.5px;
        line-height: 1.35;
      }

      .a4-page {
        width: 210mm; height: 297mm; max-height: 297mm;
        page-break-after: always !important; break-after: always !important;
        background: ${s.backgroundColor || (isLight ? '#f8fafc' : '#030712')} !important; 
        padding: 10mm 12mm;
        display: flex; flex-direction: column; gap: 6px;
        overflow: hidden; position: relative;
      }
      .a4-page:last-child { page-break-after: avoid !important; break-after: avoid !important; }

      .glass-card {
        background: ${card.backgroundColor} !important;
        border: 1px solid ${card.borderColor} !important;
        border-radius: 6px; padding: 10px 14px;
        display: flex; flex-direction: column; gap: 6px;
        position: relative;
      }

      h1 { 
        font-family: ${title.primary.fontType || "'Inter', sans-serif"}; 
        font-size: 20px; 
        color: ${title.primary.fontColor || '#38bdf8'}; 
        font-weight: 800;
        margin: 0; padding: 0; text-transform: uppercase; letter-spacing: -0.5px;
      }

      h2.candidate-subtitle { 
        font-family: ${subtitle.primary.fontType || "'Inter', sans-serif"}; 
        font-size: 11px; 
        color: ${isLight ? '#0f172a' : (subtitle.primary.fontColor || '#7dd3fc')}; 
        font-weight: 800;
        margin: 0; text-transform: uppercase; letter-spacing: 1px;
      }

      .section-title { 
        font-family: ${title.secondary.fontType || "'Inter', sans-serif"};
        font-size: 12px; 
        font-weight: 700; 
        color: ${title.secondary.fontColor || '#38bdf8'}; 
        text-transform: uppercase; letter-spacing: 1px;
        border-bottom: 1px solid ${card.borderColor}; 
        padding-bottom: 3px; margin-bottom: 2px; 
      }

      .contacts-balanced-grid { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
      .contacts-row { display: flex; flex-wrap: nowrap; gap: 8px; align-items: center; }

      .contact-badge {
        font-family: ${meta.fontType || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
        font-size: 10px;
        font-weight: 600;
        color: ${isLight ? '#0f172a' : (meta.fontColor || '#e2e8f0')};
        text-decoration: none;
        display: inline-flex; align-items: center; gap: 4px;
        background: ${isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.04)'};
        padding: 2px 7px; border-radius: 4px;
        border: 1px solid ${isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.1)'};
      }

      .contact-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 13px;
        height: 13px;
        color: ${isLight ? '#0284c7' : (subtitle.primary.fontColor || '#38bdf8')};
      }

      .svg-icon {
        width: 12px;
        height: 12px;
        display: block;
      }

      .contact-text { vertical-align: middle; }

      .badge {
        font-family: ${chip.fontType || "'Inter', sans-serif"};
        font-size: 9.5px;
        font-weight: 500;
        color: ${chip.fontColor || (isLight ? '#0f172a' : '#f1f5f9')};
        background: ${chip.backgroundColor || (isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.7)')} !important;
        border: 1px solid ${chip.borderColor || 'rgba(56, 189, 248, 0.3)'} !important;
        padding: 2px 6px; border-radius: 4px; display: inline-flex;
      }

      .item-company {
        font-family: ${caption.primary.fontType || "'Inter', sans-serif"};
        font-size: 12px;
        font-weight: 700;
        color: ${caption.primary.fontColor || (isLight ? '#0f172a' : '#f8fafc')};
      }

      .item-role {
        font-family: ${subtitle.primary.fontType || "'Inter', sans-serif"};
        font-size: 10.5px;
        font-weight: 600;
        color: ${isLight ? '#0284c7' : (subtitle.primary.fontColor || '#38bdf8')};
        margin-bottom: 2px;
      }

      .item-date { 
        font-family: ${meta.fontType || "'Inter', sans-serif"};
        font-size: 9.5px;
        font-weight: 600;
        color: ${meta.fontColor || (isLight ? '#475569' : '#94a3b8')}; 
      }

      .items-holder { display: flex; flex-direction: column; gap: 8px; }
      .item-block { width: 100%; margin: 0 !important; padding: 0 !important; }

      .description-text, ul { 
        font-family: ${caption.secondary.fontType || "'Inter', sans-serif"};
        font-size: 11px;
        color: ${caption.secondary.fontColor || (isLight ? '#334155' : '#cbd5e1')}; 
        text-align: justify; margin: 0;
      }
      ul { margin-left: 14px; padding: 0; }
      li { margin-bottom: 2px; }
    </style>
  `;
}

module.exports = {
  name: 'GlassCompact',
  generateStyles
};
