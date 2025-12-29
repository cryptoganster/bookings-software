/**
 * Integration Testing Example
 *
 * This file demonstrates how to write integration tests that verify
 * interactions between multiple components and the database.
 *
 * Integration tests:
 * - Test real database interactions
 * - Verify foreign key relationships
 * - Test data persistence and retrieval
 * - Validate business logic with real data
 *
 * @see apps/backend/src/test-utils/helpers/README.md
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '@/app.module';
import {
  TestDatabaseHelper,
  TestAuthHelper,
  TestAccountHelper,
  TestBusinessHelper,
  TestCustomerHelper,
  TestCapacityHelper,
  createTestUserInDb,
  createBusinessOwnerInDb,
  createTestBusinessInDb,
  createCustomerInDb,
} from '@test-utils/helpers';
import { UserModel } from '@auth/infra/persistence/models/user';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { BusinessModel } from '@business/infra/persistence/models/business.model';
import { CustomerModel } from '@customer/infra/persistence/models/customer.model';

describe('Integration Testing Examples', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let databaseHelper: TestDatabaseHelper;
  let authHelper: TestAuthHelper;
  let accountHelper: TestAccountHelper;
  let businessHelper: TestBusinessHelper;
  let customerHelper: TestCustomerHelper;
  let capacityHelper: TestCapacityHelper;

  /**
   * Setup: Initialize database connection and helpers
   */
  beforeAll(async () => {
    // Create NestJS testing module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Create application instance
    app = moduleFixture.createNestApplication();
    await app.init();

    // Get DataSource from app
    dataSource = app.get(DataSource);

    // Initialize helpers (all require INestApplication)
    databaseHelper = new TestDatabaseHelper(dataSource);
    authHelper = new TestAuthHelper(app);
    accountHelper = new TestAccountHelper(app);
    businessHelper = new TestBusinessHelper(app);
    customerHelper = new TestCustomerHelper(app);
    capacityHelper = new TestCapacityHelper(app);
  });

  /**
   * Cleanup: Close database connection
   */
  afterAll(async () => {
    await app?.close();
  });

  /**
   * Reset: Clean database before each test
   */
  beforeEach(async () => {
    await TestDatabaseHelper.cleanDatabase(dataSource);
  });

  /**
   * Example 1: Complete Business Setup Flow
   *
   * This test demonstrates the full flow of setting up a business:
   * 1. Create User (authentication)
   * 2. Create BusinessOwner (account profile)
   * 3. Create Business (business entity)
   * 4. Verify all relationships
   */
  describe('Complete Business Setup Flow', () => {
    it('should create user, business owner, and business with correct relationships', async () => {
      // Step 1: Create User
      const userId = 'user-123';
      await createTestUserInDb(dataSource, userId);

      // Verify user was created
      const userRepo = dataSource.getRepository(UserModel);
      const user = await userRepo.findOne({ where: { id: userId } });
      expect(user).toBeDefined();
      expect(user?.id).toBe(userId);
      expect(user?.roles).toContain('BUSINESS_OWNER');

      // Step 2: Create BusinessOwner
      const businessOwnerId = 'owner-123';
      await createBusinessOwnerInDb(dataSource, businessOwnerId, userId);

      // Verify business owner was created
      const ownerRepo = dataSource.getRepository(BusinessOwnerModel);
      const owner = await ownerRepo.findOne({ where: { id: businessOwnerId } });
      expect(owner).toBeDefined();
      expect(owner?.userId).toBe(userId);
      expect(owner?.subscriptionPlan).toBe('FREE');

      // Step 3: Create Business
      const businessId = 'business-123';
      await createTestBusinessInDb(dataSource, businessId, userId);

      // Verify business was created
      const businessRepo = dataSource.getRepository(BusinessModel);
      const business = await businessRepo.findOne({ where: { id: businessId } });
      expect(business).toBeDefined();
      expect(business?.ownerId).toBe(userId);
      expect(business?.name).toBeDefined();
      expect(business?.whatsappPhone).toBeDefined();

      // Step 4: Verify relationships
      // User -> BusinessOwner (1:1)
      const ownerByUser = await ownerRepo.findOne({ where: { userId } });
      expect(ownerByUser?.id).toBe(businessOwnerId);

      // User -> Business (1:N)
      const businessesByOwner = await businessRepo.find({ where: { ownerId: userId } });
      expect(businessesByOwner).toHaveLength(1);
      expect(businessesByOwner[0].id).toBe(businessId);
    });
  });

  /**
   * Example 2: Database Cleanup
   *
   * This test demonstrates how to properly clean the database between tests.
   */
  describe('Database Cleanup', () => {
    it('should clean all tables without errors', async () => {
      // Create some test data
      await createTestUserInDb(dataSource, 'user-1');
      await createTestUserInDb(dataSource, 'user-2');

      // Verify data exists
      const userRepo = dataSource.getRepository(UserModel);
      let users = await userRepo.find();
      expect(users.length).toBeGreaterThan(0);

      // Clean database
      await TestDatabaseHelper.cleanDatabase(dataSource);

      // Verify all data was deleted
      users = await userRepo.find();
      expect(users).toHaveLength(0);
    });

    it('should handle foreign key constraints during cleanup', async () => {
      // Create data with foreign key relationships
      const userId = 'user-123';
      const businessId = 'business-123';

      await createTestUserInDb(dataSource, userId);
      await createTestBusinessInDb(dataSource, businessId, userId);

      // Clean database (should handle FK constraints)
      await expect(TestDatabaseHelper.cleanDatabase(dataSource)).resolves.not.toThrow();

      // Verify all data was deleted
      const userRepo = dataSource.getRepository(UserModel);
      const businessRepo = dataSource.getRepository(BusinessModel);

      const users = await userRepo.find();
      const businesses = await businessRepo.find();

      expect(users).toHaveLength(0);
      expect(businesses).toHaveLength(0);
    });
  });

  /**
   * Example 3: Foreign Key Relationships
   *
   * This test demonstrates how to test foreign key constraints.
   */
  describe('Foreign Key Relationships', () => {
    it('should enforce foreign key constraint for Business.owner_id', async () => {
      // Attempt to create business without user should fail
      await expect(
        dataSource.query(
          `INSERT INTO businesses (id, owner_id, name, whatsapp_phone, address_street, address_city, address_country, timezone, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
          [
            'business-123',
            'non-existent-user',
            'Test Business',
            '+18095551234',
            '123 Main St',
            'Santo Domingo',
            'DO',
            'America/Santo_Domingo',
          ],
        ),
      ).rejects.toThrow();
    });

    it('should enforce foreign key constraint for Customer.business_id', async () => {
      // Attempt to create customer without business should fail
      await expect(
        dataSource.query(
          `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name)
           VALUES ($1, $2, $3, $4, $5)`,
          ['customer-123', null, 'non-existent-business', '+18095551234', 'Test Customer'],
        ),
      ).rejects.toThrow();
    });

    it('should allow creating customer after business exists', async () => {
      // Create prerequisites
      const userId = 'user-123';
      const businessId = 'business-123';

      await createTestUserInDb(dataSource, userId);
      await createTestBusinessInDb(dataSource, businessId, userId);

      // Now create customer (should succeed)
      const customerId = 'customer-123';
      await createCustomerInDb(dataSource, customerId, businessId);

      // Verify customer was created
      const customerRepo = dataSource.getRepository(CustomerModel);
      const customer = await customerRepo.findOne({ where: { id: customerId } });

      expect(customer).toBeDefined();
      expect(customer?.business_id).toBe(businessId);
    });
  });

  /**
   * Example 4: Using Standalone Functions
   *
   * This test demonstrates how to use standalone functions for direct database access.
   * Standalone functions return IDs, not full objects.
   */
  describe('Using Standalone Functions', () => {
    it('should create business using standalone function', async () => {
      // Standalone functions work directly with the database
      const userId = 'user-123';
      await createTestUserInDb(dataSource, userId);

      const businessId = 'business-123';
      const createdBusinessId = await createTestBusinessInDb(dataSource, businessId, userId, {
        name: 'My Test Business',
        whatsappNumber: '+18095551234',
      });

      expect(createdBusinessId).toBe(businessId);

      // Verify business was created by querying database
      const businessRepo = dataSource.getRepository(BusinessModel);
      const business = await businessRepo.findOne({ where: { id: businessId } });

      expect(business).toBeDefined();
      expect(business?.name).toBe('My Test Business');
      expect(business?.ownerId).toBe(userId);
    });

    it('should create customer using standalone function', async () => {
      // Setup prerequisites
      const userId = 'user-123';
      const businessId = 'business-123';

      await createTestUserInDb(dataSource, userId);
      await createTestBusinessInDb(dataSource, businessId, userId);

      // Create customer using standalone function
      const customerId = 'customer-123';
      const createdCustomerId = await createCustomerInDb(dataSource, customerId, businessId, {
        whatsappPhone: '+18095551234',
        name: 'Test Customer',
      });

      expect(createdCustomerId).toBe(customerId);

      // Verify customer was created by querying database
      const customerRepo = dataSource.getRepository(CustomerModel);
      const customer = await customerRepo.findOne({ where: { id: customerId } });

      expect(customer).toBeDefined();
      expect(customer?.business_id).toBe(businessId);
      expect(customer?.user_id).toBeNull(); // Anonymous customer
    });
  });

  /**
   * Example 5: Testing Data Persistence
   *
   * This test demonstrates how to verify data is correctly persisted.
   */
  describe('Data Persistence', () => {
    it('should persist and retrieve business correctly', async () => {
      // Create business
      const userId = 'user-123';
      const businessId = 'business-123';

      await createTestUserInDb(dataSource, userId);
      const createdBusinessId = await createTestBusinessInDb(dataSource, businessId, userId);

      expect(createdBusinessId).toBe(businessId);

      // Retrieve business from database
      const businessRepo = dataSource.getRepository(BusinessModel);
      const retrievedBusiness = await businessRepo.findOne({ where: { id: businessId } });

      // Verify all fields match
      expect(retrievedBusiness).toBeDefined();
      expect(retrievedBusiness?.id).toBe(businessId);
      expect(retrievedBusiness?.name).toBeDefined();
      expect(retrievedBusiness?.whatsappPhone).toBeDefined();
      expect(retrievedBusiness?.ownerId).toBe(userId);
    });
  });
});

/**
 * Tips for Writing Integration Tests:
 *
 * 1. **Use Real Database**
 *    - Integration tests should use a real database (test database)
 *    - Don't mock database interactions
 *
 * 2. **Clean Between Tests**
 *    - Always clean database in beforeEach
 *    - Ensures tests are independent
 *
 * 3. **Test Relationships**
 *    - Verify foreign key constraints
 *    - Test cascade deletes if applicable
 *    - Verify joins work correctly
 *
 * 4. **Use Helpers**
 *    - Helper classes reduce boilerplate
 *    - Make tests more readable
 *    - Centralize test data creation
 *
 * 5. **Test Complete Flows**
 *    - Integration tests should test realistic scenarios
 *    - Include all necessary setup steps
 *
 * 6. **Verify Data Persistence**
 *    - Create data
 *    - Retrieve it
 *    - Verify all fields match
 *
 * 7. **Handle Async Properly**
 *    - Always await database operations
 *    - Use async/await consistently
 *
 * 8. **Test Error Cases**
 *    - Foreign key violations
 *    - Unique constraint violations
 *    - Invalid data
 */
