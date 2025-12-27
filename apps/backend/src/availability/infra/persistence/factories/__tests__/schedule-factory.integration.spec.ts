import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { ScheduleFactory } from '../schedule-factory';
import { ScheduleModel } from '../../models/schedule';
import { getRepositoryToken } from '@nestjs/typeorm';
import { setupTestDatabase, cleanDatabase, generateTestId } from '@test-utils/helpers/database';
import { createTestBusiness } from '@test-utils/helpers/business';

describe('ScheduleFactory (Integration)', () => {
  let module: TestingModule;
  let factory: ScheduleFactory;
  let repository: Repository<ScheduleModel>;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Create shared DataSource with ALL entities
    dataSource = await setupTestDatabase();

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
          useValue: dataSource,
        },
      ],
    }).compile();

    factory = module.get<ScheduleFactory>(ScheduleFactory);
    repository = module.get<Repository<ScheduleModel>>(getRepositoryToken(ScheduleModel));
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

  describe('loadById', () => {
    it('should return aggregate with business logic', async () => {
      // Arrange
      const id = generateTestId();
      const scheduleModel = repository.create({
        id,
        businessId: testBusinessId,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      });
      await repository.save(scheduleModel);

      // Act
      const aggregate = await factory.loadById(id);

      // Assert
      expect(aggregate).toBeDefined();
      expect(aggregate).not.toBeNull();
      expect(aggregate!.getId().getValue()).toBe(id);
      expect(aggregate!.getBusinessId().getValue()).toBe(testBusinessId);
      expect(aggregate!.getDayOfWeek().getValue()).toBe(1);
      expect(aggregate!.getTimeSlot().getStartTime()).toBe('09:00');
      expect(aggregate!.getTimeSlot().getEndTime()).toBe('17:00');
      expect(aggregate!.getIsActive()).toBe(true);
    });

    it('should return null for non-existent id', async () => {
      // Act
      const aggregate = await factory.loadById(generateTestId());

      // Assert
      expect(aggregate).toBeNull();
    });

    it('should load aggregate that can execute domain methods', async () => {
      // Arrange
      const id = generateTestId();
      const scheduleModel = repository.create({
        id,
        businessId: testBusinessId,
        dayOfWeek: 2, // Tuesday
        startTime: '08:00',
        endTime: '16:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(scheduleModel);

      // Act
      const aggregate = await factory.loadById(id);

      // Assert - Verify aggregate has business logic methods
      expect(aggregate).toBeDefined();
      expect(typeof aggregate!.update).toBe('function');
      expect(typeof aggregate!.deactivate).toBe('function');
      expect(typeof aggregate!.activate).toBe('function');
    });

    it('should handle all days of week correctly', async () => {
      // Arrange - Create schedules for all days
      const testData = [
        { day: 0, id: generateTestId() }, // Sunday
        { day: 1, id: generateTestId() }, // Monday
        { day: 2, id: generateTestId() }, // Tuesday
        { day: 3, id: generateTestId() }, // Wednesday
        { day: 4, id: generateTestId() }, // Thursday
        { day: 5, id: generateTestId() }, // Friday
        { day: 6, id: generateTestId() }, // Saturday
      ];

      for (const { day, id } of testData) {
        const model = repository.create({
          id,
          businessId: testBusinessId,
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
      const activeId = generateTestId();
      const inactiveId = generateTestId();

      const activeSchedule = repository.create({
        id: activeId,
        businessId: testBusinessId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const inactiveSchedule = repository.create({
        id: inactiveId,
        businessId: testBusinessId,
        dayOfWeek: 2,
        startTime: '10:00',
        endTime: '18:00',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.save([activeSchedule, inactiveSchedule]);

      // Act
      const activeAggregate = await factory.loadById(activeId);
      const inactiveAggregate = await factory.loadById(inactiveId);

      // Assert
      expect(activeAggregate).toBeDefined();
      expect(activeAggregate!.getIsActive()).toBe(true);
      expect(inactiveAggregate).toBeDefined();
      expect(inactiveAggregate!.getIsActive()).toBe(false);
    });

    it('should handle different time ranges correctly', async () => {
      // Arrange
      const testData = [
        { id: generateTestId(), day: 1, start: '06:00', end: '14:00' }, // Early shift - Monday
        { id: generateTestId(), day: 2, start: '09:00', end: '17:00' }, // Standard shift - Tuesday
        { id: generateTestId(), day: 3, start: '14:00', end: '22:00' }, // Late shift - Wednesday
        { id: generateTestId(), day: 4, start: '00:00', end: '23:59' }, // All day - Thursday
      ];

      for (const { id, day, start, end } of testData) {
        const model = repository.create({
          id,
          businessId: testBusinessId,
          dayOfWeek: day,
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
      const scheduleModel = repository.create({
        id: generateTestId(),
        businessId: testBusinessId,
        dayOfWeek: 3, // Wednesday
        startTime: '10:00',
        endTime: '18:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(scheduleModel);

      // Act
      const aggregate = await factory.loadByBusinessAndDay(testBusinessId, 3);

      // Assert
      expect(aggregate).toBeDefined();
      expect(aggregate).not.toBeNull();
      expect(aggregate!.getBusinessId().getValue()).toBe(testBusinessId);
      expect(aggregate!.getDayOfWeek().getValue()).toBe(3);
    });

    it('should return null when no schedule exists for business and day', async () => {
      // Act
      const aggregate = await factory.loadByBusinessAndDay(generateTestId(), 5);

      // Assert
      expect(aggregate).toBeNull();
    });

    it('should return correct schedule when multiple schedules exist for same business', async () => {
      // Arrange
      // Create schedules for Monday, Wednesday, Friday
      const schedules = [
        {
          id: generateTestId(),
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        },
        {
          id: generateTestId(),
          dayOfWeek: 3,
          startTime: '10:00',
          endTime: '18:00',
        },
        {
          id: generateTestId(),
          dayOfWeek: 5,
          startTime: '08:00',
          endTime: '16:00',
        },
      ];

      for (const schedule of schedules) {
        const model = repository.create({
          ...schedule,
          businessId: testBusinessId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await repository.save(model);
      }

      // Act
      const mondaySchedule = await factory.loadByBusinessAndDay(testBusinessId, 1);
      const wednesdaySchedule = await factory.loadByBusinessAndDay(testBusinessId, 3);
      const fridaySchedule = await factory.loadByBusinessAndDay(testBusinessId, 5);

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
      const scheduleModel = repository.create({
        id: generateTestId(),
        businessId: testBusinessId,
        dayOfWeek: 4, // Thursday
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repository.save(scheduleModel);

      // Act
      const aggregate = await factory.loadByBusinessAndDay(testBusinessId, 4);

      // Assert - Verify aggregate has business logic methods
      expect(aggregate).toBeDefined();
      expect(typeof aggregate!.update).toBe('function');
      expect(typeof aggregate!.deactivate).toBe('function');
      expect(typeof aggregate!.activate).toBe('function');
    });
  });
});
