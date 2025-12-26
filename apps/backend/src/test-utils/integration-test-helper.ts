/**
 * Integration Test Helper
 *
 * Provides a shared DataSource for integration tests.
 * Uses the same database as E2E tests (postgres_test) with all entities.
 * Schema is created once in global setup, tests just clean data.
 */

import { DataSource } from 'typeorm';
import { AppointmentModel } from '@booking/infra/persistence/models/appointment';
import { CapacityModel } from '@availability/infra/persistence/models/capacity';
import { ScheduleModel } from '@availability/infra/persistence/models/schedule';
import { BlockoutModel } from '@availability/infra/persistence/models/blockout';
import { OfferingModel } from '@offering/infra/persistence/models/offering';
import { CustomerModel } from '@customer/infra/persistence/models/customer.model';
import { BusinessModel } from '@business/infra/persistence/models/business.model';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { UserModel } from '@auth/infra/persistence/models/user';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';
import { MessageModel } from '@conversation/infra/persistence/models/message.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * All entities in the system
 * Must match the list in test/global-setup.ts
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
  ConversationModel,
  MessageModel,
];

/**
 * Generate a unique UUID for tests
 * Ensures no collisions between test runs
 */
export function generateTestId(): string {
  return uuidv4();
}

/**
 * Generate a unique email for tests
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Create a test user in the database
 * Required for foreign key constraints
 */
export async function createTestUser(dataSource: DataSource, userId?: string): Promise<string> {
  const id = userId || generateTestId();
  const email = generateTestEmail();

  await dataSource.query(
    `INSERT INTO users (id, email, password, name, roles, is_active, email_verified, version, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [id, email, 'hashed_password', 'Test User', ['BUSINESS_OWNER'], true, true, 0],
  );

  return id;
}

/**
 * Create a test business in the database
 * Required for foreign key constraints
 */
export async function createTestBusiness(
  dataSource: DataSource,
  businessId?: string,
  ownerId?: string,
): Promise<string> {
  const id = businessId || generateTestId();
  const owner = ownerId || (await createTestUser(dataSource));

  await dataSource.query(
    `INSERT INTO businesses (id, owner_id, name, whatsapp_phone, address_street, address_city, timezone, is_active, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
    [
      id,
      owner,
      'Test Business',
      `+1${Math.floor(Math.random() * 10000000000)}`, // Random phone
      '123 Test St',
      'Test City',
      'America/New_York',
      true,
      0,
    ],
  );

  return id;
}

/**
 * Shared DataSource singleton for all integration tests
 * This prevents multiple connections from interfering with each other
 */
let sharedDataSource: DataSource | null = null;

/**
 * Create a DataSource for integration tests
 *
 * Uses the same postgres_test database as E2E tests.
 * Schema is already created by global setup, so synchronize: false.
 * Returns a singleton instance to prevent connection conflicts.
 *
 * @returns Initialized DataSource
 */
export async function createIntegrationTestDataSource(): Promise<DataSource> {
  // Return existing connection if already initialized
  if (sharedDataSource && sharedDataSource.isInitialized) {
    return sharedDataSource;
  }

  // Create new connection if needed
  sharedDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'postgres_test',
    entities: ALL_ENTITIES, // Include ALL entities, not just one
    synchronize: false, // Schema already exists from global setup
    dropSchema: false, // Don't drop schema
    logging: false,
  });

  await sharedDataSource.initialize();
  return sharedDataSource;
}

/**
 * Clean all tables in the database
 *
 * Truncates all tables to ensure clean state between tests.
 * Disables foreign key checks temporarily.
 *
 * @param dataSource - DataSource to clean
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  // Disable foreign key checks
  await dataSource.query('SET session_replication_role = replica;');

  try {
    // Truncate all tables in reverse order to handle dependencies
    // This ensures child tables are truncated before parent tables
    const tableNames = entities.map((entity) => entity.tableName);

    for (const tableName of tableNames) {
      try {
        await dataSource.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
      } catch (error) {
        // Skip tables that don't exist (can happen when DataSource has different entities than global-setup)
        if (error instanceof Error && error.message?.includes('does not exist')) {
          console.warn(`⚠️  Table ${tableName} does not exist, skipping...`);
          continue;
        }
        // Log but don't throw - some tables might have dependencies
        console.warn(
          `⚠️  Failed to truncate ${tableName}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  } finally {
    // Re-enable foreign key checks
    await dataSource.query('SET session_replication_role = DEFAULT;');
  }
}
