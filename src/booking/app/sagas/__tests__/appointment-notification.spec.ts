import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { AppointmentNotificationSaga } from '../appointment-notification';
import { AppointmentCreated } from '@booking/domain/events/appointment-created';
import { AppointmentCancelled } from '@booking/domain/events/appointment-cancelled';

describe('AppointmentNotificationSaga', () => {
  let saga: AppointmentNotificationSaga;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppointmentNotificationSaga],
    }).compile();

    saga = module.get<AppointmentNotificationSaga>(AppointmentNotificationSaga);
  });

  it('should be defined', () => {
    expect(saga).toBeDefined();
  });

  describe('appointmentCreated saga', () => {
    it('should emit ScheduleReminderCommand when AppointmentCreated event is published', (done) => {
      // Arrange
      const event = new AppointmentCreated(
        'appointment-id',
        'business-id',
        'customer-id',
        'offering-id',
        new Date('2024-12-20T10:00:00Z'),
      );

      const events$ = of(event);

      // Act
      const commands$ = saga.appointmentCreated(events$);

      // Assert
      commands$.subscribe((command) => {
        expect(command).toBeDefined();
        expect(command).toHaveProperty('appointmentId', 'appointment-id');
        expect(command).toHaveProperty('dateTime');
        done();
      });
    });

    it('should use ofType to filter only AppointmentCreated events', (done) => {
      // Arrange
      const appointmentCreatedEvent = new AppointmentCreated(
        'appointment-id',
        'business-id',
        'customer-id',
        'offering-id',
        new Date('2024-12-20T10:00:00Z'),
      );

      const appointmentCancelledEvent = new AppointmentCancelled('appointment-id');

      // Emitir múltiples eventos
      const events$ = of(appointmentCreatedEvent, appointmentCancelledEvent);

      // Act
      const commands$ = saga.appointmentCreated(events$);

      // Assert - Solo debe emitir comando para AppointmentCreated
      const emittedCommands: any[] = [];
      commands$.subscribe({
        next: (command) => emittedCommands.push(command),
        complete: () => {
          // Solo debe haber 1 comando (del AppointmentCreated)
          expect(emittedCommands).toHaveLength(1);
          expect(emittedCommands[0]).toHaveProperty('appointmentId', 'appointment-id');
          done();
        },
      });
    });
  });

  describe('appointmentCancelled saga', () => {
    it('should emit CancelReminderCommand and SendWhatsAppMessageCommand when AppointmentCancelled event is published', (done) => {
      // Arrange
      const event = new AppointmentCancelled('appointment-id');
      const events$ = of(event);

      // Act
      const commands$ = saga.appointmentCancelled(events$);

      // Assert
      const emittedCommands: any[] = [];
      commands$.subscribe({
        next: (command) => emittedCommands.push(command),
        complete: () => {
          // Debe emitir 2 comandos
          expect(emittedCommands).toHaveLength(2);

          // Primer comando: CancelReminderCommand
          expect(emittedCommands[0]).toHaveProperty('appointmentId', 'appointment-id');

          // Segundo comando: SendWhatsAppMessageCommand
          expect(emittedCommands[1]).toHaveProperty('message');
          expect(emittedCommands[1].message).toContain('cancelada');

          done();
        },
      });
    });

    it('should use ofType to filter only AppointmentCancelled events', (done) => {
      // Arrange
      const appointmentCreatedEvent = new AppointmentCreated(
        'appointment-id',
        'business-id',
        'customer-id',
        'offering-id',
        new Date('2024-12-20T10:00:00Z'),
      );

      const appointmentCancelledEvent = new AppointmentCancelled('appointment-id');

      // Emitir múltiples eventos
      const events$ = of(appointmentCreatedEvent, appointmentCancelledEvent);

      // Act
      const commands$ = saga.appointmentCancelled(events$);

      // Assert - Solo debe emitir comandos para AppointmentCancelled
      const emittedCommands: any[] = [];
      commands$.subscribe({
        next: (command) => emittedCommands.push(command),
        complete: () => {
          // Debe haber 2 comandos (del AppointmentCancelled)
          expect(emittedCommands).toHaveLength(2);
          done();
        },
      });
    });
  });
});
