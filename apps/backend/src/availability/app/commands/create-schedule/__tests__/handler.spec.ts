import { Test, TestingModule } from '@nestjs/testing';
import { CreateScheduleHandler } from '../handler';
import { CreateScheduleCommand } from '../command';
import { IScheduleFactory } from '@availability/domain/interfaces/factories/schedule-factory';
import { IScheduleWriteRepository } from '@availability/domain/interfaces/repositories/schedule-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { Schedule } from '@availability/domain/aggregates/schedule';
import { UUID } from '@shared/vo/uuid';
import { DayOfWeek } from '@availability/domain/vo/day-of-week.vo';
import { TimeSlot } from '@availability/domain/vo/time-slot.vo';
import { ScheduleAlreadyExistsException } from '@availability/domain/exceptions/schedule-already-exists.exception';

describe('CreateScheduleHandler', () => {
  let handler: CreateScheduleHandler;
  let mockScheduleFactory: jest.Mocked<IScheduleFactory>;
  let mockScheduleWriteRepository: jest.Mocked<IScheduleWriteRepository>;
  let mockUow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    mockScheduleFactory = {
      loadById: jest.fn(),
      loadByBusinessAndDay: jest.fn(),
    } as jest.Mocked<IScheduleFactory>;

    mockScheduleWriteRepository = {
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IScheduleWriteRepository>;

    mockUow = {
      transaction: jest.fn((work) => work()),
      getQueryRunner: jest.fn(),
    } as jest.Mocked<IUnitOfWork>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateScheduleHandler,
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

    handler = module.get<CreateScheduleHandler>(CreateScheduleHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should create a new schedule when none exists', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const command = new CreateScheduleCommand(
        businessId,
        1, // Monday
        '09:00',
        '17:00',
      );

      mockScheduleFactory.loadByBusinessAndDay.mockResolvedValue(null);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.scheduleId).toBeDefined();
      expect(mockScheduleFactory.loadByBusinessAndDay).toHaveBeenCalledWith(businessId, 1);
      expect(mockScheduleWriteRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          getBusinessId: expect.any(Function),
          getDayOfWeek: expect.any(Function),
        }),
      );
      expect(mockUow.transaction).toHaveBeenCalled();
    });

    it('should throw ScheduleAlreadyExistsException when active schedule exists', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const command = new CreateScheduleCommand(businessId, 1, '09:00', '17:00');

      const existingSchedule = Schedule.fromPersistence(
        UUID.generate(),
        UUID.fromString(businessId),
        DayOfWeek.create(1),
        TimeSlot.create('08:00', '16:00'),
        true, // isActive
      );

      mockScheduleFactory.loadByBusinessAndDay.mockResolvedValue(existingSchedule);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(ScheduleAlreadyExistsException);
      expect(mockScheduleWriteRepository.save).not.toHaveBeenCalled();
    });

    it('should create schedule when inactive schedule exists', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const command = new CreateScheduleCommand(businessId, 1, '09:00', '17:00');

      const inactiveSchedule = Schedule.fromPersistence(
        UUID.generate(),
        UUID.fromString(businessId),
        DayOfWeek.create(1),
        TimeSlot.create('08:00', '16:00'),
        false, // isActive = false
      );

      mockScheduleFactory.loadByBusinessAndDay.mockResolvedValue(inactiveSchedule);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.scheduleId).toBeDefined();
      expect(mockScheduleWriteRepository.save).toHaveBeenCalled();
    });

    it('should use UnitOfWork for transaction', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const command = new CreateScheduleCommand(businessId, 1, '09:00', '17:00');
      mockScheduleFactory.loadByBusinessAndDay.mockResolvedValue(null);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockUow.transaction).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});
