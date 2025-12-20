import { Test, TestingModule } from '@nestjs/testing';
import { GetCustomerStatsHandler } from '../handler';
import { GetCustomerStatsQuery, CustomerStats } from '../query';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories';

describe('GetCustomerStatsHandler', () => {
  let handler: GetCustomerStatsHandler;
  let mockReadRepo: jest.Mocked<ICustomerReadRepository>;

  beforeEach(async () => {
    mockReadRepo = {
      search: jest.fn(),
      getStats: jest.fn(),
      findById: jest.fn(),
      findByWhatsAppPhone: jest.fn(),
      findByBusinessId: jest.fn(),
      findByUserId: jest.fn(),
      findAnonymousByBusinessId: jest.fn(),
      getFullData: jest.fn(),
    } as jest.Mocked<ICustomerReadRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCustomerStatsHandler,
        {
          provide: 'ICustomerReadRepository',
          useValue: mockReadRepo,
        },
      ],
    }).compile();

    handler = module.get<GetCustomerStatsHandler>(GetCustomerStatsHandler);
  });

  describe('execute', () => {
    it('should return customer statistics', async () => {
      // Arrange
      const businessId = 'business-123';

      const expectedStats: CustomerStats = {
        totalCustomers: 100,
        anonymousCount: 60,
        registeredCount: 40,
        newThisMonth: 15,
        newThisWeek: 5,
        topCustomers: [
          {
            id: 'customer-1',
            name: 'John Doe',
            whatsappPhone: '+18095551234',
            appointmentCount: 25,
          },
          {
            id: 'customer-2',
            name: 'Jane Smith',
            whatsappPhone: '+18095555678',
            appointmentCount: 20,
          },
        ],
      };

      mockReadRepo.getStats.mockResolvedValue(expectedStats);

      const query = new GetCustomerStatsQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedStats);
      expect(mockReadRepo.getStats).toHaveBeenCalledWith(businessId);
    });

    it('should calculate correct anonymous vs registered ratio', async () => {
      // Arrange
      const businessId = 'business-123';

      const stats: CustomerStats = {
        totalCustomers: 100,
        anonymousCount: 70,
        registeredCount: 30,
        newThisMonth: 10,
        newThisWeek: 3,
        topCustomers: [],
      };

      mockReadRepo.getStats.mockResolvedValue(stats);

      const query = new GetCustomerStatsQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.anonymousCount + result.registeredCount).toBe(result.totalCustomers);
      expect(result.anonymousCount).toBe(70);
      expect(result.registeredCount).toBe(30);
    });

    it('should return time-based metrics', async () => {
      // Arrange
      const businessId = 'business-123';

      const stats: CustomerStats = {
        totalCustomers: 50,
        anonymousCount: 30,
        registeredCount: 20,
        newThisMonth: 12,
        newThisWeek: 4,
        topCustomers: [],
      };

      mockReadRepo.getStats.mockResolvedValue(stats);

      const query = new GetCustomerStatsQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.newThisMonth).toBe(12);
      expect(result.newThisWeek).toBe(4);
      expect(result.newThisWeek).toBeLessThanOrEqual(result.newThisMonth);
    });

    it('should return top customers ordered by appointment count', async () => {
      // Arrange
      const businessId = 'business-123';

      const stats: CustomerStats = {
        totalCustomers: 100,
        anonymousCount: 60,
        registeredCount: 40,
        newThisMonth: 15,
        newThisWeek: 5,
        topCustomers: [
          {
            id: 'customer-1',
            name: 'Top Customer',
            whatsappPhone: '+18095551234',
            appointmentCount: 50,
          },
          {
            id: 'customer-2',
            name: 'Second Customer',
            whatsappPhone: '+18095555678',
            appointmentCount: 35,
          },
          {
            id: 'customer-3',
            name: 'Third Customer',
            whatsappPhone: '+18095559999',
            appointmentCount: 20,
          },
        ],
      };

      mockReadRepo.getStats.mockResolvedValue(stats);

      const query = new GetCustomerStatsQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.topCustomers).toHaveLength(3);
      expect(result.topCustomers[0].appointmentCount).toBeGreaterThanOrEqual(
        result.topCustomers[1].appointmentCount,
      );
      expect(result.topCustomers[1].appointmentCount).toBeGreaterThanOrEqual(
        result.topCustomers[2].appointmentCount,
      );
    });

    it('should handle business with no customers', async () => {
      // Arrange
      const businessId = 'business-empty';

      const stats: CustomerStats = {
        totalCustomers: 0,
        anonymousCount: 0,
        registeredCount: 0,
        newThisMonth: 0,
        newThisWeek: 0,
        topCustomers: [],
      };

      mockReadRepo.getStats.mockResolvedValue(stats);

      const query = new GetCustomerStatsQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.totalCustomers).toBe(0);
      expect(result.topCustomers).toEqual([]);
    });
  });
});
