import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { AppointmentModel } from '../src/booking/infra/persistence/models/appointment';
import { CapacityModel } from '../src/availability/infra/persistence/models/capacity';
import { ScheduleModel } from '../src/availability/infra/persistence/models/schedule';
import { BlockoutModel } from '../src/availability/infra/persistence/models/blockout';
import { OfferingModel } from '../src/offering/infra/persistence/models/offering';
import { CustomerModel } from '../src/customer/infra/persistence/models/customer.model';
import { BusinessModel } from '../src/business/infra/persistence/models/business.model';
import { BusinessOwnerModel } from '../src/account/infra/persistence/models/business-owner.model';
import { UserModel } from '../src/auth/infra/persistence/models/user';

/**
 * All entities in the system
 * Must match the list in test-utils/e2e-helpers/database.ts
 */
const ALL_ENTITIES = [
  AppointmentModel,
  CapacityModel,
  ScheduleModel,
  BlockoutModel,
  OfferingModel,
  CustomerModel,
  BusinessModel,
  BusinessOwnerModel,
  UserModel,
];

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
    entities: ALL_ENTITIES,
    synchronize: true, // Auto-create schema in tests
    logging: false,
  });

  try {
    // Initialize connection
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Log entities found
    const entities = dataSource.entityMetadatas;
    console.log(`📦 Found ${entities.length} entities:`);
    entities.forEach((entity) => {
      console.log(`   - ${entity.name} (${entity.tableName})`);
    });

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
