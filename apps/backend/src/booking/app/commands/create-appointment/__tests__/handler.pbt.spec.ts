import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { CreateAppointmentHandler } from '../handler';
import { CreateAppointmentCommand } from '../command';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write';
import { IUnitOfWork } from '@shared/kernel/uow';

describe('CreateAppointmentHandler - Property Tests', () => {
  let handler: CreateAppointmentHandler;
  let appointmentRepository: jest.Mocked<IAppointmentWriteRepository>;
  let capacityFactory: any;
  let capacityWriteRepository: any;
  let uow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
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
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 1, max: 100 }),
        async (businessId, customerId, offeringId, initialSlots) => {
          // Arrange
          let capacitySlots = initialSlots;
          const mockCapacity = {
            hasAvailableSlots: jest.fn(() => capacitySlots > 0),
            bookSlot: jest.fn(() => {
              capacitySlots--;
            }),
          };

          capacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);
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
