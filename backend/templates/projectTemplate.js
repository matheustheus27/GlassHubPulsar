const TagProcessor = require('../layout/TagProcessor');

module.exports = function projectTemplate({ proj }) {
  return `
    <div class="item-block" style="display: flex; flex-direction: column; gap: 4px; padding-left: 0px; margin-left: 0px;">
      <div class="item-header" style="display: flex; justify-content: space-between; align-items: baseline; width: 100%;">
        <a href="${proj.link}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;"><h3 class="item-company" style="margin: 0; padding: 0;">${proj.title}</h3></a>
      </div>
      <div class="item-role">${proj.role}</div>
      <ul class="description-text" style="margin: 0; padding-left: 14px; list-style-position: font-relative;">
        ${(proj.bullets || []).map(item => `<li style="margin-bottom: 5px; text-align: justify;">${TagProcessor.processInHtml(item)}</li>`).join("")}
      </ul>
    </div>
  `;
};