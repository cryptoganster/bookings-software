import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { OnAppointmentCancelledHandler } from '../on-appointment-cancelled';
import { AppointmentCancelled } from '@booking/domain/events/appointment-cancelled';

describe('OnAppointmentCancelledHandler', () => {
  let handler: OnAppointmentCancelledHandler;
  let commandBus: CommandBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnAppointmentCancelledHandler,
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<OnAppointmentCancelledHandler>(OnAppointmentCancelledHandler);
    commandBus = module.get<CommandBus>(CommandBus);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should dispatch CancelReminderCommand and SendWhatsAppMessageCommand', async () => {
    // Arrange
    const event = new AppointmentCancelled('appointment-id');

    // Act
    await handler.handle(event);

    // Assert
    expect(commandBus.execute).toHaveBeenCalledTimes(2);
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: 'appointment-id',
      }),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('cancelada'),
      }),
    );
  });

  it('should not propagate errors', async () => {
    // Arrange
    const event = new AppointmentCancelled('appointment-id');

    // Mock commandBus to throw error
    jest.spyOn(commandBus, 'execute').mockRejectedValueOnce(new Error('Test error'));

    // Act & Assert - should not throw
    await expect(handler.handle(event)).resolves.not.toThrow();
  });
});
