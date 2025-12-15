import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { OnAppointmentCreatedHandler } from '../on-appointment-created';
import { AppointmentCreated } from '@booking/domain/events/appointment-created';

describe('OnAppointmentCreatedHandler', () => {
  let handler: OnAppointmentCreatedHandler;
  let commandBus: CommandBus;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Silenciar console.error durante los tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

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

  afterEach(() => {
    // Restaurar console.error
    consoleErrorSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should dispatch ScheduleReminderCommand and SendWhatsAppMessageCommand', async () => {
    // Arrange
    const event = new AppointmentCreated(
      'appointment-id',
      'business-id',
      'customer-id',
      'offering-id',
      new Date('2024-12-20T10:00:00Z'),
    );

    // Act
    await handler.handle(event);

    // Assert
    expect(commandBus.execute).toHaveBeenCalledTimes(2);
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: 'appointment-id',
        dateTime: event.dateTime,
      }),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'customer-id',
        message: expect.stringContaining('confirmada'),
      }),
    );
  });

  it('should not propagate errors', async () => {
    // Arrange
    const event = new AppointmentCreated(
      'appointment-id',
      'business-id',
      'customer-id',
      'offering-id',
      new Date('2024-12-20T10:00:00Z'),
    );

    // Mock commandBus to throw error
    jest.spyOn(commandBus, 'execute').mockRejectedValueOnce(new Error('Test error'));

    // Act & Assert - should not throw
    await expect(handler.handle(event)).resolves.not.toThrow();
  });
});
