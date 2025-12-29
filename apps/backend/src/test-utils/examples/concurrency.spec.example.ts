/**
 * Concurrency Testing Example
 *
 * This file demonstrates how to write tests that verify
 * concurrent operations are handled correctly.
 *
 * Concurrency tests:
 * - Test race conditions
 * - Verify optimistic locking
 * - Test concurrent updates
 * - Validate data integrity under load
 *
 * @see apps/backend/src/test-utils/helpers/README.md
 * @see .kiro/steering/PRD.md (Section 3: Gestión de Concurrencia)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { DataSource, Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {
  TestDatabaseHelper,
  TestCapacityHelper,
  createTestUserInDb,
  createTestBusinessInDb,
} from '@test-utils/helpers';
import { CapacityModel } from '@availability/infra/persistence/models/capacity';
import { AppModule } from '@/app.module';

describe('Concurrency Testing Examples', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let capacityHelper: TestCapacityHelper;
  let capacityRepo: Repository<CapacityModel>;

  /**
   * Setup: Initialize database connection and helpers
   */
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    capacityHelper = new TestCapacityHelper(app);
    capacityRepo = dataSource.getRepository(CapacityModel);
  });

  /**
   * Cleanup: Close database connection
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
   * Example 1: Concurrent Capacity Updates
   *
   * This test demonstrates how optimistic locking prevents lost updates
   * when multiple processes try to update the same capacity simultaneously.
   */
  describe('Concurrent Capacity Updates', () => {
    it('should handle concurrent slot decrements with optimistic locking', async () => {
      // Setup: Create capacity with 10 available slots
      const userId = 'user-123';
      const businessId = 'business-123';
      const offeringId = 'offering-123';

      await createTestUserInDb(dataSource, userId);
      await createTestBusinessInDb(dataSource, businessId, userId);

      const capacity = await capacityHelper.createCapacityForDate(
        offeringId,
        new Date('2025-01-15'),
        10, // availableSlots
        10, // totalSlots
      );

      // Simulate 5 concurrent users trying to book slots
      const concurrentBookings = Array.from({ length: 5 }, async (_, index) => {
        try {
          // Each user reads the current capacity
          const currentCapacity = await capacityRepo.findOne({
            where: { id: capacity.id },
          });

          if (!currentCapacity) {
            throw new Error('Capacity not found');
          }

          // Simulate some processing time
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));

          // Try to decrement slot
          if (currentCapacity.availableSlots > 0) {
            currentCapacity.availableSlots -= 1;

            // This update includes version check (optimistic locking)
            const result = await capacityRepo
              .createQueryBuilder()
              .update(CapacityModel)
              .set({
                availableSlots: currentCapacity.availableSlots,
                version: currentCapacity.version + 1,
              })
              .where('id = :id', { id: currentCapacity.id })
              .andWhere('version = :version', { version: currentCapacity.version })
              .execute();

            if (result.affected === 0) {
              // Optimistic locking detected concurrent modification
              return { success: false, reason: 'concurrency' };
            }

            return { success: true, user: index };
          }

          return { success: false, reason: 'no_slots' };
        } catch (error) {
          return { success: false, reason: 'error', error };
        }
      });

      // Wait for all concurrent operations to complete
      const results = await Promise.all(concurrentBookings);

      // Verify results
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      console.log('Successful bookings:', successful.length);
      console.log('Failed bookings:', failed.length);

      // At least some should succeed
      expect(successful.length).toBeGreaterThan(0);

      // Some should fail due to concurrency
      expect(failed.length).toBeGreaterThan(0);

      // Total should be 5
      expect(successful.length + failed.length).toBe(5);

      // Verify final capacity state
      const finalCapacity = await capacityRepo.findOne({
        where: { id: capacity.id },
      });

      expect(finalCapacity).toBeDefined();
      expect(finalCapacity!.availableSlots).toBe(10 - successful.length);

      // Version should have incremented for each successful update
      expect(finalCapacity!.version).toBe(successful.length);
    });

    it('should prevent overbooking with concurrent requests', async () => {
      // Setup: Create capacity with only 1 available slot
      const userId = 'user-123';
      const businessId = 'business-123';
      const offeringId = 'offering-123';

      await createTestUserInDb(dataSource, userId);
      await createTestBusinessInDb(dataSource, businessId, userId);

      const capacity = await capacityHelper.createCapacityForDate(
        offeringId,
        new Date('2025-01-15'),
        1, // Only 1 slot available
        1, // totalSlots
      );

      // Simulate 10 concurrent users trying to book the last slot
      const concurrentBookings = Array.from({ length: 10 }, async (_, index) => {
        try {
          const currentCapacity = await capacityRepo.findOne({
            where: { id: capacity.id },
          });

          if (!currentCapacity || currentCapacity.availableSlots === 0) {
            return { success: false, reason: 'no_slots' };
          }

          // Try to book the slot
          currentCapacity.availableSlots -= 1;

          const result = await capacityRepo
            .createQueryBuilder()
            .update(CapacityModel)
            .set({
              availableSlots: currentCapacity.availableSlots,
              version: currentCapacity.version + 1,
            })
            .where('id = :id', { id: currentCapacity.id })
            .andWhere('version = :version', { version: currentCapacity.version })
            .execute();

          if (result.affected === 0) {
            return { success: false, reason: 'concurrency' };
          }

          return { success: true, user: index };
        } catch (error) {
          return { success: false, reason: 'error', error };
        }
      });

      const results = await Promise.all(concurrentBookings);

      // Verify only ONE booking succeeded
      const successful = results.filter((r) => r.success);
      expect(successful).toHaveLength(1);

      // Verify final capacity
      const finalCapacity = await capacityRepo.findOne({
        where: { id: capacity.id },
      });

      expect(finalCapacity!.availableSlots).toBe(0);
      expect(finalCapacity!.version).toBe(1); // Only one successful update
    });
  });

  /**
   * Example 2: Retry Logic for Concurrent Updates
   *
   * This test demonstrates how to implement retry logic
   * when optimistic locking detects concurrent modifications.
   */
  describe('Retry Logic', () => {
    it('should successfully update after retries', async () => {
      // Setup
      const userId = 'user-123';
      const businessId = 'business-123';
      const offeringId = 'offering-123';

      await createTestUserInDb(dataSource, userId);
      await createTestBusinessInDb(dataSource, businessId, userId);

      const capacity = await capacityHelper.createCapacityForDate(
        offeringId,
        new Date('2025-01-15'),
        10, // availableSlots
        10, // totalSlots
      );

      // Function with retry logic
      const updateWithRetry = async (maxRetries = 3): Promise<boolean> => {
        let attempt = 0;

        while (attempt < maxRetries) {
          try {
            const currentCapacity = await capacityRepo.findOne({
              where: { id: capacity.id },
            });

            if (!currentCapacity || currentCapacity.availableSlots === 0) {
              return false;
            }

            currentCapacity.availableSlots -= 1;

            const result = await capacityRepo
              .createQueryBuilder()
              .update(CapacityModel)
              .set({
                availableSlots: currentCapacity.availableSlots,
                version: currentCapacity.version + 1,
              })
              .where('id = :id', { id: currentCapacity.id })
              .andWhere('version = :version', { version: currentCapacity.version })
              .execute();

            if (result.affected === 0) {
              // Concurrent modification detected, retry
              attempt++;
              await new Promise((resolve) => setTimeout(resolve, 10 * Math.pow(2, attempt))); // Exponential backoff
              continue;
            }

            return true; // Success
          } catch (error) {
            attempt++;
            if (attempt >= maxRetries) {
              throw error;
            }
          }
        }

        return false; // Max retries exceeded
      };

      // Test with concurrent updates
      const updates = Array.from({ length: 5 }, () => updateWithRetry());
      const results = await Promise.all(updates);

      // All should eventually succeed with retry logic
      const successful = results.filter((r) => r === true);
      expect(successful.length).toBe(5);

      // Verify final state
      const finalCapacity = await capacityRepo.findOne({
        where: { id: capacity.id },
      });

      expect(finalCapacity!.availableSlots).toBe(5);
    });
  });

  /**
   * Example 3: Testing Version Increment
   *
   * This test verifies that version field increments correctly
   * with each update.
   */
  describe('Version Increment', () => {
    it('should increment version with each update', async () => {
      // Setup
      const userId = 'user-123';
      const businessId = 'business-123';
      const offeringId = 'offering-123';

      await createTestUserInDb(dataSource, userId);
      await createTestBusinessInDb(dataSource, businessId, userId);

      const capacity = await capacityHelper.createCapacityForDate(
        offeringId,
        new Date('2025-01-15'),
        10, // availableSlots
        10, // totalSlots
      );

      // Initial version should be 0
      expect(capacity.version).toBe(0);

      // Perform 5 sequential updates
      for (let i = 0; i < 5; i++) {
        const currentCapacity = await capacityRepo.findOne({
          where: { id: capacity.id },
        });

        expect(currentCapacity!.version).toBe(i);

        currentCapacity!.availableSlots -= 1;

        await capacityRepo
          .createQueryBuilder()
          .update(CapacityModel)
          .set({
            availableSlots: currentCapacity!.availableSlots,
            version: currentCapacity!.version + 1,
          })
          .where('id = :id', { id: currentCapacity!.id })
          .andWhere('version = :version', { version: currentCapacity!.version })
          .execute();
      }

      // Final version should be 5
      const finalCapacity = await capacityRepo.findOne({
        where: { id: capacity.id },
      });

      expect(finalCapacity!.version).toBe(5);
      expect(finalCapacity!.availableSlots).toBe(5);
    });
  });
});

