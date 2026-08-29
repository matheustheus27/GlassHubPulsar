const TagProcessor = require('../layout/TagProcessor');

module.exports = function educationTemplate({ edu }) {
  const institution = edu.institution || edu.organization || edu.school || "";
  const role = edu.role || edu.degree || edu.course || "";
  const date = edu.period || edu.date || edu.year || "";
  const desc = edu.description || "";

  return `
    <div class="item-block" style="display: flex; flex-direction: column; gap: 4px; padding-left: 0px; margin-left: 0px;">
      <div class="item-header" style="display: flex; justify-content: space-between; align-items: baseline; width: 100%;">
        <h3 class="item-company" style="margin: 0; padding: 0;">${institution}</h3>
        <span class="item-date">${date}</span>
      </div>
      ${role ? `<div class="item-role">${role}</div>` : ''}
      ${desc ? `<p class="description-text" style="margin: 0; padding-left: 0px; text-align: justify;">${TagProcessor.processInHtml(desc)}</p>` : ""}
    </div>
  `;
};