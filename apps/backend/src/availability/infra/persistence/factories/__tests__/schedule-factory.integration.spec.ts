import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { ScheduleFactory } from '../schedule-factory';
import { ScheduleModel } from '../../models/schedule';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('ScheduleFactory (Integration)', () => {
  let module: TestingModule;
  let factory: ScheduleFactory;
  let repository: Repository<ScheduleModel>;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        ScheduleFactory,
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
              database: process.env.DB_DATABASE || 'postgres_test',
              entities: [ScheduleModel],
              synchronize: false,
              dropSchema: true,
            });
            return AppDataSource.initialize();
          },
        },
      ],
    }).compile();

    factory = module.get<ScheduleFactory>(ScheduleFactory);
    repository = module.get<Repository<ScheduleModel>>(getRepositoryToken(ScheduleModel));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    await repository.clear();
  });

  describe('loadById', () => {
    it('should return aggregate with business logic', async () => {
      // Arrange
      const scheduleModel = repository.create({
        id: '550e8400-e29b-41d4-a716-446655440000',
        businessId: '550e8400-e29b-41d4-a716-446655440001',
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      });
      await repository.save(scheduleModel);

      // Act
      const aggregate = await factory.loadById('550e8400-e29b-41d4-a716-446655440000');

      // Assert
      expect(aggregate).toBeDefined();
      expect(aggregate).not.toBeNull();
      expect(aggregate!.getId().getValue()).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(aggregate!.getBusinessId().getValue()).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(aggregate!.getDayOfWeek().getValue()).toBe(1);
      expect(aggregate!.getTimeSlot().getStartTime()).toBe('09:00');
      expect(aggregate!.getTimeSlot().getEndTime()).toBe('17:00');
      expect(aggregate!.getIsActive()).toBe(true);
    });

    it('should return null for non-existent id', async () => {
      // Act
      const aggregate = await factory.loadById('11111111-1111-1111-1111-111111111111');

      // Assert
      expect(aggregate).toBeNull();
    });

    it('should load aggregate that can execute domain methods', async () => {
      // Arrange
      const scheduleModel = repository.create({
        id: '550e8400-e29b-41d4-a716-446655440002',
        businessId: '550e8400-e29b-41d4-a716-446655440003',
        dayOfWeek: 2, // Tuesday
        startTime: '08:00',
        endTime: '16:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(scheduleModel);

      // Act
      const aggregate = await factory.loadById('550e8400-e29b-41d4-a716-446655440002');

      // Assert - Verify aggregate has business logic methods
      expect(aggregate).toBeDefined();
      expect(typeof aggregate!.update).toBe('function');
      expect(typeof aggregate!.deactivate).toBe('function');
      expect(typeof aggregate!.activate).toBe('function');
    });

    it('should handle all days of week correctly', async () => {
      // Arrange - Create schedules for all days
      const testData = [
        {
          day: 0,
          id: '550e8400-e29b-41d4-a716-446655440010',
          businessId: '550e8400-e29b-41d4-a716-446655440100',
        }, // Sunday
        {
          day: 1,
          id: '550e8400-e29b-41d4-a716-446655440011',
          businessId: '550e8400-e29b-41d4-a716-446655440101',
        }, // Monday
        {
          day: 2,
          id: '550e8400-e29b-41d4-a716-446655440012',
          businessId: '550e8400-e29b-41d4-a716-446655440102',
        }, // Tuesday
        {
          day: 3,
          id: '550e8400-e29b-41d4-a716-446655440013',
          businessId: '550e8400-e29b-41d4-a716-446655440103',
        }, // Wednesday
        {
          day: 4,
          id: '550e8400-e29b-41d4-a716-446655440014',
          businessId: '550e8400-e29b-41d4-a716-446655440104',
        }, // Thursday
        {
          day: 5,
          id: '550e8400-e29b-41d4-a716-446655440015',
          businessId: '550e8400-e29b-41d4-a716-446655440105',
        }, // Friday
        {
          day: 6,
          id: '550e8400-e29b-41d4-a716-446655440016',
          businessId: '550e8400-e29b-41d4-a716-446655440106',
        }, // Saturday
      ];

      for (const { day, id, businessId } of testData) {
        const model = repository.create({
          id,
          businessId,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await repository.save(model);
      }

      // Act & Assert
      for (const { day, id } of testData) {
        const aggregate = await factory.loadById(id);
        expect(aggregate).toBeDefined();
        expect(aggregate!.getDayOfWeek().getValue()).toBe(day);
      }
    });

    it('should handle both active and inactive schedules', async () => {
      // Arrange
      const activeSchedule = repository.create({
        id: '550e8400-e29b-41d4-a716-446655440020',
        businessId: '550e8400-e29b-41d4-a716-446655440200',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const inactiveSchedule = repository.create({
        id: '550e8400-e29b-41d4-a716-446655440021',
        businessId: '550e8400-e29b-41d4-a716-446655440201',
        dayOfWeek: 2,
        startTime: '10:00',
        endTime: '18:00',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.save([activeSchedule, inactiveSchedule]);

      // Act
      const activeAggregate = await factory.loadById('550e8400-e29b-41d4-a716-446655440020');
      const inactiveAggregate = await factory.loadById('550e8400-e29b-41d4-a716-446655440021');

      // Assert
      expect(activeAggregate).toBeDefined();
      expect(activeAggregate!.getIsActive()).toBe(true);
      expect(inactiveAggregate).toBeDefined();
      expect(inactiveAggregate!.getIsActive()).toBe(false);
    });

    it('should handle different time ranges correctly', async () => {
      // Arrange
      const testData = [
        {
          id: '550e8400-e29b-41d4-a716-446655440030',
          businessId: '550e8400-e29b-41d4-a716-446655440300',
          start: '06:00',
          end: '14:00',
        }, // Early shift
        {
          id: '550e8400-e29b-41d4-a716-446655440031',
          businessId: '550e8400-e29b-41d4-a716-446655440301',
          start: '09:00',
          end: '17:00',
        }, // Standard shift
        {
          id: '550e8400-e29b-41d4-a716-446655440032',
          businessId: '550e8400-e29b-41d4-a716-446655440302',
          start: '14:00',
          end: '22:00',
        }, // Late shift
        {
          id: '550e8400-e29b-41d4-a716-446655440033',
          businessId: '550e8400-e29b-41d4-a716-446655440303',
          start: '00:00',
          end: '23:59',
        }, // All day
      ];

      for (const { id, businessId, start, end } of testData) {
        const model = repository.create({
          id,
          businessId,
          dayOfWeek: 1,
          startTime: start,
          endTime: end,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await repository.save(model);
      }

      // Act & Assert
      for (const { id, start, end } of testData) {
        const aggregate = await factory.loadById(id);
        expect(aggregate).toBeDefined();
        expect(aggregate!.getTimeSlot().getStartTime()).toBe(start);
        expect(aggregate!.getTimeSlot().getEndTime()).toBe(end);
      }
    });
  });

  describe('loadByBusinessAndDay', () => {
    it('should return aggregate for specific business and day', async () => {
      // Arrange
      const businessId = '550e8400-e29b-41d4-a716-446655440400';
      const scheduleModel = repository.create({
        id: '550e8400-e29b-41d4-a716-446655440040',
        businessId,
        dayOfWeek: 3, // Wednesday
        startTime: '10:00',
        endTime: '18:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(scheduleModel);

      // Act
      const aggregate = await factory.loadByBusinessAndDay(businessId, 3);

      // Assert
      expect(aggregate).toBeDefined();
      expect(aggregate).not.toBeNull();
      expect(aggregate!.getBusinessId().getValue()).toBe(businessId);
      expect(aggregate!.getDayOfWeek().getValue()).toBe(3);
    });

    it('should return null when no schedule exists for business and day', async () => {
      // Act
      const aggregate = await factory.loadByBusinessAndDay(
        '550e8400-e29b-41d4-a716-446655440500',
        5,
      );

      // Assert
      expect(aggregate).toBeNull();
    });

    it('should return correct schedule when multiple schedules exist for same business', async () => {
      // Arrange
      const businessId = '550e8400-e29b-41d4-a716-446655440600';

      // Create schedules for Monday, Wednesday, Friday
      const schedules = [
        {
          id: '550e8400-e29b-41d4-a716-446655440050',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440051',
          dayOfWeek: 3,
          startTime: '10:00',
          endTime: '18:00',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440052',
          dayOfWeek: 5,
          startTime: '08:00',
          endTime: '16:00',
        },
      ];

      for (const schedule of schedules) {
        const model = repository.create({
          ...schedule,
          businessId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await repository.save(model);
      }

      // Act
      const mondaySchedule = await factory.loadByBusinessAndDay(businessId, 1);
      const wednesdaySchedule = await factory.loadByBusinessAndDay(businessId, 3);
      const fridaySchedule = await factory.loadByBusinessAndDay(businessId, 5);

      // Assert
      expect(mondaySchedule).toBeDefined();
      expect(mondaySchedule!.getTimeSlot().getStartTime()).toBe('09:00');

      expect(wednesdaySchedule).toBeDefined();
      expect(wednesdaySchedule!.getTimeSlot().getStartTime()).toBe('10:00');

      expect(fridaySchedule).toBeDefined();
      expect(fridaySchedule!.getTimeSlot().getStartTime()).toBe('08:00');
    });

    it('should load aggregate that can execute domain methods', async () => {
      // Arrange
      const businessId = '550e8400-e29b-41d4-a716-446655440700';
      const scheduleModel = repository.create({
        id: '550e8400-e29b-41d4-a716-446655440060',
        businessId,
        dayOfWeek: 4, // Thursday
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(scheduleModel);

      // Act
      const aggregate = await factory.loadByBusinessAndDay(businessId, 4);

      // Assert - Verify aggregate has business logic methods
      expect(aggregate).toBeDefined();
      expect(typeof aggregate!.update).toBe('function');
      expect(typeof aggregate!.deactivate).toBe('function');
      expect(typeof aggregate!.activate).toBe('function');
    });
  });
});
