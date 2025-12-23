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
} from '@test-utils/e2e-helpers/types';

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
      return body.token; // Changed from accessToken to token
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

      return response.body.token; // Changed from accessToken to token
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

    // If BUSINESS_OWNER, wait for BusinessOwner to be created by event handler, then create Business
    if (role === UserRole.BUSINESS_OWNER) {
      // Wait for OnUserRegisteredHandler to create BusinessOwner (asynchronous event handler)
      // Simple delay to allow event processing (event handlers are async)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const business = await this.createTestBusiness(token, options?.businessData);
      testUser.businessId = business.id;

      // Login again to get updated token with businessId
      const updatedToken = await this.login(email, password);
      testUser.token = updatedToken;
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

        // Delete business_owners if exists (using camelCase column name)
        await dataSource.query('DELETE FROM business_owners WHERE "userId" = $1', [testUser.id]);

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
    // Generate unique WhatsApp number for each test business
    const uniqueWhatsApp =
      businessData?.whatsappNumber || `+1809555${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const response = await request(this.app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: businessData?.name || 'Test Business',
          whatsappNumber: uniqueWhatsApp,
          address: businessData?.address || {
            street: '123 Test St',
            city: 'Santo Domingo',
            state: null,
            country: 'Dominican Republic',
            postalCode: null,
          },
          timezone: businessData?.timezone || 'America/Santo_Domingo',
        })
        .expect(201);

      return { id: response.body.id };
    } catch (error: unknown) {
      // Log the error response for debugging
      if (error && typeof error === 'object' && 'response' in error) {
        const httpError = error as { response: { status: number; body: unknown } };
        console.error('Create business failed:', {
          status: httpError.response.status,
          body: httpError.response.body,
        });
      }
      throw error;
    }
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
