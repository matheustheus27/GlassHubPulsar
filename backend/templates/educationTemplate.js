const TagProcessor = require('../layout/TagProcessor');

module.exports = function educationTemplate({ edu }) {
  return `
    <div class="item-block" style="display: flex; flex-direction: column; gap: 4px; padding-left: 0px; margin-left: 0px;">
      <div class="item-header" style="display: flex; justify-content: space-between; align-items: baseline; width: 100%;">
        <h3 class="item-company" style="margin: 0; padding: 0;">${edu.institution}</h3>
        <span class="item-date">${edu.period || edu.date || ""}</span>
      </div>
      <div class="item-role">${edu.role}</div>
      ${edu.description ? `<p class="description-text" style="margin: 0; padding-left: 0px; text-align: justify;">${TagProcessor.processInHtml(edu.description)}</p>` : ""}
    </div>
  `;
};