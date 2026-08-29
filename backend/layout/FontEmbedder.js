/**
 * FontEmbedder
 * 
 * Embeds Roboto font family with Google Fonts import and system font fallback chain.
 * ATS-compatible and Puppeteer-safe.
 */

const FONT_FACE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;0,900;1,300;1,400;1,500;1,700;1,900&display=swap');

  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 100 900;
    src: local('Roboto'), local('Roboto-Regular'), local('Arial'), local('Helvetica Neue'), local('Helvetica');
  }
`;

function getFontFaceStyles() {
  return `<style id="glasshub-fonts">${FONT_FACE_CSS}</style>`;
}

function getSafeFontStack(preferred = 'Roboto') {
  const stacks = {
    Roboto: "'Roboto', 'Helvetica Neue', Arial, 'Segoe UI', sans-serif",
    Inter: "'Roboto', 'Inter', Arial, sans-serif",
    Outfit: "'Roboto', 'Outfit', Arial, sans-serif",
    Monospace: "'Courier New', Courier, monospace"
  };
  return stacks[preferred] || stacks.Roboto;
}

module.exports = { getFontFaceStyles, getSafeFontStack, FONT_FACE_CSS };
