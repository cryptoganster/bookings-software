/**
 * Jest setupFilesAfterEnv Hook
 *
 * This file runs AFTER the test framework is set up but BEFORE test files execute.
 * We use it to run migrations once per test worker.
 *
 * EXPERIMENT: Testing if this can eliminate the need for manual ensureMigrationsRun()
 * calls in each test file.
 *
 * Expected behavior:
 * 1. Jest loads this file after test framework setup
 * 2. beforeAll() hook runs ONCE per worker
 * 3. Migrations run before any test file starts
 * 4. All test files see migrated schema
 *
 * If this works, we can remove manual ensureMigrationsRun() calls from test files.
 * If it doesn't work, we keep the manual calls + ESLint rule.
 */

import { ensureMigrationsRun } from './test-setup';

// Run migrations once per worker before any test files execute
beforeAll(async () => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] [setupFilesAfterEnv] Running migrations before test files...`);

  try {
    await ensureMigrationsRun();
    console.log(
      `[${timestamp}] [setupFilesAfterEnv] ✅ Migrations complete - test files can now execute\n`,
    );
  } catch (error) {
    console.error(`[${timestamp}] [setupFilesAfterEnv] ❌ Migration failed:`, error);
    throw error;
  }
});
