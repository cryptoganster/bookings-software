import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { Schedule } from '../schedule';
import { UUID } from '@shared/vo/uuid';
import { TimeSlot } from '../../vo/time-slot.vo';
import { DayOfWeek } from '../../vo/day-of-week.vo';

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
 * Property-Based Tests for Schedule Aggregate
 *
 * These tests verify universal properties that should hold across all inputs.
 */
describe('Schedule Aggregate - Property-Based Tests', () => {
  /**
   * Property 1: Schedule time range validity
   * Validates: Requirements 1.1
   *
   * For any Schedule, the start time must always be before the end time.
   */
  describe('Property 1: Schedule time range validity', () => {
    it('should reject time slots where start >= end', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 23 }),
          fc.integer({ min: 0, max: 59 }),
          fc.integer({ min: 0, max: 23 }),
          fc.integer({ min: 0, max: 59 }),
          (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
            const startTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
            const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

            if (startTime >= endTime) {
              // Should throw error
              expect(() => {
                TimeSlot.create(startTime, endTime);
              }).toThrow();
            } else {
              // Should succeed
              const timeSlot = TimeSlot.create(startTime, endTime);
              expect(timeSlot.getStartTime()).toBe(startTime);
              expect(timeSlot.getEndTime()).toBe(endTime);
              expect(timeSlot.getStartTime() < timeSlot.getEndTime()).toBe(true);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 2: Schedule day of week validity
   * Validates: Requirements 1.2
   *
   * For any Schedule, the day of week must be between 0 and 6 inclusive.
   */
  describe('Property 2: Schedule day of week validity', () => {
    it('should only accept day values between 0 and 6', () => {
      fc.assert(
        fc.property(fc.integer({ min: -10, max: 20 }), (dayValue: number) => {
          if (dayValue < 0 || dayValue > 6) {
            // Should throw error
            expect(() => {
              DayOfWeek.create(dayValue);
            }).toThrow();
          } else {
            // Should succeed
            const dayOfWeek = DayOfWeek.create(dayValue);
            expect(dayOfWeek.getValue()).toBe(dayValue);
            expect(dayOfWeek.getValue()).toBeGreaterThanOrEqual(0);
            expect(dayOfWeek.getValue()).toBeLessThanOrEqual(6);
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 3: Schedule creation always produces valid aggregate
   * Validates: Requirements 1.1, 1.2, 1.3
   *
   * For any valid inputs, Schedule.create() should produce a valid aggregate.
   */
  describe('Property 3: Schedule creation produces valid aggregate', () => {
    it('should create valid schedule with correct properties', () => {
      fc.assert(
        fc.property(
          uuidV4(),
          uuidV4(),
          fc.integer({ min: 0, max: 6 }),
          fc.integer({ min: 0, max: 22 }),
          fc.integer({ min: 0, max: 59 }),
          (id: string, businessId: string, day: number, startHour: number, startMinute: number) => {
            const endHour = startHour + 1;
            const startTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
            const endTime = `${String(endHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;

            const schedule = Schedule.create(
              UUID.fromString(id),
              UUID.fromString(businessId),
              DayOfWeek.create(day),
              TimeSlot.create(startTime, endTime),
            );

            expect(schedule.getId().getValue()).toBe(id);
            expect(schedule.getBusinessId().getValue()).toBe(businessId);
            expect(schedule.getDayOfWeek().getValue()).toBe(day);
            expect(schedule.getIsActive()).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 4: Schedule update preserves identity
   * Validates: Requirements 1.4
   *
   * For any Schedule, updating the time slot should preserve id, businessId, and dayOfWeek.
   */
  describe('Property 4: Schedule update preserves identity', () => {
    it('should preserve identity fields when updating time slot', () => {
      fc.assert(
        fc.property(
          uuidV4(),
          uuidV4(),
          fc.integer({ min: 0, max: 6 }),
          fc.integer({ min: 0, max: 22 }),
          fc.integer({ min: 0, max: 59 }),
          fc.integer({ min: 0, max: 22 }),
          fc.integer({ min: 0, max: 59 }),
          (
            id: string,
            businessId: string,
            day: number,
            startHour1: number,
            startMinute1: number,
            startHour2: number,
            startMinute2: number,
          ) => {
            const endHour1 = startHour1 + 1;
            const endHour2 = startHour2 + 1;
            const startTime1 = `${String(startHour1).padStart(2, '0')}:${String(startMinute1).padStart(2, '0')}`;
            const endTime1 = `${String(endHour1).padStart(2, '0')}:${String(startMinute1).padStart(2, '0')}`;
            const startTime2 = `${String(startHour2).padStart(2, '0')}:${String(startMinute2).padStart(2, '0')}`;
            const endTime2 = `${String(endHour2).padStart(2, '0')}:${String(startMinute2).padStart(2, '0')}`;

            const schedule = Schedule.create(
              UUID.fromString(id),
              UUID.fromString(businessId),
              DayOfWeek.create(day),
              TimeSlot.create(startTime1, endTime1),
            );

            const originalId = schedule.getId().getValue();
            const originalBusinessId = schedule.getBusinessId().getValue();
            const originalDay = schedule.getDayOfWeek().getValue();

            schedule.update(TimeSlot.create(startTime2, endTime2));

            // Identity should be preserved
            expect(schedule.getId().getValue()).toBe(originalId);
            expect(schedule.getBusinessId().getValue()).toBe(originalBusinessId);
            expect(schedule.getDayOfWeek().getValue()).toBe(originalDay);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 5: Deactivate makes schedule inactive
   * Validates: Requirements 1.5
   *
   * For any Schedule, calling deactivate() should set isActive to false.
   */
  describe('Property 5: Deactivate makes schedule inactive', () => {
    it('should set isActive to false when deactivated', () => {
      fc.assert(
        fc.property(
          uuidV4(),
          uuidV4(),
          fc.integer({ min: 0, max: 6 }),
          (id: string, businessId: string, day: number) => {
            const schedule = Schedule.create(
              UUID.fromString(id),
              UUID.fromString(businessId),
              DayOfWeek.create(day),
              TimeSlot.create('09:00', '17:00'),
            );

            expect(schedule.getIsActive()).toBe(true);

            schedule.deactivate();

            expect(schedule.getIsActive()).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
