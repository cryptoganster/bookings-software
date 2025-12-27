/**
 * Availability BC - Capacity Test Helpers
 *
 * Provides Capacity creation and management utilities for E2E and integration tests.
 * This file contains ONLY Availability BC - Capacity functionality.
 *
 * Capacity represents the available slots for an offering on a specific date.
 * It uses optimistic locking (version field) to handle concurrent updates.
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CapacityModel } from '@availability/infra/persistence/models/capacity';
import { UUID } from '@shared/vo/uuid';

/**
 * Test Capacity Helper Class
 *
 * Provides testing utilities for Capacity with full application context.
 * Use this class for E2E tests that need to interact with the API.
 */
export class TestCapacityHelper {
  private createdCapacities: string[] = [];

  constructor(private readonly app: INestApplication) {}

  /**
   * Create capacity for tomorrow at midnight UTC
   *
   * Creates capacity for tomorrow's date at midnight (00:00:00 UTC).
   * Note: Capacity is stored by date only (no time), so we use midnight.
   *
   * @param offeringId - Offering ID
   * @param availableSlots - Number of available slots (default: 5)
   * @param totalSlots - Total number of slots (default: 10)
   * @returns Created capacity model
   */
  async createCapacityForTomorrow(
    offeringId: string,
    availableSlots: number = 5,
    totalSlots: number = 10,
  ): Promise<CapacityModel> {
    const dataSource = this.app.get(DataSource);

    // Create tomorrow's date at midnight UTC (capacity is stored by date only)
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0); // Midnight UTC

    const capacity = new CapacityModel();
    capacity.id = UUID.generate().getValue();
    capacity.offeringId = offeringId;
    capacity.date = tomorrow;
    capacity.totalSlots = totalSlots;
    capacity.availableSlots = availableSlots;
    capacity.version = 0;

    await dataSource.getRepository(CapacityModel).save(capacity);

    this.createdCapacities.push(capacity.id);

    return capacity;
  }

  /**
   * Create capacity for a specific date
   *
   * Creates capacity for a specific date at midnight UTC.
   * The date is normalized to midnight (capacity is stored by date only).
   *
   * @param offeringId - Offering ID
   * @param date - Target date
   * @param availableSlots - Number of available slots (default: 5)
   * @param totalSlots - Total number of slots (default: 10)
   * @returns Created capacity model
   */
  async createCapacityForDate(
    offeringId: string,
    date: Date,
    availableSlots: number = 5,
    totalSlots: number = 10,
  ): Promise<CapacityModel> {
    const dataSource = this.app.get(DataSource);

    // Normalize date to midnight (capacity is stored by date only)
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const capacity = new CapacityModel();
    capacity.id = UUID.generate().getValue();
    capacity.offeringId = offeringId;
    capacity.date = normalizedDate;
    capacity.totalSlots = totalSlots;
    capacity.availableSlots = availableSlots;
    capacity.version = 0;

    await dataSource.getRepository(CapacityModel).save(capacity);

    this.createdCapacities.push(capacity.id);

    return capacity;
  }

  /**
   * Clean up all capacities created during tests
   *
   * Deletes all capacity records created by this helper instance.
   * Handles errors gracefully and logs failures.
   *
   * @param capacityIds - Optional array of capacity IDs to clean up (defaults to all created)
   */
  async cleanupCapacities(capacityIds?: string[]): Promise<void> {
    const dataSource = this.app.get(DataSource);
    const idsToClean = capacityIds || this.createdCapacities;
    const errors: Error[] = [];

    for (const id of idsToClean) {
      try {
        // Delete capacity
        await dataSource.query('DELETE FROM capacities WHERE id = $1', [id]);
      } catch (error) {
        errors.push(error as Error);
        console.error(`Failed to cleanup capacity ${id}:`, error);
      }
    }

    if (!capacityIds) {
      this.createdCapacities = [];
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
 * Helper to create capacity for E2E tests
 * Creates capacity for tomorrow at midnight (00:00:00) with available slots
 * Note: Capacity is stored by date only (no time), so we use midnight
 */
export async function createCapacityForTomorrow(
  dataSource: DataSource,
  offeringId: string,
  availableSlots: number = 5,
  totalSlots: number = 10,
): Promise<CapacityModel> {
  // Create tomorrow's date at midnight UTC (capacity is stored by date only)
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0); // Midnight UTC

  const capacity = new CapacityModel();
  capacity.id = UUID.generate().getValue();
  capacity.offeringId = offeringId;
  capacity.date = tomorrow;
  capacity.totalSlots = totalSlots;
  capacity.availableSlots = availableSlots;
  capacity.version = 0;

  await dataSource.getRepository(CapacityModel).save(capacity);

  return capacity;
}

/**
 * Helper to create capacity for a specific date and time
 */
export async function createCapacityForDate(
  dataSource: DataSource,
  offeringId: string,
  date: Date,
  availableSlots: number = 5,
  totalSlots: number = 10,
): Promise<CapacityModel> {
  // Normalize date to midnight (capacity is stored by date only)
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  const capacity = new CapacityModel();
  capacity.id = UUID.generate().getValue();
  capacity.offeringId = offeringId;
  capacity.date = normalizedDate;
  capacity.totalSlots = totalSlots;
  capacity.availableSlots = availableSlots;
  capacity.version = 0;

  await dataSource.getRepository(CapacityModel).save(capacity);

  return capacity;
}
