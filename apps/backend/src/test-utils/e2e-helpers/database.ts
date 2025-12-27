/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Please use the new test helpers from '@test-utils/helpers' instead:
 *
 * Migration guide:
 * - Import from: import { TestDatabaseHelper } from '@test-utils/helpers';
 * - Use: const helper = new TestDatabaseHelper(dataSource);
 * - Methods: helper.setup(), helper.cleanup(), helper.createTestUser()
 * - Static methods: TestDatabaseHelper.cleanDatabase(), TestDatabaseHelper.setupTestDatabase()
 *
 * See: apps/backend/src/test-utils/helpers/database.ts
 */

/**
 * E2E Database Helper
 *
 * Consolidated database utilities for E2E and integration tests.
 * Provides functions for:
 * - Database cleanup between tests
 * - Test DataSource creation
 * - Database setup and teardown
 * - TypeORM configuration for tests
 *
 * This file consolidates functionality from:
 * - apps/backend/test/setup-db.ts
 * - apps/backend/test/test-database.config.ts
 */

import { DataSource } from 'typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppointmentModel } from '@booking/infra/persistence/models/appointment';
import { CapacityModel } from '@availability/infra/persistence/models/capacity';
import { OfferingModel } from '@offering/infra/persistence/models/offering';
import { CustomerModel } from '@customer/infra/persistence/models/customer.model';
import { BusinessModel } from '@business/infra/persistence/models/business.model';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { UserModel } from '@auth/infra/persistence/models/user';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';
import { MessageModel } from '@conversation/infra/persistence/models/message.model';

/**
 * All entities in the system
 * Used for database setup and cleanup
 */
const ALL_ENTITIES = [
  AppointmentModel,
  CapacityModel,
  OfferingModel,
  CustomerModel,
  BusinessModel,
  BusinessOwnerModel,
  UserModel,
  ConversationModel,
  MessageModel,
];

/**
 * E2E Database Helper Class
 *
 * Provides database utilities for E2E and integration tests.
 * Can be used as instance (with DataSource) or static methods.
 *
 * @deprecated Use TestDatabaseHelper from '@test-utils/helpers' instead
 */
export class E2EDatabaseHelper {
  constructor(private readonly dataSource?: DataSource) {}

  /**
   * Create a test user in the database
   * Required before creating businesses or business_owners due to foreign key constraints
   */
  async createTestUser(userId: string): Promise<void> {
    if (!this.dataSource) {
      throw new Error('DataSource is required for instance methods');
    }
    await E2EDatabaseHelper.createTestUser(this.dataSource, userId);
  }

