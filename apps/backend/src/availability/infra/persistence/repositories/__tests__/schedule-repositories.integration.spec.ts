import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { ScheduleWriteRepository } from '../schedule-write';
import { ScheduleReadRepository } from '../schedule-read';
import { ScheduleModel } from '../../models/schedule';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Schedule } from '@availability/domain/aggregates/schedule';
import { UUID } from '@shared/vo/uuid';
import { DayOfWeek } from '@availability/domain/vo/day-of-week.vo';
import { TimeSlot } from '@availability/domain/vo/time-slot.vo';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { setupTestDatabase, cleanDatabase } from '@test-utils/helpers/database';
import { createTestBusiness } from '@test-utils/helpers/business';
import { ensureMigrationsRun } from '../../../../../../test/test-setup';

describe('Schedule Repositories (Integration)', () => {
  let module: TestingModule;
  let writeRepo: ScheduleWriteRepository;
  let readRepo: ScheduleReadRepository;
  let repository: Repository<ScheduleModel>;
  let dataSource: DataSource;
  let uow: TypeOrmUnitOfWork;

  beforeAll(async () => {
    await ensureMigrationsRun();

    // Use integration test helper to create DataSource with ALL entities
    dataSource = await setupTestDatabase();

    module = await Test.createTestingModule({
      providers: [
        ScheduleWriteRepository,
        ScheduleReadRepository,
        TypeOrmUnitOfWork,
        {
          provide: getRepositoryToken(ScheduleModel),
          useFactory: () => dataSource.getRepository(ScheduleModel),
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    writeRepo = module.get<ScheduleWriteRepository>(ScheduleWriteRepository);
    readRepo = module.get<ScheduleReadRepository>(ScheduleReadRepository);
    repository = module.get<Repository<ScheduleModel>>(getRepositoryToken(ScheduleModel));
    uow = module.get<TypeOrmUnitOfWork>(TypeOrmUnitOfWork);
  });

  afterAll(async () => {
    // Don't destroy shared DataSource - it's reused across tests
    await module.close();
  });

  let testBusinessId: string;

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    // Create test business for foreign key constraint
    testBusinessId = await createTestBusiness(dataSource);
  });

  describe('ScheduleWriteRepository', () => {
    describe('save', () => {
      it('should persist a new schedule aggregate', async () => {
        // Arrange
        const schedule = Schedule.create(
          UUID.generate(),
          UUID.fromString(testBusinessId),
          DayOfWeek.create(1), // Monday
          TimeSlot.create('09:00', '17:00'),
        );

        // Act
        await writeRepo.save(schedule);

        // Assert
        const saved = await repository.findOne({
          where: { id: schedule.getId().getValue() },
        });
        expect(saved).toBeDefined();
        expect(saved!.businessId).toBe(schedule.getBusinessId().getValue());
        expect(saved!.dayOfWeek).toBe(1);
        expect(saved!.startTime).toBe('09:00:00'); // PostgreSQL returns HH:mm:ss
        expect(saved!.endTime).toBe('17:00:00'); // PostgreSQL returns HH:mm:ss
        expect(saved!.isActive).toBe(true);
      });

      it('should update an existing schedule aggregate', async () => {
        // Arrange - Create initial schedule
        const schedule = Schedule.create(
          UUID.generate(),
          UUID.fromString(testBusinessId),
          DayOfWeek.create(2), // Tuesday
          TimeSlot.create('08:00', '16:00'),
        );
        await writeRepo.save(schedule);

        // Act - Update schedule
        schedule.update(TimeSlot.create('10:00', '18:00'));
        await writeRepo.save(schedule);

        // Assert
        const updated = await repository.findOne({
          where: { id: schedule.getId().getValue() },
        });
        expect(updated).toBeDefined();
        expect(updated!.startTime).toBe('10:00:00'); // PostgreSQL returns HH:mm:ss
        expect(updated!.endTime).toBe('18:00:00'); // PostgreSQL returns HH:mm:ss
      });

      it('should handle deactivation correctly', async () => {
        // Arrange
        const schedule = Schedule.create(
          UUID.generate(),
          UUID.fromString(testBusinessId),
          DayOfWeek.create(3), // Wednesday
          TimeSlot.create('09:00', '17:00'),
        );
        await writeRepo.save(schedule);

        // Act - Deactivate
        schedule.deactivate();
        await writeRepo.save(schedule);

        // Assert
        const deactivated = await repository.findOne({
          where: { id: schedule.getId().getValue() },
        });
        expect(deactivated).toBeDefined();
        expect(deactivated!.isActive).toBe(false);
      });

      it('should handle activation correctly', async () => {
        // Arrange - Create and deactivate
        const schedule = Schedule.create(
          UUID.generate(),
          UUID.fromString(testBusinessId),
          DayOfWeek.create(4), // Thursday
          TimeSlot.create('09:00', '17:00'),
        );
        schedule.deactivate();
        await writeRepo.save(schedule);

        // Act - Activate
        schedule.activate();
        await writeRepo.save(schedule);

        // Assert
        const activated = await repository.findOne({
          where: { id: schedule.getId().getValue() },
        });
        expect(activated).toBeDefined();
        expect(activated!.isActive).toBe(true);
      });

      it('should work within a transaction', async () => {
        // Arrange
        const schedule = Schedule.create(
          UUID.generate(),
          UUID.fromString(testBusinessId),
          DayOfWeek.create(5), // Friday
          TimeSlot.create('09:00', '17:00'),
        );

        // Act
        await uow.transaction(async () => {
          await writeRepo.save(schedule);
        });

        // Assert
        const saved = await repository.findOne({
          where: { id: schedule.getId().getValue() },
        });
        expect(saved).toBeDefined();
      });
    });
  });

  describe('ScheduleReadRepository', () => {
    describe('findById', () => {
      it('should return read model for existing schedule', async () => {
        // Arrange
        const scheduleModel = repository.create({
          id: '550e8400-e29b-41d4-a716-446655440000',
          businessId: testBusinessId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await repository.save(scheduleModel);

        // Act
        const readModel = await readRepo.findById('550e8400-e29b-41d4-a716-446655440000');

        // Assert
        expect(readModel).toBeDefined();
        expect(readModel!.id).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(readModel!.businessId).toBe(testBusinessId);
        expect(readModel!.dayOfWeek).toBe(1);
        expect(readModel!.startTime).toBe('09:00:00'); // PostgreSQL returns HH:mm:ss
        expect(readModel!.endTime).toBe('17:00:00'); // PostgreSQL returns HH:mm:ss
        expect(readModel!.isActive).toBe(true);
      });

      it('should return null for non-existent id', async () => {
        // Act
        const readModel = await readRepo.findById('11111111-1111-1111-1111-111111111111');

        // Assert
        expect(readModel).toBeNull();
      });
    });

    describe('findByBusinessId', () => {
      it('should return all schedules for a business', async () => {
        // Arrange
        // Create schedules for Monday, Wednesday, Friday
        const schedules = [
          { id: '550e8400-e29b-41d4-a716-446655440010', dayOfWeek: 1 },
          { id: '550e8400-e29b-41d4-a716-446655440011', dayOfWeek: 3 },
          { id: '550e8400-e29b-41d4-a716-446655440012', dayOfWeek: 5 },
        ];

        for (const schedule of schedules) {
          const model = repository.create({
            ...schedule,
            businessId: testBusinessId,
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await repository.save(model);
        }

        // Act
        const readModels = await readRepo.findByBusinessId(testBusinessId);

        // Assert
        expect(readModels).toHaveLength(3);
        expect(readModels.map((rm) => rm.dayOfWeek).sort()).toEqual([1, 3, 5]);
      });

      it('should return empty array when no schedules exist', async () => {
        // Act
        const readModels = await readRepo.findByBusinessId('550e8400-e29b-41d4-a716-446655440200');

        // Assert
        expect(readModels).toEqual([]);
      });

      it('should only return schedules for specified business', async () => {
        // Arrange - Create another test business
        const business2Id = await createTestBusiness(dataSource);

        // Create schedules for both businesses
        await repository.save([
          repository.create({
            id: '550e8400-e29b-41d4-a716-446655440020',
            businessId: testBusinessId,
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
          repository.create({
            id: '550e8400-e29b-41d4-a716-446655440021',
            businessId: business2Id,
            dayOfWeek: 1,
            startTime: '10:00',
            endTime: '18:00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ]);

        // Act
        const readModels = await readRepo.findByBusinessId(testBusinessId);

        // Assert
        expect(readModels).toHaveLength(1);
        expect(readModels[0].businessId).toBe(testBusinessId);
      });
    });

    describe('findByBusinessAndDay', () => {
      it('should return schedule for specific business and day', async () => {
        // Arrange
        const scheduleModel = repository.create({
          id: '550e8400-e29b-41d4-a716-446655440030',
          businessId: testBusinessId,
          dayOfWeek: 2, // Tuesday
          startTime: '10:00',
          endTime: '18:00',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await repository.save(scheduleModel);

        // Act
        const readModel = await readRepo.findByBusinessAndDay(testBusinessId, 2);

        // Assert
        expect(readModel).toBeDefined();
        expect(readModel!.businessId).toBe(testBusinessId);
        expect(readModel!.dayOfWeek).toBe(2);
      });

      it('should return null when no schedule exists for business and day', async () => {
        // Act
        const readModel = await readRepo.findByBusinessAndDay(
          '550e8400-e29b-41d4-a716-446655440500',
          3,
        );

        // Assert
        expect(readModel).toBeNull();
      });

      it('should return correct schedule when multiple days exist for same business', async () => {
        // Arrange
        // Create schedules for different days
        await repository.save([
          repository.create({
            id: '550e8400-e29b-41d4-a716-446655440040',
            businessId: testBusinessId,
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
          repository.create({
            id: '550e8400-e29b-41d4-a716-446655440041',
            businessId: testBusinessId,
            dayOfWeek: 3,
            startTime: '10:00',
            endTime: '18:00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ]);

        // Act
        const mondaySchedule = await readRepo.findByBusinessAndDay(testBusinessId, 1);
        const wednesdaySchedule = await readRepo.findByBusinessAndDay(testBusinessId, 3);

        // Assert
        expect(mondaySchedule).toBeDefined();
        expect(mondaySchedule!.startTime).toBe('09:00:00'); // PostgreSQL returns HH:mm:ss

        expect(wednesdaySchedule).toBeDefined();
        expect(wednesdaySchedule!.startTime).toBe('10:00:00'); // PostgreSQL returns HH:mm:ss
      });
    });
  });
});
