const TagProcessor = require('../layout/TagProcessor');

module.exports = function summaryTemplate({ summary }) {
  return `<p class="description-text" style="margin: 0; text-align: justify;">${TagProcessor.processInHtml(summary)}</p>`;
};