  /**
   * Create a test user in the database (static method)
   * Required before creating businesses or business_owners due to foreign key constraints
   */
  static async createTestUser(dataSource: DataSource, userId: string): Promise<void> {
    await dataSource.query(
      `INSERT INTO users (id, email, password, name, roles, is_active, email_verified, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        userId,
        `user-${userId}@test.com`,
        'hashed_password',
        'Test User',
        ['BUSINESS_OWNER'],
        true,
        true,
      ],
    );
  }

  /**
   * Setup database (instance method)
   * Cleans the database for the test
   */
  async setup(): Promise<void> {
    if (!this.dataSource) {
      throw new Error('DataSource is required for instance methods');
    }
    await E2EDatabaseHelper.cleanDatabase(this.dataSource);
  }

  /**
   * Cleanup database (instance method)
   * Alias for clearData()
   */
  async cleanup(): Promise<void> {
    await this.clearData();
  }

  /**
   * Clear data between tests (instance method)
   * Truncates all tables
   */
  async clearData(): Promise<void> {
    if (!this.dataSource) {
      throw new Error('DataSource is required for instance methods');
    }
    await E2EDatabaseHelper.cleanDatabase(this.dataSource);
  }

  /**
   * Clean database by truncating all tables (static method)
   *
   * This is much faster than dropping/recreating databases.
   * Disables foreign key checks temporarily to allow truncation.
   *
   * @param dataSource - TypeORM DataSource instance
   *
   * @example
   * ```typescript
   * const dataSource = await E2EDatabaseHelper.setupTestDatabase();
   * await E2EDatabaseHelper.cleanDatabase(dataSource);
   * ```
   */
  static async cleanDatabase(dataSource: DataSource): Promise<void> {
    const entities = dataSource.entityMetadatas;

    // Disable foreign key checks temporarily to allow truncation
    await dataSource.query('SET session_replication_role = replica;');

    try {
      // Truncate all tables with CASCADE to handle foreign keys
      for (const entity of entities) {
        try {
          const repository = dataSource.getRepository(entity.name);
          await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
        } catch (error) {
          // Skip tables that don't exist (can happen when DataSource has different entities than global-setup)
          if (error instanceof Error && error.message?.includes('does not exist')) {
            console.warn(`⚠️  Table ${entity.tableName} does not exist, skipping...`);
            continue;
          }
          throw error;
        }
      }
    } finally {
      // Re-enable foreign key checks
      await dataSource.query('SET session_replication_role = DEFAULT;');
    }
  }

  /**
   * Create a test DataSource (static method)
   *
   * Uses worker-specific database when running tests in parallel.
   * When running with --runInBand, uses bookings_test directly.
   * In parallel mode, uses bookings_test_${workerId}.
   *
   * @returns TypeORM DataSource configured for tests
   *
   * @example
   * ```typescript
   * const dataSource = E2EDatabaseHelper.createTestDataSource();
   * await dataSource.initialize();
   * ```
   */
  static createTestDataSource(): DataSource {
    const isRunInBand = process.argv.includes('--runInBand');
    const workerId = process.env.JEST_WORKER_ID;
    const database = isRunInBand ? 'bookings_test' : `bookings_test_${workerId || '1'}`;

    return new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database,
      entities: ALL_ENTITIES,
      synchronize: true, // Auto-create schema in tests
      logging: false,
    });
  }

  /**
   * Setup test database (static method)
   *
   * Initializes a DataSource and cleans the database.
   * Use this in beforeAll() or beforeEach() hooks.
   *
   * @returns Initialized and clean DataSource
   *
   * @example
   * ```typescript
   * let dataSource: DataSource;
   *
   * beforeAll(async () => {
   *   dataSource = await E2EDatabaseHelper.setupTestDatabase();
   * });
   *
   * afterAll(async () => {
   *   await E2EDatabaseHelper.teardownTestDatabase(dataSource);
   * });
   * ```
   */
  static async setupTestDatabase(): Promise<DataSource> {
    const dataSource = E2EDatabaseHelper.createTestDataSource();

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    // Clean database before tests
    await E2EDatabaseHelper.cleanDatabase(dataSource);

    return dataSource;
  }

  /**
   * Teardown test database (static method)
   *
   * Destroys the DataSource connection.
   * Use this in afterAll() hooks.
   *
   * @param dataSource - DataSource to destroy
   *
   * @example
   * ```typescript
   * afterAll(async () => {
   *   await E2EDatabaseHelper.teardownTestDatabase(dataSource);
   * });
   * ```
   */
  static async teardownTestDatabase(dataSource: DataSource): Promise<void> {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }

  /**
   * Get TypeORM configuration for tests (static method)
   *
   * Returns NestJS TypeOrmModuleOptions with all entities.
   * Includes all entities to ensure joins work correctly.
   *
   * @param database - Optional database name override
   * @returns TypeORM configuration for NestJS
   *
   * @example
   * ```typescript
   * const moduleFixture = await Test.createTestingModule({
   *   imports: [
   *     TypeOrmModule.forRoot(E2EDatabaseHelper.getTestTypeOrmConfig()),
   *     // ... other modules
   *   ],
   * }).compile();
   * ```
   */
  static getTestTypeOrmConfig(database?: string): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: database || process.env.DB_DATABASE || 'bookings_test',
      entities: ALL_ENTITIES,
      synchronize: true,
      dropSchema: false,
      logging: false,
    };
  }
}

// Export standalone functions for backward compatibility
export const cleanDatabase = E2EDatabaseHelper.cleanDatabase.bind(E2EDatabaseHelper);
export const createTestDataSource = E2EDatabaseHelper.createTestDataSource.bind(E2EDatabaseHelper);
export const setupTestDatabase = E2EDatabaseHelper.setupTestDatabase.bind(E2EDatabaseHelper);
export const teardownTestDatabase = E2EDatabaseHelper.teardownTestDatabase.bind(E2EDatabaseHelper);
export const getTestTypeOrmConfig = E2EDatabaseHelper.getTestTypeOrmConfig.bind(E2EDatabaseHelper);
export const createTestUser = E2EDatabaseHelper.createTestUser.bind(E2EDatabaseHelper);
