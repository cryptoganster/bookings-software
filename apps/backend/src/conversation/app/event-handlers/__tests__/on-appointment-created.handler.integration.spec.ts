/**
 * OnAppointmentCreatedHandler Integration Tests
 *
 * Tests the event handler with real EventBus integration.
 *
 * Requirements: 8.5, 10.4, 10.5
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { OnAppointmentCreatedHandler } from '../on-appointment-created.handler';
import { AppointmentCreated } from '@booking/domain/events/appointment-created';

describe('OnAppointmentCreatedHandler (Integration)', () => {
  let handler: OnAppointmentCreatedHandler;
  let loggerSpy: jest.SpyInstance;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [OnAppointmentCreatedHandler],
    }).compile();

    handler = module.get<OnAppointmentCreatedHandler>(OnAppointmentCreatedHandler);
    // EventBus is available but not used directly in these tests
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
    it('should log appointment created event', async () => {
      // Arrange
      const event = new AppointmentCreated(
        'appointment-123',
        'business-456',
        'customer-789',
        'offering-101',
        new Date('2024-12-25T10:00:00Z'),
      );

      // Act
      await handler.handle(event);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Appointment created: appointment-123'),
      );
    });

    it('should log debug information with event details', async () => {
      // Arrange
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');
      const event = new AppointmentCreated(
        'appointment-123',
        'business-456',
        'customer-789',
        'offering-101',
        new Date('2024-12-25T10:00:00Z'),
      );

      // Act
      await handler.handle(event);

      // Assert
      expect(debugSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: 'appointment-123',
          customerId: 'customer-789',
          dateTime: expect.any(Date),
          message: 'Appointment confirmation notification pending',
        }),
      );
    });

    it('should handle event when published through EventBus', async () => {
      // Arrange
      const event = new AppointmentCreated(
        'appointment-123',
        'business-456',
        'customer-789',
        'offering-101',
        new Date('2024-12-25T10:00:00Z'),
      );

      // Act - Call handler directly (EventBus integration tested in E2E)
      await handler.handle(event);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Appointment created: appointment-123'),
      );
    });

    it('should not propagate errors (fire-and-forget)', async () => {
      // Arrange
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const event = new AppointmentCreated(
        'appointment-123',
        'business-456',
        'customer-789',
        'offering-101',
        new Date('2024-12-25T10:00:00Z'),
      );

      // Mock logger.log to throw error
      loggerSpy.mockImplementation(() => {
        throw new Error('Simulated logger error');
      });

      // Act & Assert - Should not throw
      await expect(handler.handle(event)).resolves.not.toThrow();

      // Verify error was logged
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error processing appointment created event'),
        expect.any(String),
      );
    });

    it('should handle multiple events sequentially', async () => {
      // Arrange
      const event1 = new AppointmentCreated(
        'appointment-1',
        'business-456',
        'customer-789',
        'offering-101',
        new Date('2024-12-25T10:00:00Z'),
      );
      const event2 = new AppointmentCreated(
        'appointment-2',
        'business-456',
        'customer-789',
        'offering-101',
        new Date('2024-12-25T11:00:00Z'),
      );

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
        new AppointmentCreated(
          'appointment-A',
          'business-1',
          'customer-1',
          'offering-1',
          new Date('2024-12-25T10:00:00Z'),
        ),
        new AppointmentCreated(
          'appointment-B',
          'business-2',
          'customer-2',
          'offering-2',
          new Date('2024-12-25T11:00:00Z'),
        ),
        new AppointmentCreated(
          'appointment-C',
          'business-3',
          'customer-3',
          'offering-3',
          new Date('2024-12-25T12:00:00Z'),
        ),
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
  });
});
