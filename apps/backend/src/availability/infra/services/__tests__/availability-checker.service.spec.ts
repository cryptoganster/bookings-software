import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AvailabilityChecker } from '../availability-checker.service';
import { IScheduleReadRepository } from '@availability/domain/interfaces/repositories/schedule-read';
import { IBlockoutReadRepository } from '@availability/domain/interfaces/repositories/blockout-read';
import { ICapacityFactory } from '@availability/domain/interfaces/factories/capacity-factory';
import { ScheduleReadModel } from '@availability/domain/read-models/schedule';
import { BlockoutReadModel } from '@availability/domain/read-models/blockout';
import { Capacity } from '@availability/domain/aggregates/capacity';
import { UUID } from '@shared/vo/uuid';

describe('AvailabilityChecker Service - Unit Tests', () => {
  let service: AvailabilityChecker;
  let mockScheduleRepo: jest.Mocked<IScheduleReadRepository>;
  let mockBlockoutRepo: jest.Mocked<IBlockoutReadRepository>;
  let mockCapacityFactory: jest.Mocked<ICapacityFactory>;

  beforeEach(() => {
    // Create mocks
    mockScheduleRepo = {
      findById: jest.fn(),
      findByBusinessId: jest.fn(),
      findByBusinessAndDay: jest.fn(),
    } as any;

    mockBlockoutRepo = {
      findById: jest.fn(),
      findByBusinessId: jest.fn(),
      findByBusinessAndDateRange: jest.fn(),
    } as any;

    mockCapacityFactory = {
      loadByOfferingAndDate: jest.fn(),
      loadById: jest.fn(),
    } as any;

    // Create service instance
    service = new AvailabilityChecker(mockScheduleRepo, mockBlockoutRepo, mockCapacityFactory);
  });

  describe('isDateAvailable', () => {
    const businessId = 'business-123';
    const offeringId = 'offering-456';
    const testDate = new Date('2025-01-15T10:00:00Z'); // Wednesday

    it('should return true when date is available (has schedule, no blockout, has capacity)', async () => {
      // Arrange
      const schedule: ScheduleReadModel = {
        id: 'schedule-1',
        businessId,
        dayOfWeek: 3, // Wednesday
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const capacity = Capacity.create(
        UUID.generate(),
        UUID.fromString(offeringId),
        testDate,
        10, // 10 slots available
      );

      mockScheduleRepo.findByBusinessAndDay.mockResolvedValue(schedule);
      mockBlockoutRepo.findByBusinessAndDateRange.mockResolvedValue([]);
      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(capacity);

      // Act
      const result = await service.isDateAvailable(businessId, offeringId, testDate);

      // Assert
      expect(result).toBe(true);
      expect(mockScheduleRepo.findByBusinessAndDay).toHaveBeenCalledWith(businessId, 3);
      expect(mockBlockoutRepo.findByBusinessAndDateRange).toHaveBeenCalled();
      expect(mockCapacityFactory.loadByOfferingAndDate).toHaveBeenCalled();
    });

    it('should return false when no schedule exists for that day', async () => {
      // Arrange
      mockScheduleRepo.findByBusinessAndDay.mockResolvedValue(null);

      // Act
      const result = await service.isDateAvailable(businessId, offeringId, testDate);

      // Assert
      expect(result).toBe(false);
      expect(mockScheduleRepo.findByBusinessAndDay).toHaveBeenCalledWith(businessId, 3);
      expect(mockBlockoutRepo.findByBusinessAndDateRange).not.toHaveBeenCalled();
      expect(mockCapacityFactory.loadByOfferingAndDate).not.toHaveBeenCalled();
    });

    it('should return false when schedule is inactive', async () => {
      // Arrange
      const inactiveSchedule: ScheduleReadModel = {
        id: 'schedule-1',
        businessId,
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '17:00',
        isActive: false, // Inactive
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockScheduleRepo.findByBusinessAndDay.mockResolvedValue(inactiveSchedule);

      // Act
      const result = await service.isDateAvailable(businessId, offeringId, testDate);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when date is blocked', async () => {
      // Arrange
      const schedule: ScheduleReadModel = {
        id: 'schedule-1',
        businessId,
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const blockout: BlockoutReadModel = {
        id: 'blockout-1',
        businessId,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-15'),
        reason: 'Holiday',
        createdAt: new Date(),
      };

      mockScheduleRepo.findByBusinessAndDay.mockResolvedValue(schedule);
      mockBlockoutRepo.findByBusinessAndDateRange.mockResolvedValue([blockout]);

      // Act
      const result = await service.isDateAvailable(businessId, offeringId, testDate);

      // Assert
      expect(result).toBe(false);
      expect(mockBlockoutRepo.findByBusinessAndDateRange).toHaveBeenCalled();
    });

    it('should return false when capacity is null', async () => {
      // Arrange
      const schedule: ScheduleReadModel = {
        id: 'schedule-1',
        businessId,
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockScheduleRepo.findByBusinessAndDay.mockResolvedValue(schedule);
      mockBlockoutRepo.findByBusinessAndDateRange.mockResolvedValue([]);
      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(null);

      // Act
      const result = await service.isDateAvailable(businessId, offeringId, testDate);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when capacity has no available slots', async () => {
      // Arrange
      const schedule: ScheduleReadModel = {
        id: 'schedule-1',
        businessId,
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const capacity = Capacity.create(UUID.generate(), UUID.fromString(offeringId), testDate, 5);

      // Book all slots
      for (let i = 0; i < 5; i++) {
        capacity.bookSlot();
      }

      mockScheduleRepo.findByBusinessAndDay.mockResolvedValue(schedule);
      mockBlockoutRepo.findByBusinessAndDateRange.mockResolvedValue([]);
      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(capacity);

      // Act
      const result = await service.isDateAvailable(businessId, offeringId, testDate);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getAvailableTimeSlots', () => {
    const businessId = 'business-123';
    const offeringId = 'offering-456';
    const testDate = new Date('2025-01-15T10:00:00Z'); // Wednesday
    const duration = 30; // 30 minutes

    it('should return time slots when date is available', async () => {
      // Arrange
      const schedule: ScheduleReadModel = {
        id: 'schedule-1',
        businessId,
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '11:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const capacity = Capacity.create(UUID.generate(), UUID.fromString(offeringId), testDate, 10);

      mockBlockoutRepo.findByBusinessAndDateRange.mockResolvedValue([]);
      mockScheduleRepo.findByBusinessAndDay.mockResolvedValue(schedule);
      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(capacity);

      // Act
      const result = await service.getAvailableTimeSlots(
        businessId,
        offeringId,
        testDate,
        duration,
      );

      // Assert
      expect(result).toEqual(['09:00', '09:30', '10:00', '10:30']);
    });

    it('should return empty array when date is blocked', async () => {
      // Arrange
      const blockout: BlockoutReadModel = {
        id: 'blockout-1',
        businessId,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-15'),
        reason: 'Holiday',
        createdAt: new Date(),
      };

      mockBlockoutRepo.findByBusinessAndDateRange.mockResolvedValue([blockout]);

      // Act
      const result = await service.getAvailableTimeSlots(
        businessId,
        offeringId,
        testDate,
        duration,
      );

      // Assert
      expect(result).toEqual([]);
      expect(mockScheduleRepo.findByBusinessAndDay).not.toHaveBeenCalled();
    });

    it('should return empty array when no schedule exists', async () => {
      // Arrange
      mockBlockoutRepo.findByBusinessAndDateRange.mockResolvedValue([]);
      mockScheduleRepo.findByBusinessAndDay.mockResolvedValue(null);

      // Act
      const result = await service.getAvailableTimeSlots(
        businessId,
        offeringId,
        testDate,
        duration,
      );

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when schedule is inactive', async () => {
      // Arrange
      const inactiveSchedule: ScheduleReadModel = {
        id: 'schedule-1',
        businessId,
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '17:00',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBlockoutRepo.findByBusinessAndDateRange.mockResolvedValue([]);
      mockScheduleRepo.findByBusinessAndDay.mockResolvedValue(inactiveSchedule);

      // Act
      const result = await service.getAvailableTimeSlots(
        businessId,
        offeringId,
        testDate,
        duration,
      );

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when no capacity available', async () => {
      // Arrange
      const schedule: ScheduleReadModel = {
        id: 'schedule-1',
        businessId,
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBlockoutRepo.findByBusinessAndDateRange.mockResolvedValue([]);
      mockScheduleRepo.findByBusinessAndDay.mockResolvedValue(schedule);
      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(null);

      // Act
      const result = await service.getAvailableTimeSlots(
        businessId,
        offeringId,
        testDate,
        duration,
      );

      // Assert
      expect(result).toEqual([]);
    });

    it('should generate correct slots for 60-minute duration', async () => {
      // Arrange
      const schedule: ScheduleReadModel = {
        id: 'schedule-1',
        businessId,
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '12:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const capacity = Capacity.create(UUID.generate(), UUID.fromString(offeringId), testDate, 10);

      mockBlockoutRepo.findByBusinessAndDateRange.mockResolvedValue([]);
      mockScheduleRepo.findByBusinessAndDay.mockResolvedValue(schedule);
      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(capacity);

      // Act
      const result = await service.getAvailableTimeSlots(businessId, offeringId, testDate, 60);

      // Assert
      expect(result).toEqual(['09:00', '10:00', '11:00']);
    });

    it('should generate correct slots for 15-minute duration', async () => {
      // Arrange
      const schedule: ScheduleReadModel = {
        id: 'schedule-1',
        businessId,
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '10:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const capacity = Capacity.create(UUID.generate(), UUID.fromString(offeringId), testDate, 10);

      mockBlockoutRepo.findByBusinessAndDateRange.mockResolvedValue([]);
      mockScheduleRepo.findByBusinessAndDay.mockResolvedValue(schedule);
      mockCapacityFactory.loadByOfferingAndDate.mockResolvedValue(capacity);

      // Act
      const result = await service.getAvailableTimeSlots(businessId, offeringId, testDate, 15);

      // Assert
      expect(result).toEqual(['09:00', '09:15', '09:30', '09:45']);
    });
  });
});
