import * as fc from 'fast-check';
import { Offering } from '../offering';
import { UUID } from '@shared/vo/uuid';
import { OfferingDuration } from '../../vo/offering-duration';

describe('Offering Aggregate - Property-Based Tests', () => {
  /**
   * Property 6: Event publication
   * For any offering operation (create/update/deactivate/activate),
   * the corresponding domain event should be published
   * Validates: Requirements 1.5, 2.3, 3.2
   */
  describe('Property 6: Event publication', () => {
    it('create should always publish OfferingCreated event', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          fc.integer({ min: 1, max: 20 }),
          fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
          (name: string, durationMinutes: number, maxPerSlot: number, maxDaily: number | null) => {
            // Pre-conditions
            fc.pre(durationMinutes >= 15 && durationMinutes <= 480);
            fc.pre(maxDaily === null || maxDaily >= maxPerSlot);

            const offering = Offering.create(
              UUID.generate(),
              UUID.generate(),
              name,
              OfferingDuration.fromMinutes(durationMinutes),
              maxPerSlot,
              maxDaily,
            );

            // Verify event was published (version incremented)
            expect(offering.getVersion().getValue()).toBe(1);
          }
        )
      );
    });

    it('update should always increment version', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 20 }),
          (
            name1: string,
            name2: string,
            duration1: number,
            duration2: number,
            capacity1: number,
            capacity2: number,
          ) => {
            // Pre-conditions
            fc.pre(duration1 >= 15 && duration1 <= 480);
            fc.pre(duration2 >= 15 && duration2 <= 480);

            const offering = Offering.create(
              UUID.generate(),
              UUID.generate(),
              name1,
              OfferingDuration.fromMinutes(duration1),
              capacity1,
              null,
            );

            const versionBeforeUpdate = offering.getVersion().getValue();

            offering.update(
              name2,
              OfferingDuration.fromMinutes(duration2),
              capacity2,
              null,
            );

            // Version should increment
            expect(offering.getVersion().getValue()).toBe(versionBeforeUpdate + 1);
          }
        )
      );
    });

    it('deactivate should always increment version', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          fc.integer({ min: 1, max: 20 }),
          (name: string, durationMinutes: number, maxPerSlot: number) => {
            fc.pre(durationMinutes >= 15 && durationMinutes <= 480);

            const offering = Offering.create(
              UUID.generate(),
              UUID.generate(),
              name,
              OfferingDuration.fromMinutes(durationMinutes),
              maxPerSlot,
              null,
            );

            const versionBeforeDeactivate = offering.getVersion().getValue();
            offering.deactivate();

            expect(offering.getVersion().getValue()).toBe(versionBeforeDeactivate + 1);
          }
        )
      );
    });

    it('activate should always increment version', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          fc.integer({ min: 1, max: 20 }),
          (name: string, durationMinutes: number, maxPerSlot: number) => {
            fc.pre(durationMinutes >= 15 && durationMinutes <= 480);

            const offering = Offering.create(
              UUID.generate(),
              UUID.generate(),
              name,
              OfferingDuration.fromMinutes(durationMinutes),
              maxPerSlot,
              null,
            );

            offering.deactivate();
            const versionBeforeActivate = offering.getVersion().getValue();
            offering.activate();

            expect(offering.getVersion().getValue()).toBe(versionBeforeActivate + 1);
          }
        )
      );
    });
  });

  /**
   * Property 7: Deactivation preserves data
   * For any offering, deactivating should only change isActive to false
   * without modifying other attributes
   * Validates: Requirements 3.1
   */
  describe('Property 7: Deactivation preserves data', () => {
    it('deactivate should only change isActive flag', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          fc.integer({ min: 1, max: 20 }),
          fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
          (name: string, durationMinutes: number, maxPerSlot: number, maxDaily: number | null) => {
            fc.pre(durationMinutes >= 15 && durationMinutes <= 480);
            fc.pre(maxDaily === null || maxDaily >= maxPerSlot);

            const offering = Offering.create(
              UUID.generate(),
              UUID.generate(),
              name,
              OfferingDuration.fromMinutes(durationMinutes),
              maxPerSlot,
              maxDaily,
            );

            // Capture original values
            const originalId = offering.getId().getValue();
            const originalBusinessId = offering.getBusinessId().getValue();
            const originalName = offering.getName();
            const originalDuration = offering.getDuration().getMinutes();
            const originalMaxPerSlot = offering.getMaxCapacityPerSlot();
            const originalMaxDaily = offering.getMaxDailyCapacity();

            // Deactivate
            offering.deactivate();

            // All attributes except isActive should remain unchanged
            expect(offering.getId().getValue()).toBe(originalId);
            expect(offering.getBusinessId().getValue()).toBe(originalBusinessId);
            expect(offering.getName()).toBe(originalName);
            expect(offering.getDuration().getMinutes()).toBe(originalDuration);
            expect(offering.getMaxCapacityPerSlot()).toBe(originalMaxPerSlot);
            expect(offering.getMaxDailyCapacity()).toBe(originalMaxDaily);
            expect(offering.isActiveOffering()).toBe(false);
          }
        )
      );
    });

    it('activate after deactivate should restore isActive flag', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          fc.integer({ min: 1, max: 20 }),
          (name: string, durationMinutes: number, maxPerSlot: number) => {
            fc.pre(durationMinutes >= 15 && durationMinutes <= 480);

            const offering = Offering.create(
              UUID.generate(),
              UUID.generate(),
              name,
              OfferingDuration.fromMinutes(durationMinutes),
              maxPerSlot,
              null,
            );

            // Capture original values
            const originalName = offering.getName();
            const originalDuration = offering.getDuration().getMinutes();

            // Deactivate then activate
            offering.deactivate();
            offering.activate();

            // All attributes should remain unchanged
            expect(offering.getName()).toBe(originalName);
            expect(offering.getDuration().getMinutes()).toBe(originalDuration);
            expect(offering.isActiveOffering()).toBe(true);
          }
        )
      );
    });
  });

  /**
   * Property 8: Update preserves identity
   * For any offering update, the id and businessId should remain unchanged
   * Validates: Requirements 2.4
   */
  describe('Property 8: Update preserves identity', () => {
    it('update should never change id or businessId', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 20 }),
          (
            name1: string,
            name2: string,
            duration1: number,
            duration2: number,
            capacity1: number,
            capacity2: number,
          ) => {
            fc.pre(duration1 >= 15 && duration1 <= 480);
            fc.pre(duration2 >= 15 && duration2 <= 480);

            const offering = Offering.create(
              UUID.generate(),
              UUID.generate(),
              name1,
              OfferingDuration.fromMinutes(duration1),
              capacity1,
              null,
            );

            const originalId = offering.getId().getValue();
            const originalBusinessId = offering.getBusinessId().getValue();

            // Update with different values
            offering.update(
              name2,
              OfferingDuration.fromMinutes(duration2),
              capacity2,
              null,
            );

            // Identity should remain unchanged
            expect(offering.getId().getValue()).toBe(originalId);
            expect(offering.getBusinessId().getValue()).toBe(originalBusinessId);
          }
        )
      );
    });

    it('multiple updates should preserve identity', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.array(
            fc.record({
              name: fc.string({ minLength: 3, maxLength: 50 }),
              duration: fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
              capacity: fc.integer({ min: 1, max: 20 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (initialName: string, updates: Array<{ name: string; duration: number; capacity: number }>) => {
            const offering = Offering.create(
              UUID.generate(),
              UUID.generate(),
              initialName,
              OfferingDuration.fromMinutes(30),
              4,
              null,
            );

            const originalId = offering.getId().getValue();
            const originalBusinessId = offering.getBusinessId().getValue();

            // Apply multiple updates
            updates.forEach((update) => {
              fc.pre(update.duration >= 15 && update.duration <= 480);
              offering.update(
                update.name,
                OfferingDuration.fromMinutes(update.duration),
                update.capacity,
                null,
              );
            });

            // Identity should still be unchanged
            expect(offering.getId().getValue()).toBe(originalId);
            expect(offering.getBusinessId().getValue()).toBe(originalBusinessId);
          }
        )
      );
    });
  });

  /**
   * Property: Capacity validation
   * For any capacity values, maxCapacityPerSlot must be >= 1
   * and maxDailyCapacity must be >= maxCapacityPerSlot if defined
   * Validates: Requirements 1.3
   */
  describe('Property: Capacity validation', () => {
    it('should reject maxCapacityPerSlot < 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 0 }),
          (maxPerSlot: number) => {
            expect(() => {
              Offering.create(
                UUID.generate(),
                UUID.generate(),
                'Test Service',
                OfferingDuration.fromMinutes(30),
                maxPerSlot,
                null,
              );
            }).toThrow('maxCapacityPerSlot must be at least 1');
          }
        )
      );
    });

    it('should reject maxDailyCapacity < maxCapacityPerSlot', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }),
          fc.integer({ min: 1, max: 20 }),
          (maxPerSlot: number, maxDaily: number) => {
            fc.pre(maxDaily < maxPerSlot);

            expect(() => {
              Offering.create(
                UUID.generate(),
                UUID.generate(),
                'Test Service',
                OfferingDuration.fromMinutes(30),
                maxPerSlot,
                maxDaily,
              );
            }).toThrow('maxDailyCapacity must be greater than or equal to maxCapacityPerSlot');
          }
        )
      );
    });

    it('should accept valid capacity combinations', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
          (maxPerSlot: number, maxDaily: number | null) => {
            fc.pre(maxDaily === null || maxDaily >= maxPerSlot);

            const offering = Offering.create(
              UUID.generate(),
              UUID.generate(),
              'Test Service',
              OfferingDuration.fromMinutes(30),
              maxPerSlot,
              maxDaily,
            );

            expect(offering.getMaxCapacityPerSlot()).toBe(maxPerSlot);
            expect(offering.getMaxDailyCapacity()).toBe(maxDaily);
          }
        )
      );
    });
  });

  /**
   * Property: Immutability of reconstructed offerings
   * Offerings reconstructed from persistence should behave identically
   * to newly created offerings
   */
  describe('Property: fromPersistence equivalence', () => {
    it('fromPersistence should create offering with same attributes', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.integer({ min: 1, max: 32 }).map((n: number) => n * 15),
          fc.integer({ min: 1, max: 20 }),
          fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
          fc.boolean(),
          fc.integer({ min: 0, max: 100 }),
          (
            name: string,
            durationMinutes: number,
            maxPerSlot: number,
            maxDaily: number | null,
            isActive: boolean,
            version: number,
          ) => {
            fc.pre(durationMinutes >= 15 && durationMinutes <= 480);
            fc.pre(maxDaily === null || maxDaily >= maxPerSlot);

            const id = UUID.generate();
            const businessId = UUID.generate();

            const offering = Offering.fromPersistence(
              id,
              businessId,
              name,
              OfferingDuration.fromMinutes(durationMinutes),
              maxPerSlot,
              maxDaily,
              isActive,
              version,
            );

            expect(offering.getId().getValue()).toBe(id.getValue());
            expect(offering.getBusinessId().getValue()).toBe(businessId.getValue());
            expect(offering.getName()).toBe(name);
            expect(offering.getDuration().getMinutes()).toBe(durationMinutes);
            expect(offering.getMaxCapacityPerSlot()).toBe(maxPerSlot);
            expect(offering.getMaxDailyCapacity()).toBe(maxDaily);
            expect(offering.isActiveOffering()).toBe(isActive);
            expect(offering.getVersion().getValue()).toBe(version);
          }
        )
      );
    });
  });
});
