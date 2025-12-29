import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { CreateAppointmentHandler } from '../handler';
import { CreateAppointmentCommand } from '../command';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write';
import { ICapacityFactory } from '@availability/domain/interfaces/factories/capacity-factory';
import { ICapacityWriteRepository } from '@availability/domain/interfaces/repositories/capacity-write';
import { ICustomerExistenceChecker } from '@customer/domain/interfaces/services/customer-existence-checker.interface';
import { IUnitOfWork } from '@shared/kernel/uow';
import { NoAvailableSlotsException } from '@booking/domain/exceptions/no-available-slots';
import { CustomerNotFoundException } from '@customer/domain/exceptions/customer-not-found';
import { Capacity } from '@availability/domain/aggregates/capacity';

describe('CreateAppointmentHandler Integration', () => {
  let handler: CreateAppointmentHandler;
  let appointmentRepository: jest.Mocked<IAppointmentWriteRepository>;
  let capacityFactory: jest.Mocked<ICapacityFactory>;
  let capacityWriteRepository: jest.Mocked<ICapacityWriteRepository>;
  let customerExistenceChecker: jest.Mocked<ICustomerExistenceChecker>;
  let uow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    // Mock repositories
    appointmentRepository = {
      save: jest.fn(),
    } as jest.Mocked<IAppointmentWriteRepository>;

    capacityFactory = {
      loadByOfferingAndDate: jest.fn(),
      loadById: jest.fn(),
    } as jest.Mocked<ICapacityFactory>;

    capacityWriteRepository = {
      save: jest.fn(),
    } as jest.Mocked<ICapacityWriteRepository>;

    customerExistenceChecker = {
      exists: jest.fn(),
      getCustomer: jest.fn(),
    } as jest.Mocked<ICustomerExistenceChecker>;

    uow = {
      transaction: jest.fn((work) => work()),
      getQueryRunner: jest.fn(),
    } as jest.Mocked<IUnitOfWork>;

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      setContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAppointmentHandler,
        {
          provide: 'IAppointmentWriteRepository',
          useValue: appointmentRepository,
        },
        {
          provide: 'ICapacityFactory',
          useValue: capacityFactory,
        },
        {
          provide: 'ICapacityWriteRepository',
          useValue: capacityWriteRepository,
        },
        {
          provide: 'ICustomerExistenceChecker',
          useValue: customerExistenceChecker,
        },
        {
          provide: 'IUnitOfWork',
          useValue: uow,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    handler = module.get<CreateAppointmentHandler>(CreateAppointmentHandler);
  });

  it('should create appointment and decrement capacity', async () => {
    // Arrange
    const mockCapacity = {
      hasAvailableSlots: jest.fn().mockReturnValue(true),
      bookSlot: jest.fn(),
    } as unknown as Capacity;

    capacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);
    customerExistenceChecker.exists.mockResolvedValue(true);

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
    expect(customerExistenceChecker.exists).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440001',
    );
    expect(mockCapacity.bookSlot).toHaveBeenCalled();
    expect(capacityWriteRepository.save).toHaveBeenCalledWith(mockCapacity);
    expect(appointmentRepository.save).toHaveBeenCalled();
  });

  it('should throw NoAvailableSlotsException if capacity is 0', async () => {
    // Arrange
    const mockCapacity = {
      hasAvailableSlots: jest.fn().mockReturnValue(false),
      bookSlot: jest.fn(),
    } as unknown as Capacity;

    capacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);
    customerExistenceChecker.exists.mockResolvedValue(true);

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
    await expect(handler.execute(command)).rejects.toThrow(NoAvailableSlotsException);
    expect(customerExistenceChecker.exists).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440001',
    );
    expect(mockCapacity.bookSlot).not.toHaveBeenCalled();
  });

  it('should throw NoAvailableSlotsException if capacity is null', async () => {
    // Arrange
    capacityFactory.loadByOfferingAndDate.mockResolvedValue(null);
    customerExistenceChecker.exists.mockResolvedValue(true);

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
    await expect(handler.execute(command)).rejects.toThrow(NoAvailableSlotsException);
    expect(customerExistenceChecker.exists).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440001',
    );
  });

  it('should throw CustomerNotFoundException when customer does not exist', async () => {
    // Arrange
    customerExistenceChecker.exists.mockResolvedValue(false);

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
    await expect(handler.execute(command)).rejects.toThrow(CustomerNotFoundException);
    expect(customerExistenceChecker.exists).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440001',
    );
    expect(capacityFactory.loadByOfferingAndDate).not.toHaveBeenCalled();
  });
});
