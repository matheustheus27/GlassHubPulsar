const TagProcessor = require('../layout/TagProcessor');

module.exports = function experienceTemplate({ exp }) {
  const company = exp.company || exp.organization || "";
  const role = exp.role || exp.position || exp.title || "";
  const date = exp.period || exp.date || "";
  const bullets = exp.bullets || (exp.description ? [exp.description] : []);

  return `
    <div class="item-block" style="display: flex; flex-direction: column; gap: 4px; padding-left: 0px; margin-left: 0px;">
      <div class="item-header" style="display: flex; justify-content: space-between; align-items: baseline; width: 100%;">
        <h3 class="item-company" style="margin: 0; padding: 0;">${company}</h3>
        <span class="item-date">${date}</span>
      </div>
      ${role ? `<div class="item-role">${role}</div>` : ''}
      <ul class="description-text" style="margin: 0; padding-left: 14px; list-style-position: font-relative;">
        ${bullets.map(item => `<li style="margin-bottom: 5px; text-align: justify;">${TagProcessor.processInHtml(item)}</li>`).join("")}
      </ul>
    </div>
  `;
};