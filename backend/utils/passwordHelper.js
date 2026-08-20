const crypto = require('crypto');

const SALT = 'glasshub_enterprise_security_salt_2026_v1';

/**
 * Hashes a plaintext password using crypto scrypt with constant enterprise salt
 * @param {string} password 
 * @returns {string} Hex encoded hash (128 chars)
 */
function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return crypto.scryptSync(password, SALT, 64).toString('hex');
}

/**
 * Verifies a plaintext password against a stored scrypt hash in constant time
 * @param {string} password 
 * @param {string} storedHash 
 * @returns {boolean}
 */
function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
    return false;
  }

  try {
    const computed = hashPassword(password);
    const bufA = Buffer.from(computed, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');

    if (bufA.length !== bufB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  } catch (err) {
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword
};
