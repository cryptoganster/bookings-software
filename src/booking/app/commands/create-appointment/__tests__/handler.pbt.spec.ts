import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateAppointmentHandler } from '../handler';
import { CreateAppointmentCommand } from '../command';
import { IAppointmentWriteRepository } from '../../../../domain/interfaces/repositories/appointment-write';
import { IUnitOfWork } from '../../../../../shared/kernel/uow';

describe('CreateAppointmentHandler - Property Tests', () => {
  let handler: CreateAppointmentHandler;
  let appointmentRepository: jest.Mocked<IAppointmentWriteRepository>;
  let capacityRepository: any;
  let uow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
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
            decrementSlot: jest.fn(() => {
              capacitySlots--;
            }),
          };

          capacityRepository.findByOfferingAndDate.mockResolvedValue(mockCapacity);
          appointmentRepository.save.mockResolvedValue();
          capacityRepository.save.mockResolvedValue();

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
          expect(mockCapacity.decrementSlot).toHaveBeenCalled();
          expect(capacityRepository.save).toHaveBeenCalledWith(mockCapacity);
          expect(appointmentRepository.save).toHaveBeenCalled();

          // Verify capacity was decremented by exactly 1
          expect(capacitySlots).toBe(initialSlots - 1);
        },
      ),
      { numRuns: 100 },
    );
  });
});
