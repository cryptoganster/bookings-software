/**
 * Customer BC Test Helpers
 *
 * Provides Customer entity creation and management utilities for E2E and integration tests including:
 * - Anonymous customer creation
 * - Registered customer creation (linked to User)
 * - Customer linking/unlinking to User
 * - Customer data export (GDPR)
 * - Automatic cleanup of test data
 *
 * This file contains ONLY Customer BC functionality.
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { CreateCustomerDto } from '@test-utils/helpers/types';

/**
 * Test Customer Helper Class
 *
 * Provides testing utilities for Customer BC with full application context.
 * Use this class for E2E tests that need to interact with the API.
 */
export class TestCustomerHelper {
  private createdCustomers: string[] = [];

  constructor(private readonly app: INestApplication) {}

  /**
   * Create an anonymous test customer
   *
   * Creates a Customer entity via the API without linking to a User.
   * Requires a valid JWT token from a BUSINESS_OWNER user.
   *
   * @param token - JWT access token
   * @param businessId - Business ID
   * @param customerData - Optional customer data (whatsappPhone, name)
   * @returns Customer ID
   */
  async createAnonymousCustomer(
    token: string,
    businessId: string,
    customerData?: Partial<CreateCustomerDto>,
  ): Promise<string> {
    const defaultData: CreateCustomerDto = {
      businessId,
      whatsappPhone: customerData?.whatsappPhone || generateUniqueWhatsAppPhone(),
      name: customerData?.name,
      userId: null, // ← Anonymous customer
    };

    try {
      const response = await request(this.app.getHttpServer())
        .post('/api/customers')
        .set('Authorization', `Bearer ${token}`)
        .send(defaultData)
        .expect(201);

      const { id } = response.body as { id: string };

      if (!id) {
        throw new Error(
          `Customer creation failed: Invalid response format. Got: ${JSON.stringify(response.body)}`,
        );
      }

      this.createdCustomers.push(id);

      return id;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number; body?: { message?: string } };
        if (httpError.status === 401) {
          throw new Error('Customer creation failed: Unauthorized');
        }
        if (httpError.status === 400) {
          throw new Error(
            `Customer creation failed: ${JSON.stringify(httpError.body?.message || httpError.body || 'Invalid data')}`,
          );
        }
        if (httpError.status === 409) {
          throw new Error(
            'Customer creation failed: WhatsApp phone already exists for this business',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Create a registered test customer (linked to User)
   *
   * Creates a Customer entity via the API linked to a User.
   * Requires a valid JWT token from a BUSINESS_OWNER user.
   *
   * @param token - JWT access token
   * @param businessId - Business ID
   * @param userId - User ID to link to
   * @param customerData - Optional customer data (whatsappPhone, name)
   * @returns Customer ID
   */
  async createRegisteredCustomer(
    token: string,
    businessId: string,
    userId: string,
    customerData?: Partial<CreateCustomerDto>,
  ): Promise<string> {
    const defaultData: CreateCustomerDto = {
      businessId,
      whatsappPhone: customerData?.whatsappPhone || generateUniqueWhatsAppPhone(),
      name: customerData?.name || 'Test Customer',
      userId, // ← Registered customer
    };

    try {
      const response = await request(this.app.getHttpServer())
        .post('/api/customers')
        .set('Authorization', `Bearer ${token}`)
        .send(defaultData)
        .expect(201);

      const { id } = response.body as { id: string };

      if (!id) {
        throw new Error(
          `Customer creation failed: Invalid response format. Got: ${JSON.stringify(response.body)}`,
        );
      }

      this.createdCustomers.push(id);

      return id;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number; body?: { message?: string } };
        if (httpError.status === 401) {
          throw new Error('Customer creation failed: Unauthorized');
        }
        if (httpError.status === 400) {
          throw new Error(
            `Customer creation failed: ${JSON.stringify(httpError.body?.message || httpError.body || 'Invalid data')}`,
          );
        }
        if (httpError.status === 409) {
          throw new Error(
            'Customer creation failed: WhatsApp phone already exists for this business',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Link an anonymous customer to a User
   *
   * @param token - JWT access token
   * @param customerId - Customer ID
   * @param userId - User ID to link to
   */
  async linkCustomerToUser(token: string, customerId: string, userId: string): Promise<void> {
    try {
      await request(this.app.getHttpServer())
        .put(`/api/customers/${customerId}/link`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userId })
        .expect(200);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number; body?: { message?: string } };
        if (httpError.status === 401) {
          throw new Error('Link customer failed: Unauthorized');
        }
        if (httpError.status === 404) {
          throw new Error('Link customer failed: Customer not found');
        }
        if (httpError.status === 400) {
          throw new Error('Link customer failed: Customer already linked to user');
        }
      }
      throw error;
    }
  }

  /**
   * Unlink a customer from a User
   *
   * @param token - JWT access token
   * @param customerId - Customer ID
   */
  async unlinkCustomerFromUser(token: string, customerId: string): Promise<void> {
    try {
      await request(this.app.getHttpServer())
        .put(`/api/customers/${customerId}/unlink`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number; body?: { message?: string } };
        if (httpError.status === 401) {
          throw new Error('Unlink customer failed: Unauthorized');
        }
        if (httpError.status === 404) {
          throw new Error('Unlink customer failed: Customer not found');
        }
        if (httpError.status === 400) {
          throw new Error('Unlink customer failed: Customer not linked to user');
        }
      }
      throw error;
    }
  }

  /**
   * Get customer by ID
   *
   * @param token - JWT access token
   * @param customerId - Customer ID
   * @returns Customer data
   */
  async getCustomer(
    token: string,
    customerId: string,
  ): Promise<{
    id: string;
    businessId: string;
    userId: string | null;
    whatsappPhone: string;
    name: string | null;
    createdAt: string;
  }> {
    try {
      const response = await request(this.app.getHttpServer())
        .get(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      return response.body;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number };
        if (httpError.status === 401) {
          throw new Error('Get customer failed: Unauthorized');
        }
        if (httpError.status === 404) {
          throw new Error('Get customer failed: Customer not found');
        }
        if (httpError.status === 403) {
          throw new Error('Get customer failed: Access denied');
        }
      }
      throw error;
    }
  }

  /**
   * Export customer data (GDPR)
   *
   * @param token - JWT access token
   * @param customerId - Customer ID
   * @returns Customer data export
   */
  async exportCustomerData(token: string, customerId: string): Promise<unknown> {
    try {
      const response = await request(this.app.getHttpServer())
        .get(`/api/customers/${customerId}/export`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      return response.body;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number };
        if (httpError.status === 401) {
          throw new Error('Export customer data failed: Unauthorized');
        }
        if (httpError.status === 404) {
          throw new Error('Export customer data failed: Customer not found');
        }
        if (httpError.status === 403) {
          throw new Error('Export customer data failed: Access denied');
        }
      }
      throw error;
    }
  }

