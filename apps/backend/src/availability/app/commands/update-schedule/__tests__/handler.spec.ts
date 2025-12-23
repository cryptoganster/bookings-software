import { Test, TestingModule } from '@nestjs/testing';
import { UpdateScheduleHandler } from '../handler';
import { UpdateScheduleCommand } from '../command';
import { IScheduleFactory } from '@availability/domain/interfaces/factories/schedule-factory';
import { IScheduleWriteRepository } from '@availability/domain/interfaces/repositories/schedule-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { Schedule } from '@availability/domain/aggregates/schedule';
import { UUID } from '@shared/vo/uuid';
import { DayOfWeek } from '@availability/domain/vo/day-of-week.vo';
import { TimeSlot } from '@availability/domain/vo/time-slot.vo';
import { ScheduleNotFoundException } from '@availability/domain/exceptions/schedule-not-found.exception';

describe('UpdateScheduleHandler', () => {
  let handler: UpdateScheduleHandler;
  let mockScheduleFactory: jest.Mocked<IScheduleFactory>;
  let mockScheduleWriteRepository: jest.Mocked<IScheduleWriteRepository>;
  let mockUow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    mockScheduleFactory = {
      loadById: jest.fn(),
      loadByBusinessAndDay: jest.fn(),
    };

    mockScheduleWriteRepository = {
      save: jest.fn(),
      delete: jest.fn(),
    };

    mockUow = {
      transaction: jest.fn((work) => work()),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateScheduleHandler,
        {
          provide: 'IScheduleFactory',
          useValue: mockScheduleFactory,
        },
        {
          provide: 'IScheduleWriteRepository',
          useValue: mockScheduleWriteRepository,
        },
        {
          provide: 'IUnitOfWork',
          useValue: mockUow,
        },
      ],
    }).compile();

    handler = module.get<UpdateScheduleHandler>(UpdateScheduleHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should update schedule with new time slot', async () => {
      // Arrange
      const scheduleId = UUID.generate().getValue();
      const command = new UpdateScheduleCommand(scheduleId, '10:00', '18:00');

      const existingSchedule = Schedule.fromPersistence(
        UUID.fromString(scheduleId),
        UUID.generate(),
        DayOfWeek.create(1),
        TimeSlot.create('09:00', '17:00'),
        true,
      );

      mockScheduleFactory.loadById.mockResolvedValue(existingSchedule);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockScheduleFactory.loadById).toHaveBeenCalledWith(scheduleId);
      expect(mockScheduleWriteRepository.save).toHaveBeenCalledWith(existingSchedule);
      expect(mockUow.transaction).toHaveBeenCalled();
    });

    it('should update only start time when end time not provided', async () => {
      // Arrange
      const scheduleId = UUID.generate().getValue();
      const command = new UpdateScheduleCommand(scheduleId, '10:00', undefined);

      const existingSchedule = Schedule.fromPersistence(
        UUID.fromString(scheduleId),
        UUID.generate(),
        DayOfWeek.create(1),
        TimeSlot.create('09:00', '17:00'),
        true,
      );

      mockScheduleFactory.loadById.mockResolvedValue(existingSchedule);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockScheduleWriteRepository.save).toHaveBeenCalled();
    });

    it('should update only end time when start time not provided', async () => {
      // Arrange
      const scheduleId = UUID.generate().getValue();
      const command = new UpdateScheduleCommand(scheduleId, undefined, '18:00');

      const existingSchedule = Schedule.fromPersistence(
        UUID.fromString(scheduleId),
        UUID.generate(),
        DayOfWeek.create(1),
        TimeSlot.create('09:00', '17:00'),
        true,
      );

      mockScheduleFactory.loadById.mockResolvedValue(existingSchedule);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockScheduleWriteRepository.save).toHaveBeenCalled();
    });

    it('should throw ScheduleNotFoundException when schedule does not exist', async () => {
      // Arrange
      const scheduleId = UUID.generate().getValue();
      const command = new UpdateScheduleCommand(scheduleId, '10:00', '18:00');

      mockScheduleFactory.loadById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(ScheduleNotFoundException);
      expect(mockScheduleWriteRepository.save).not.toHaveBeenCalled();
    });

    it('should use UnitOfWork for transaction', async () => {
      // Arrange
      const scheduleId = UUID.generate().getValue();
      const command = new UpdateScheduleCommand(scheduleId, '10:00', '18:00');

      const existingSchedule = Schedule.fromPersistence(
        UUID.fromString(scheduleId),
        UUID.generate(),
        DayOfWeek.create(1),
        TimeSlot.create('09:00', '17:00'),
        true,
      );

      mockScheduleFactory.loadById.mockResolvedValue(existingSchedule);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockUow.transaction).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});
