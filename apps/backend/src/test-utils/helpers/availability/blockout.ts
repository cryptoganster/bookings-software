/**
 * Availability BC - Blockout Test Helpers
 *
 * Provides Blockout configuration utilities for E2E and integration tests.
 * This file contains ONLY Availability BC - Blockout functionality.
 *
 * Blockout represents date ranges when the business is closed (holidays, vacations, etc.).
 */

import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BlockoutModel } from '@availability/infra/persistence/models/blockout';
import { CreateBlockoutDto } from '@test-utils/helpers/types';

/**
 * TestBlockoutHelper - Helper for Blockout entity in E2E tests
 *
 * Provides methods to create and manage blockouts for testing purposes.
 * Automatically tracks created entities for cleanup.
 *
 * @example
 * ```typescript
 * const blockoutHelper = new TestBlockoutHelper(dataSource);
 * const blockout = await blockoutHelper.createBlockout({
 *   businessId: business.id,
 *   startDate: new Date('2025-12-25'),
 *   endDate: new Date('2025-12-26'),
 *   reason: 'Christmas holiday',
 * });
 * await blockoutHelper.cleanup(); // Removes all created blockouts
 * ```
 */
export class TestBlockoutHelper {
  private createdBlockouts: string[] = [];

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Creates a blockout for testing
   *
   * @param dto - Blockout creation data
   * @returns Created blockout model
   *
   * @example
   * ```typescript
   * const blockout = await blockoutHelper.createBlockout({
   *   businessId: business.id,
   *   startDate: new Date('2025-12-25'),
   *   endDate: new Date('2025-12-26'),
   *   reason: 'Christmas holiday',
   * });
   * ```
   */
  async createBlockout(dto: CreateBlockoutDto): Promise<BlockoutModel> {
    const repo = this.dataSource.getRepository(BlockoutModel);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const blockout = repo.create({
      id: uuidv4(),
      businessId: dto.businessId,
      startDate: dto.startDate || tomorrow,
      endDate: dto.endDate || dayAfterTomorrow,
      reason: dto.reason || 'Test blockout',
    });

    const saved = await repo.save(blockout);
    this.createdBlockouts.push(saved.id);

    return saved;
  }

  /**
   * Cleans up all blockouts created by this helper
   *
   * @example
   * ```typescript
   * afterEach(async () => {
   *   await blockoutHelper.cleanup();
   * });
   * ```
   */
  async cleanup(): Promise<void> {
    if (this.createdBlockouts.length === 0) {
      return;
    }

    try {
      const repo = this.dataSource.getRepository(BlockoutModel);
      await repo.delete(this.createdBlockouts);
      this.createdBlockouts = [];
    } catch (error) {
      console.error('Failed to cleanup blockouts:', error);
      // Don't throw - cleanup should be best-effort
    }
  }
}

/**
 * Creates a blockout directly in the database (for integration tests)
 *
 * This is a standalone function that doesn't track entities for cleanup.
 * Use TestBlockoutHelper for E2E tests that need automatic cleanup.
 *
 * @param dataSource - TypeORM DataSource
 * @param dto - Blockout creation data
 * @returns Created blockout model
 *
 * @example
 * ```typescript
 * const blockout = await createBlockoutInDb(dataSource, {
 *   businessId: 'business-uuid',
 *   startDate: new Date('2025-12-25'),
 *   endDate: new Date('2025-12-26'),
 *   reason: 'Christmas holiday',
 * });
 * ```
 */
export async function createBlockoutInDb(
  dataSource: DataSource,
  dto: CreateBlockoutDto,
): Promise<BlockoutModel> {
  const repo = dataSource.getRepository(BlockoutModel);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const blockout = repo.create({
    id: uuidv4(),
    businessId: dto.businessId,
    startDate: dto.startDate || tomorrow,
    endDate: dto.endDate || dayAfterTomorrow,
    reason: dto.reason || 'Test blockout',
  });

  return repo.save(blockout);
}
