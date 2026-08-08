/**
 * Envelopa um conteúdo e título dentro de um Glass Card coeso
 */
module.exports = function cardTemplate(title, contentHtml) {
  return `
    <div class="glass-card">
      <div class="section-title">${title}</div>
      ${contentHtml}
    </div>
  `;
};