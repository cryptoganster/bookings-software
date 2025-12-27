/**
 * Auth BC Test Helpers
 *
 * Provides authentication utilities for E2E and integration tests including:
 * - User login and registration
 * - Test user creation with specific roles
 * - Token management and refresh
 * - Automatic cleanup of test data
 *
 * This file contains ONLY Auth BC functionality. Business and Customer creation
 * have been moved to their respective BC helper files.
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import {
  TestUser,
  UserRole,
  RegisterDto,
  LoginResponse,
  RegisterResponse,
} from '@test-utils/helpers/types';
import { generateUniqueWhatsAppNumber } from '@test-utils/helpers/business';

/**
 * Test Auth Helper Class
 *
 * Provides testing utilities for Auth BC with full application context.
 * Use this class for E2E tests that need to interact with the API.
 */
export class TestAuthHelper {
  private testUsers: TestUser[] = [];

  constructor(private readonly app: INestApplication) {}

  /**
   * Login with email and password
   * @returns JWT access token
   */
  async login(email: string, password: string): Promise<string> {
    try {
      const response = await request(this.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(201); // Login returns 201 Created

      const body = response.body as LoginResponse;
      return body.token;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number };
        if (httpError.status === 401) {
          throw new Error('Authentication failed: Invalid credentials');
        }
        if (httpError.status === 500) {
          throw new Error('Authentication failed: Server error');
        }
      }
      throw error;
    }
  }

  /**
   * Register a new user
   * @returns JWT access token and user ID
   */
  async register(userData: RegisterDto): Promise<{ token: string; userId: string }> {
    try {
      const response = await request(this.app.getHttpServer())
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const body = response.body as RegisterResponse;

      if (!body.token || !body.userId) {
        console.error('Invalid registration response:', JSON.stringify(body, null, 2));
        throw new Error(
          `Registration failed: Invalid response format. Got: ${JSON.stringify(body)}`,
        );
      }

      return {
        token: body.token,
        userId: body.userId,
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number; body?: { message?: string } };
        if (httpError.status === 400) {
          console.error('Registration 400 error:', httpError.body);
          throw new Error(
            `Registration failed: ${JSON.stringify(httpError.body?.message || httpError.body || 'Invalid data')}`,
          );
        }
        if (httpError.status === 409) {
          throw new Error('Registration failed: Email already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Refresh an access token
   */
  async refreshToken(refreshToken: string): Promise<string> {
    try {
      const response = await request(this.app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      return response.body.token;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number };
        if (httpError.status === 401) {
          throw new Error('Token refresh failed: Invalid refresh token');
        }
      }
      throw error;
    }
  }

  /**
   * Create a test user with specific role
   *
   * NOTE: This method only creates the User entity. For BUSINESS_OWNER users,
   * you need to use E2EBusinessHelper to create the Business. For CUSTOMER users,
   * use E2ECustomerHelper to create the Customer.
   *
   * @param role - User role (BUSINESS_OWNER, CUSTOMER, ADMIN)
   * @param options - Optional user data (name)
   * @returns Test user with credentials and token
   */
  async createTestUser(role: UserRole, options?: { name?: string }): Promise<TestUser> {
    const email = generateTestEmail();
    const password = 'Test123!@#';
    const name = options?.name || 'Test User';

    const { token, userId } = await this.register({
      email,
      password,
      name,
      initialRole: role,
    });

    const testUser: TestUser = {
      id: userId,
      email,
      password,
      token,
      role,
    };

    this.testUsers.push(testUser);
    return testUser;
  }

  /**
   * Create an ADMIN test user
   */
  async createAdmin(options?: { name?: string }): Promise<TestUser> {
    return this.createTestUser(UserRole.ADMIN, options);
  }

  /**
   * Create a BUSINESS_OWNER test user with business
   *
   * This is a convenience method that:
   * 1. Creates a User with BUSINESS_OWNER role
   * 2. Waits for BusinessOwner to be created by event handler
   * 3. Creates a Business via API
   * 4. Returns TestUser with businessId populated
   *
   * @param businessData - Optional business data (name, whatsappNumber, address, timezone)
   * @returns Test user with credentials, token, and businessId
   */
  async createBusinessOwner(businessData?: {
    name?: string;
    whatsappNumber?: string;
    address?: {
      street: string;
      city: string;
      state: string | null;
      country: string;
      postalCode: string | null;
    };
    timezone?: string;
  }): Promise<TestUser & { businessId: string }> {
    // 1. Create BUSINESS_OWNER user
    const testUser = await this.createTestUser(UserRole.BUSINESS_OWNER);

    // 2. Wait for OnUserRegisteredHandler to create BusinessOwner and complete onboarding
    // Poll until BusinessOwner exists with onboarding completed (max 10 seconds)
    const maxAttempts = 100; // 100 attempts * 100ms = 10 seconds max
    let attempts = 0;
    let businessOwnerReady = false;
    let lastError: Error | null = null;
    let businessId: string | undefined;

    while (attempts < maxAttempts && !businessOwnerReady) {
      try {
        // Try to create business - if it succeeds, BusinessOwner is ready
        const response = await request(this.app.getHttpServer())
          .post('/api/businesses')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({
            name: businessData?.name || 'Test Business',
            whatsappNumber: businessData?.whatsappNumber || generateUniqueWhatsAppNumber(),
            address: businessData?.address || {
              street: '123 Test St',
              city: 'Test City',
              state: null,
              country: 'Test Country',
              postalCode: null,
            },
            timezone: businessData?.timezone || 'America/Santo_Domingo',
          })
          .expect(201);

        businessId = response.body.id;
        businessOwnerReady = true;
      } catch (error) {
        lastError = error as Error;
        // If error is about BusinessOwner not found or onboarding not completed, wait and retry
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        } else {
          // Max attempts reached, throw the error with context
          console.error(
            `Failed to create business after ${maxAttempts} attempts (${maxAttempts * 100}ms)`,
          );
          console.error('Last error:', lastError);
          throw new Error(
            `Failed to create business after ${maxAttempts} attempts. ` +
              `This usually means the OnUserRegisteredHandler event handler is not running or is too slow. ` +
              `Last error: ${lastError?.message || 'Unknown error'}`,
          );
        }
      }
    }

    if (!businessId) {
      throw new Error('Failed to create business: businessId is undefined');
    }

    // 3. Login again to get updated token with businessId
    const updatedToken = await this.login(testUser.email, testUser.password);

    return {
      ...testUser,
      token: updatedToken,
      businessId,
    };
  }

  /**
   * Clean up all test users created during tests
   *
   * NOTE: This only cleans up User entities. Business and Customer entities
   * should be cleaned up by their respective helpers.
   */
  async cleanupTestUsers(): Promise<void> {
    const dataSource = this.app.get(DataSource);
    const errors: Error[] = [];

    for (const testUser of this.testUsers) {
      try {
        // Delete business_owners if exists (using snake_case column name)
        await dataSource.query('DELETE FROM business_owners WHERE user_id = $1', [testUser.id]);

        // Delete user
        await dataSource.query('DELETE FROM users WHERE id = $1', [testUser.id]);
      } catch (error) {
        errors.push(error as Error);
        console.error(`Failed to cleanup test user ${testUser.id}:`, error);
      }
    }

    this.testUsers = [];

    if (errors.length > 0) {
      console.warn(`Cleanup completed with ${errors.length} errors`);
    }
  }
}

// ============================================================================
// Standalone Functions for Integration Tests
// ============================================================================

/**
 * Generate unique test email
 *
 * Generates a unique email address for testing purposes using timestamp and random string.
 *
 * @returns Unique email address in format: test-{timestamp}-{random}@example.com
 *
 * @example
 * ```typescript
 * const email = generateTestEmail();
 * // Returns: "test-1703001234567-abc123@example.com"
 * ```
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Create a test user directly in the database
 *
 * Creates a User entity directly in the database without going through the API.
 * Useful for integration tests that need to set up test data quickly.
 *
 * @param dataSource - TypeORM DataSource instance
 * @param userId - User ID (optional, generates UUID if not provided)
 * @param options - Optional user data (email, password, name, roles)
 * @returns Created user ID
 *
 * @example
 * ```typescript
 * const userId = await createTestUserInDb(dataSource, undefined, {
 *   email: 'test@example.com',
 *   roles: [UserRole.BUSINESS_OWNER],
 * });
 * ```
 */
export async function createTestUserInDb(
  dataSource: DataSource,
  userId?: string,
  options?: {
    email?: string;
    password?: string;
    name?: string;
    roles?: UserRole[];
    isActive?: boolean;
    emailVerified?: boolean;
  },
): Promise<string> {
  const { UUID } = await import('@shared/vo/uuid');

  const id = userId || UUID.generate().getValue();
  const email = options?.email || generateTestEmail();
  const password = options?.password || 'Test123!@#'; // In real implementation, this should be hashed
  const name = options?.name || 'Test User';
  const roles = options?.roles || [UserRole.BUSINESS_OWNER];
  const isActive = options?.isActive ?? true;
  const emailVerified = options?.emailVerified ?? true;

  await dataSource.query(
    `INSERT INTO users (id, email, password, name, roles, is_active, email_verified, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [id, email, password, name, JSON.stringify(roles), isActive, emailVerified],
  );

  return id;
}
