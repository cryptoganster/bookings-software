import * as fc from 'fast-check';
import { CustomerAppointmentChecker } from '../customer-appointment-checker.service';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';

/**
 * Property-Based Tests for CustomerAppointmentChecker
 *
 * **Feature: architecture-compliance-refactor**
 * **Validates: Requirements 19.1, 19.2, 19.3, 19.4**
 */
describe('CustomerAppointmentChecker PBT', () => {
  describe('Property 1: Idempotence - hasFutureAppointments()', () => {
    /**
     * **Feature: architecture-compliance-refactor, Property 1: Idempotence**
     * **Validates: Requirements 19.2**
     *
     * Calling hasFutureAppointments() twice with same input returns same result
     */
    it('calling hasFutureAppointments twice with same customerId returns same result', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), fc.boolean(), async (customerId, hasFuture) => {
          // Arrange
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);

          const appointments: AppointmentReadModel[] = hasFuture
            ? [
                {
                  id: 'appointment-1',
                  businessId: 'business-1',
                  customerId,
                  customerName: 'Test',
                  customerPhone: '+18095551234',
                  offeringId: 'offering-1',
                  offeringName: 'Service',
                  dateTime: futureDate,
                  status: 'CONFIRMED',
                  createdAt: new Date(),
                  cancelledAt: null,
                },
              ]
            : [];

          const mockRepo: jest.Mocked<IAppointmentReadRepository> = {
            findByCustomerId: jest.fn().mockResolvedValue(appointments),
            findById: jest.fn(),
            findByBusinessId: jest.fn(),
            findUpcoming: jest.fn(),
            findToday: jest.fn(),
            findByBusinessAndDateRange: jest.fn(),
          } as jest.Mocked<IAppointmentReadRepository>;

          const checker = new CustomerAppointmentChecker(mockRepo);

          // Act
          const result1 = await checker.hasFutureAppointments(customerId);
          const result2 = await checker.hasFutureAppointments(customerId);

          // Assert
          expect(result1).toBe(result2);
          expect(mockRepo.findByCustomerId).toHaveBeenCalledTimes(2);
          expect(mockRepo.findByCustomerId).toHaveBeenCalledWith(customerId);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 2: Idempotence - getFutureAppointmentsCount()', () => {
    /**
     * **Feature: architecture-compliance-refactor, Property 2: Idempotence**
     * **Validates: Requirements 19.2**
     *
     * Calling getFutureAppointmentsCount() twice with same input returns same result
     */
    it('calling getFutureAppointmentsCount twice with same customerId returns same result', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), fc.integer({ min: 0, max: 10 }), async (customerId, count) => {
          // Arrange
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);

          const appointments: AppointmentReadModel[] = Array.from({ length: count }, (_, i) => ({
            id: `appointment-${i}`,
            businessId: 'business-1',
            customerId,
            customerName: 'Test',
            customerPhone: '+18095551234',
            offeringId: 'offering-1',
            offeringName: 'Service',
            dateTime: futureDate,
            status: 'CONFIRMED',
            createdAt: new Date(),
            cancelledAt: null,
          }));

          const mockRepo: jest.Mocked<IAppointmentReadRepository> = {
            findByCustomerId: jest.fn().mockResolvedValue(appointments),
            findById: jest.fn(),
            findByBusinessId: jest.fn(),
            findUpcoming: jest.fn(),
            findToday: jest.fn(),
            findByBusinessAndDateRange: jest.fn(),
          } as jest.Mocked<IAppointmentReadRepository>;

          const checker = new CustomerAppointmentChecker(mockRepo);

          // Act
          const result1 = await checker.getFutureAppointmentsCount(customerId);
          const result2 = await checker.getFutureAppointmentsCount(customerId);

          // Assert
          expect(result1).toBe(result2);
          expect(result1).toBe(count);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 3: Deterministic behavior', () => {
    /**
     * **Feature: architecture-compliance-refactor, Property 3: Deterministic behavior**
     * **Validates: Requirements 19.2**
     *
     * hasFutureAppointments() returns true when there are future CONFIRMED appointments
     */
    it('hasFutureAppointments returns true when there are future CONFIRMED appointments', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), fc.integer({ min: 1, max: 10 }), async (customerId, count) => {
          // Arrange
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);

          const appointments: AppointmentReadModel[] = Array.from({ length: count }, (_, i) => ({
            id: `appointment-${i}`,
            businessId: 'business-1',
            customerId,
            customerName: 'Test',
            customerPhone: '+18095551234',
            offeringId: 'offering-1',
            offeringName: 'Service',
            dateTime: futureDate,
            status: 'CONFIRMED',
            createdAt: new Date(),
            cancelledAt: null,
          }));

          const mockRepo: jest.Mocked<IAppointmentReadRepository> = {
            findByCustomerId: jest.fn().mockResolvedValue(appointments),
            findById: jest.fn(),
            findByBusinessId: jest.fn(),
            findUpcoming: jest.fn(),
            findToday: jest.fn(),
            findByBusinessAndDateRange: jest.fn(),
          } as jest.Mocked<IAppointmentReadRepository>;

          const checker = new CustomerAppointmentChecker(mockRepo);

          // Act
          const result = await checker.hasFutureAppointments(customerId);

          // Assert
          expect(result).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Feature: architecture-compliance-refactor, Property 3: Deterministic behavior**
     * **Validates: Requirements 19.2**
     *
     * hasFutureAppointments() returns false when there are no appointments
     */
    it('hasFutureAppointments returns false when there are no appointments', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), async (customerId) => {
          // Arrange
          const mockRepo: jest.Mocked<IAppointmentReadRepository> = {
            findByCustomerId: jest.fn().mockResolvedValue([]),
            findById: jest.fn(),
            findByBusinessId: jest.fn(),
            findUpcoming: jest.fn(),
            findToday: jest.fn(),
            findByBusinessAndDateRange: jest.fn(),
          } as jest.Mocked<IAppointmentReadRepository>;

          const checker = new CustomerAppointmentChecker(mockRepo);

          // Act
          const result = await checker.hasFutureAppointments(customerId);

          // Assert
          expect(result).toBe(false);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 4: Consistency between hasFutureAppointments() and getFutureAppointmentsCount()', () => {
    /**
     * **Feature: architecture-compliance-refactor, Property 4: Consistency**
     * **Validates: Requirements 19.2**
     *
     * If hasFutureAppointments() returns true, getFutureAppointmentsCount() should return > 0
     * If hasFutureAppointments() returns false, getFutureAppointmentsCount() should return 0
     */
    it('hasFutureAppointments and getFutureAppointmentsCount are consistent', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), fc.integer({ min: 0, max: 10 }), async (customerId, count) => {
          // Arrange
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);

          const appointments: AppointmentReadModel[] = Array.from({ length: count }, (_, i) => ({
            id: `appointment-${i}`,
            businessId: 'business-1',
            customerId,
            customerName: 'Test',
            customerPhone: '+18095551234',
            offeringId: 'offering-1',
            offeringName: 'Service',
            dateTime: futureDate,
            status: 'CONFIRMED',
            createdAt: new Date(),
            cancelledAt: null,
          }));

          const mockRepo: jest.Mocked<IAppointmentReadRepository> = {
            findByCustomerId: jest.fn().mockResolvedValue(appointments),
            findById: jest.fn(),
            findByBusinessId: jest.fn(),
            findUpcoming: jest.fn(),
            findToday: jest.fn(),
            findByBusinessAndDateRange: jest.fn(),
          } as jest.Mocked<IAppointmentReadRepository>;

          const checker = new CustomerAppointmentChecker(mockRepo);

          // Act
          const hasFuture = await checker.hasFutureAppointments(customerId);
          const futureCount = await checker.getFutureAppointmentsCount(customerId);

          // Assert
          if (hasFuture) {
            expect(futureCount).toBeGreaterThan(0);
          } else {
            expect(futureCount).toBe(0);
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 5: No side effects', () => {
    /**
     * **Feature: architecture-compliance-refactor, Property 5: No side effects**
     * **Validates: Requirements 19.2**
     *
     * Service does not modify repository state
     */
    it('does not modify repository state', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), async (customerId) => {
          // Arrange
          const mockRepo: jest.Mocked<IAppointmentReadRepository> = {
            findByCustomerId: jest.fn().mockResolvedValue([]),
            findById: jest.fn(),
            findByBusinessId: jest.fn(),
            findUpcoming: jest.fn(),
            findToday: jest.fn(),
            findByBusinessAndDateRange: jest.fn(),
          } as jest.Mocked<IAppointmentReadRepository>;

          const checker = new CustomerAppointmentChecker(mockRepo);

          // Act
          await checker.hasFutureAppointments(customerId);
          await checker.getFutureAppointmentsCount(customerId);

          // Assert - only read operation called, no write operations
          expect(mockRepo.findByCustomerId).toHaveBeenCalled();
          expect(mockRepo.findById).not.toHaveBeenCalled();
          expect(mockRepo.findByBusinessId).not.toHaveBeenCalled();
        }),
        { numRuns: 100 },
      );
    });
  });
});
