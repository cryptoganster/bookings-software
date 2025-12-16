import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { CancelAppointmentHandler } from '../handler';
import { CancelAppointmentCommand } from '../command';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write';
import { Appointment } from '@booking/domain/aggregates/appointment';
import { AppointmentNotFoundException } from '@booking/domain/exceptions/appointment-not-found';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';
import { UUID } from '@shared/vo/uuid';

import { DateTime } from '@booking/domain/vo/date-time';

describe('CancelAppointmentHandler Integration', () => {
  let handler: CancelAppointmentHandler;
  let appointmentRepository: jest.Mocked<IAppointmentWriteRepository>;

  beforeEach(async () => {
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      setContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelAppointmentHandler,
        {
          provide: 'IAppointmentWriteRepository',
          useValue: appointmentRepository,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    handler = module.get<CancelAppointmentHandler>(CancelAppointmentHandler);
  });

  it('should cancel appointment successfully', async () => {
    // Arrange
    const appointmentId = UUID.generate();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const mockAppointment = Appointment.create(
      appointmentId,
      UUID.generate(),
      UUID.generate(),
      UUID.generate(),
      DateTime.fromDate(futureDate),
    );

    appointmentRepository.findById.mockResolvedValue(mockAppointment);
    appointmentRepository.save.mockResolvedValue();

    const command = new CancelAppointmentCommand(appointmentId.getValue(), 'user-id');

    // Act
    await handler.execute(command);

    // Assert
    expect(appointmentRepository.findById).toHaveBeenCalledWith(appointmentId);
    expect(appointmentRepository.save).toHaveBeenCalledWith(mockAppointment);
    expect(mockAppointment.getStatus().getValue()).toBe('CANCELLED');
  });

  it('should throw AppointmentNotFoundException if appointment not found', async () => {
    // Arrange
    appointmentRepository.findById.mockResolvedValue(null);

    const command = new CancelAppointmentCommand('550e8400-e29b-41d4-a716-446655440000', 'user-id');

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(AppointmentNotFoundException);
  });

  it('should retry on ConcurrencyException', async () => {
    // Arrange
    const appointmentId = UUID.generate();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    // Create fresh appointments for each retry
    const mockAppointment1 = Appointment.create(
      appointmentId,
      UUID.generate(),
      UUID.generate(),
      UUID.generate(),
      DateTime.fromDate(futureDate),
    );

    const mockAppointment2 = Appointment.create(
      appointmentId,
      UUID.generate(),
      UUID.generate(),
      UUID.generate(),
      DateTime.fromDate(futureDate),
    );

    appointmentRepository.findById
      .mockResolvedValueOnce(mockAppointment1)
      .mockResolvedValueOnce(mockAppointment2);

    // First call throws ConcurrencyException, second succeeds
    appointmentRepository.save
      .mockRejectedValueOnce(new ConcurrencyException('Version conflict'))
      .mockResolvedValueOnce();

    const command = new CancelAppointmentCommand(appointmentId.getValue(), 'user-id');

    // Act
    await handler.execute(command);

    // Assert
    expect(appointmentRepository.save).toHaveBeenCalledTimes(2);
  });

  it('should throw error after max retries on ConcurrencyException', async () => {
    // Arrange
    const appointmentId = UUID.generate();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    // Create fresh appointments for each retry
    const mockAppointment1 = Appointment.create(
      appointmentId,
      UUID.generate(),
      UUID.generate(),
      UUID.generate(),
      DateTime.fromDate(futureDate),
    );

    const mockAppointment2 = Appointment.create(
      appointmentId,
      UUID.generate(),
      UUID.generate(),
      UUID.generate(),
      DateTime.fromDate(futureDate),
    );

    const mockAppointment3 = Appointment.create(
      appointmentId,
      UUID.generate(),
      UUID.generate(),
      UUID.generate(),
      DateTime.fromDate(futureDate),
    );

    appointmentRepository.findById
      .mockResolvedValueOnce(mockAppointment1)
      .mockResolvedValueOnce(mockAppointment2)
      .mockResolvedValueOnce(mockAppointment3);

    appointmentRepository.save.mockRejectedValue(new ConcurrencyException('Version conflict'));

    const command = new CancelAppointmentCommand(appointmentId.getValue(), 'user-id');

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      'Unable to cancel appointment after multiple attempts',
    );
    expect(appointmentRepository.save).toHaveBeenCalledTimes(3);
  });
});
