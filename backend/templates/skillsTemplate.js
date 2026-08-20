module.exports = function skillsTemplate({ categories, settings }) {
  const chip = settings?.chip || {};
  const card = settings?.card || {};

  const catsHtml = (categories || []).map(category => `
    <div class="skill-group" style="display: flex; flex-direction: column; gap: 4px; break-inside: avoid;">
      <h4 class="skill-group-title" style="margin: 0; padding: 0;">${category.title || category.name}</h4>
      <div class="badge-row" style="display: flex; flex-wrap: wrap; gap: 4px;">
        ${(category.items || []).map(item => `
          <span class="badge" style="background-color: ${chip.backgroundColor || ''} !important; color: ${chip.fontColor || ''} !important; border-color: ${chip.borderColor || card.borderColor || ''} !important;">
            ${item}
          </span>
        `).join("")}
      </div>
    </div>
  `).join("");

  return `
    <div class="skills-container-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 8px;">
      ${catsHtml}
    </div>
  `;
};