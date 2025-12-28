import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';

/**
 * Jest Global Setup
 * Runs once before all test suites
 *
 * This setup:
 * 1. Drops and recreates the database schema
 * 2. Cleans migration flag file (so migrations run fresh)
 * 3. Migrations are executed in test-setup.ts (same process as tests)
 */
export default async function globalSetup() {
  console.log('🔧 Running global setup...');

  // Load test environment variables
  config({ path: join(__dirname, '..', '.env.test') });

  // Clean migration flag file from previous test runs
  const migrationFlagFile = join(__dirname, '.migrations-complete');
  if (fs.existsSync(migrationFlagFile)) {
    fs.unlinkSync(migrationFlagFile);
    console.log('🧹 Cleaned migration flag file');
  }

  const dbConfig = {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'postgres_test',
    synchronize: false,
    logging: false,
  };

  try {
    console.log('📡 Connecting to database...');
    const dataSource = new DataSource(dbConfig);
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

    console.log('🔌 Closing connection...');
    await dataSource.destroy();
    console.log('✅ Global setup complete - migrations will run in test files');
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
