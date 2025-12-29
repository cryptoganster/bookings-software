/**
 * Offering BC Test Helpers
 *
 * Provides Offering entity creation and management utilities for E2E and integration tests including:
 * - Offering creation with various configurations
 * - Multiple offering creation
 * - Offering deactivation
 * - Automatic cleanup of test data
 *
 * This file contains ONLY Offering BC functionality.
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { OfferingModel } from '@offering/infra/persistence/models/offering';

/**
 * Test Offering Helper Class
 *
 * Provides testing utilities for Offering BC with full application context.
 * Use this class for E2E tests that need to interact with the API.
 */
export class TestOfferingHelper {
  private createdOfferings: string[] = [];

  constructor(private readonly app: INestApplication) {}

  /**
   * Create a test offering
   *
   * Creates an Offering entity via the API.
   * Requires a valid JWT token from a BUSINESS_OWNER user.
   *
   * @param token - JWT access token
   * @param offeringData - Optional offering data (name, durationMinutes, maxCapacityPerSlot)
   * @returns Offering ID
   */
  async createOffering(
    token: string,
    offeringData?: {
      name?: string;
      durationMinutes?: number;
      maxCapacityPerSlot?: number;
      maxDailyCapacity?: number | null;
    },
  ): Promise<string> {
    const defaultData = {
      name: offeringData?.name || 'Corte de Pelo',
      durationMinutes: offeringData?.durationMinutes || 30,
      maxCapacityPerSlot: offeringData?.maxCapacityPerSlot || 5,
      maxDailyCapacity: offeringData?.maxDailyCapacity ?? null,
    };

    try {
      const response = await request(this.app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${token}`)
        .send(defaultData)
        .expect(201);

      const { offeringId } = response.body as { offeringId: string };

      if (!offeringId) {
        throw new Error(
          `Offering creation failed: Invalid response format. Got: ${JSON.stringify(response.body)}`,
        );
      }

      this.createdOfferings.push(offeringId);

      return offeringId;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number; body?: { message?: string } };
        if (httpError.status === 401) {
          throw new Error('Offering creation failed: Unauthorized');
        }
        if (httpError.status === 400) {
          throw new Error(
            `Offering creation failed: ${JSON.stringify(httpError.body?.message || httpError.body || 'Invalid data')}`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Create multiple offerings
   *
   * @param token - JWT access token
   * @param count - Number of offerings to create
   * @returns Array of offering IDs
   */
  async createMultipleOfferings(token: string, count: number = 3): Promise<string[]> {
    const names = ['Corte de Pelo', 'Lavado', 'Tinte', 'Manicure', 'Pedicure'];
    const offeringIds: string[] = [];

    for (let i = 0; i < count; i++) {
      const offeringId = await this.createOffering(token, {
        name: names[i] || `Servicio ${i + 1}`,
        durationMinutes: 30 + i * 15,
        maxCapacityPerSlot: 5,
      });
      offeringIds.push(offeringId);
    }

    return offeringIds;
  }

  /**
   * Deactivate an offering
   *
   * @param token - JWT access token
   * @param offeringId - Offering ID
   */
  async deactivateOffering(token: string, offeringId: string): Promise<void> {
    try {
      await request(this.app.getHttpServer())
        .delete(`/api/offerings/${offeringId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number; body?: { message?: string } };
        if (httpError.status === 401) {
          throw new Error('Offering deactivation failed: Unauthorized');
        }
        if (httpError.status === 404) {
          throw new Error('Offering deactivation failed: Offering not found');
        }
      }
      throw error;
    }
  }

