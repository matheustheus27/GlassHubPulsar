const { hashPassword, verifyPassword } = require('../utils/passwordHelper');

console.log('Testing passwordHelper...');

const adminHash = hashPassword('AdminPassword123!');
const testHash = hashPassword('TestPassword123!');

if (!verifyPassword('AdminPassword123!', adminHash)) {
  throw new Error('Admin verification failed');
}

if (!verifyPassword('TestPassword123!', testHash)) {
  throw new Error('Test user verification failed');
}

if (verifyPassword('WrongPassword', adminHash)) {
  throw new Error('Wrong password accepted');
}

console.log('✓ All passwordHelper tests passed successfully!');
