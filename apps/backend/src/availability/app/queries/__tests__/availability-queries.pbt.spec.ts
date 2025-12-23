import * as fc from 'fast-check';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { GetAvailableDatesHandler } from '../get-available-dates/handler';
import { GetAvailableSlotsHandler } from '../get-available-slots/handler';
import { GetAvailableDatesQuery } from '../get-available-dates/query';
import { GetAvailableSlotsQuery } from '../get-available-slots/query';
import { IAvailabilityChecker } from '@availability/domain/interfaces/services/availability-checker.service';
import { ICapacityReadRepository } from '@availability/domain/interfaces/repositories/capacity-read';
import { CapacityReadModel } from '@availability/domain/read-models/capacity';

describe('Availability Queries - Property-Based Tests', () => {
  let availabilityChecker: IAvailabilityChecker;
  let capacityReadRepo: ICapacityReadRepository;
  let getAvailableDatesHandler: GetAvailableDatesHandler;
  let getAvailableSlotsHandler: GetAvailableSlotsHandler;

  beforeEach(() => {
    availabilityChecker = {
      isDateAvailable: async () => true,
      getAvailableTimeSlots: async () => [],
    } as IAvailabilityChecker;

    capacityReadRepo = {
      findByOfferingAndDate: async () => null,
      findByOfferingAndDateRange: async () => [],
    } as ICapacityReadRepository;

    getAvailableDatesHandler = new GetAvailableDatesHandler(availabilityChecker);
    getAvailableSlotsHandler = new GetAvailableSlotsHandler(availabilityChecker, capacityReadRepo);
  });

  describe('Property 10: Available dates exclude blockouts', () => {
    it('should exclude dates that are blocked', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
          fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
          fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
          async (offeringId, businessId, startDate, endDate, blockedDate) => {
            // Pre-condition: all dates must be valid
            fc.pre(
              !isNaN(startDate.getTime()) &&
                !isNaN(endDate.getTime()) &&
                !isNaN(blockedDate.getTime()),
            );

            // Ensure endDate is after startDate
            if (endDate < startDate) {
              [startDate, endDate] = [endDate, startDate];
            }

            // Mock availability checker to return false for blocked date
            availabilityChecker.isDateAvailable = async (bId, oId, date) => {
              const dateStr = date.toISOString().split('T')[0];
              const blockedStr = blockedDate.toISOString().split('T')[0];
              return dateStr !== blockedStr;
            };

            const query = new GetAvailableDatesQuery(offeringId, businessId, startDate, endDate);

            const result = await getAvailableDatesHandler.execute(query);

            // Property: Blocked date should not be in result
            const blockedDateStr = blockedDate.toISOString().split('T')[0];
            const hasBlockedDate = result.some(
              (date) => date.toISOString().split('T')[0] === blockedDateStr,
            );

            expect(hasBlockedDate).toBe(false);
          },
        ),
      );
    });

    it('should return empty array when all dates in range are blocked', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.date({ min: new Date(), max: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }),
          async (offeringId, businessId, startDate) => {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 3);

            // Mock availability checker to return false for all dates
            availabilityChecker.isDateAvailable = async () => false;

            const query = new GetAvailableDatesQuery(offeringId, businessId, startDate, endDate);

            const result = await getAvailableDatesHandler.execute(query);

            // Property: No dates should be available when all are blocked
            expect(result).toHaveLength(0);
          },
        ),
      );
    });

    it('should return all dates when none are blocked', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.date({ min: new Date(), max: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }),
          async (offeringId, businessId, startDate) => {
            // Pre-condition: date must be valid
            fc.pre(!isNaN(startDate.getTime()));

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 3);

            // Mock availability checker to return true for all dates
            availabilityChecker.isDateAvailable = async () => true;

            const query = new GetAvailableDatesQuery(offeringId, businessId, startDate, endDate);

            const result = await getAvailableDatesHandler.execute(query);

            // Property: Should have at least 1 date (startDate) when none are blocked
            expect(result.length).toBeGreaterThanOrEqual(1);

            // Property: All returned dates should be within range
            result.forEach((date) => {
              // Normalize to midnight for comparison
              const normalizedDate = new Date(date);
              normalizedDate.setUTCHours(0, 0, 0, 0);

              const normalizedStart = new Date(startDate);
              normalizedStart.setUTCHours(0, 0, 0, 0);

              const normalizedEnd = new Date(endDate);
              normalizedEnd.setUTCHours(0, 0, 0, 0);

              expect(normalizedDate.getTime()).toBeGreaterThanOrEqual(normalizedStart.getTime());
              expect(normalizedDate.getTime()).toBeLessThanOrEqual(normalizedEnd.getTime());
            });
          },
        ),
      );
    });
  });

  describe('Property 11: Available dates exclude zero capacity', () => {
    it('should exclude dates with zero available slots', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.date({ min: new Date(), max: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }),
          fc.integer({ min: 0, max: 10 }),
          async (offeringId, businessId, startDate, availableSlots) => {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 3);

            // Mock capacity repository to return capacity with specific available slots
            capacityReadRepo.findByOfferingAndDate = async (offId, date) => {
              return {
                id: 'capacity-id',
                offeringId: offId,
                date,
                totalSlots: 10,
                availableSlots,
                bookedSlots: 10 - availableSlots,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as CapacityReadModel;
            };

            // Mock availability checker to check capacity
            availabilityChecker.isDateAvailable = async (bId, oId, date) => {
              const capacity = await capacityReadRepo.findByOfferingAndDate(oId, date);
              return capacity !== null && capacity.availableSlots > 0;
            };

            const query = new GetAvailableDatesQuery(offeringId, businessId, startDate, endDate);

            const result = await getAvailableDatesHandler.execute(query);

            // Property: If availableSlots is 0, result should be empty
            // If availableSlots > 0, result should have dates
            if (availableSlots === 0) {
              expect(result).toHaveLength(0);
            } else {
              expect(result.length).toBeGreaterThanOrEqual(1);
            }
          },
        ),
      );
    });

    it('should exclude dates with no capacity record', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.date({ min: new Date(), max: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }),
          async (offeringId, businessId, startDate) => {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 3);

            // Mock capacity repository to return null (no capacity record)
            capacityReadRepo.findByOfferingAndDate = async () => null;

            // Mock availability checker to check capacity
            availabilityChecker.isDateAvailable = async (bId, oId, date) => {
              const capacity = await capacityReadRepo.findByOfferingAndDate(oId, date);
              return capacity !== null && capacity.availableSlots > 0;
            };

            const query = new GetAvailableDatesQuery(offeringId, businessId, startDate, endDate);

            const result = await getAvailableDatesHandler.execute(query);

            // Property: No capacity record means no available dates
            expect(result).toHaveLength(0);
          },
        ),
      );
    });
  });

  describe('Property: Available slots respect capacity constraints', () => {
    it('should return slots with correct available capacity', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.date({ min: new Date(), max: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }),
          fc.integer({ min: 15, max: 120 }),
          fc.integer({ min: 0, max: 10 }),
          async (offeringId, businessId, date, durationMinutes, availableSlots) => {
            // Mock capacity repository
            capacityReadRepo.findByOfferingAndDate = async () =>
              ({
                id: 'capacity-id',
                offeringId,
                date,
                totalSlots: 10,
                availableSlots,
                bookedSlots: 10 - availableSlots,
                createdAt: new Date(),
                updatedAt: new Date(),
              }) as CapacityReadModel;

            // Mock availability checker to return time slots
            availabilityChecker.getAvailableTimeSlots = async () => {
              if (availableSlots === 0) return [];
              return ['09:00', '10:00', '11:00'];
            };

            const query = new GetAvailableSlotsQuery(offeringId, businessId, date, durationMinutes);

            const result = await getAvailableSlotsHandler.execute(query);

            // Property: If no available slots, result should be empty
            if (availableSlots === 0) {
              expect(result).toHaveLength(0);
            }

            // Property: All returned slots should have availableSlots matching capacity
            result.forEach((slot) => {
              expect(slot.availableSlots).toBe(availableSlots);
            });
          },
        ),
      );
    });

    it('should return empty array when no capacity exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.date({ min: new Date(), max: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }),
          fc.integer({ min: 15, max: 120 }),
          async (offeringId, businessId, date, durationMinutes) => {
            // Mock capacity repository to return null
            capacityReadRepo.findByOfferingAndDate = async () => null;

            // Mock availability checker to return empty when no capacity
            availabilityChecker.getAvailableTimeSlots = async () => [];

            const query = new GetAvailableSlotsQuery(offeringId, businessId, date, durationMinutes);

            const result = await getAvailableSlotsHandler.execute(query);

            // Property: No capacity means no available slots
            expect(result).toHaveLength(0);
          },
        ),
      );
    });
  });

  describe('Property: Date range handling', () => {
    it('should handle any valid date range', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
          fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
          async (offeringId, businessId, date1, date2) => {
            // Ensure proper order
            const startDate = date1 < date2 ? date1 : date2;
            const endDate = date1 < date2 ? date2 : date1;

            // Mock availability checker
            availabilityChecker.isDateAvailable = async () => true;

            const query = new GetAvailableDatesQuery(offeringId, businessId, startDate, endDate);

            const result = await getAvailableDatesHandler.execute(query);

            // Property: Result should be an array
            expect(Array.isArray(result)).toBe(true);

            // Property: All dates should be within range
            result.forEach((date) => {
              // Normalize to midnight for comparison
              const normalizedDate = new Date(date);
              normalizedDate.setUTCHours(0, 0, 0, 0);

              const normalizedStart = new Date(startDate);
              normalizedStart.setUTCHours(0, 0, 0, 0);

              const normalizedEnd = new Date(endDate);
              normalizedEnd.setUTCHours(0, 0, 0, 0);

              expect(normalizedDate.getTime()).toBeGreaterThanOrEqual(normalizedStart.getTime());
              expect(normalizedDate.getTime()).toBeLessThanOrEqual(normalizedEnd.getTime());
            });

            // Property: Dates should be in ascending order
            for (let i = 1; i < result.length; i++) {
              expect(result[i].getTime()).toBeGreaterThanOrEqual(result[i - 1].getTime());
            }
          },
        ),
      );
    });

    it('should handle single-day range', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
          async (offeringId, businessId, date) => {
            // Mock availability checker
            availabilityChecker.isDateAvailable = async () => true;

            const query = new GetAvailableDatesQuery(
              offeringId,
              businessId,
              date,
              date, // Same date for start and end
            );

            const result = await getAvailableDatesHandler.execute(query);

            // Property: Single-day range should return 0 or 1 date
            expect(result.length).toBeLessThanOrEqual(1);

            // Property: If date is returned, it should match the input date
            if (result.length === 1) {
              expect(result[0].toISOString().split('T')[0]).toBe(date.toISOString().split('T')[0]);
            }
          },
        ),
      );
    });
  });
});
