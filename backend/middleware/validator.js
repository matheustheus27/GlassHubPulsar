/**
 * Input Sanitization & Validation Middleware
 */

/**
 * Recursively sanitizes string inputs to prevent XSS while preserving allowed resume custom tags:
 * <BOLD>, <ITALIC>, <UNDERLINE>, <HIGHLIGHT>, <STRIKETHROUGH>
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  // Temporarily mask allowed custom tags
  const tokenMap = {};
  let tokenCounter = 0;

  const preserved = str.replace(/<\/?(BOLD|ITALIC|UNDERLINE|HIGHLIGHT|STRIKETHROUGH)>/gi, (match) => {
    const token = `__CUSTOM_TAG_${tokenCounter++}__`;
    tokenMap[token] = match;
    return token;
  });

  // Strip harmful script tags and event handlers
  let cleaned = preserved
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');

  // Restore preserved custom tags
  for (const [token, originalTag] of Object.entries(tokenMap)) {
    cleaned = cleaned.replace(token, originalTag);
  }

  return cleaned;
}

function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

function sanitizeInput(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
}

module.exports = {
  sanitizeInput,
  sanitizeString,
  sanitizeObject
};
