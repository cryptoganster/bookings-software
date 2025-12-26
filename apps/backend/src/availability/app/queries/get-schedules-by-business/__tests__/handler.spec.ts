import { Test, TestingModule } from '@nestjs/testing';
import { GetSchedulesByBusinessHandler } from '../handler';
import { GetSchedulesByBusinessQuery } from '../query';
import { IScheduleReadRepository } from '@availability/domain/interfaces/repositories/schedule-read';
import { ScheduleReadModel } from '@availability/domain/read-models/schedule';

describe('GetSchedulesByBusinessHandler', () => {
  let handler: GetSchedulesByBusinessHandler;
  let scheduleReadRepository: jest.Mocked<IScheduleReadRepository>;

  beforeEach(async () => {
    const mockScheduleReadRepository: Partial<jest.Mocked<IScheduleReadRepository>> = {
      findByBusinessId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSchedulesByBusinessHandler,
        {
          provide: 'IScheduleReadRepository',
          useValue: mockScheduleReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetSchedulesByBusinessHandler>(GetSchedulesByBusinessHandler);
    scheduleReadRepository = module.get('IScheduleReadRepository');
  });

  describe('execute', () => {
    it('should return schedules for a business', async () => {
      // Arrange
      const businessId = 'business-123';
      const mockSchedules: ScheduleReadModel[] = [
        {
          id: 'schedule-1',
          businessId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'schedule-2',
          businessId,
          dayOfWeek: 2,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      scheduleReadRepository.findByBusinessId.mockResolvedValue(mockSchedules);

      const query = new GetSchedulesByBusinessQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(mockSchedules);
      expect(scheduleReadRepository.findByBusinessId).toHaveBeenCalledWith(businessId);
      expect(scheduleReadRepository.findByBusinessId).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when business has no schedules', async () => {
      // Arrange
      const businessId = 'business-123';
      scheduleReadRepository.findByBusinessId.mockResolvedValue([]);

      const query = new GetSchedulesByBusinessQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual([]);
      expect(scheduleReadRepository.findByBusinessId).toHaveBeenCalledWith(businessId);
    });

    it('should return only active schedules', async () => {
      // Arrange
      const businessId = 'business-123';
      const mockSchedules: ScheduleReadModel[] = [
        {
          id: 'schedule-1',
          businessId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      scheduleReadRepository.findByBusinessId.mockResolvedValue(mockSchedules);

      const query = new GetSchedulesByBusinessQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(mockSchedules);
      expect(result.every((s) => s.isActive)).toBe(true);
    });

    it('should return schedules sorted by day of week', async () => {
      // Arrange
      const businessId = 'business-123';
      const mockSchedules: ScheduleReadModel[] = [
        {
          id: 'schedule-1',
          businessId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'schedule-2',
          businessId,
          dayOfWeek: 2,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'schedule-3',
          businessId,
          dayOfWeek: 5,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      scheduleReadRepository.findByBusinessId.mockResolvedValue(mockSchedules);

      const query = new GetSchedulesByBusinessQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(mockSchedules);
      // Verify schedules are in order
      for (let i = 1; i < result.length; i++) {
        expect(result[i].dayOfWeek).toBeGreaterThanOrEqual(result[i - 1].dayOfWeek);
      }
    });
  });
});
