const TagProcessor = require('../layout/TagProcessor');

module.exports = function projectTemplate({ proj }) {
  const title = proj.title || proj.name || "";
  const role = proj.role || proj.description || "";
  const link = proj.link || proj.url || "";
  const bullets = proj.bullets || [];

  const linkHtml = link && link !== '#' ? `
    <a href="${link}" target="_blank" rel="noopener noreferrer" class="project-link-badge">
      <span class="contact-icon-glass" style="width: 16px; height: 16px;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </span>
      <span>Link</span>
    </a>
  ` : '';

  return `
    <div class="item-block" style="display: flex; flex-direction: column; gap: 4px; padding-left: 0px; margin-left: 0px;">
      <div class="item-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h3 class="item-company" style="margin: 0; padding: 0;">${title}</h3>
          ${linkHtml}
        </div>
      </div>
      ${role ? `<div class="item-role">${role}</div>` : ''}
      <ul class="description-text" style="margin: 0; padding-left: 14px; list-style-position: font-relative;">
        ${bullets.map(item => `<li style="margin-bottom: 5px; text-align: justify;">${TagProcessor.processInHtml(item)}</li>`).join("")}
      </ul>
    </div>
  `;
};