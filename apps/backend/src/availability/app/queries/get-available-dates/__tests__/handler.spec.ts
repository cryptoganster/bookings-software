import { Test, TestingModule } from '@nestjs/testing';
import { GetAvailableDatesHandler } from '../handler';
import { GetAvailableDatesQuery } from '../query';
import { IAvailabilityChecker } from '@availability/domain/interfaces/services/availability-checker.service';

describe('GetAvailableDatesHandler', () => {
  let handler: GetAvailableDatesHandler;
  let availabilityChecker: jest.Mocked<IAvailabilityChecker>;

  beforeEach(async () => {
    // Mock AvailabilityChecker
    availabilityChecker = {
      isDateAvailable: jest.fn(),
      getAvailableTimeSlots: jest.fn(),
    } as jest.Mocked<IAvailabilityChecker>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAvailableDatesHandler,
        {
          provide: 'IAvailabilityChecker',
          useValue: availabilityChecker,
        },
      ],
    }).compile();

    handler = module.get<GetAvailableDatesHandler>(GetAvailableDatesHandler);
  });

  describe('execute', () => {
    it('should return available dates within range', async () => {
      // Arrange
      const startDate = new Date('2024-12-20T00:00:00.000Z');
      const endDate = new Date('2024-12-22T00:00:00.000Z');
      const query = new GetAvailableDatesQuery('offering-id', 'business-id', startDate, endDate);

      // Mock: Dec 20 and Dec 22 are available, Dec 21 is not
      availabilityChecker.isDateAvailable.mockImplementation(
        async (businessId: string, offeringId: string, date: Date) => {
          const day = date.getUTCDate();
          return day === 20 || day === 22;
        },
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].toISOString().split('T')[0]).toBe('2024-12-20');
      expect(result[1].toISOString().split('T')[0]).toBe('2024-12-22');
      expect(availabilityChecker.isDateAvailable).toHaveBeenCalledTimes(3);
    });

    it('should return empty array when no dates are available', async () => {
      // Arrange
      const startDate = new Date('2024-12-20T00:00:00.000Z');
      const endDate = new Date('2024-12-22T00:00:00.000Z');
      const query = new GetAvailableDatesQuery('offering-id', 'business-id', startDate, endDate);

      availabilityChecker.isDateAvailable.mockResolvedValue(false);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(0);
      expect(availabilityChecker.isDateAvailable).toHaveBeenCalledTimes(3);
    });

    it('should return all dates when all are available', async () => {
      // Arrange
      const startDate = new Date('2024-12-20T00:00:00.000Z');
      const endDate = new Date('2024-12-24T00:00:00.000Z');
      const query = new GetAvailableDatesQuery('offering-id', 'business-id', startDate, endDate);

      availabilityChecker.isDateAvailable.mockResolvedValue(true);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(5); // 5 days inclusive
      expect(availabilityChecker.isDateAvailable).toHaveBeenCalledTimes(5);
    });

    it('should handle single day range', async () => {
      // Arrange
      const date = new Date('2024-12-20T00:00:00.000Z');
      const query = new GetAvailableDatesQuery('offering-id', 'business-id', date, date);

      availabilityChecker.isDateAvailable.mockResolvedValue(true);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].toISOString().split('T')[0]).toBe('2024-12-20');
      expect(availabilityChecker.isDateAvailable).toHaveBeenCalledTimes(1);
    });

    it('should call isDateAvailable with correct parameters', async () => {
      // Arrange
      const startDate = new Date('2024-12-20T00:00:00.000Z');
      const endDate = new Date('2024-12-20T00:00:00.000Z');
      const query = new GetAvailableDatesQuery('offering-123', 'business-456', startDate, endDate);

      availabilityChecker.isDateAvailable.mockResolvedValue(true);

      // Act
      await handler.execute(query);

      // Assert
      expect(availabilityChecker.isDateAvailable).toHaveBeenCalledWith(
        'business-456',
        'offering-123',
        expect.any(Date),
      );
    });

    it('should normalize dates to midnight', async () => {
      // Arrange
      const startDate = new Date('2024-12-20T15:30:00Z');
      const endDate = new Date('2024-12-20T18:45:00Z');
      const query = new GetAvailableDatesQuery('offering-id', 'business-id', startDate, endDate);

      availabilityChecker.isDateAvailable.mockResolvedValue(true);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      // Verify time is normalized to midnight UTC
      const resultDate = result[0];
      expect(resultDate.getUTCHours()).toBe(0);
      expect(resultDate.getUTCMinutes()).toBe(0);
      expect(resultDate.getUTCSeconds()).toBe(0);
      expect(resultDate.getUTCMilliseconds()).toBe(0);
    });
  });
});
