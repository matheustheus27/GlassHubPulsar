const TagProcessor = require('../layout/TagProcessor');

module.exports = function coverTemplate({ cover = {} }) {
  const paragraphs = Array.isArray(cover.text) && cover.text.length > 0
    ? cover.text
    : (Array.isArray(cover.paragraphs) && cover.paragraphs.length > 0
        ? cover.paragraphs
        : (Array.isArray(cover.bullets) ? cover.bullets : [cover.text || cover.paragraphs || '']));

  const formattedParagraphs = paragraphs
    .filter(p => p !== null && p !== undefined && String(p).trim() !== '')
    .map(item => {
      const processed = TagProcessor.processInHtml(String(item)).replace(/\n/g, '<br />');
      return `<p class="cover-paragraph" style="white-space: pre-wrap; line-height: 1.6; margin-bottom: 12px; text-align: justify;">${processed}</p>`;
    })
    .join('');

  return `
    <div class="item-block cover-letter-container" style="display: flex; flex-direction: column; gap: 8px; padding-left: 0px; margin-left: 0px; text-align: justify; font-size: inherit;">
      ${cover.greeting ? `<p class="common-item cover-greeting" style="font-weight: 600; margin-bottom: 8px;">${TagProcessor.processInHtml(cover.greeting)}</p>` : ''}

      <div class="common-item cover-body">
        ${formattedParagraphs}
      </div>

      <div class="signature-block" style="margin-top: 16px;">
        ${cover.valediction ? `<p class="common-item cover-valediction" style="margin-bottom: 8px;">${TagProcessor.processInHtml(cover.valediction)}</p>` : ''}
        ${cover.signature ? `<p class="signature-item cover-signature" style="font-weight: bold;">${TagProcessor.processInHtml(cover.signature)}</p>` : ''}
      </div>
    </div>
  `;
};