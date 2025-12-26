import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { Capacity } from '../capacity';
import { UUID } from '@shared/vo/uuid';

/**
 * Property-Based Tests for Capacity Aggregate
 *
 * These tests verify universal properties that should hold across all inputs.
 */
describe('Capacity Aggregate - Property-Based Tests', () => {
  /**
   * Property 1: Total slots must always be non-negative
   * Validates: Requirements 3.1
   *
   * For any Capacity, totalSlots should never be negative.
   */
  describe('Property 1: Total slots must always be non-negative', () => {
    it('should reject negative total slots on create', () => {
      fc.assert(
        fc.property(fc.integer({ min: -1000, max: -1 }), (negativeTotalSlots) => {
          const id = UUID.generate();
          const offeringId = UUID.generate();
          const date = new Date(Date.now() + 86400000); // Tomorrow

          expect(() => {
            Capacity.create(id, offeringId, date, negativeTotalSlots);
          }).toThrow('Total slots cannot be negative');
        }),
        { numRuns: 100 },
      );
    });

    it('should accept non-negative total slots on create', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1000 }), (totalSlots) => {
          const id = UUID.generate();
          const offeringId = UUID.generate();
          const date = new Date(Date.now() + 86400000); // Tomorrow

          const capacity = Capacity.create(id, offeringId, date, totalSlots);

          expect(capacity.getTotalSlots()).toBe(totalSlots);
          expect(capacity.getTotalSlots()).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 },
      );
    });

    it('should reject negative total slots on updateCapacity', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: -1000, max: -1 }),
          (initialSlots, negativeTotalSlots) => {
            const id = UUID.generate();
            const offeringId = UUID.generate();
            const date = new Date(Date.now() + 86400000);

            const capacity = Capacity.create(id, offeringId, date, initialSlots);

            expect(() => {
              capacity.updateCapacity(negativeTotalSlots);
            }).toThrow('Total slots cannot be negative');
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 2: Cannot create capacity for past dates
   * Validates: Requirements 3.2
   *
   * For any Capacity, the date must be today or in the future.
   */
  describe('Property 2: Cannot create capacity for past dates', () => {
    it('should reject past dates', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 365 }), (daysAgo) => {
          const id = UUID.generate();
          const offeringId = UUID.generate();
          const pastDate = new Date(Date.now() - daysAgo * 86400000);
          const totalSlots = 10;

          expect(() => {
            Capacity.create(id, offeringId, pastDate, totalSlots);
          }).toThrow('Cannot create capacity for past dates');
        }),
        { numRuns: 100 },
      );
    });

    it('should accept today and future dates', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 365 }), (daysAhead) => {
          const id = UUID.generate();
          const offeringId = UUID.generate();
          const futureDate = new Date(Date.now() + daysAhead * 86400000);
          const totalSlots = 10;

          const capacity = Capacity.create(id, offeringId, futureDate, totalSlots);

          expect(capacity.getDate()).toEqual(futureDate);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 3: Available slots + booked slots = total slots (invariant)
   * Validates: Requirements 3.3
   *
   * For any Capacity, the sum of available and booked slots should always equal total slots.
   */
  describe('Property 3: Available slots + booked slots = total slots', () => {
    it('should maintain invariant after create', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (totalSlots) => {
          const id = UUID.generate();
          const offeringId = UUID.generate();
          const date = new Date(Date.now() + 86400000);

          const capacity = Capacity.create(id, offeringId, date, totalSlots);

          expect(capacity.getAvailableSlots() + capacity.getBookedSlots()).toBe(
            capacity.getTotalSlots(),
          );
        }),
        { numRuns: 100 },
      );
    });

    it('should maintain invariant after bookSlot', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (totalSlots, bookings) => {
            const id = UUID.generate();
            const offeringId = UUID.generate();
            const date = new Date(Date.now() + 86400000);

            const capacity = Capacity.create(id, offeringId, date, totalSlots);

            // Book slots (up to available)
            const actualBookings = Math.min(bookings, capacity.getAvailableSlots());
            for (let i = 0; i < actualBookings; i++) {
              capacity.bookSlot();
            }

            expect(capacity.getAvailableSlots() + capacity.getBookedSlots()).toBe(
              capacity.getTotalSlots(),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should maintain invariant after releaseSlot', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 5 }),
          (totalSlots, bookings, releases) => {
            const id = UUID.generate();
            const offeringId = UUID.generate();
            const date = new Date(Date.now() + 86400000);

            const capacity = Capacity.create(id, offeringId, date, totalSlots);

            // Book slots
            const actualBookings = Math.min(bookings, capacity.getAvailableSlots());
            for (let i = 0; i < actualBookings; i++) {
              capacity.bookSlot();
            }

            // Release slots
            const actualReleases = Math.min(releases, capacity.getBookedSlots());
            for (let i = 0; i < actualReleases; i++) {
              capacity.releaseSlot();
            }

            expect(capacity.getAvailableSlots() + capacity.getBookedSlots()).toBe(
              capacity.getTotalSlots(),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should maintain invariant after updateCapacity', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 5, max: 150 }),
          (initialSlots, bookings, newTotalSlots) => {
            const id = UUID.generate();
            const offeringId = UUID.generate();
            const date = new Date(Date.now() + 86400000);

            const capacity = Capacity.create(id, offeringId, date, initialSlots);

            // Book some slots
            const actualBookings = Math.min(bookings, capacity.getAvailableSlots());
            for (let i = 0; i < actualBookings; i++) {
              capacity.bookSlot();
            }

            // Update capacity (only if new total >= booked)
            if (newTotalSlots >= capacity.getBookedSlots()) {
              capacity.updateCapacity(newTotalSlots);

              expect(capacity.getAvailableSlots() + capacity.getBookedSlots()).toBe(
                capacity.getTotalSlots(),
              );
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 4: Cannot reduce capacity below booked slots
   * Validates: Requirements 3.4
   *
   * For any Capacity, updateCapacity should reject new total < booked slots.
   */
  describe('Property 4: Cannot reduce capacity below booked slots', () => {
    it('should reject capacity reduction below booked slots', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }),
          fc.integer({ min: 5, max: 10 }),
          (initialSlots, bookings) => {
            const id = UUID.generate();
            const offeringId = UUID.generate();
            const date = new Date(Date.now() + 86400000);

            const capacity = Capacity.create(id, offeringId, date, initialSlots);

            // Book slots
            const actualBookings = Math.min(bookings, capacity.getAvailableSlots());
            for (let i = 0; i < actualBookings; i++) {
              capacity.bookSlot();
            }

            // Try to reduce capacity below booked slots
            const newTotalSlots = capacity.getBookedSlots() - 1;

            expect(() => {
              capacity.updateCapacity(newTotalSlots);
            }).toThrow(/Cannot reduce capacity below booked slots/);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should allow capacity reduction to exactly booked slots', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }),
          fc.integer({ min: 5, max: 10 }),
          (initialSlots, bookings) => {
            const id = UUID.generate();
            const offeringId = UUID.generate();
            const date = new Date(Date.now() + 86400000);

            const capacity = Capacity.create(id, offeringId, date, initialSlots);

            // Book slots
            const actualBookings = Math.min(bookings, capacity.getAvailableSlots());
            for (let i = 0; i < actualBookings; i++) {
              capacity.bookSlot();
            }

            // Reduce capacity to exactly booked slots
            const newTotalSlots = capacity.getBookedSlots();

            capacity.updateCapacity(newTotalSlots);

            expect(capacity.getTotalSlots()).toBe(newTotalSlots);
            expect(capacity.getAvailableSlots()).toBe(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 5: Version increments on state changes
   * Validates: Requirements 3.5, 5.1
   *
   * For any Capacity, any state-changing operation should increment version by exactly 1.
   */
  describe('Property 5: Version increments on state changes', () => {
    it('should have version = 1 after create', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (totalSlots) => {
          const id = UUID.generate();
          const offeringId = UUID.generate();
          const date = new Date(Date.now() + 86400000);

          const capacity = Capacity.create(id, offeringId, date, totalSlots);

          expect(capacity.getVersion().getValue()).toBe(1);
        }),
        { numRuns: 100 },
      );
    });

    it('should increment version by 1 on bookSlot', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (totalSlots) => {
          const id = UUID.generate();
          const offeringId = UUID.generate();
          const date = new Date(Date.now() + 86400000);

          const capacity = Capacity.create(id, offeringId, date, totalSlots);

          const versionBefore = capacity.getVersion().getValue();
          capacity.bookSlot();
          const versionAfter = capacity.getVersion().getValue();

          expect(versionAfter).toBe(versionBefore + 1);
        }),
        { numRuns: 100 },
      );
    });

    it('should increment version by 1 on releaseSlot', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (totalSlots) => {
          const id = UUID.generate();
          const offeringId = UUID.generate();
          const date = new Date(Date.now() + 86400000);

          const capacity = Capacity.create(id, offeringId, date, totalSlots);
          capacity.bookSlot(); // Book first

          const versionBefore = capacity.getVersion().getValue();
          capacity.releaseSlot();
          const versionAfter = capacity.getVersion().getValue();

          expect(versionAfter).toBe(versionBefore + 1);
        }),
        { numRuns: 100 },
      );
    });

    it('should increment version by 1 on updateCapacity', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }),
          fc.integer({ min: 10, max: 150 }),
          (initialSlots, newSlots) => {
            const id = UUID.generate();
            const offeringId = UUID.generate();
            const date = new Date(Date.now() + 86400000);

            const capacity = Capacity.create(id, offeringId, date, initialSlots);

            const versionBefore = capacity.getVersion().getValue();
            capacity.updateCapacity(newSlots);
            const versionAfter = capacity.getVersion().getValue();

            expect(versionAfter).toBe(versionBefore + 1);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 6: Booking decrements available slots
   * Validates: Requirements 3.3
   *
   * For any Capacity with available slots, bookSlot() should decrement availableSlots by 1.
   */
  describe('Property 6: Booking decrements available slots', () => {
    it('should decrement available slots by 1 on bookSlot', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (totalSlots) => {
          const id = UUID.generate();
          const offeringId = UUID.generate();
          const date = new Date(Date.now() + 86400000);

          const capacity = Capacity.create(id, offeringId, date, totalSlots);

          const availableBefore = capacity.getAvailableSlots();
          capacity.bookSlot();
          const availableAfter = capacity.getAvailableSlots();

          expect(availableAfter).toBe(availableBefore - 1);
        }),
        { numRuns: 100 },
      );
    });

    it('should increment booked slots by 1 on bookSlot', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (totalSlots) => {
          const id = UUID.generate();
          const offeringId = UUID.generate();
          const date = new Date(Date.now() + 86400000);

          const capacity = Capacity.create(id, offeringId, date, totalSlots);

          const bookedBefore = capacity.getBookedSlots();
          capacity.bookSlot();
          const bookedAfter = capacity.getBookedSlots();

          expect(bookedAfter).toBe(bookedBefore + 1);
        }),
        { numRuns: 100 },
      );
    });

    it('should reject bookSlot when no available slots', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), (totalSlots) => {
          const id = UUID.generate();
          const offeringId = UUID.generate();
          const date = new Date(Date.now() + 86400000);

          const capacity = Capacity.create(id, offeringId, date, totalSlots);

          // Book all slots
          for (let i = 0; i < totalSlots; i++) {
            capacity.bookSlot();
          }

          // Try to book one more
          expect(() => {
            capacity.bookSlot();
          }).toThrow('No available slots to book');
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7: Releasing increments available slots
   * Validates: Requirements 3.3
   *
   * For any Capacity with booked slots, releaseSlot() should increment availableSlots by 1.
   */
  describe('Property 7: Releasing increments available slots', () => {
    it('should increment available slots by 1 on releaseSlot', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (totalSlots) => {
          const id = UUID.generate();
          const offeringId = UUID.generate();
          const date = new Date(Date.now() + 86400000);

          const capacity = Capacity.create(id, offeringId, date, totalSlots);
          capacity.bookSlot(); // Book first

          const availableBefore = capacity.getAvailableSlots();
          capacity.releaseSlot();
          const availableAfter = capacity.getAvailableSlots();

          expect(availableAfter).toBe(availableBefore + 1);
        }),
        { numRuns: 100 },
      );
    });

    it('should decrement booked slots by 1 on releaseSlot', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (totalSlots) => {
          const id = UUID.generate();
          const offeringId = UUID.generate();
          const date = new Date(Date.now() + 86400000);

          const capacity = Capacity.create(id, offeringId, date, totalSlots);
          capacity.bookSlot(); // Book first

          const bookedBefore = capacity.getBookedSlots();
          capacity.releaseSlot();
          const bookedAfter = capacity.getBookedSlots();

          expect(bookedAfter).toBe(bookedBefore - 1);
        }),
        { numRuns: 100 },
      );
    });

    it('should reject releaseSlot when no booked slots', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (totalSlots) => {
          const id = UUID.generate();
          const offeringId = UUID.generate();
          const date = new Date(Date.now() + 86400000);

          const capacity = Capacity.create(id, offeringId, date, totalSlots);

          // Try to release without booking
          expect(() => {
            capacity.releaseSlot();
          }).toThrow('No booked slots to release');
        }),
        { numRuns: 100 },
      );
    });
  });
});
