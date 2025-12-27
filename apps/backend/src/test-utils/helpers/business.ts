/**
 * Business BC Test Helpers
 *
 * Provides Business entity creation and configuration utilities for E2E and integration tests including:
 * - Business creation with unique WhatsApp numbers
 * - WhatsApp configuration
 * - Business information updates
 * - Automatic cleanup of test data
 *
 * This file contains ONLY Business BC functionality.
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { CreateBusinessDto, ConfigureWhatsAppDto } from './types';
import { createTestUserInDb } from './auth';

/**
 * Test Business Helper Class
 *
 * Provides testing utilities for Business BC with full application context.
 * Use this class for E2E tests that need to interact with the API.
 */
export class TestBusinessHelper {
  private createdBusinesses: string[] = [];

  constructor(private readonly app: INestApplication) {}

  /**
   * Create a test business
   *
   * Creates a Business entity via the API with unique WhatsApp number.
   * Requires a valid JWT token from a BUSINESS_OWNER user.
   *
   * @param token - JWT access token
   * @param businessData - Optional business data (name, whatsappNumber, address, timezone)
   * @returns Business ID and updated token with businessId
   */
  async createTestBusiness(
    token: string,
    businessData?: Partial<CreateBusinessDto>,
  ): Promise<{ id: string; token: string }> {
    const defaultData: CreateBusinessDto = {
      name: businessData?.name || 'Test Business',
      whatsappNumber: businessData?.whatsappNumber || generateUniqueWhatsAppNumber(),
      address: businessData?.address || {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345',
      },
      timezone: businessData?.timezone || 'America/Santo_Domingo',
    };

    try {
      const response = await request(this.app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${token}`)
        .send(defaultData)
        .expect(201);

      const { id, token: newToken } = response.body as { id: string; token: string };

      if (!id || !newToken) {
        throw new Error(
          `Business creation failed: Invalid response format. Got: ${JSON.stringify(response.body)}`,
        );
      }

      this.createdBusinesses.push(id);

      return { id, token: newToken };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number; body?: { message?: string } };
        if (httpError.status === 401) {
          throw new Error('Business creation failed: Unauthorized');
        }
        if (httpError.status === 400) {
          throw new Error(
            `Business creation failed: ${JSON.stringify(httpError.body?.message || httpError.body || 'Invalid data')}`,
          );
        }
        if (httpError.status === 409) {
          throw new Error('Business creation failed: WhatsApp number already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Configure WhatsApp number for a business
   *
   * @param token - JWT access token
   * @param businessId - Business ID
   * @param whatsappNumber - New WhatsApp number
   */
  async configureWhatsApp(
    token: string,
    businessId: string,
    whatsappNumber: string,
  ): Promise<void> {
    const dto: ConfigureWhatsAppDto = { whatsappNumber };

    try {
      await request(this.app.getHttpServer())
        .put(`/api/businesses/${businessId}/whatsapp`)
        .set('Authorization', `Bearer ${token}`)
        .send(dto)
        .expect(200);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number; body?: { message?: string } };
        if (httpError.status === 401) {
          throw new Error('WhatsApp configuration failed: Unauthorized');
        }
        if (httpError.status === 404) {
          throw new Error('WhatsApp configuration failed: Business not found');
        }
        if (httpError.status === 409) {
          throw new Error('WhatsApp configuration failed: WhatsApp number already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Clean up all test businesses created during tests
   */
  async cleanupBusinesses(businessIds?: string[]): Promise<void> {
    const dataSource = this.app.get(DataSource);
    const idsToClean = businessIds || this.createdBusinesses;
    const errors: Error[] = [];

    for (const id of idsToClean) {
      try {
        // Delete business (cascade will handle related entities)
        await dataSource.query('DELETE FROM businesses WHERE id = $1', [id]);
      } catch (error) {
        errors.push(error as Error);
        console.error(`Failed to cleanup business ${id}:`, error);
      }
    }

    if (!businessIds) {
      this.createdBusinesses = [];
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
 * Generate unique WhatsApp number
 *
 * Generates a unique WhatsApp number for testing purposes using timestamp.
 * Format: +1809{timestamp_last_7_digits}
 *
 * @returns Unique WhatsApp number in format: +1809XXXXXXX
 *
 * @example
 * ```typescript
 * const whatsapp = generateUniqueWhatsAppNumber();
 * // Returns: "+18091234567"
 * ```
 */
export function generateUniqueWhatsAppNumber(): string {
  const timestamp = Date.now().toString();
  // Take last 7 digits of timestamp to ensure uniqueness
  const uniquePart = timestamp.slice(-7);
  return `+1809${uniquePart}`;
}

/**
 * Create a test business with minimal required data (simplified for tests)
 *
 * This is a simplified version that generates all required IDs automatically.
 * Use this in tests where you don't care about specific IDs.
 *
 * @param dataSource - TypeORM DataSource
 * @param businessData - Optional business data
 * @returns Business ID
 *
 * @example
 * ```typescript
 * const businessId = await createTestBusiness(dataSource);
 * ```
 */
export async function createTestBusiness(
  dataSource: DataSource,
  businessData?: Partial<CreateBusinessDto>,
): Promise<string> {
  const { UUID } = await import('@shared/vo/uuid');
  const businessId = UUID.generate().getValue();
  const ownerId = UUID.generate().getValue();

  // First create the user (owner)
  await createTestUserInDb(dataSource, ownerId);

  // Then create the business
  return createTestBusinessInDb(dataSource, businessId, ownerId, businessData);
}

/**
 * Create a test business directly in the database
 *
 * Creates a Business entity directly in the database without going through the API.
 * Useful for integration tests that need to set up test data quickly.
 *
 * @param dataSource - TypeORM DataSource instance
 * @param businessId - Business ID (optional, generates UUID if not provided)
 * @param ownerId - User ID of the business owner (required)
 * @param businessData - Optional business data (name, whatsappNumber, address, timezone)
 * @returns Created business ID
 *
 * @example
 * ```typescript
 * const businessId = await createTestBusinessInDb(dataSource, undefined, userId, {
 *   name: 'My Test Business',
 *   whatsappNumber: '+18091234567',
 * });
 * ```
 */
export async function createTestBusinessInDb(
  dataSource: DataSource,
  businessId: string | undefined,
  ownerId: string,
  businessData?: Partial<CreateBusinessDto>,
): Promise<string> {
  const { UUID } = await import('@shared/vo/uuid');

  const id = businessId || UUID.generate().getValue();
  const name = businessData?.name || 'Test Business';
  const whatsappNumber = businessData?.whatsappNumber || generateUniqueWhatsAppNumber();
  const address = businessData?.address || {
    street: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    postalCode: '12345',
  };
  const timezone = businessData?.timezone || 'America/Santo_Domingo';

  await dataSource.query(
    `INSERT INTO businesses (id, owner_id, name, whatsapp_number, address_street, address_city, address_state, address_country, address_postal_code, timezone, is_active, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW())`,
    [
      id,
      ownerId,
      name,
      whatsappNumber,
      address.street,
      address.city,
      address.state || null,
      address.country,
      address.postalCode || null,
      timezone,
    ],
  );

  return id;
}
