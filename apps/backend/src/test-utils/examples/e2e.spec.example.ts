/**
 * End-to-End (E2E) Testing Example
 *
 * This file demonstrates how to write E2E tests that verify
 * complete user journeys through HTTP requests.
 *
 * E2E tests:
 * - Test complete user flows
 * - Use real HTTP requests
 * - Verify API responses
 * - Test authentication and authorization
 * - Validate business logic end-to-end
 *
 * @see apps/backend/src/test-utils/helpers/README.md
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '@/app.module';
import {
  TestDatabaseHelper,
  TestAuthHelper,
  TestBusinessHelper,
  UserRole,
  type TestUser,
} from '@test-utils/helpers';

describe('E2E Testing Examples', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authHelper: TestAuthHelper;
  let businessHelper: TestBusinessHelper;

  /**
   * Setup: Initialize NestJS application and database
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

    // Initialize helpers
    authHelper = new TestAuthHelper(app);
    businessHelper = new TestBusinessHelper(app);
  });

  /**
   * Cleanup: Close application and database
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
   * Example 1: Complete User Journey - Business Owner Registration
   *
   * This test demonstrates a complete user journey from registration to business creation.
   */
  describe('Business Owner Registration Journey', () => {
    it('should register, login, and create business', async () => {
      // Step 1: Register new user
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'owner@example.com',
          password: 'SecurePass123!',
          name: 'John Doe',
          initialRole: UserRole.BUSINESS_OWNER,
        })
        .expect(201);

      expect(registerResponse.body).toHaveProperty('userId');
      expect(registerResponse.body).toHaveProperty('token');

      const { userId, token } = registerResponse.body;

      // Step 2: Verify user can login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'owner@example.com',
          password: 'SecurePass123!',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.user.id).toBe(userId);

      // Step 3: Create business (authenticated request)
      const businessResponse = await request(app.getHttpServer())
        .post('/api/business')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'My Business',
          whatsappNumber: '+18095551234',
          address: {
            street: '123 Main St',
            city: 'Santo Domingo',
            country: 'DO',
          },
          timezone: 'America/Santo_Domingo',
        })
        .expect(201);

      expect(businessResponse.body).toHaveProperty('businessId');

      // Step 4: Verify business was created
      const getBusinessResponse = await request(app.getHttpServer())
        .get('/api/business')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getBusinessResponse.body).toHaveProperty('id');
      expect(getBusinessResponse.body.name).toBe('My Business');
    });
  });

  /**
   * Example 2: Authentication Flow
   *
   * This test demonstrates authentication and authorization.
   */
  describe('Authentication Flow', () => {
    it('should require authentication for protected routes', async () => {
      // Attempt to access protected route without token
      await request(app.getHttpServer()).get('/api/business').expect(401);
    });

    it('should reject invalid tokens', async () => {
      await request(app.getHttpServer())
        .get('/api/business')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should allow access with valid token', async () => {
      // Create business owner (user + business)
      const testUser = await authHelper.createBusinessOwner({
        name: 'Test Business',
      });

      // Access protected route with valid token
      const response = await request(app.getHttpServer())
        .get('/api/business')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  /**
   * Example 3: Business Owner Creation with Helper
   *
   * This test demonstrates using helpers to simplify E2E tests.
   */
  describe('Using Test Helpers', () => {
    it('should create business owner using helper', async () => {
      // Helper encapsulates registration + business creation
      const testUser = await authHelper.createBusinessOwner({
        name: 'My Business',
        whatsappNumber: '+18095551234',
      });

      expect(testUser).toBeDefined();
      expect(testUser.id).toBeDefined();
      expect(testUser.token).toBeDefined();
      expect(testUser.businessId).toBeDefined();

      // Verify can access business
      const response = await request(app.getHttpServer())
        .get('/api/business')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      expect(response.body.id).toBe(testUser.businessId);
      expect(response.body.name).toBe('My Business');
    });
  });

  /**
   * Example 4: Offering Creation Flow
   *
   * This test demonstrates creating offerings for a business.
   */
  describe('Offering Creation Flow', () => {
    let testUser: TestUser & { businessId: string };

    beforeEach(async () => {
      testUser = await authHelper.createBusinessOwner({
        name: 'Salon',
      });
    });

    it('should create offering for business', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Haircut',
          duration: 30,
          maxCapacityPerSlot: 5,
        })
        .expect(201);

      expect(response.body).toHaveProperty('offeringId');
    });

    it('should list offerings for business', async () => {
      // Create multiple offerings
      await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Haircut',
          duration: 30,
          maxCapacityPerSlot: 5,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Hair Coloring',
          duration: 60,
          maxCapacityPerSlot: 3,
        })
        .expect(201);

      // List offerings
      const response = await request(app.getHttpServer())
        .get('/api/offerings')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Haircut');
      expect(response.body[1].name).toBe('Hair Coloring');
    });
  });

  /**
   * Example 5: Error Handling
   *
   * This test demonstrates how to test error cases.
   */
  describe('Error Handling', () => {
    it('should return 400 for invalid registration data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email', // Invalid email format
          password: '123', // Too short
          name: '',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 for duplicate email', async () => {
      // Register first user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'SecurePass123!',
          name: 'User One',
          initialRole: UserRole.BUSINESS_OWNER,
        })
        .expect(201);

      // Attempt to register with same email
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'SecurePass123!',
          name: 'User Two',
          initialRole: UserRole.BUSINESS_OWNER,
        })
        .expect(409);
    });

    it('should return 404 for non-existent resource', async () => {
      const testUser = await authHelper.createBusinessOwner({
        name: 'Test Business',
      });

      await request(app.getHttpServer())
        .get('/api/offerings/non-existent-id')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(404);
    });
  });

  /**
   * Example 6: Testing Response Format
   *
   * This test demonstrates how to verify API response structure.
   */
  describe('Response Format Validation', () => {
    it('should return correct response format for business', async () => {
      const testUser = await authHelper.createBusinessOwner({
        name: 'My Business',
        whatsappNumber: '+18095551234',
      });

      const response = await request(app.getHttpServer())
        .get('/api/business')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      // Verify response structure
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        whatsappNumber: expect.any(String),
        address: expect.objectContaining({
          street: expect.any(String),
          city: expect.any(String),
          country: expect.any(String),
        }),
        timezone: expect.any(String),
        isActive: expect.any(Boolean),
      });
    });
  });
});

