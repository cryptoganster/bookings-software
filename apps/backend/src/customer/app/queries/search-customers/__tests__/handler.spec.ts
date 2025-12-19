import { Test, TestingModule } from '@nestjs/testing';
import { SearchCustomersHandler } from '../handler';
import { SearchCustomersQuery } from '../query';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories';

describe('SearchCustomersHandler', () => {
  let handler: SearchCustomersHandler;
  let mockReadRepo: jest.Mocked<ICustomerReadRepository>;

  beforeEach(async () => {
    mockReadRepo = {
      search: jest.fn(),
      findById: jest.fn(),
      findByWhatsAppPhone: jest.fn(),
      findByBusinessId: jest.fn(),
      findByUserId: jest.fn(),
      findAnonymousByBusinessId: jest.fn(),
    } as jest.Mocked<ICustomerReadRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchCustomersHandler,
        {
          provide: 'ICustomerReadRepository',
          useValue: mockReadRepo,
        },
      ],
    }).compile();

    handler = module.get<SearchCustomersHandler>(SearchCustomersHandler);
  });

  describe('execute', () => {
    it('should search customers by name (case-insensitive)', async () => {
      // Arrange
      const filters = {
        businessId: 'business-123',
        searchText: 'john',
        page: 1,
        limit: 20,
      };

      const expectedResult = {
        customers: [
          {
            id: 'customer-1',
            userId: null,
            businessId: 'business-123',
            whatsappPhone: '+18095551234',
            name: 'John Doe',
            createdAt: new Date('2024-01-01'),
            appointmentCount: 5,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockReadRepo.search.mockResolvedValue(expectedResult);

      const query = new SearchCustomersQuery(filters);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockReadRepo.search).toHaveBeenCalledWith(filters);
    });

    it('should search customers by phone', async () => {
      // Arrange
      const filters = {
        businessId: 'business-123',
        searchText: '8095551234',
        page: 1,
        limit: 20,
      };

      const expectedResult = {
        customers: [
          {
            id: 'customer-1',
            userId: null,
            businessId: 'business-123',
            whatsappPhone: '+18095551234',
            name: 'John Doe',
            createdAt: new Date('2024-01-01'),
            appointmentCount: 5,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockReadRepo.search.mockResolvedValue(expectedResult);

      const query = new SearchCustomersQuery(filters);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockReadRepo.search).toHaveBeenCalledWith(filters);
    });

    it('should filter by type (anonymous)', async () => {
      // Arrange
      const filters = {
        businessId: 'business-123',
        type: 'anonymous' as const,
        page: 1,
        limit: 20,
      };

      const expectedResult = {
        customers: [
          {
            id: 'customer-1',
            userId: null, // Anonymous
            businessId: 'business-123',
            whatsappPhone: '+18095551234',
            name: 'John Doe',
            createdAt: new Date('2024-01-01'),
            appointmentCount: 5,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockReadRepo.search.mockResolvedValue(expectedResult);

      const query = new SearchCustomersQuery(filters);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result.customers[0].userId).toBeNull();
    });

    it('should filter by type (registered)', async () => {
      // Arrange
      const filters = {
        businessId: 'business-123',
        type: 'registered' as const,
        page: 1,
        limit: 20,
      };

      const expectedResult = {
        customers: [
          {
            id: 'customer-1',
            userId: 'user-123', // Registered
            businessId: 'business-123',
            whatsappPhone: '+18095551234',
            name: 'John Doe',
            createdAt: new Date('2024-01-01'),
            appointmentCount: 5,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockReadRepo.search.mockResolvedValue(expectedResult);

      const query = new SearchCustomersQuery(filters);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result.customers[0].userId).not.toBeNull();
    });

    it('should filter by date range', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const filters = {
        businessId: 'business-123',
        dateRange: { startDate, endDate },
        page: 1,
        limit: 20,
      };

      const expectedResult = {
        customers: [
          {
            id: 'customer-1',
            userId: null,
            businessId: 'business-123',
            whatsappPhone: '+18095551234',
            name: 'John Doe',
            createdAt: new Date('2024-01-15'),
            appointmentCount: 5,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockReadRepo.search.mockResolvedValue(expectedResult);

      const query = new SearchCustomersQuery(filters);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockReadRepo.search).toHaveBeenCalledWith(filters);
    });

    it('should implement pagination', async () => {
      // Arrange
      const filters = {
        businessId: 'business-123',
        page: 2,
        limit: 10,
      };

      const expectedResult = {
        customers: [
          {
            id: 'customer-11',
            userId: null,
            businessId: 'business-123',
            whatsappPhone: '+18095551234',
            name: 'Customer 11',
            createdAt: new Date('2024-01-01'),
            appointmentCount: 2,
          },
        ],
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      };

      mockReadRepo.search.mockResolvedValue(expectedResult);

      const query = new SearchCustomersQuery(filters);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
    });

    it('should support sorting by name', async () => {
      // Arrange
      const filters = {
        businessId: 'business-123',
        sortBy: 'name' as const,
        sortOrder: 'ASC' as const,
        page: 1,
        limit: 20,
      };

      const expectedResult = {
        customers: [
          {
            id: 'customer-1',
            userId: null,
            businessId: 'business-123',
            whatsappPhone: '+18095551234',
            name: 'Alice',
            createdAt: new Date('2024-01-01'),
            appointmentCount: 5,
          },
          {
            id: 'customer-2',
            userId: null,
            businessId: 'business-123',
            whatsappPhone: '+18095555678',
            name: 'Bob',
            createdAt: new Date('2024-01-02'),
            appointmentCount: 3,
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockReadRepo.search.mockResolvedValue(expectedResult);

      const query = new SearchCustomersQuery(filters);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.customers[0].name).toBe('Alice');
      expect(result.customers[1].name).toBe('Bob');
    });

    it('should support sorting by createdAt', async () => {
      // Arrange
      const filters = {
        businessId: 'business-123',
        sortBy: 'createdAt' as const,
        sortOrder: 'DESC' as const,
        page: 1,
        limit: 20,
      };

      const expectedResult = {
        customers: [
          {
            id: 'customer-2',
            userId: null,
            businessId: 'business-123',
            whatsappPhone: '+18095555678',
            name: 'Bob',
            createdAt: new Date('2024-01-02'),
            appointmentCount: 3,
          },
          {
            id: 'customer-1',
            userId: null,
            businessId: 'business-123',
            whatsappPhone: '+18095551234',
            name: 'Alice',
            createdAt: new Date('2024-01-01'),
            appointmentCount: 5,
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockReadRepo.search.mockResolvedValue(expectedResult);

      const query = new SearchCustomersQuery(filters);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.customers[0].createdAt > result.customers[1].createdAt).toBe(true);
    });

    it('should handle SQL injection prevention (special characters)', async () => {
      // Arrange - Edge Case 2: SQL injection
      const filters = {
        businessId: 'business-123',
        searchText: "'; DROP TABLE customers; --",
        page: 1,
        limit: 20,
      };

      const expectedResult = {
        customers: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      mockReadRepo.search.mockResolvedValue(expectedResult);

      const query = new SearchCustomersQuery(filters);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.customers).toEqual([]);
      expect(mockReadRepo.search).toHaveBeenCalledWith(filters);
    });

    it('should handle empty query (Edge Case 9)', async () => {
      // Arrange
      const filters = {
        businessId: 'business-123',
        searchText: '',
        page: 1,
        limit: 20,
      };

      const expectedResult = {
        customers: [
          {
            id: 'customer-1',
            userId: null,
            businessId: 'business-123',
            whatsappPhone: '+18095551234',
            name: 'John Doe',
            createdAt: new Date('2024-01-01'),
            appointmentCount: 5,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockReadRepo.search.mockResolvedValue(expectedResult);

      const query = new SearchCustomersQuery(filters);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.customers.length).toBeGreaterThan(0);
    });

    it('should handle pagination beyond total pages (Edge Case 7)', async () => {
      // Arrange
      const filters = {
        businessId: 'business-123',
        page: 999,
        limit: 20,
      };

      const expectedResult = {
        customers: [],
        total: 25,
        page: 999,
        limit: 20,
        totalPages: 2,
      };

      mockReadRepo.search.mockResolvedValue(expectedResult);

      const query = new SearchCustomersQuery(filters);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.customers).toEqual([]);
      expect(result.page).toBe(999);
      expect(result.totalPages).toBe(2);
    });
  });
});
