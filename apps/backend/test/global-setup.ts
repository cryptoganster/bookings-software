import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

/**
 * Jest Global Setup
 * Runs once before all test suites
 * Creates database tables using TypeORM synchronize
 */
export default async function globalSetup() {
  console.log('🔧 Running global setup...');

  // Load test environment variables
  config({ path: join(__dirname, '..', '.env.test') });

  // Create DataSource for test database
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'test',
    password: process.env.DB_PASSWORD || 'test',
    database: process.env.DB_DATABASE || 'bookings_test',
    entities: [
      join(__dirname, '..', 'src', '**', '*.model.{ts,js}'),
      join(__dirname, '..', 'src', '**', 'models', '*.{ts,js}'),
    ],
    synchronize: false, // Don't auto-sync, we'll do it manually
    logging: false,
  });

  try {
    // Initialize connection
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Drop and recreate all tables
    // This ensures a clean state for all tests
    await dataSource.synchronize(true); // dropBeforeSync = true
    console.log('✅ Database tables created');

    // Close connection
    await dataSource.destroy();
    console.log('✅ Global setup complete');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}
