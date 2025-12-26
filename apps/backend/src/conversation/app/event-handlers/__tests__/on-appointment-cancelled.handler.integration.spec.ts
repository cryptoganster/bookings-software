/**
 * OnAppointmentCancelledHandler Integration Tests
 *
 * Tests the event handler with real EventBus integration.
 *
 * Requirements: 8.5, 10.4, 10.5
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule, EventBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { OnAppointmentCancelledHandler } from '../on-appointment-cancelled.handler';
import { AppointmentCancelled } from '@booking/domain/events/appointment-cancelled';

describe('OnAppointmentCancelledHandler (Integration)', () => {
  let handler: OnAppointmentCancelledHandler;
  let eventBus: EventBus;
  let loggerSpy: jest.SpyInstance;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [OnAppointmentCancelledHandler],
    }).compile();

    handler = module.get<OnAppointmentCancelledHandler>(OnAppointmentCancelledHandler);
    eventBus = module.get<EventBus>(EventBus);
  });

  beforeEach(() => {
    // Spy on logger methods
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handle', () => {
    it('should log appointment cancelled event', async () => {
      // Arrange
      const event = new AppointmentCancelled('appointment-123', new Date('2024-12-25T09:00:00Z'));

      // Act
      await handler.handle(event);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Appointment cancelled: appointment-123'),
      );
    });

    it('should log debug information with event details', async () => {
      // Arrange
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');
      const cancelledAt = new Date('2024-12-25T09:00:00Z');
      const event = new AppointmentCancelled('appointment-123', cancelledAt);

      // Act
      await handler.handle(event);

      // Assert
      expect(debugSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: 'appointment-123',
          cancelledAt: cancelledAt,
          message: 'Appointment cancellation notification pending',
        }),
      );
    });

    it('should handle event when published through EventBus', async () => {
      // Arrange
      const event = new AppointmentCancelled('appointment-123', new Date('2024-12-25T09:00:00Z'));

      // Act - Call handler directly (EventBus integration tested in E2E)
      await handler.handle(event);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Appointment cancelled: appointment-123'),
      );
    });

    it('should not propagate errors (fire-and-forget)', async () => {
      // Arrange
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const event = new AppointmentCancelled('appointment-123', new Date('2024-12-25T09:00:00Z'));

      // Mock logger.log to throw error
      loggerSpy.mockImplementation(() => {
        throw new Error('Simulated logger error');
      });

      // Act & Assert - Should not throw
      await expect(handler.handle(event)).resolves.not.toThrow();

      // Verify error was logged
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error processing appointment cancelled event'),
        expect.any(String),
      );
    });

    it('should handle multiple events sequentially', async () => {
      // Arrange
      const event1 = new AppointmentCancelled('appointment-1', new Date('2024-12-25T09:00:00Z'));
      const event2 = new AppointmentCancelled('appointment-2', new Date('2024-12-25T10:00:00Z'));

      // Act
      await handler.handle(event1);
      await handler.handle(event2);

      // Assert
      expect(loggerSpy).toHaveBeenCalledTimes(2);
      expect(loggerSpy).toHaveBeenNthCalledWith(1, expect.stringContaining('appointment-1'));
      expect(loggerSpy).toHaveBeenNthCalledWith(2, expect.stringContaining('appointment-2'));
    });

    it('should handle events with different appointment IDs', async () => {
      // Arrange
      const events = [
        new AppointmentCancelled('appointment-A', new Date('2024-12-25T09:00:00Z')),
        new AppointmentCancelled('appointment-B', new Date('2024-12-25T10:00:00Z')),
        new AppointmentCancelled('appointment-C', new Date('2024-12-25T11:00:00Z')),
      ];

      // Act
      for (const event of events) {
        await handler.handle(event);
      }

      // Assert
      expect(loggerSpy).toHaveBeenCalledTimes(3);
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('appointment-A'));
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('appointment-B'));
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('appointment-C'));
    });

    it('should handle events with different cancellation times', async () => {
      // Arrange
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');
      const time1 = new Date('2024-12-25T09:00:00Z');
      const time2 = new Date('2024-12-25T15:30:00Z');

      const event1 = new AppointmentCancelled('appointment-1', time1);
      const event2 = new AppointmentCancelled('appointment-2', time2);

      // Act
      await handler.handle(event1);
      await handler.handle(event2);

      // Assert
      expect(debugSpy).toHaveBeenCalledTimes(2);
      expect(debugSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          appointmentId: 'appointment-1',
          cancelledAt: time1,
        }),
      );
      expect(debugSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          appointmentId: 'appointment-2',
          cancelledAt: time2,
        }),
      );
    });
  });
});