/**
 * Tips for Writing E2E Tests:
 *
 * 1. **Test Complete Flows**
 *    - E2E tests should test realistic user journeys
 *    - Include all steps a real user would take
 *
 * 2. **Use Real HTTP Requests**
 *    - Use supertest to make actual HTTP requests
 *    - Don't bypass the HTTP layer
 *
 * 3. **Test Authentication**
 *    - Verify protected routes require authentication
 *    - Test with valid and invalid tokens
 *
 * 4. **Use Helpers for Setup**
 *    - Helpers reduce boilerplate
 *    - Make tests more readable
 *    - Focus tests on what you're actually testing
 *
 * 5. **Test Error Cases**
 *    - Invalid input
 *    - Missing authentication
 *    - Non-existent resources
 *    - Duplicate data
 *
 * 6. **Verify Response Format**
 *    - Check status codes
 *    - Verify response structure
 *    - Validate data types
 *
 * 7. **Clean Between Tests**
 *    - Always clean database in beforeEach
 *    - Ensures tests are independent
 *
 * 8. **Test Authorization**
 *    - Verify users can only access their own data
 *    - Test role-based access control
 *
 * 9. **Keep Tests Fast**
 *    - Use helpers to reduce setup time
 *    - Only test what's necessary
 *    - Run in parallel when possible
 *
 * 10. **Document Test Scenarios**
 *     - Use descriptive test names
 *     - Add comments explaining the flow
 *     - Group related tests in describe blocks
 */
