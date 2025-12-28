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
 *
 * IMPORTANT: We reconnect after dropping/recreating the schema to ensure
 * TypeORM has a fresh connection to the new schema. This prevents issues
 * where foreign keys fail to create due to stale connection state.
 */
export default async function globalSetup() {
  console.log('🔧 Running global setup...');

  // Load test environment variables
  config({ path: join(__dirname, '..', '.env.test') });

  const dbConfig = {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'postgres_test',
    migrations: [join(__dirname, '..', 'src', 'database', 'migrations', '*.ts')],
    migrationsRun: false, // We'll run them manually
    synchronize: false, // Use migrations instead
    logging: ['error', 'warn', 'migration'] as ('error' | 'warn' | 'migration')[],
  };

  try {
    // ============================================
    // STEP 1: Connect and drop/recreate schema
    // ============================================
    console.log('📡 Step 1: Connecting to database...');
    let dataSource = new DataSource(dbConfig);
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const queryRunner = dataSource.createQueryRunner();
    try {
      console.log('🗑️  Dropping schema public...');
      await queryRunner.query('DROP SCHEMA IF EXISTS public CASCADE');

      console.log('🏗️  Creating schema public...');
      await queryRunner.query('CREATE SCHEMA public');

      console.log('🔐 Granting permissions...');
      await queryRunner.query('GRANT ALL ON SCHEMA public TO postgres');
      await queryRunner.query('GRANT ALL ON SCHEMA public TO public');

      console.log('✅ Schema dropped and recreated');
    } finally {
      await queryRunner.release();
    }

    // ============================================
    // STEP 2: Close connection
    // ============================================
    console.log('🔌 Step 2: Closing first connection...');
    await dataSource.destroy();
    console.log('✅ First connection closed');

    // ============================================
    // STEP 3: Reconnect with fresh connection
    // ============================================
    console.log('📡 Step 3: Reconnecting to database...');
    dataSource = new DataSource(dbConfig);
    await dataSource.initialize();
    console.log('✅ Reconnected to database with fresh connection');

    // ============================================
    // STEP 4: Run migrations with fresh connection
    // ============================================
    console.log('🚀 Step 4: Running migrations...');
    const migrations = await dataSource.runMigrations();
    console.log(`✅ Executed ${migrations.length} migrations`);

    // Log each migration
    if (migrations.length > 0) {
      console.log('📋 Migration details:');
      migrations.forEach((migration) => {
        console.log(`  ✓ ${migration.name}`);
      });
    }

    // ============================================
    // STEP 5: Verify database state
    // ============================================
    console.log('🔍 Step 5: Verifying database state...');

    // Check tables
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log(
      `📊 Created ${tables.length} tables:`,
      tables.map((t: any) => t.table_name).join(', '),
    );

    // Check foreign keys in detail
    const foreignKeys = await dataSource.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name
    `);

    console.log(`🔗 Created ${foreignKeys.length} foreign keys`);
    if (foreignKeys.length === 0) {
      console.error('⚠️  WARNING: No foreign keys were created!');
      console.error('This indicates a problem with the migration execution.');
    } else {
      console.log('📋 Foreign key details:');
      foreignKeys.forEach((fk: any) => {
        console.log(
          `  ✓ ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`,
        );
      });
    }

    // ============================================
    // STEP 6: Close connection
    // ============================================
    console.log('🔌 Step 6: Closing connection...');
    await dataSource.destroy();
    console.log('✅ Global setup complete');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}
