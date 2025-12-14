import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CreateAppointmentHandler } from '../handler';
import { CreateAppointmentCommand } from '../command';
import { IAppointmentWriteRepository } from '../../../../domain/interfaces/repositories/appointment-write.repository';
import { IUnitOfWork } from '../../../../../shared/kernel/uow';
import { NoAvailableSlotsException } from '../../../../domain/exceptions/no-available-slots';

describe('CreateAppointmentHandler Integration', () => {
  let handler: CreateAppointmentHandler;
  let appointmentRepository: jest.Mocked<IAppointmentWriteRepository>;
  let capacityRepository: any;
  let uow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    // Mock repositories
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    capacityRepository = {
      findByOfferingAndDate: jest.fn(),
      save: jest.fn(),
    };

    uow = {
      transaction: jest.fn((work) => work()),
      getQueryRunner: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAppointmentHandler,
        {
          provide: 'IAppointmentWriteRepository',
          useValue: appointmentRepository,
        },
        {
          provide: 'ICapacityWriteRepository',
          useValue: capacityRepository,
        },
        {
          provide: 'IUnitOfWork',
          useValue: uow,
        },
      ],
    }).compile();

    handler = module.get<CreateAppointmentHandler>(CreateAppointmentHandler);
  });

  it('should create appointment and decrement capacity', async () => {
    // Arrange
    const mockCapacity = {
      hasAvailableSlots: jest.fn().mockReturnValue(true),
      decrementSlot: jest.fn(),
    };

    capacityRepository.findByOfferingAndDate.mockResolvedValue(mockCapacity);

    // Use a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const command = new CreateAppointmentCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
      futureDate,
    );

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.appointmentId).toBeDefined();
    expect(mockCapacity.decrementSlot).toHaveBeenCalled();
    expect(capacityRepository.save).toHaveBeenCalledWith(mockCapacity);
    expect(appointmentRepository.save).toHaveBeenCalled();
  });

  it('should throw NoAvailableSlotsException if capacity is 0', async () => {
    // Arrange
    const mockCapacity = {
      hasAvailableSlots: jest.fn().mockReturnValue(false),
      decrementSlot: jest.fn(),
    };

    capacityRepository.findByOfferingAndDate.mockResolvedValue(mockCapacity);

    // Use a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const command = new CreateAppointmentCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
      futureDate,
    );

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      NoAvailableSlotsException,
    );
    expect(mockCapacity.decrementSlot).not.toHaveBeenCalled();
  });

  it('should throw NoAvailableSlotsException if capacity is null', async () => {
    // Arrange
    capacityRepository.findByOfferingAndDate.mockResolvedValue(null);

    // Use a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const command = new CreateAppointmentCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
      futureDate,
    );

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      NoAvailableSlotsException,
    );
  });
});
