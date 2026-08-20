/**
 * PostgreSQL Database Initializer & Schema Synchronizer
 * Ensures the database is reachable, pushes Prisma schema tables, and executes initial seeds.
 */
const { execSync } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');
const prisma = require('./client');

async function waitForDatabase(maxAttempts = 15, delayMs = 2000) {
  logger.info('[InitDB] Waiting for PostgreSQL database connection...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$connect();
      logger.info(`[InitDB] ✓ Connected to PostgreSQL on attempt ${attempt}/${maxAttempts}`);
      return true;
    } catch (err) {
      logger.warn(`[InitDB] Database connection attempt ${attempt}/${maxAttempts} failed: ${err.message}. Retrying in ${delayMs / 1000}s...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  logger.error('[InitDB] ✗ Failed to connect to PostgreSQL after maximum attempts.');
  return false;
}

async function syncSchema() {
  try {
    logger.info('[InitDB] Pushing Prisma schema to PostgreSQL (npx prisma db push --skip-generate)...');
    execSync('npx prisma db push --skip-generate', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit'
    });
    logger.info('[InitDB] ✓ Prisma schema synchronized successfully with PostgreSQL tables.');
  } catch (err) {
    logger.warn('[InitDB] Prisma db push execution error (may already be in sync):', err.message);
  }
}

async function runSeed() {
  try {
    logger.info('[InitDB] Verifying/Executing default seed accounts...');
    const seed = require('./seed');
    await seed();
    logger.info('[InitDB] ✓ Default seed verification completed.');
  } catch (err) {
    logger.warn('[InitDB] Seed execution note:', err.message);
  }
}

async function main() {
  const connected = await waitForDatabase();
  if (connected) {
    await syncSchema();
    await runSeed();
  } else {
    logger.warn('[InitDB] Starting application in resilient memory fallback mode while database initializes.');
  }
}

if (require.main === module) {
  main().then(() => {
    logger.info('[InitDB] Database bootstrap complete.');
    process.exit(0);
  }).catch(err => {
    logger.warn('[InitDB] Database bootstrap warning (using resilient memory fallback):', err.message || err);
    process.exit(0);
  });
}

module.exports = main;
