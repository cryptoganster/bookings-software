import { Test, TestingModule } from '@nestjs/testing';
import { CreateAppointmentHandler } from '@booking/app/commands/create-appointment/handler';
import { CreateAppointmentCommand } from '@booking/app/commands/create-appointment/command';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write';
import { ICapacityFactory } from '@availability/domain/interfaces/factories/capacity-factory';
import { ICapacityWriteRepository } from '@availability/domain/interfaces/repositories/capacity-write';
import { ICustomerExistenceChecker } from '@customer/domain/interfaces/services/customer-existence-checker.interface';
import { IUnitOfWork } from '@shared/kernel/uow';
import { NoAvailableSlotsException } from '@booking/domain/exceptions/no-available-slots';
import { CustomerNotFoundException } from '@customer/domain/exceptions/customer-not-found';
import { PinoLogger } from 'nestjs-pino';
import { Capacity } from '@availability/domain/aggregates/capacity';

// Helper to create a mock Capacity
function createMockCapacity(hasSlots: boolean): Capacity {
  return {
    hasAvailableSlots: jest.fn().mockReturnValue(hasSlots),
    bookSlot: jest.fn(),
  } as unknown as Capacity;
}

describe('CreateAppointmentHandler', () => {
  let handler: CreateAppointmentHandler;
  let mockAppointmentRepository: jest.Mocked<IAppointmentWriteRepository>;
  let mockCapacityFactory: jest.Mocked<ICapacityFactory>;
  let mockCapacityWriteRepository: jest.Mocked<ICapacityWriteRepository>;
  let mockCustomerExistenceChecker: jest.Mocked<ICustomerExistenceChecker>;
  let mockUow: jest.Mocked<IUnitOfWork>;
  let mockLogger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    // Create mocks
    mockAppointmentRepository = {
      save: jest.fn(),
    } as jest.Mocked<IAppointmentWriteRepository>;

    mockCapacityFactory = {
      loadByOfferingAndDate: jest.fn(),
      loadById: jest.fn(),
    } as jest.Mocked<ICapacityFactory>;

    mockCapacityWriteRepository = {
      save: jest.fn(),
    } as jest.Mocked<ICapacityWriteRepository>;

    mockCustomerExistenceChecker = {
      exists: jest.fn(),
      getCustomer: jest.fn(),
    } as jest.Mocked<ICustomerExistenceChecker>;

    mockUow = {
      transaction: jest.fn((work) => work()),
      getQueryRunner: jest.fn(),
    } as jest.Mocked<IUnitOfWork>;

    mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
      assign: jest.fn(),
      logger: {},
    } as unknown as jest.Mocked<PinoLogger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAppointmentHandler,
        {
          provide: 'IAppointmentWriteRepository',
          useValue: mockAppointmentRepository,
        },
        {
          provide: 'ICapacityFactory',
          useValue: mockCapacityFactory,
        },
        {
          provide: 'ICapacityWriteRepository',
          useValue: mockCapacityWriteRepository,
        },
        {
          provide: 'ICustomerExistenceChecker',
          useValue: mockCustomerExistenceChecker,
        },
        {
          provide: 'IUnitOfWork',
          useValue: mockUow,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    handler = module.get<CreateAppointmentHandler>(CreateAppointmentHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days in the future

    const validCommand = new CreateAppointmentCommand(
      '550e8400-e29b-41d4-a716-446655440001', // business-id
      '550e8400-e29b-41d4-a716-446655440002', // customer-id
      '550e8400-e29b-41d4-a716-446655440003', // offering-id
      futureDate,
    );

    it('should create appointment successfully when customer exists and capacity available', async () => {
      // Arrange
      const mockCapacity = createMockCapacity(true);

      mockCustomerExistenceChecker.exists.mockResolvedValue(true);
      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);

      // Act
      const result = await handler.execute(validCommand);

      // Assert
      expect(result).toHaveProperty('appointmentId');
      expect(typeof result.appointmentId).toBe('string');
      expect(mockCustomerExistenceChecker.exists).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      expect(mockCapacityFactory.loadByOfferingAndDate).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440003',
        validCommand.dateTime,
      );
      expect(mockCapacity.bookSlot).toHaveBeenCalled();
      expect(mockCapacityWriteRepository.save).toHaveBeenCalledWith(mockCapacity);
      expect(mockAppointmentRepository.save).toHaveBeenCalled();
      expect(mockUow.transaction).toHaveBeenCalled();
    });

    it('should throw CustomerNotFoundException when customer does not exist', async () => {
      // Arrange
      mockCustomerExistenceChecker.exists.mockResolvedValue(false);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(CustomerNotFoundException);
      expect(mockCustomerExistenceChecker.exists).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      expect(mockCapacityFactory.loadByOfferingAndDate).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NoAvailableSlotsException when capacity is null', async () => {
      // Arrange
      mockCustomerExistenceChecker.exists.mockResolvedValue(true);
      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(NoAvailableSlotsException);
      expect(mockCustomerExistenceChecker.exists).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      expect(mockCapacityFactory.loadByOfferingAndDate).toHaveBeenCalled();
      expect(mockAppointmentRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NoAvailableSlotsException when capacity has no available slots', async () => {
      // Arrange
      const mockCapacity = createMockCapacity(false);

      mockCustomerExistenceChecker.exists.mockResolvedValue(true);
      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(NoAvailableSlotsException);
      expect(mockCustomerExistenceChecker.exists).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      expect(mockCapacityFactory.loadByOfferingAndDate).toHaveBeenCalled();
      expect(mockCapacity.hasAvailableSlots).toHaveBeenCalled();
      expect(mockCapacity.bookSlot).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.save).not.toHaveBeenCalled();
    });

    it('should call bookSlot on capacity when creating appointment', async () => {
      // Arrange
      const mockCapacity = createMockCapacity(true);

      mockCustomerExistenceChecker.exists.mockResolvedValue(true);
      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(mockCapacity.bookSlot).toHaveBeenCalledTimes(1);
      expect(mockCapacityWriteRepository.save).toHaveBeenCalledWith(mockCapacity);
    });

    it('should execute within a transaction', async () => {
      // Arrange
      const mockCapacity = createMockCapacity(true);

      mockCustomerExistenceChecker.exists.mockResolvedValue(true);
      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(mockUow.transaction).toHaveBeenCalledTimes(1);
      expect(mockUow.transaction).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should log info when command starts', async () => {
      // Arrange
      const mockCapacity = createMockCapacity(true);

      mockCustomerExistenceChecker.exists.mockResolvedValue(true);
      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          commandName: 'CreateAppointmentCommand',
          businessId: '550e8400-e29b-41d4-a716-446655440001',
          customerId: '550e8400-e29b-41d4-a716-446655440002',
          offeringId: '550e8400-e29b-41d4-a716-446655440003',
        }),
        'Executing CreateAppointmentCommand',
      );
    });

    it('should log info when command succeeds', async () => {
      // Arrange
      const mockCapacity = createMockCapacity(true);

      mockCustomerExistenceChecker.exists.mockResolvedValue(true);
      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          commandName: 'CreateAppointmentCommand',
          appointmentId: expect.any(String),
          duration: expect.any(Number),
        }),
        'CreateAppointmentCommand executed successfully',
      );
    });

    it('should log error when command fails', async () => {
      // Arrange
      mockCustomerExistenceChecker.exists.mockResolvedValue(false);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          commandName: 'CreateAppointmentCommand',
          error: expect.objectContaining({
            message: expect.any(String),
          }),
        }),
        'CreateAppointmentCommand failed',
      );
    });

    it('should validate customer existence before checking capacity', async () => {
      // Arrange
      const callOrder: string[] = [];

      mockCustomerExistenceChecker.exists.mockImplementation(async () => {
        callOrder.push('customerExists');
        return true;
      });

      mockCapacityFactory.loadByOfferingAndDate.mockImplementation(async () => {
        callOrder.push('loadCapacity');
        return createMockCapacity(true);
      });

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(callOrder).toEqual(['customerExists', 'loadCapacity']);
    });
  });
});
