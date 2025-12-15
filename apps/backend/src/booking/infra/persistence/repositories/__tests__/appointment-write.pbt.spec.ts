import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentWriteRepository } from '../appointment-write';
import { AppointmentModel } from '../../models/appointment';
import { Appointment } from '@booking/domain/aggregates/appointment';
import { UUID } from '@shared/vo/uuid';
import { DateTime } from '@booking/domain/vo/date-time';
import { AppointmentStatus } from '@booking/domain/vo/appointment-status';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';
import { IUnitOfWork } from '@shared/kernel/uow';
import { uuidV4 } from '@test-utils/generators';

describe('AppointmentWriteRepository - Property Tests', () => {
  let repository: AppointmentWriteRepository;
  let typeormRepository: jest.Mocked<Repository<AppointmentModel>>;
  let uow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    typeormRepository = {
      findOne: jest.fn(),
      insert: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    uow = {
      transaction: jest.fn((work) => work()),
      getQueryRunner: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentWriteRepository,
        {
          provide: getRepositoryToken(AppointmentModel),
          useValue: typeormRepository,
        },
        {
          provide: 'IUnitOfWork',
          useValue: uow,
        },
      ],
    }).compile();

    repository = module.get<AppointmentWriteRepository>(AppointmentWriteRepository);
  });

  // Property 2: Optimistic locking prevents concurrent modifications
  // Validates: Requirements 3.5, 8.3
  it('should prevent concurrent modifications with same initial version', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidV4(),
        uuidV4(),
        uuidV4(),
        uuidV4(),
        fc.integer({ min: 0, max: 10 }),
        async (id, businessId, customerId, offeringId, initialVersion) => {
          // Arrange - Create two appointments with the same ID and version
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);

          const appointment1 = Appointment.fromPersistence(
            UUID.fromString(id),
            UUID.fromString(businessId),
            UUID.fromString(customerId),
            UUID.fromString(offeringId),
            DateTime.fromDate(futureDate),
            AppointmentStatus.confirmed(),
            initialVersion,
          );

          const appointment2 = Appointment.fromPersistence(
            UUID.fromString(id),
            UUID.fromString(businessId),
            UUID.fromString(customerId),
            UUID.fromString(offeringId),
            DateTime.fromDate(futureDate),
            AppointmentStatus.confirmed(),
            initialVersion,
          );

          // Modify both appointments (this increments their versions)
          const newDate = new Date();
          newDate.setDate(newDate.getDate() + 14);
          appointment1.modify(DateTime.fromDate(newDate));
          appointment2.modify(DateTime.fromDate(newDate));

          // Mock findOne to return existing appointment (simulating it already exists)
          typeormRepository.findOne.mockResolvedValue({
            id,
            businessId,
            customerId,
            offeringId,
            dateTime: futureDate,
            status: 'CONFIRMED',
            version: initialVersion,
            createdAt: new Date(),
            updatedAt: new Date(),
            cancelledAt: null,
          } as AppointmentModel);

          // Mock the query builder for the first save (succeeds)
          const mockQueryBuilder1 = {
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 1 }),
          };

          // Mock the query builder for the second save (fails - no rows affected)
          const mockQueryBuilder2 = {
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 0 }),
          };

          typeormRepository.createQueryBuilder
            .mockReturnValueOnce(mockQueryBuilder1 as any)
            .mockReturnValueOnce(mockQueryBuilder2 as any);

          // Act - First save should succeed
          await repository.save(appointment1);

          // Second save should throw ConcurrencyException
          let exceptionThrown = false;
          try {
            await repository.save(appointment2);
          } catch (error) {
            if (error instanceof ConcurrencyException) {
              exceptionThrown = true;
            }
          }

          // Assert - Exactly one save should succeed, the other should fail
          expect(exceptionThrown).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
