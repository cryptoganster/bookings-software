import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { CreateAppointmentHandler } from '../handler';
import { CreateAppointmentCommand } from '../command';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write';
import { ICapacityFactory } from '@availability/domain/interfaces/factories/capacity-factory';
import { ICapacityWriteRepository } from '@availability/domain/interfaces/repositories/capacity-write';
import { ICustomerExistenceChecker } from '@customer/domain/interfaces/services/customer-existence-checker.interface';
import { IUnitOfWork } from '@shared/kernel/uow';
import { uuidV4 } from '@test-utils/generators';
import { Capacity } from '@availability/domain/aggregates/capacity';

describe('CreateAppointmentHandler - Property Tests', () => {
  let handler: CreateAppointmentHandler;
  let appointmentRepository: jest.Mocked<IAppointmentWriteRepository>;
  let capacityFactory: jest.Mocked<ICapacityFactory>;
  let capacityWriteRepository: jest.Mocked<ICapacityWriteRepository>;
  let customerExistenceChecker: jest.Mocked<ICustomerExistenceChecker>;
  let uow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
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
      exists: jest.fn().mockResolvedValue(true), // Mock customer exists for all tests
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
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: 'IUnitOfWork',
          useValue: uow,
        },
      ],
    }).compile();

    handler = module.get<CreateAppointmentHandler>(CreateAppointmentHandler);
  });

  // Property 3: Capacity decrements atomically with appointment creation
  // Validates: Requirements 8.2
  it('should always decrement capacity atomically with appointment creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidV4(),
        uuidV4(),
        uuidV4(),
        fc.integer({ min: 1, max: 100 }),
        async (businessId, customerId, offeringId, initialSlots) => {
          // Arrange
          let capacitySlots = initialSlots;
          const mockCapacity = {
            hasAvailableSlots: jest.fn(() => capacitySlots > 0),
            bookSlot: jest.fn(() => {
              capacitySlots--;
            }),
          } as unknown as Capacity;

          capacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);
          customerExistenceChecker.exists.mockResolvedValue(true); // Mock customer exists
          appointmentRepository.save.mockResolvedValue();
          capacityWriteRepository.save.mockResolvedValue();

          // Use a future date
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);

          const command = new CreateAppointmentCommand(
            businessId,
            customerId,
            offeringId,
            futureDate,
          );

          // Act
          await handler.execute(command);

          // Assert - Both operations should have been called within the same transaction
          expect(uow.transaction).toHaveBeenCalled();
          expect(mockCapacity.bookSlot).toHaveBeenCalled();
          expect(capacityWriteRepository.save).toHaveBeenCalledWith(mockCapacity);
          expect(appointmentRepository.save).toHaveBeenCalled();

          // Verify capacity was decremented by exactly 1
          expect(capacitySlots).toBe(initialSlots - 1);
        },
      ),
      { numRuns: 100 },
    );
  });
});
