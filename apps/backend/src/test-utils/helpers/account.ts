/**
 * Account BC Test Helpers
 *
 * Provides BusinessOwner creation and management utilities for E2E and integration tests.
 * This file contains ONLY Account BC functionality.
 *
 * BusinessOwner is the profile of a business owner (our customer) who uses the platform.
 * It's automatically created when a User registers with BUSINESS_OWNER role.
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { SubscriptionPlan } from '@test-utils/helpers/types';

/**
 * Test Account Helper Class
 *
 * Provides testing utilities for Account BC with full application context.
 * Use this class for E2E tests that need to interact with the API.
 */
export class TestAccountHelper {
  private createdBusinessOwners: string[] = [];

  constructor(private readonly app: INestApplication) {}

  /**
   * Get BusinessOwner profile by user ID
   * @param token - JWT access token
   * @returns BusinessOwner profile
   */
  async getProfile(token: string): Promise<{
    id: string;
    userId: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
    onboardingCompleted: boolean;
    maxBusinesses: number;
    maxAppointmentsPerMonth: number;
    price: number;
  }> {
    try {
      const response = await request(this.app.getHttpServer())
        .get('/api/account/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      return response.body;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number };
        if (httpError.status === 401) {
          throw new Error('Get profile failed: Unauthorized');
        }
        if (httpError.status === 404) {
          throw new Error('Get profile failed: BusinessOwner not found');
        }
      }
      throw error;
    }
  }

  /**
   * Complete onboarding for a BusinessOwner
   * @param token - JWT access token
   */
  async completeOnboarding(token: string): Promise<void> {
    try {
      await request(this.app.getHttpServer())
        .post('/api/account/onboarding/complete')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number };
        if (httpError.status === 401) {
          throw new Error('Complete onboarding failed: Unauthorized');
        }
        if (httpError.status === 400) {
          throw new Error('Complete onboarding failed: Onboarding already completed');
        }
      }
      throw error;
    }
  }

  /**
   * Upgrade subscription plan
   * @param token - JWT access token
   * @param newPlan - New subscription plan
   */
  async upgradeSubscription(token: string, newPlan: SubscriptionPlan): Promise<void> {
    try {
      await request(this.app.getHttpServer())
        .put('/api/account/subscription/upgrade')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPlan })
        .expect(200);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number };
        if (httpError.status === 401) {
          throw new Error('Upgrade subscription failed: Unauthorized');
        }
        if (httpError.status === 400) {
          throw new Error('Upgrade subscription failed: Invalid plan or already on this plan');
        }
      }
      throw error;
    }
  }

  /**
   * Get subscription information
   * @param token - JWT access token
   * @returns Subscription details
   */
  async getSubscription(token: string): Promise<{
    plan: string;
    status: string;
    maxBusinesses: number;
    currentBusinessCount: number;
    maxAppointmentsPerMonth: number;
    price: number;
  }> {
    try {
      const response = await request(this.app.getHttpServer())
        .get('/api/account/subscription')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      return response.body;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number };
        if (httpError.status === 401) {
          throw new Error('Get subscription failed: Unauthorized');
        }
      }
      throw error;
    }
  }

  /**
   * Clean up all BusinessOwners created during tests
   *
   * NOTE: This only cleans up BusinessOwner entities. User entities
   * should be cleaned up by TestAuthHelper.
   */
  async cleanupBusinessOwners(): Promise<void> {
    const dataSource = this.app.get(DataSource);
    const errors: Error[] = [];

    for (const businessOwnerId of this.createdBusinessOwners) {
      try {
        // Delete business_owner (using snake_case column name)
        await dataSource.query('DELETE FROM business_owners WHERE id = $1', [businessOwnerId]);
      } catch (error) {
        errors.push(error as Error);
        console.error(`Failed to cleanup business owner ${businessOwnerId}:`, error);
      }
    }

    this.createdBusinessOwners = [];

    if (errors.length > 0) {
      console.warn(`Cleanup completed with ${errors.length} errors`);
    }
  }
}

// ============================================================================
// Standalone Functions for Integration Tests
// ============================================================================

/**
 * Create a BusinessOwner directly in the database
 *
 * Creates a BusinessOwner entity directly in the database without going through the API.
 * Useful for integration tests that need to set up test data quickly.
 *
 * NOTE: The User must already exist in the database before calling this function.
 *
 * @param dataSource - TypeORM DataSource instance
 * @param businessOwnerId - BusinessOwner ID (optional, generates UUID if not provided)
 * @param userId - User ID (required, must exist in users table)
 * @param options - Optional BusinessOwner data
 * @returns Created BusinessOwner ID
 *
 * @example
 * ```typescript
 * const userId = await createTestUserInDb(dataSource);
 * const businessOwnerId = await createBusinessOwnerInDb(dataSource, undefined, userId, {
 *   subscriptionPlan: SubscriptionPlan.PRO,
 *   onboardingCompleted: true,
 * });
 * ```
 */
export async function createBusinessOwnerInDb(
  dataSource: DataSource,
  businessOwnerId?: string,
  userId?: string,
  options?: {
    subscriptionPlan?: SubscriptionPlan;
    subscriptionStatus?: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
    onboardingCompleted?: boolean;
  },
): Promise<string> {
  const { UUID } = await import('@shared/vo/uuid');

  const id = businessOwnerId || UUID.generate().getValue();
  const userIdToUse = userId || UUID.generate().getValue();
  const subscriptionPlan = options?.subscriptionPlan || SubscriptionPlan.FREE;
  const subscriptionStatus = options?.subscriptionStatus || 'ACTIVE';
  const onboardingCompleted = options?.onboardingCompleted ?? false;

  await dataSource.query(
    `INSERT INTO business_owners (id, user_id, subscription_plan, subscription_status, onboarding_completed, created_at, version)
     VALUES ($1, $2, $3, $4, $5, NOW(), 0)`,
    [id, userIdToUse, subscriptionPlan, subscriptionStatus, onboardingCompleted],
  );

  return id;
}
