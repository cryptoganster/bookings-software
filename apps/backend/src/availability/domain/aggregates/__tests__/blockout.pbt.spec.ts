import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { Blockout } from '../blockout';
import { UUID } from '@shared/vo/uuid';
import { DateRange } from '../../vo/date-range.vo';

/**
 * Custom UUID v4 generator for fast-check
 * Generates valid UUIDs that pass uuid-validate
 */
const uuidV4 = (): fc.Arbitrary<string> => {
  return fc
    .tuple(
      fc.integer({ min: 0, max: 0xffffffff }),
      fc.integer({ min: 0, max: 0xffff }),
      fc.integer({ min: 0, max: 0x0fff }),
      fc.integer({ min: 0, max: 0x3fff }),
      fc.integer({ min: 0, max: 0xffffffffffff }),
    )
    .map(([a, b, c, d, e]) => {
      // Format as UUID v4
      const hex = (n: number, len: number) => n.toString(16).padStart(len, '0');
      return `${hex(a, 8)}-${hex(b, 4)}-4${hex(c, 3)}-${hex(0x8000 | d, 4)}-${hex(e, 12)}`;
    });
};

/**
 * Property-Based Tests for Blockout Aggregate
 *
 * These tests verify universal properties that should hold across all inputs.
 */
describe('Blockout Aggregate - Property-Based Tests', () => {
  /**
   * Property 3: Blockout date range validity
   * Validates: Requirements 2.2
   *
   * For any Blockout, the start date must be before or equal to the end date.
   */
  describe('Property 3: Blockout date range validity', () => {
    it('should accept date ranges where start <= end (both in future)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }), // Cambio: min=1 para evitar "hoy"
          fc.integer({ min: 1, max: 365 }), // Cambio: min=1 para evitar "hoy"
          (daysFromNow1: number, daysFromNow2: number) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const date1 = new Date(today);
            date1.setDate(date1.getDate() + daysFromNow1);

            const date2 = new Date(today);
            date2.setDate(date2.getDate() + daysFromNow2);

            const startDate = date1 < date2 ? date1 : date2;
            const endDate = date1 < date2 ? date2 : date1;

            // Should always succeed when start <= end and both in future
            const dateRange = DateRange.create(startDate, endDate);
            expect(dateRange.getStartDate()).toEqual(startDate);
            expect(dateRange.getEndDate()).toEqual(endDate);
            expect(dateRange.getStartDate() <= dateRange.getEndDate()).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 4: Blockout no past dates
   * Validates: Requirements 2.1
   *
   * For any Blockout, the start date cannot be in the past.
   */
  describe('Property 4: Blockout no past dates', () => {
    it('should reject date ranges starting in the past', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 365 }), (daysAgo: number) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const pastDate = new Date(today);
          pastDate.setDate(pastDate.getDate() - daysAgo);

          const futureDate = new Date(today);
          futureDate.setDate(futureDate.getDate() + 1);

          // Should throw error when start date is in the past
          expect(() => {
            DateRange.create(pastDate, futureDate);
          }).toThrow();
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 5: Blockout creation always produces valid aggregate
   * Validates: Requirements 2.1, 2.2, 2.3
   *
   * For any valid inputs, Blockout.create() should produce a valid aggregate.
   */
  describe('Property 5: Blockout creation produces valid aggregate', () => {
    it('should create valid blockout with correct properties', () => {
      fc.assert(
        fc.property(
          uuidV4(),
          uuidV4(),
          fc.integer({ min: 1, max: 365 }),
          fc.integer({ min: 0, max: 30 }),
          fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          (
            id: string,
            businessId: string,
            daysFromNow: number,
            duration: number,
            reason: string | null,
          ) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() + daysFromNow);

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + duration);

            const blockout = Blockout.create(
              UUID.fromString(id),
              UUID.fromString(businessId),
              DateRange.create(startDate, endDate),
              reason ?? null,
            );

            expect(blockout.getId().getValue()).toBe(id);
            expect(blockout.getBusinessId().getValue()).toBe(businessId);
            expect(blockout.getReason()).toBe(reason ?? null);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 6: isDateBlocked correctly identifies dates within range
   * Validates: Requirements 2.3
   *
   * For any Blockout, isDateBlocked() should return true for dates within the range.
   */
  describe('Property 6: isDateBlocked correctly identifies dates', () => {
    it('should correctly identify if a date is within the blocked range', () => {
      fc.assert(
        fc.property(
          uuidV4(),
          uuidV4(),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 30 }),
          fc.integer({ min: -5, max: 35 }),
          (
            id: string,
            businessId: string,
            daysFromNow: number,
            duration: number,
            testOffset: number,
          ) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() + daysFromNow);

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + duration);

            const blockout = Blockout.create(
              UUID.fromString(id),
              UUID.fromString(businessId),
              DateRange.create(startDate, endDate),
              null,
            );

            const testDate = new Date(startDate);
            testDate.setDate(testDate.getDate() + testOffset);

            const isBlocked = blockout.isDateBlocked(testDate);

            // Normalize dates for comparison
            const normalizedTest = new Date(testDate);
            normalizedTest.setHours(0, 0, 0, 0);
            const normalizedStart = new Date(startDate);
            normalizedStart.setHours(0, 0, 0, 0);
            const normalizedEnd = new Date(endDate);
            normalizedEnd.setHours(0, 0, 0, 0);

            const shouldBeBlocked =
              normalizedTest >= normalizedStart && normalizedTest <= normalizedEnd;

            expect(isBlocked).toBe(shouldBeBlocked);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7: DateRange duration calculation is correct
   * Validates: Requirements 2.2
   *
   * For any DateRange, getDurationInDays() should return the correct number of days.
   */
  describe('Property 7: DateRange duration calculation', () => {
    it('should calculate duration correctly (inclusive of both days)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 30 }),
          (daysFromNow: number, duration: number) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() + daysFromNow);

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + duration);

            const dateRange = DateRange.create(startDate, endDate);

            // Duration should be duration + 1 (inclusive of both days)
            expect(dateRange.getDurationInDays()).toBe(duration + 1);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
