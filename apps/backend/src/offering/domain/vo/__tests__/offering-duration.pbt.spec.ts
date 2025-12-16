import * as fc from 'fast-check';
import { OfferingDuration } from '../offering-duration';

describe('OfferingDuration - Property-Based Tests', () => {
  /**
   * Property 2: Duration validation
   * For any duration value, creating an offering with duration not multiple of 15
   * or outside range [15, 480] should fail with error
   * Validates: Requirements 1.2
   */
  describe('Property 2: Duration validation', () => {
    it('should reject durations not multiple of 15', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (minutes: number) => {
          // Pre-condition: duration is not a multiple of 15
          fc.pre(minutes % 15 !== 0);

          // Should throw error
          expect(() => OfferingDuration.fromMinutes(minutes)).toThrow();
        }),
      );
    });

    it('should reject durations less than 15 minutes', () => {
      fc.assert(
        fc.property(fc.integer({ min: -1000, max: 14 }), (minutes: number) => {
          // Should throw error
          expect(() => OfferingDuration.fromMinutes(minutes)).toThrow(
            'Duration must be at least 15 minutes',
          );
        }),
      );
    });

    it('should reject durations greater than 480 minutes', () => {
      fc.assert(
        fc.property(fc.integer({ min: 481, max: 10000 }), (minutes: number) => {
          // Should throw error
          expect(() => OfferingDuration.fromMinutes(minutes)).toThrow(
            'Duration cannot exceed 480 minutes',
          );
        }),
      );
    });

    it('should accept all valid durations (multiples of 15 in range [15, 480])', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          (minutes: number) => {
            // Pre-condition: ensure we're in valid range
            fc.pre(minutes >= 15 && minutes <= 480);

            // Should not throw
            const duration = OfferingDuration.fromMinutes(minutes);
            expect(duration.getMinutes()).toBe(minutes);
          },
        ),
      );
    });

    it('should reject non-integer durations', () => {
      fc.assert(
        fc.property(fc.double({ min: 0.1, max: 1000, noNaN: true }), (minutes: number) => {
          // Pre-condition: ensure it's not an integer
          fc.pre(!Number.isInteger(minutes));

          // Should throw error
          expect(() => OfferingDuration.fromMinutes(minutes)).toThrow(
            'Duration must be an integer',
          );
        }),
      );
    });
  });

  describe('Idempotency and immutability', () => {
    it('creating duration twice with same value should be equal', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          (minutes: number) => {
            fc.pre(minutes >= 15 && minutes <= 480);

            const duration1 = OfferingDuration.fromMinutes(minutes);
            const duration2 = OfferingDuration.fromMinutes(minutes);

            expect(duration1.equals(duration2)).toBe(true);
            expect(duration1.getMinutes()).toBe(duration2.getMinutes());
          },
        ),
      );
    });

    it('duration value should not change after creation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          (minutes: number) => {
            fc.pre(minutes >= 15 && minutes <= 480);

            const duration = OfferingDuration.fromMinutes(minutes);
            const originalMinutes = duration.getMinutes();

            // Call getMinutes multiple times
            duration.getMinutes();
            duration.getMinutes();
            duration.toString();

            // Value should remain the same
            expect(duration.getMinutes()).toBe(originalMinutes);
          },
        ),
      );
    });
  });

  describe('Equality properties', () => {
    it('equals should be reflexive (a.equals(a) = true)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          (minutes: number) => {
            fc.pre(minutes >= 15 && minutes <= 480);

            const duration = OfferingDuration.fromMinutes(minutes);
            expect(duration.equals(duration)).toBe(true);
          },
        ),
      );
    });

    it('equals should be symmetric (a.equals(b) = b.equals(a))', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          (minutes1: number, minutes2: number) => {
            fc.pre(minutes1 >= 15 && minutes1 <= 480);
            fc.pre(minutes2 >= 15 && minutes2 <= 480);

            const duration1 = OfferingDuration.fromMinutes(minutes1);
            const duration2 = OfferingDuration.fromMinutes(minutes2);

            expect(duration1.equals(duration2)).toBe(duration2.equals(duration1));
          },
        ),
      );
    });

    it('equals should be transitive (a.equals(b) && b.equals(c) => a.equals(c))', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          (minutes1: number, minutes2: number, minutes3: number) => {
            fc.pre(minutes1 >= 15 && minutes1 <= 480);
            fc.pre(minutes2 >= 15 && minutes2 <= 480);
            fc.pre(minutes3 >= 15 && minutes3 <= 480);

            const duration1 = OfferingDuration.fromMinutes(minutes1);
            const duration2 = OfferingDuration.fromMinutes(minutes2);
            const duration3 = OfferingDuration.fromMinutes(minutes3);

            if (duration1.equals(duration2) && duration2.equals(duration3)) {
              expect(duration1.equals(duration3)).toBe(true);
            }
          },
        ),
      );
    });
  });

  describe('toString consistency', () => {
    it('toString should always return a non-empty string', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          (minutes: number) => {
            fc.pre(minutes >= 15 && minutes <= 480);

            const duration = OfferingDuration.fromMinutes(minutes);
            const str = duration.toString();

            expect(typeof str).toBe('string');
            expect(str.length).toBeGreaterThan(0);
          },
        ),
      );
    });

    it('toString should be deterministic (same input = same output)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          (minutes: number) => {
            fc.pre(minutes >= 15 && minutes <= 480);

            const duration = OfferingDuration.fromMinutes(minutes);
            const str1 = duration.toString();
            const str2 = duration.toString();

            expect(str1).toBe(str2);
          },
        ),
      );
    });
  });
});
