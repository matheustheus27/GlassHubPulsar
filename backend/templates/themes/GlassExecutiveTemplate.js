/**
 * GlassExecutiveTemplate
 */

function generateStyles(s = {}) {
  const isLight = s.theme === 'light';
  const card = s.card || { borderColor: isLight ? '#cbd5e1' : 'rgba(245, 158, 11, 0.3)', backgroundColor: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)' };
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
        background: ${s.backgroundColor || (isLight ? '#ffffff' : '#0a0a0f')} !important;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
      }

      body {
        font-family: ${caption.secondary.fontType || "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"};
        color: ${caption.secondary.fontColor || (isLight ? '#334155' : '#e2e8f0')};
        font-size: ${caption.secondary.fontSize || '13px'};
        line-height: 1.5;
      }

      .a4-page {
        width: 210mm;
        height: 297mm;
        max-height: 297mm;
        padding: 12mm 14mm;
        box-sizing: border-box;
        page-break-after: always !important;
        break-after: always !important;
        overflow: hidden;
        background: ${s.backgroundColor || (isLight ? '#ffffff' : '#0a0a0f')} !important;
        display: flex;
        flex-direction: column;
        gap: 8px;
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
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
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
        font-size: ${title.primary.fontSize || '24px'}; 
        color: ${title.primary.fontColor || '#f59e0b'}; 
        font-weight: 800;
        margin: 0; padding: 0; text-transform: uppercase; letter-spacing: 0.5px;
        break-after: avoid !important; page-break-after: avoid !important;
      }

      h2.candidate-subtitle { 
        font-family: ${subtitle.primary.fontType || "'Roboto', sans-serif"}; 
        font-size: ${subtitle.primary.fontSize || '12px'}; 
        color: ${isLight ? '#0f172a' : (subtitle.primary.fontColor || '#fbbf24')}; 
        font-weight: 800;
        margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 2px;
      }

      .section-title { 
        font-family: ${title.secondary.fontType || "'Roboto', sans-serif"};
        font-size: ${title.secondary.fontSize || '13px'}; 
        font-weight: 700; 
        color: ${title.secondary.fontColor || '#f59e0b'}; 
        text-transform: uppercase; letter-spacing: 1.5px;
        border-bottom: 2px solid ${card.borderColor}; 
        padding-bottom: 4px; margin-bottom: 2px; 
        break-after: avoid !important; page-break-after: avoid !important;
        break-inside: avoid !important; page-break-inside: avoid !important;
      }

      .contacts-balanced-grid { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
      .contacts-row { display: flex; flex-wrap: nowrap; gap: 8px; align-items: center; }

      .contact-badge {
        font-family: ${meta.fontType || "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"};
        font-size: ${meta.fontSize || '11px'};
        font-weight: 600;
        color: ${isLight ? '#0f172a' : (meta.fontColor || '#fde68a')};
        text-decoration: none;
        display: inline-flex; align-items: center; gap: 6px;
        background: ${isLight ? 'rgba(241, 245, 249, 0.9)' : 'rgba(245, 158, 11, 0.08)'};
        padding: 3px 8px; border-radius: 6px;
        border: 1px solid ${isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(245, 158, 11, 0.25)'};
      }

      .contact-icon-glass {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 5px;
        background: ${isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.15)'};
        border: 1px solid ${isLight ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.35)'};
        color: ${title.primary.fontColor || (isLight ? '#b45309' : '#fbbf24')};
        flex-shrink: 0;
      }

      .svg-icon {
        display: block;
      }

      .project-link-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 7px;
        border-radius: 5px;
        background: ${isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.15)'};
        border: 1px solid ${isLight ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.35)'};
        color: ${title.primary.fontColor || '#fbbf24'} !important;
        font-size: 11px;
        font-weight: 600;
        text-decoration: none;
        vertical-align: middle;
      }

      .skill-group-title {
        font-family: ${subtitle.secondary.fontType || "'Roboto', sans-serif"};
        font-size: ${subtitle.secondary.fontSize || '11px'};
        font-weight: ${subtitle.secondary.fontWeight || '700'};
        color: ${isLight ? '#0f172a' : (subtitle.secondary.fontColor || '#cbd5e1')};
        text-transform: uppercase; margin-bottom: 4px; letter-spacing: 1px;
      }

      .badge {
        font-family: ${chip.fontType || "'Roboto', sans-serif"};
        font-size: ${chip.fontSize || '11px'};
        font-weight: 500;
        color: ${chip.fontColor || (isLight ? '#0f172a' : '#fef3c7')};
        background: ${chip.backgroundColor || (isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.8)')} !important;
        border: 1px solid ${chip.borderColor || 'rgba(245, 158, 11, 0.3)'} !important;
        padding: 2px 8px; border-radius: 5px; display: inline-flex;
      }

      .item-company {
        font-family: ${caption.primary.fontType || "'Roboto', sans-serif"};
        font-size: ${caption.primary.fontSize || '14px'};
        font-weight: 700;
        color: ${caption.primary.fontColor || (isLight ? '#0f172a' : '#fffbe0')};
      }

      .item-role {
        font-family: ${subtitle.primary.fontType || "'Roboto', sans-serif"};
        font-size: ${subtitle.primary.fontSize || '12px'};
        font-weight: 600;
        color: ${isLight ? '#b45309' : (subtitle.primary.fontColor || '#fbbf24')};
        font-style: italic; margin-bottom: 3px;
      }

      .item-date { 
        font-family: ${meta.fontType || "'Roboto', sans-serif"};
        font-size: ${meta.fontSize || '11px'};
        font-weight: 700;
        color: ${meta.fontColor || (isLight ? '#475569' : '#94a3b8')}; 
      }

      .items-holder { display: flex; flex-direction: column; gap: 10px; }
      .item-block { width: 100%; margin: 0 !important; padding: 0 !important; }

      .description-text, ul { 
        font-family: ${caption.secondary.fontType || "'Roboto', sans-serif"};
        font-size: ${caption.secondary.fontSize || '13px'};
        color: ${caption.secondary.fontColor || (isLight ? '#334155' : '#e2e8f0')}; 
        text-align: justify; margin: 0;
      }
      ul { margin-left: 18px; padding: 0; }
      li { margin-bottom: 3px; }
    </style>
  `;
}

module.exports = {
  name: 'GlassExecutive',
  generateStyles
};
