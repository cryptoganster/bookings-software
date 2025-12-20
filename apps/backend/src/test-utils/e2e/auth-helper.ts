/**
 * E2E Authentication Helper
 *
 * Provides authentication utilities for E2E tests including:
 * - User login and registration
 * - Test user creation with specific roles
 * - Token management and refresh
 * - Automatic cleanup of test data
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import {
  TestUser,
  UserRole,
  RegisterDto,
  CreateTestUserOptions,
  LoginResponse,
  RegisterResponse,
  CreateBusinessDto,
  CreateCustomerDto,
} from '@test-utils/e2e/types';

export class E2EAuthHelper {
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
        .expect(201); // Login devuelve 201 Created

      const body = response.body as LoginResponse;
      return body.accessToken;
    } catch (error: any) {
      if (error.status === 401) {
        throw new Error('Authentication failed: Invalid credentials');
      }
      if (error.status === 500) {
        throw new Error('Authentication failed: Server error');
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

      if (!body.accessToken || !body.userId) {
        console.error('Invalid registration response:', JSON.stringify(body, null, 2));
        throw new Error(
          `Registration failed: Invalid response format. Got: ${JSON.stringify(body)}`,
        );
      }

      return {
        token: body.accessToken,
        userId: body.userId,
      };
    } catch (error: any) {
      if (error.status === 400) {
        console.error('Registration 400 error:', error.body);
        throw new Error(
          `Registration failed: ${JSON.stringify(error.body?.message || error.body || 'Invalid data')}`,
        );
      }
      if (error.status === 409) {
        throw new Error('Registration failed: Email already exists');
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

      return response.body.accessToken;
    } catch (error: any) {
      if (error.status === 401) {
        throw new Error('Token refresh failed: Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Create a test user with specific role
   * @returns Test user with credentials and token
   */
  async createTestUser(role: UserRole, options?: CreateTestUserOptions): Promise<TestUser> {
    const email = this.generateTestEmail();
    const password = 'Test123!@#';
    const name = options?.name || 'Test User';

    const { token, userId } = await this.register({
      email,
      password,
      name,
      initialRole: role, // Cambiado de role a initialRole
    });

    const testUser: TestUser = {
      id: userId,
      email,
      password,
      token,
      role,
    };

    // If BUSINESS_OWNER, create associated Business
    if (role === UserRole.BUSINESS_OWNER) {
      const business = await this.createTestBusiness(token, options?.businessData);
      testUser.businessId = business.id;
    }

    // If CUSTOMER, create associated Customer
    if (role === UserRole.CUSTOMER && options?.customerData) {
      const customer = await this.createTestCustomer(token, options.customerData);
      testUser.customerId = customer.id;
    }

    this.testUsers.push(testUser);
    return testUser;
  }

  /**
   * Create a BUSINESS_OWNER test user with business
   */
  async createBusinessOwner(businessData?: Partial<CreateBusinessDto>): Promise<TestUser> {
    return this.createTestUser(UserRole.BUSINESS_OWNER, { businessData });
  }

  /**
   * Create a CUSTOMER test user
   */
  async createCustomer(customerData?: Partial<CreateCustomerDto>): Promise<TestUser> {
    return this.createTestUser(UserRole.CUSTOMER, { customerData });
  }

  /**
   * Create an ADMIN test user
   */
  async createAdmin(): Promise<TestUser> {
    return this.createTestUser(UserRole.ADMIN);
  }

  /**
   * Clean up all test users created during tests
   */
  async cleanupTestUsers(): Promise<void> {
    const dataSource = this.app.get(DataSource);
    const errors: Error[] = [];

    for (const testUser of this.testUsers) {
      try {
        // Delete associated data first (due to foreign keys)
        if (testUser.businessId) {
          await dataSource.query('DELETE FROM businesses WHERE id = $1', [testUser.businessId]);
        }
        if (testUser.customerId) {
          await dataSource.query('DELETE FROM customers WHERE id = $1', [testUser.customerId]);
        }

        // Delete business_owners if exists
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

  /**
   * Generate unique test email
   */
  private generateTestEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test-${timestamp}-${random}@example.com`;
  }

  /**
   * Create a test business for a BUSINESS_OWNER user
   */
  private async createTestBusiness(
    token: string,
    businessData?: Partial<CreateBusinessDto>,
  ): Promise<{ id: string }> {
    const response = await request(this.app.getHttpServer())
      .post('/api/businesses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: businessData?.name || 'Test Business',
        whatsappNumber: businessData?.whatsappNumber || '+18095551234',
        address: businessData?.address || '123 Test St',
        timezone: businessData?.timezone || 'America/Santo_Domingo',
      })
      .expect(201);

    return { id: response.body.id };
  }

  /**
   * Create a test customer
   */
  private async createTestCustomer(
    token: string,
    customerData: Partial<CreateCustomerDto>,
  ): Promise<{ id: string }> {
    const dataSource = this.app.get(DataSource);
    const { UUID } = await import('@shared/vo/uuid');

    const customerId = UUID.generate().getValue();
    await dataSource.query(
      'INSERT INTO customers (id, business_id, whatsapp_phone, name, user_id) VALUES ($1, $2, $3, $4, $5)',
      [
        customerId,
        customerData.businessId,
        customerData.whatsappPhone || '+18095559999',
        customerData.name || null,
        null, // user_id is null for test customers
      ],
    );

    return { id: customerId };
  }
}