  /**
   * Delete customer (GDPR anonymization)
   *
   * @param token - JWT access token
   * @param customerId - Customer ID
   */
  async deleteCustomer(token: string, customerId: string): Promise<void> {
    try {
      await request(this.app.getHttpServer())
        .delete(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number; body?: { message?: string } };
        if (httpError.status === 401) {
          throw new Error('Delete customer failed: Unauthorized');
        }
        if (httpError.status === 404) {
          throw new Error('Delete customer failed: Customer not found');
        }
        if (httpError.status === 403) {
          throw new Error('Delete customer failed: Access denied');
        }
        if (httpError.status === 400) {
          throw new Error(
            `Delete customer failed: ${httpError.body?.message || 'Customer has future appointments'}`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Clean up all test customers created during tests
   */
  async cleanupCustomers(customerIds?: string[]): Promise<void> {
    const dataSource = this.app.get(DataSource);
    const idsToClean = customerIds || this.createdCustomers;
    const errors: Error[] = [];

    for (const id of idsToClean) {
      try {
        // Delete customer (cascade will handle related entities)
        await dataSource.query('DELETE FROM customers WHERE id = $1', [id]);
      } catch (error) {
        errors.push(error as Error);
        console.error(`Failed to cleanup customer ${id}:`, error);
      }
    }

    if (!customerIds) {
      this.createdCustomers = [];
    }

    if (errors.length > 0) {
      console.warn(`Cleanup completed with ${errors.length} errors`);
    }
  }
}

// ============================================================================
// Standalone Functions for Integration Tests
// ============================================================================

/**
 * Generate unique WhatsApp phone number
 *
 * Generates a unique WhatsApp phone number for testing purposes using timestamp.
 * Format: +1829{timestamp_last_7_digits}
 *
 * @returns Unique WhatsApp phone number in format: +1829XXXXXXX
 *
 * @example
 * ```typescript
 * const phone = generateUniqueWhatsAppPhone();
 * // Returns: "+18291234567"
 * ```
 */
export function generateUniqueWhatsAppPhone(): string {
  const timestamp = Date.now().toString();
  // Take last 7 digits of timestamp to ensure uniqueness
  const uniquePart = timestamp.slice(-7);
  return `+1829${uniquePart}`;
}

/**
 * Create a test customer directly in the database
 *
 * Creates a Customer entity directly in the database without going through the API.
 * Useful for integration tests that need to set up test data quickly.
 *
 * @param dataSource - TypeORM DataSource instance
 * @param customerId - Customer ID (optional, generates UUID if not provided)
 * @param businessId - Business ID (required)
 * @param customerData - Optional customer data (whatsappPhone, name, userId)
 * @returns Created customer ID
 *
 * @example
 * ```typescript
 * // Anonymous customer
 * const customerId = await createCustomerInDb(dataSource, undefined, businessId, {
 *   whatsappPhone: '+18291234567',
 *   name: 'Test Customer',
 * });
 *
 * // Registered customer
 * const customerId = await createCustomerInDb(dataSource, undefined, businessId, {
 *   whatsappPhone: '+18291234567',
 *   name: 'Test Customer',
 *   userId: 'user-uuid',
 * });
 * ```
 */
export async function createCustomerInDb(
  dataSource: DataSource,
  customerId: string | undefined,
  businessId: string,
  customerData?: Partial<CreateCustomerDto>,
): Promise<string> {
  const { UUID } = await import('@shared/vo/uuid');

  const id = customerId || UUID.generate().getValue();
  const whatsappPhone = customerData?.whatsappPhone || generateUniqueWhatsAppPhone();
  const name = customerData?.name || null;
  const userId = customerData?.userId || null;

  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, created_at, updated_at, version)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), 0)`,
    [id, userId, businessId, whatsappPhone, name],
  );

  return id;
}
