import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

/**
 * Jest Global Setup
 * Runs once before all test suites
 * Executes migrations to create database schema
 *
 * This approach:
 * 1. Validates that migrations work correctly
 * 2. Ensures test schema matches production schema
 * 3. Allows migration tests to validate the migration table
 */
export default async function globalSetup() {
  console.log('🔧 Running global setup...');

  // Load test environment variables
  config({ path: join(__dirname, '..', '.env.test') });

  // Create DataSource for test database with migrations
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'postgres_test',
    migrations: [join(__dirname, '..', 'src', 'database', 'migrations', '*.ts')],
    migrationsRun: false, // We'll run them manually
    synchronize: false, // Use migrations instead
    logging: false,
  });

  try {
    // Initialize connection
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Drop schema and recreate (cleanest approach)
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.query('DROP SCHEMA IF EXISTS public CASCADE');
      await queryRunner.query('CREATE SCHEMA public');
      await queryRunner.query('GRANT ALL ON SCHEMA public TO postgres');
      await queryRunner.query('GRANT ALL ON SCHEMA public TO public');
      console.log('✅ Schema dropped and recreated');
    } finally {
      await queryRunner.release();
    }

    // Run all migrations
    await dataSource.runMigrations();
    console.log('✅ Migrations executed');

    // Log migrations
    const executedMigrations = await dataSource.query(
      'SELECT name, timestamp FROM migrations ORDER BY timestamp',
    );
    console.log(`📦 Executed ${executedMigrations.length} migrations`);

    // Verify foreign keys were created
    const foreignKeys = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
    `);
    console.log(`🔗 Created ${foreignKeys[0].count} foreign keys`);

    // Close connection
    await dataSource.destroy();
    console.log('✅ Global setup complete');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}
