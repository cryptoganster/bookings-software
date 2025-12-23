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

describe('Schedule Repositories (Integration)', () => {
  let module: TestingModule;
  let writeRepo: ScheduleWriteRepository;
  let readRepo: ScheduleReadRepository;
  let repository: Repository<ScheduleModel>;
  let dataSource: DataSource;
  let uow: TypeOrmUnitOfWork;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        ScheduleWriteRepository,
        ScheduleReadRepository,
        TypeOrmUnitOfWork,
        {
          provide: getRepositoryToken(ScheduleModel),
          useFactory: (dataSource: DataSource) => dataSource.getRepository(ScheduleModel),
          inject: [DataSource],
        },
        {
          provide: DataSource,
          useFactory: async () => {
            const AppDataSource = new DataSource({
              type: 'postgres',
              host: process.env.DB_HOST || 'localhost',
              port: parseInt(process.env.DB_PORT || '5432'),
              username: process.env.DB_USERNAME || 'postgres',
              password: process.env.DB_PASSWORD || 'postgres',
              database: process.env.DB_DATABASE || 'bookings_test',
              entities: [ScheduleModel],
              synchronize: true,
              dropSchema: true,
            });
            return AppDataSource.initialize();
          },
        },
      ],
    }).compile();

    writeRepo = module.get<ScheduleWriteRepository>(ScheduleWriteRepository);
    readRepo = module.get<ScheduleReadRepository>(ScheduleReadRepository);
    repository = module.get<Repository<ScheduleModel>>(getRepositoryToken(ScheduleModel));
    dataSource = module.get<DataSource>(DataSource);
    uow = module.get<TypeOrmUnitOfWork>(TypeOrmUnitOfWork);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    await repository.clear();
  });

  describe('ScheduleWriteRepository', () => {
    describe('save', () => {
      it('should persist a new schedule aggregate', async () => {
        // Arrange
        const schedule = Schedule.create(
          UUID.generate(),
          UUID.generate(),
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
        expect(saved!.startTime).toBe('09:00');
        expect(saved!.endTime).toBe('17:00');
        expect(saved!.isActive).toBe(true);
      });

      it('should update an existing schedule aggregate', async () => {
        // Arrange - Create initial schedule
        const schedule = Schedule.create(
          UUID.generate(),
          UUID.generate(),
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
        expect(updated!.startTime).toBe('10:00');
        expect(updated!.endTime).toBe('18:00');
      });

      it('should handle deactivation correctly', async () => {
        // Arrange
        const schedule = Schedule.create(
          UUID.generate(),
          UUID.generate(),
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
          UUID.generate(),
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
          UUID.generate(),
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
          businessId: '550e8400-e29b-41d4-a716-446655440001',
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
        expect(readModel!.businessId).toBe('550e8400-e29b-41d4-a716-446655440001');
        expect(readModel!.dayOfWeek).toBe(1);
        expect(readModel!.startTime).toBe('09:00');
        expect(readModel!.endTime).toBe('17:00');
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
        const businessId = '550e8400-e29b-41d4-a716-446655440100';

        // Create schedules for Monday, Wednesday, Friday
        const schedules = [
          { id: '550e8400-e29b-41d4-a716-446655440010', dayOfWeek: 1 },
          { id: '550e8400-e29b-41d4-a716-446655440011', dayOfWeek: 3 },
          { id: '550e8400-e29b-41d4-a716-446655440012', dayOfWeek: 5 },
        ];

        for (const schedule of schedules) {
          const model = repository.create({
            ...schedule,
            businessId,
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await repository.save(model);
        }

        // Act
        const readModels = await readRepo.findByBusinessId(businessId);

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
        // Arrange
        const business1 = '550e8400-e29b-41d4-a716-446655440300';
        const business2 = '550e8400-e29b-41d4-a716-446655440301';

        // Create schedules for both businesses
        await repository.save([
          repository.create({
            id: '550e8400-e29b-41d4-a716-446655440020',
            businessId: business1,
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
          repository.create({
            id: '550e8400-e29b-41d4-a716-446655440021',
            businessId: business2,
            dayOfWeek: 1,
            startTime: '10:00',
            endTime: '18:00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ]);

        // Act
        const readModels = await readRepo.findByBusinessId(business1);

        // Assert
        expect(readModels).toHaveLength(1);
        expect(readModels[0].businessId).toBe(business1);
      });
    });

    describe('findByBusinessAndDay', () => {
      it('should return schedule for specific business and day', async () => {
        // Arrange
        const businessId = '550e8400-e29b-41d4-a716-446655440400';
        const scheduleModel = repository.create({
          id: '550e8400-e29b-41d4-a716-446655440030',
          businessId,
          dayOfWeek: 2, // Tuesday
          startTime: '10:00',
          endTime: '18:00',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await repository.save(scheduleModel);

        // Act
        const readModel = await readRepo.findByBusinessAndDay(businessId, 2);

        // Assert
        expect(readModel).toBeDefined();
        expect(readModel!.businessId).toBe(businessId);
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
        const businessId = '550e8400-e29b-41d4-a716-446655440600';

        // Create schedules for different days
        await repository.save([
          repository.create({
            id: '550e8400-e29b-41d4-a716-446655440040',
            businessId,
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
          repository.create({
            id: '550e8400-e29b-41d4-a716-446655440041',
            businessId,
            dayOfWeek: 3,
            startTime: '10:00',
            endTime: '18:00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ]);

        // Act
        const mondaySchedule = await readRepo.findByBusinessAndDay(businessId, 1);
        const wednesdaySchedule = await readRepo.findByBusinessAndDay(businessId, 3);

        // Assert
        expect(mondaySchedule).toBeDefined();
        expect(mondaySchedule!.startTime).toBe('09:00');

        expect(wednesdaySchedule).toBeDefined();
        expect(wednesdaySchedule!.startTime).toBe('10:00');
      });
    });
  });
});
