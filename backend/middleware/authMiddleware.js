/**
 * Compatibility alias for auth middleware
 */
const auth = require('./auth');

module.exports = {
  ...auth,
  authenticateOptional: auth.authenticate
};
