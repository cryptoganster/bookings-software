import { Test, TestingModule } from '@nestjs/testing';
import { of, Subject } from 'rxjs';
import { AppointmentNotificationSaga } from '../appointment-notification';
import { AppointmentCreated } from '@booking/domain/events/appointment-created';
import { AppointmentCancelled } from '@booking/domain/events/appointment-cancelled';
import * as fc from 'fast-check';

/**
 * Feature: proyecto-base-mvp, Property 11: Sagas emit commands for matching events
 * Validates: Requirements 5.4
 */
describe('AppointmentNotificationSaga - Property Tests', () => {
  let saga: AppointmentNotificationSaga;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppointmentNotificationSaga],
    }).compile();

    saga = module.get<AppointmentNotificationSaga>(AppointmentNotificationSaga);
  });

  describe('Property 11: Sagas emit commands for matching events', () => {
    it('should always emit ScheduleReminderCommand for any AppointmentCreated event', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.date({ min: new Date('2000-01-01'), max: new Date('2100-12-31') }),
          async (appointmentId, businessId, customerId, offeringId, dateTime) => {
            // Skip invalid dates (NaN)
            if (isNaN(dateTime.getTime())) {
              return true;
            }

            // Arrange
            const event = new AppointmentCreated(
              appointmentId,
              businessId,
              customerId,
              offeringId,
              dateTime,
            );

            const events$ = of(event);

            // Act
            const commands$ = saga.appointmentCreated(events$);

            // Assert - Debe emitir exactamente un comando
            return new Promise<boolean>((resolve) => {
              const emittedCommands: any[] = [];
              commands$.subscribe({
                next: (command) => emittedCommands.push(command),
                complete: () => {
                  // Verificar que se emitió exactamente 1 comando
                  const hasOneCommand = emittedCommands.length === 1;

                  // Verificar que el comando tiene los datos correctos
                  const hasCorrectData =
                    emittedCommands[0]?.appointmentId === appointmentId &&
                    emittedCommands[0]?.dateTime?.getTime() === dateTime.getTime();

                  resolve(hasOneCommand && hasCorrectData);
                },
              });
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should always emit exactly 2 commands for any AppointmentCancelled event', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (appointmentId) => {
          // Arrange
          const event = new AppointmentCancelled(appointmentId);
          const events$ = of(event);

          // Act
          const commands$ = saga.appointmentCancelled(events$);

          // Assert - Debe emitir exactamente 2 comandos
          return new Promise<boolean>((resolve) => {
            const emittedCommands: any[] = [];
            commands$.subscribe({
              next: (command) => emittedCommands.push(command),
              complete: () => {
                // Verificar que se emitieron exactamente 2 comandos
                const hasTwoCommands = emittedCommands.length === 2;

                // Verificar que el primer comando es CancelReminderCommand
                const firstCommandCorrect = emittedCommands[0]?.appointmentId === appointmentId;

                // Verificar que el segundo comando es SendWhatsAppMessageCommand
                const secondCommandCorrect = emittedCommands[1]?.message !== undefined;

                resolve(hasTwoCommands && firstCommandCorrect && secondCommandCorrect);
              },
            });
          });
        }),
        { numRuns: 100 },
      );
    });

    it('should filter events correctly - only emit commands for matching event types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.date({ min: new Date('2000-01-01'), max: new Date('2100-12-31') }),
          fc.uuid(),
          async (appointmentId1, businessId, customerId, offeringId, dateTime, appointmentId2) => {
            // Arrange - Crear múltiples eventos de diferentes tipos
            const createdEvent = new AppointmentCreated(
              appointmentId1,
              businessId,
              customerId,
              offeringId,
              dateTime,
            );
            const cancelledEvent = new AppointmentCancelled(appointmentId2);

            // Emitir ambos eventos
            const events$ = of(createdEvent, cancelledEvent);

            // Act - Aplicar saga de appointmentCreated
            const commands$ = saga.appointmentCreated(events$);

            // Assert - Solo debe emitir comando para AppointmentCreated
            return new Promise<boolean>((resolve) => {
              const emittedCommands: any[] = [];
              commands$.subscribe({
                next: (command) => emittedCommands.push(command),
                complete: () => {
                  // Debe emitir exactamente 1 comando (solo del AppointmentCreated)
                  const hasOneCommand = emittedCommands.length === 1;

                  // El comando debe corresponder al evento AppointmentCreated
                  const isCorrectEvent = emittedCommands[0]?.appointmentId === appointmentId1;

                  resolve(hasOneCommand && isCorrectEvent);
                },
              });
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should emit commands for multiple events of the same type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              appointmentId: fc.uuid(),
              businessId: fc.uuid(),
              customerId: fc.uuid(),
              offeringId: fc.uuid(),
              dateTime: fc.date({ min: new Date('2000-01-01'), max: new Date('2100-12-31') }),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          async (eventData) => {
            // Filter out invalid dates
            const validEventData = eventData.filter((data) => !isNaN(data.dateTime.getTime()));

            // Skip if no valid events
            if (validEventData.length === 0) {
              return true;
            }

            // Arrange - Crear múltiples eventos AppointmentCreated
            const events = validEventData.map(
              (data) =>
                new AppointmentCreated(
                  data.appointmentId,
                  data.businessId,
                  data.customerId,
                  data.offeringId,
                  data.dateTime,
                ),
            );

            const events$ = of(...events);

            // Act
            const commands$ = saga.appointmentCreated(events$);

            // Assert - Debe emitir un comando por cada evento
            return new Promise<boolean>((resolve) => {
              const emittedCommands: any[] = [];
              commands$.subscribe({
                next: (command) => emittedCommands.push(command),
                complete: () => {
                  // Debe emitir tantos comandos como eventos
                  const hasCorrectCount = emittedCommands.length === events.length;

                  // Cada comando debe corresponder a un evento
                  const allCommandsCorrect = emittedCommands.every(
                    (command, index) =>
                      command.appointmentId === validEventData[index].appointmentId &&
                      command.dateTime.getTime() === validEventData[index].dateTime.getTime(),
                  );

                  resolve(hasCorrectCount && allCommandsCorrect);
                },
              });
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should handle empty event stream without emitting commands', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null), // No necesitamos datos aleatorios para este test
          async () => {
            // Arrange - Stream vacío
            const events$ = of();

            // Act
            const commands$ = saga.appointmentCreated(events$);

            // Assert - No debe emitir ningún comando
            return new Promise<boolean>((resolve) => {
              const emittedCommands: any[] = [];
              commands$.subscribe({
                next: (command) => emittedCommands.push(command),
                complete: () => {
                  resolve(emittedCommands.length === 0);
                },
              });
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should emit commands asynchronously without blocking', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.date({ min: new Date('2000-01-01'), max: new Date('2100-12-31') }),
          async (appointmentId, businessId, customerId, offeringId, dateTime) => {
            // Arrange
            const event = new AppointmentCreated(
              appointmentId,
              businessId,
              customerId,
              offeringId,
              dateTime,
            );

            // Usar Subject para simular eventos asíncronos
            const events$ = new Subject();
            const commands$ = saga.appointmentCreated(events$);

            // Act & Assert
            return new Promise<boolean>((resolve) => {
              const emittedCommands: any[] = [];
              let subscriptionComplete = false;

              commands$.subscribe({
                next: (command) => emittedCommands.push(command),
                complete: () => {
                  subscriptionComplete = true;
                },
              });

              // Emitir evento después de suscribirse
              setTimeout(() => {
                events$.next(event);
                events$.complete();

                // Verificar después de un pequeño delay
                setTimeout(() => {
                  const hasCommand = emittedCommands.length === 1;
                  const isComplete = subscriptionComplete;
                  resolve(hasCommand && isComplete);
                }, 10);
              }, 10);
            });
          },
        ),
        { numRuns: 50 }, // Menos runs porque involucra timeouts
      );
    });
  });
});
