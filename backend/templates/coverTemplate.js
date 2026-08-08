const TagProcessor = require('../layout/TagProcessor');

module.exports = function coverTemplate({ cover }) {
  return `
    <div class="item-block" style="display: flex; flex-direction: column; gap: 4px; padding-left: 0px; margin-left: 0px; text-align: justify;">
      <p class="common-item">${cover.greeting}</p>

      <div class="common-item">
        ${(cover.bullets || []).map(item => `<p>${TagProcessor.processInHtml(item)}</p>`).join("")}
      </div>
      <br>
      <div className="signature-block">
        <p class="common-item" style="margin-bottom: '5pt'">${cover.valediction}</p>
        <p class="signature-item">${cover.signature}</p>
      </div>
    </div>
  `;
};