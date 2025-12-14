import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { CancelAppointmentHandler } from '../handler';
import { CancelAppointmentCommand } from '../command';
import { IAppointmentWriteRepository } from '../../../../domain/interfaces/repositories/appointment-write.repository';
import { Appointment } from '../../../../domain/aggregates/appointment';
import { ConcurrencyException } from '../../../../../shared/kernel/exceptions/concurrency';
import { UUID } from '../../../../../shared/vo/uuid';
import { DateTime } from '../../../../domain/vo/date-time';

describe('CancelAppointmentHandler - Property Tests', () => {
  let handler: CancelAppointmentHandler;
  let appointmentRepository: jest.Mocked<IAppointmentWriteRepository>;

  beforeEach(async () => {
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelAppointmentHandler,
        {
          provide: 'IAppointmentWriteRepository',
          useValue: appointmentRepository,
        },
      ],
    }).compile();

    handler = module.get<CancelAppointmentHandler>(CancelAppointmentHandler);
  });

  // Property 7: Command handlers retry on concurrency exceptions
  // Validates: Requirements 8.3
  it(
    'should always retry on ConcurrencyException with exponential backoff',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 1, max: 2 }), // Number of failures before success (1 or 2)
          async (id, businessId, customerId, offeringId, failureCount) => {
            // Reset mocks for each iteration
            jest.clearAllMocks();

            // Arrange
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            // Create fresh appointments for each retry
            const appointments: Appointment[] = [];
            for (let i = 0; i <= failureCount; i++) {
              appointments.push(
                Appointment.create(
                  UUID.fromString(id),
                  UUID.fromString(businessId),
                  UUID.fromString(customerId),
                  UUID.fromString(offeringId),
                  DateTime.fromDate(futureDate),
                ),
              );
            }

            // Mock findById to return fresh appointments
            for (const appointment of appointments) {
              appointmentRepository.findById.mockResolvedValueOnce(appointment);
            }

            // Mock save to fail N times, then succeed
            for (let i = 0; i < failureCount; i++) {
              appointmentRepository.save.mockRejectedValueOnce(
                new ConcurrencyException('Version conflict'),
              );
            }
            appointmentRepository.save.mockResolvedValueOnce();

            const command = new CancelAppointmentCommand(id, 'user-id');

            // Act
            const startTime = Date.now();
            await handler.execute(command);
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Assert
            // Should have called save failureCount + 1 times (failures + success)
            expect(appointmentRepository.save).toHaveBeenCalledTimes(
              failureCount + 1,
            );

            // Should have called findById failureCount + 1 times
            expect(appointmentRepository.findById).toHaveBeenCalledTimes(
              failureCount + 1,
            );

            // Verify exponential backoff was applied
            // With exponential backoff: 100ms * 2^1 = 200ms for first retry
            // 100ms * 2^2 = 400ms for second retry
            // Total minimum time should be at least the sum of backoffs
            if (failureCount === 1) {
              // At least 100ms for one retry
              expect(duration).toBeGreaterThanOrEqual(100);
            } else if (failureCount === 2) {
              // At least 400ms for two retries (200ms + 400ms)
              expect(duration).toBeGreaterThanOrEqual(400);
            }
          },
        ),
        { numRuns: 20 }, // Reduced runs because of the delays
      );
    },
    30000,
  ); // 30 second timeout

  it(
    'should fail after max retries on persistent ConcurrencyException',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (id, businessId, customerId, offeringId) => {
            // Reset mocks for each iteration
            jest.clearAllMocks();

            // Arrange
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            // Create fresh appointments for each retry (3 attempts)
            for (let i = 0; i < 3; i++) {
              const appointment = Appointment.create(
                UUID.fromString(id),
                UUID.fromString(businessId),
                UUID.fromString(customerId),
                UUID.fromString(offeringId),
                DateTime.fromDate(futureDate),
              );
              appointmentRepository.findById.mockResolvedValueOnce(appointment);
            }

            // Mock save to always fail
            appointmentRepository.save.mockRejectedValue(
              new ConcurrencyException('Version conflict'),
            );

            const command = new CancelAppointmentCommand(id, 'user-id');

            // Act & Assert
            let errorThrown = false;
            try {
              await handler.execute(command);
            } catch (error) {
              if (
                error instanceof Error &&
                error.message ===
                  'Unable to cancel appointment after multiple attempts'
              ) {
                errorThrown = true;
              }
            }

            // Should have attempted 3 times
            expect(appointmentRepository.save).toHaveBeenCalledTimes(3);
            expect(errorThrown).toBe(true);
          },
        ),
        { numRuns: 20 },
      );
    },
    30000,
  ); // 30 second timeout
});