  /**
   * Clean up all test offerings created during tests
   */
  async cleanupOfferings(offeringIds?: string[]): Promise<void> {
    const dataSource = this.app.get(DataSource);
    const idsToClean = offeringIds || this.createdOfferings;
    const errors: Error[] = [];

    for (const id of idsToClean) {
      try {
        // Delete offering (cascade will handle related entities)
        await dataSource.query('DELETE FROM offerings WHERE id = $1', [id]);
      } catch (error) {
        errors.push(error as Error);
        console.error(`Failed to cleanup offering ${id}:`, error);
      }
    }

    if (!offeringIds) {
      this.createdOfferings = [];
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
 * Create an active offering directly in the database
 *
 * Creates an Offering entity directly in the database without going through the API.
 * Useful for integration tests that need to set up test data quickly.
 *
 * @param dataSource - TypeORM DataSource instance
 * @param businessId - Business ID (required)
 * @param offeringData - Optional offering data (id, name, duration, maxCapacityPerSlot)
 * @returns Created offering model
 *
 * @example
 * ```typescript
 * const offering = await createActiveOffering(dataSource, businessId, {
 *   name: 'Haircut',
 *   duration: 30,
 * });
 * ```
 */
export async function createActiveOffering(
  dataSource: DataSource,
  businessId: string,
  offeringData?: {
    id?: string;
    name?: string;
    duration?: number;
    maxCapacityPerSlot?: number;
    maxDailyCapacity?: number | null;
  },
): Promise<OfferingModel> {
  const { UUID } = await import('@shared/vo/uuid');

  const offering = new OfferingModel();
  offering.id = offeringData?.id || UUID.generate().getValue();
  offering.businessId = businessId;
  offering.name = offeringData?.name || 'Corte de Pelo';
  offering.duration = offeringData?.duration || 30;
  offering.maxCapacityPerSlot = offeringData?.maxCapacityPerSlot || 5;
  offering.maxDailyCapacity = offeringData?.maxDailyCapacity ?? null;
  offering.isActive = true;

  await dataSource.getRepository(OfferingModel).save(offering);

  return offering;
}

/**
 * Create multiple offerings directly in the database
 *
 * @param dataSource - TypeORM DataSource instance
 * @param businessId - Business ID (required)
 * @param count - Number of offerings to create (default: 3)
 * @returns Array of created offering models
 *
 * @example
 * ```typescript
 * const offerings = await createMultipleOfferings(dataSource, businessId, 5);
 * ```
 */
export async function createMultipleOfferings(
  dataSource: DataSource,
  businessId: string,
  count: number = 3,
): Promise<OfferingModel[]> {
  const offerings: OfferingModel[] = [];
  const names = ['Corte de Pelo', 'Lavado', 'Tinte', 'Manicure', 'Pedicure'];

  for (let i = 0; i < count; i++) {
    const offering = await createActiveOffering(dataSource, businessId, {
      name: names[i] || `Servicio ${i + 1}`,
      duration: 30 + i * 15,
      maxCapacityPerSlot: 5,
    });
    offerings.push(offering);
  }

  return offerings;
}

/**
 * Create an offering directly in the database with full control
 *
 * @param dataSource - TypeORM DataSource instance
 * @param offeringId - Offering ID (optional, generates UUID if not provided)
 * @param businessId - Business ID (required)
 * @param offeringData - Optional offering data
 * @returns Created offering ID
 *
 * @example
 * ```typescript
 * const offeringId = await createOfferingInDb(dataSource, undefined, businessId, {
 *   name: 'Premium Haircut',
 *   duration: 60,
 *   maxCapacityPerSlot: 3,
 * });
 * ```
 */
export async function createOfferingInDb(
  dataSource: DataSource,
  offeringId: string | undefined,
  businessId: string,
  offeringData?: {
    name?: string;
    duration?: number;
    maxCapacityPerSlot?: number;
    maxDailyCapacity?: number | null;
  },
): Promise<string> {
  const { UUID } = await import('@shared/vo/uuid');

  const id = offeringId || UUID.generate().getValue();
  const name = offeringData?.name || 'Corte de Pelo';
  const duration = offeringData?.duration || 30;
  const maxCapacityPerSlot = offeringData?.maxCapacityPerSlot || 5;
  const maxDailyCapacity = offeringData?.maxDailyCapacity ?? null;

  await dataSource.query(
    `INSERT INTO offerings (id, business_id, name, duration, max_capacity_per_slot, max_daily_capacity, is_active, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, true, NOW())`,
    [id, businessId, name, duration, maxCapacityPerSlot, maxDailyCapacity],
  );

  return id;
}
