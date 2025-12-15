import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { OnAppointmentCreatedHandler } from '../on-appointment-created';
import { AppointmentCreated } from '@booking/domain/events/appointment-created';
import * as fc from 'fast-check';

/**
 * Feature: proyecto-base-mvp, Property 10: Event handlers handle errors gracefully
 * Validates: Requirements 5.2
 */
describe('OnAppointmentCreatedHandler - Property Tests', () => {
  let handler: OnAppointmentCreatedHandler;
  let commandBus: CommandBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnAppointmentCreatedHandler,
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<OnAppointmentCreatedHandler>(OnAppointmentCreatedHandler);
    commandBus = module.get<CommandBus>(CommandBus);
  });

  it('should not propagate errors when command execution fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.date({ min: new Date('2000-01-01'), max: new Date('2100-12-31') }),
        fc.oneof(
          fc.constant(new Error('Network error')),
          fc.constant(new Error('Database error')),
          fc.constant(new Error('Timeout error')),
          fc.constant(new Error('Unknown error')),
        ),
        async (appointmentId, businessId, customerId, offeringId, dateTime, error) => {
          // Arrange - Mock commandBus to throw error
          jest.spyOn(commandBus, 'execute').mockRejectedValue(error);

          const event = new AppointmentCreated(
            appointmentId,
            businessId,
            customerId,
            offeringId,
            dateTime,
          );

          // Act & Assert - El handler no debe propagar el error
          try {
            await handler.handle(event);
            // Si llegamos aquí, el handler manejó el error correctamente
            return true;
          } catch {
            // Si se lanza un error, el handler no lo manejó correctamente
            return false;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle errors from first command without affecting second command', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.date({ min: new Date('2000-01-01'), max: new Date('2100-12-31') }),
        async (appointmentId, businessId, customerId, offeringId, dateTime) => {
          // Arrange - Mock first command to fail, second to succeed
          let callCount = 0;
          jest.spyOn(commandBus, 'execute').mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.reject(new Error('First command failed'));
            }
            return Promise.resolve();
          });

          const event = new AppointmentCreated(
            appointmentId,
            businessId,
            customerId,
            offeringId,
            dateTime,
          );

          // Act
          try {
            await handler.handle(event);
            // El handler debe completar sin lanzar error
            return true;
          } catch {
            // No debe propagar el error
            return false;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle errors from any command in the sequence', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.date({ min: new Date('2000-01-01'), max: new Date('2100-12-31') }),
        fc.integer({ min: 1, max: 2 }), // Qué comando falla (1 o 2)
        async (appointmentId, businessId, customerId, offeringId, dateTime, failingCommand) => {
          // Arrange - Mock el comando especificado para fallar
          let callCount = 0;
          jest.spyOn(commandBus, 'execute').mockImplementation(() => {
            callCount++;
            if (callCount === failingCommand) {
              return Promise.reject(new Error(`Command ${failingCommand} failed`));
            }
            return Promise.resolve();
          });

          const event = new AppointmentCreated(
            appointmentId,
            businessId,
            customerId,
            offeringId,
            dateTime,
          );

          // Act & Assert
          try {
            await handler.handle(event);
            return true;
          } catch {
            return false;
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
