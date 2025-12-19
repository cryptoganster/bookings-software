import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { CreateAppointmentHandler } from '../handler';
import { CreateAppointmentCommand } from '../command';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { NoAvailableSlotsException } from '@booking/domain/exceptions/no-available-slots';

describe('CreateAppointmentHandler Integration', () => {
  let handler: CreateAppointmentHandler;
  let appointmentRepository: jest.Mocked<IAppointmentWriteRepository>;
  let capacityFactory: any;
  let capacityWriteRepository: any;
  let customerReadRepository: any;
  let uow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    // Mock repositories
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    capacityFactory = {
      loadByOfferingAndDate: jest.fn(),
      loadById: jest.fn(),
    };

    capacityWriteRepository = {
      save: jest.fn(),
    };

    customerReadRepository = {
      findById: jest.fn(),
      findByWhatsAppPhone: jest.fn(),
      findByBusinessId: jest.fn(),
      findByUserId: jest.fn(),
      findAnonymousByBusinessId: jest.fn(),
    };

    uow = {
      transaction: jest.fn((work) => work()),
      getQueryRunner: jest.fn(),
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
          provide: 'ICustomerReadRepository',
          useValue: customerReadRepository,
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
    };

    capacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);
    customerReadRepository.findById.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440001',
    });

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
    expect(mockCapacity.bookSlot).toHaveBeenCalled();
    expect(capacityWriteRepository.save).toHaveBeenCalledWith(mockCapacity);
    expect(appointmentRepository.save).toHaveBeenCalled();
  });

  it('should throw NoAvailableSlotsException if capacity is 0', async () => {
    // Arrange
    const mockCapacity = {
      hasAvailableSlots: jest.fn().mockReturnValue(false),
      bookSlot: jest.fn(),
    };

    capacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);
    customerReadRepository.findById.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440001',
    });

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
    expect(mockCapacity.bookSlot).not.toHaveBeenCalled();
  });

  it('should throw NoAvailableSlotsException if capacity is null', async () => {
    // Arrange
    capacityFactory.loadByOfferingAndDate.mockResolvedValue(null);
    customerReadRepository.findById.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440001',
    });

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
  });
});
