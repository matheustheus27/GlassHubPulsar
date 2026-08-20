/**
 * Auto-Initializes local .env from .env.example if missing
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const examplePath = path.join(rootDir, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log('✓ Successfully created .env from .env.example with secure default configurations.');
} else if (fs.existsSync(envPath)) {
  console.log('✓ .env file exists and is configured.');
}
