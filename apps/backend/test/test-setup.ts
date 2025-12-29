import { DataSource } from 'typeorm';
import { join } from 'path';
import * as fs from 'fs';

/**
 * Migration Helper for Tests
 *
 * Provides a function to run migrations in test process.
 * Must be called from beforeAll() hooks in test files that need migrations.
 *
 * IMPORTANT: Jest's setupFiles doesn't wait for async operations,
 * so we can't run migrations there. Instead, test files must call
 * ensureMigrationsRun() in their beforeAll() hooks.
 *
 * Usage:
 * ```typescript
 * import { ensureMigrationsRun } from '../../../test/test-setup';
 *
 * beforeAll(async () => {
 *   await ensureMigrationsRun();
 *   // ... rest of setup
 * });
 * ```
 */

const MIGRATIONS_FLAG_FILE = join(__dirname, '.migrations-complete');
const MIGRATIONS_LOCK_FILE = join(__dirname, '.migrations-lock');

/**
 * Run migrations once per test session
 *
 * This function:
 * 1. Checks if migrations have already been run (via flag file)
 * 2. If not, acquires a lock and runs all migrations
 * 3. Verifies database state (tables and foreign keys)
 * 4. Creates flag file to prevent re-running
 *
 * Safe to call multiple times - will only run migrations once.
 * Uses lock file to prevent race conditions in parallel test execution.
 */
export async function ensureMigrationsRun(): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [PID ${process.pid}] ensureMigrationsRun() called`);

  // Check if already run in this test session
  if (fs.existsSync(MIGRATIONS_FLAG_FILE)) {
    console.log(
      `[${timestamp}] [PID ${process.pid}] Migrations already completed (flag file exists)`,
    );
    return; // Already run, skip
  }

  // Try to acquire lock (atomic operation)
  let lockAcquired = false;
  try {
    // writeFileSync with 'wx' flag fails if file exists (atomic)
    fs.writeFileSync(MIGRATIONS_LOCK_FILE, process.pid.toString(), { flag: 'wx' });
    lockAcquired = true;
    console.log(`[PID ${process.pid}] Lock acquired, will run migrations`);
  } catch (error) {
    // Lock file exists, another worker is running migrations
    // Wait for migrations to complete
    console.log(
      `[PID ${process.pid}] ⏳ Waiting for migrations to complete (another worker is running them)...`,
    );

    // Poll for flag file (max 30 seconds)
    const maxWaitTime = 30000; // 30 seconds
    const pollInterval = 100; // 100ms
    const startTime = Date.now();

    while (!fs.existsSync(MIGRATIONS_FLAG_FILE)) {
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error('Timeout waiting for migrations to complete');
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    console.log(`[PID ${process.pid}] ✅ Migrations completed by another worker`);
    return;
  }

  // If we acquired the lock, we're responsible for running migrations
  if (!lockAcquired) {
    return;
  }

  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] 🚀 Running migrations in test process...`);

  const dbConfig = {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'postgres_test',
    migrations: [join(__dirname, '..', 'src', 'database', 'migrations', '*.ts')],
    migrationsRun: false,
    synchronize: false,
    logging: ['error', 'warn', 'migration'] as ('error' | 'warn' | 'migration')[],
  };

  let migrationDataSource: DataSource | null = null;

  try {
    migrationDataSource = new DataSource(dbConfig);
    await migrationDataSource.initialize();
    console.log('✅ Migration DataSource initialized');

    console.log('🔄 Executing migrations...');
    const migrations = await migrationDataSource.runMigrations();
    console.log(`✅ Executed ${migrations.length} migrations`);

    if (migrations.length > 0) {
      console.log('📋 Migration details:');
      migrations.forEach((migration) => {
        console.log(`  ✓ ${migration.name}`);
      });
    }

    // Verify database state
    const tables = await migrationDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log(`📊 Found ${tables.length} tables`);

    if (tables.length === 0) {
      throw new Error('No tables found after migrations');
    }

    // Check foreign keys
    const foreignKeys = await migrationDataSource.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
    `);

    const fkCount = parseInt(foreignKeys[0].count, 10);
    console.log(`🔗 Found ${fkCount} foreign keys`);

    if (fkCount === 0) {
      throw new Error('No foreign keys created - migration may have failed');
    }

    // Close connection
    await migrationDataSource.destroy();
    migrationDataSource = null;

    // Create flag file
    fs.writeFileSync(MIGRATIONS_FLAG_FILE, new Date().toISOString());
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`[${new Date().toISOString()}] ✅ Migrations complete (took ${duration}ms)`);

    // Release lock
    if (fs.existsSync(MIGRATIONS_LOCK_FILE)) {
      fs.unlinkSync(MIGRATIONS_LOCK_FILE);
    }
  } catch (error) {
    console.error('❌ Migration setup failed:', error);

    // Release lock on error
    if (fs.existsSync(MIGRATIONS_LOCK_FILE)) {
      fs.unlinkSync(MIGRATIONS_LOCK_FILE);
    }

    if (migrationDataSource?.isInitialized) {
      await migrationDataSource.destroy();
    }
    throw error;
  }
}

/**
 * Clean up migration flag and lock files
 * Called by Jest's globalTeardown (if configured)
 */
export function cleanupMigrationFlag(): void {
  if (fs.existsSync(MIGRATIONS_FLAG_FILE)) {
    fs.unlinkSync(MIGRATIONS_FLAG_FILE);
  }
  if (fs.existsSync(MIGRATIONS_LOCK_FILE)) {
    fs.unlinkSync(MIGRATIONS_LOCK_FILE);
  }
}
