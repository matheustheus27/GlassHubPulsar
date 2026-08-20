/**
 * GlassMinimalistTemplate
 */

function generateStyles(s = {}) {
  const isLight = s.theme === 'light';
  const card = s.card || { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.03)' };
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
        background: ${s.backgroundColor || (isLight ? '#ffffff' : '#050505')} !important;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
      }

      body {
        font-family: ${caption.secondary.fontType || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
        color: ${caption.secondary.fontColor || (isLight ? '#334155' : '#e5e7eb')};
        font-size: ${caption.secondary.fontSize || '13px'};
        line-height: 1.5;
      }

      .a4-page {
        width: 210mm; height: 297mm; max-height: 297mm;
        page-break-after: always !important; break-after: always !important;
        background: ${s.backgroundColor || (isLight ? '#ffffff' : '#050505')} !important; 
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
        position: relative;
      }

      h1 { 
        font-family: ${title.primary.fontType || "'Inter', sans-serif"}; 
        font-size: ${title.primary.fontSize || '24px'}; 
        color: ${isLight ? '#0f172a' : (title.primary.fontColor || '#f8fafc')}; 
        font-weight: 800;
        margin: 0; padding: 0; text-transform: uppercase; letter-spacing: 0px;
      }

      h2.candidate-subtitle { 
        font-family: ${subtitle.primary.fontType || "'Inter', sans-serif"}; 
        font-size: ${subtitle.primary.fontSize || '12px'}; 
        color: ${isLight ? '#0f172a' : (subtitle.primary.fontColor || '#9ca3af')}; 
        font-weight: 700;
        margin: 0; text-transform: uppercase; letter-spacing: 1.5px;
      }

      .section-title { 
        font-family: ${title.secondary.fontType || "'Inter', sans-serif"};
        font-size: ${title.secondary.fontSize || '13px'}; 
        font-weight: 700; 
        color: ${isLight ? '#0f172a' : (title.secondary.fontColor || '#f3f4f6')}; 
        text-transform: uppercase; letter-spacing: 1.5px;
        border-bottom: 1px solid ${card.borderColor}; 
        padding-bottom: 4px; margin-bottom: 2px; 
      }

      .contacts-balanced-grid { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
      .contacts-row { display: flex; flex-wrap: nowrap; gap: 8px; align-items: center; }

      .contact-badge {
        font-family: ${meta.fontType || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
        font-size: ${meta.fontSize || '11px'};
        font-weight: 600;
        color: ${isLight ? '#0f172a' : (meta.fontColor || '#d1d5db')};
        text-decoration: none;
        display: inline-flex; align-items: center; gap: 6px;
        background: ${isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.04)'};
        padding: 3px 8px; border-radius: 4px;
        border: 1px solid ${isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.08)'};
      }

      .contact-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        color: ${isLight ? '#0284c7' : (subtitle.primary.fontColor || '#9ca3af')};
      }

      .svg-icon {
        width: 13px;
        height: 13px;
        display: block;
      }

      .contact-text { vertical-align: middle; }

      .badge {
        font-family: ${chip.fontType || "'Inter', sans-serif"};
        font-size: ${chip.fontSize || '10px'};
        font-weight: 500;
        color: ${chip.fontColor || (isLight ? '#0f172a' : '#f3f4f6')};
        background: ${chip.backgroundColor || (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)')} !important;
        border: 1px solid ${chip.borderColor || (isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.15)')} !important;
        padding: 2px 7px; border-radius: 4px; display: inline-flex;
      }

      .item-company {
        font-family: ${caption.primary.fontType || "'Inter', sans-serif"};
        font-size: ${caption.primary.fontSize || '13px'};
        font-weight: 700;
        color: ${caption.primary.fontColor || (isLight ? '#0f172a' : '#f9fafb')};
      }

      .item-role {
        font-family: ${subtitle.primary.fontType || "'Inter', sans-serif"};
        font-size: ${subtitle.primary.fontSize || '12px'};
        font-weight: 600;
        color: ${isLight ? '#475569' : (subtitle.primary.fontColor || '#9ca3af')};
        margin-bottom: 2px;
      }

      .item-date { 
        font-family: ${meta.fontType || "'Inter', sans-serif"};
        font-size: ${meta.fontSize || '10px'};
        font-weight: 600;
        color: ${meta.fontColor || (isLight ? '#64748b' : '#6b7280')}; 
      }

      .items-holder { display: flex; flex-direction: column; gap: 10px; }
      .item-block { width: 100%; margin: 0 !important; padding: 0 !important; }

      .description-text, ul { 
        font-family: ${caption.secondary.fontType || "'Inter', sans-serif"};
        font-size: ${caption.secondary.fontSize || '12px'};
        color: ${caption.secondary.fontColor || (isLight ? '#334155' : '#d1d5db')}; 
        text-align: justify; margin: 0;
      }
      ul { margin-left: 16px; padding: 0; }
      li { margin-bottom: 3px; }
    </style>
  `;
}

module.exports = {
  name: 'GlassMinimalist',
  generateStyles
};
