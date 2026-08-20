const GlassModern = require('./GlassModernTemplate');
const GlassMinimalist = require('./GlassMinimalistTemplate');
const GlassExecutive = require('./GlassExecutiveTemplate');
const GlassCompact = require('./GlassCompactTemplate');

const themes = {
  GlassModern,
  GlassMinimalist,
  GlassExecutive,
  GlassCompact
};

/**
 * Retrieves the theme generator by name, falling back to GlassModern
 * @param {string} themeName 
 * @returns {Object} Theme module with generateStyles function
 */
function getTheme(themeName) {
  if (themeName && themes[themeName]) {
    return themes[themeName];
  }
  return GlassModern;
}

module.exports = {
  themes,
  getTheme
};
