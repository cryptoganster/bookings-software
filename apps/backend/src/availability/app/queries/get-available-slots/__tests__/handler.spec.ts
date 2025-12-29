import { Test, TestingModule } from '@nestjs/testing';
import { GetAvailableSlotsHandler } from '../handler';
import { GetAvailableSlotsQuery } from '../query';
import { IAvailabilityChecker } from '@availability/domain/interfaces/services/availability-checker.service';
import { ICapacityReadRepository } from '@availability/domain/interfaces/repositories/capacity-read';

describe('GetAvailableSlotsHandler', () => {
  let handler: GetAvailableSlotsHandler;
  let availabilityChecker: jest.Mocked<IAvailabilityChecker>;
  let capacityReadRepository: jest.Mocked<ICapacityReadRepository>;

  beforeEach(async () => {
    // Mock AvailabilityChecker
    availabilityChecker = {
      isDateAvailable: jest.fn(),
      getAvailableTimeSlots: jest.fn(),
    } as jest.Mocked<IAvailabilityChecker>;

    // Mock CapacityReadRepository
    capacityReadRepository = {
      findByOfferingAndDate: jest.fn(),
      findByOfferingAndDateRange: jest.fn(),
      findByBusinessId: jest.fn(),
    } as unknown as jest.Mocked<ICapacityReadRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAvailableSlotsHandler,
        {
          provide: 'IAvailabilityChecker',
          useValue: availabilityChecker,
        },
        {
          provide: 'ICapacityReadRepository',
          useValue: capacityReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetAvailableSlotsHandler>(GetAvailableSlotsHandler);
  });

  describe('execute', () => {
    it('should return available time slots with capacity', async () => {
      // Arrange
      const date = new Date('2024-12-20');
      const query = new GetAvailableSlotsQuery('offering-id', 'business-id', date, 60);

      const mockTimeStrings = ['09:00', '10:00', '11:00'];
      availabilityChecker.getAvailableTimeSlots.mockResolvedValue(mockTimeStrings);

      capacityReadRepository.findByOfferingAndDate.mockResolvedValue({
        id: 'capacity-id',
        offeringId: 'offering-id',
        date: date,
        totalSlots: 10,
        availableSlots: 5,
        bookedSlots: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].time.getUTCHours()).toBe(9);
      expect(result[0].availableSlots).toBe(5);
      expect(result[1].time.getUTCHours()).toBe(10);
      expect(result[1].availableSlots).toBe(5);
      expect(result[2].time.getUTCHours()).toBe(11);
      expect(result[2].availableSlots).toBe(5);
    });

    it('should return empty array when no slots available', async () => {
      // Arrange
      const date = new Date('2024-12-20');
      const query = new GetAvailableSlotsQuery('offering-id', 'business-id', date, 60);

      availabilityChecker.getAvailableTimeSlots.mockResolvedValue([]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual([]);
      expect(capacityReadRepository.findByOfferingAndDate).not.toHaveBeenCalled();
    });

    it('should return empty array when capacity not found', async () => {
      // Arrange
      const date = new Date('2024-12-20');
      const query = new GetAvailableSlotsQuery('offering-id', 'business-id', date, 60);

      availabilityChecker.getAvailableTimeSlots.mockResolvedValue(['09:00', '10:00']);
      capacityReadRepository.findByOfferingAndDate.mockResolvedValue(null);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle different duration values', async () => {
      // Arrange
      const date = new Date('2024-12-20');
      const query = new GetAvailableSlotsQuery('offering-id', 'business-id', date, 30);

      availabilityChecker.getAvailableTimeSlots.mockResolvedValue(['09:00', '09:30']);
      capacityReadRepository.findByOfferingAndDate.mockResolvedValue({
        id: 'capacity-id',
        offeringId: 'offering-id',
        date: date,
        totalSlots: 5,
        availableSlots: 3,
        bookedSlots: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].time.getUTCHours()).toBe(9);
      expect(result[0].time.getUTCMinutes()).toBe(0);
      expect(result[1].time.getUTCHours()).toBe(9);
      expect(result[1].time.getUTCMinutes()).toBe(30);
    });

    it('should pass correct parameters to AvailabilityChecker', async () => {
      // Arrange
      const date = new Date('2024-12-20T10:00:00Z');
      const query = new GetAvailableSlotsQuery('offering-123', 'business-456', date, 90);

      availabilityChecker.getAvailableTimeSlots.mockResolvedValue([]);

      // Act
      await handler.execute(query);

      // Assert
      expect(availabilityChecker.getAvailableTimeSlots).toHaveBeenCalledWith(
        'business-456',
        'offering-123',
        date,
        90,
      );
    });

    it('should convert time strings to Date objects correctly', async () => {
      // Arrange
      const date = new Date('2024-12-20');
      const query = new GetAvailableSlotsQuery('offering-id', 'business-id', date, 60);

      availabilityChecker.getAvailableTimeSlots.mockResolvedValue(['14:30', '15:30']);
      capacityReadRepository.findByOfferingAndDate.mockResolvedValue({
        id: 'capacity-id',
        offeringId: 'offering-id',
        date: date,
        totalSlots: 5,
        availableSlots: 2,
        bookedSlots: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].time.getUTCHours()).toBe(14);
      expect(result[0].time.getUTCMinutes()).toBe(30);
      expect(result[1].time.getUTCHours()).toBe(15);
      expect(result[1].time.getUTCMinutes()).toBe(30);
    });

    it('should include capacity count in all slots', async () => {
      // Arrange
      const date = new Date('2024-12-20');
      const query = new GetAvailableSlotsQuery('offering-id', 'business-id', date, 45);

      availabilityChecker.getAvailableTimeSlots.mockResolvedValue(['09:00', '09:45', '10:30']);
      capacityReadRepository.findByOfferingAndDate.mockResolvedValue({
        id: 'capacity-id',
        offeringId: 'offering-id',
        date: date,
        totalSlots: 10,
        availableSlots: 7,
        bookedSlots: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(3);
      result.forEach((slot) => {
        expect(slot.availableSlots).toBe(7);
      });
    });
  });
});