/**
 * Tips for Writing Concurrency Tests:
 *
 * 1. **Test Real Scenarios**
 *    - Simulate actual concurrent user behavior
 *    - Test with realistic timing and delays
 *
 * 2. **Use Optimistic Locking**
 *    - Always include version field in updates
 *    - Check affected rows after update
 *    - Implement retry logic with exponential backoff
 *
 * 3. **Verify Data Integrity**
 *    - Check final state matches expected
 *    - Verify no data was lost
 *    - Ensure no overbooking occurred
 *
 * 4. **Test Edge Cases**
 *    - Last available slot
 *    - High concurrency (10+ simultaneous requests)
 *    - Zero available slots
 *
 * 5. **Implement Retry Logic**
 *    - Max 3 retries is usually sufficient
 *    - Use exponential backoff
 *    - Log retry attempts for debugging
 *
 * 6. **Monitor Version Field**
 *    - Verify version increments correctly
 *    - Check version in WHERE clause
 *    - Increment version in SET clause
 *
 * 7. **Handle Failures Gracefully**
 *    - Return meaningful error messages
 *    - Distinguish between concurrency and other errors
 *    - Provide user-friendly feedback
 *
 * 8. **Test Performance**
 *    - Measure time for concurrent operations
 *    - Verify acceptable response times
 *    - Check database load
 *
 * 9. **Use Transactions**
 *    - Wrap related operations in transactions
 *    - Ensure atomicity
 *    - Handle rollbacks properly
 *
 * 10. **Document Concurrency Strategy**
 *     - Explain optimistic locking approach
 *     - Document retry logic
 *     - Provide examples of handling conflicts
 */
