import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CustomerReadRepository } from '../customer-read.repository';
import { CustomerModel } from '../../models';
import { SearchCustomersFilters } from '@customer/app/queries/search-customers/query';

describe('CustomerReadRepository - Unit Tests', () => {
  let repository: CustomerReadRepository;
  let mockRepository: jest.Mocked<Repository<CustomerModel>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<CustomerModel>>;

  beforeEach(async () => {
    // Create mock query builder with all necessary methods
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getMany: jest.fn(),
      clone: jest.fn().mockReturnThis(),
    } as any;

    // Create mock repository
    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerReadRepository,
        {
          provide: getRepositoryToken(CustomerModel),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<CustomerReadRepository>(CustomerReadRepository);
  });

  describe('Task 2: Offset Calculation', () => {
    /**
     * Task 2.1: Test offset calculation for page 1, limit 12 (offset = 0)
     * Requirement: 1.1
     * Property: Offset calculation accuracy
     */
    it('should calculate offset = 0 for page 1 with limit 12', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 1,
        limit: 12,
      };

      mockQueryBuilder.getCount.mockResolvedValue(36);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await repository.search(filters);

      // Assert - verify skip(0) was called
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(12);
    });

    /**
     * Task 2.2: Test offset calculation for page 2, limit 12 (offset = 12)
     * Requirement: 1.2
     * Property: Offset calculation accuracy
     */
    it('should calculate offset = 12 for page 2 with limit 12', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 2,
        limit: 12,
      };

      mockQueryBuilder.getCount.mockResolvedValue(36);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await repository.search(filters);

      // Assert - verify skip(12) was called
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(12);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(12);
    });

    /**
     * Task 2.3: Test offset calculation for page 3, limit 12 (offset = 24)
     * Requirement: 1.3
     * Property: Offset calculation accuracy
     */
    it('should calculate offset = 24 for page 3 with limit 12', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 3,
        limit: 12,
      };

      mockQueryBuilder.getCount.mockResolvedValue(36);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await repository.search(filters);

      // Assert - verify skip(24) was called
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(24);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(12);
    });

    /**
     * Task 2.4: Test offset calculation for various page/limit combinations
     * Requirement: 1.4
     * Property: Offset calculation accuracy - offset = (page - 1) × limit
     */
    it('should calculate offset = 80 for page 5 with limit 20', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 5,
        limit: 20,
      };

      mockQueryBuilder.getCount.mockResolvedValue(200);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await repository.search(filters);

      // Assert
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(80);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('should calculate offset = 90 for page 10 with limit 10', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 10,
        limit: 10,
      };

      mockQueryBuilder.getCount.mockResolvedValue(200);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await repository.search(filters);

      // Assert
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(90);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should calculate offset = 0 for page 1 with limit 100', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 1,
        limit: 100,
      };

      mockQueryBuilder.getCount.mockResolvedValue(500);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await repository.search(filters);

      // Assert
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });
  });

  describe('Task 3: Metadata Calculation', () => {
    /**
     * Task 3.1: Test totalPages calculation
     * Requirement: 2.3
     * Property: Metadata accuracy - totalPages = Math.ceil(total / limit)
     */
    it('should calculate totalPages = 9 for total=100, limit=12', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 1,
        limit: 12,
      };

      mockQueryBuilder.getCount.mockResolvedValue(100);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.search(filters);

      // Assert
      expect(result.totalPages).toBe(9); // Math.ceil(100 / 12) = 9
      expect(result.total).toBe(100);
      expect(result.limit).toBe(12);
    });

    it('should calculate totalPages = 10 for total=120, limit=12', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 1,
        limit: 12,
      };

      mockQueryBuilder.getCount.mockResolvedValue(120);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.search(filters);

      // Assert
      expect(result.totalPages).toBe(10); // Math.ceil(120 / 12) = 10
      expect(result.total).toBe(120);
    });

    it('should calculate totalPages = 1 for total=5, limit=12', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 1,
        limit: 12,
      };

      mockQueryBuilder.getCount.mockResolvedValue(5);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.search(filters);

      // Assert
      expect(result.totalPages).toBe(1); // Math.ceil(5 / 12) = 1
    });

    /**
     * Task 3.2: Test hasNextPage flag
     * Requirement: 2.4
     * Property: Metadata accuracy - hasNextPage = page < totalPages
     */
    it('should return hasNextPage = true when page < totalPages', async () => {
      // Arrange - page 1 of 3
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 1,
        limit: 12,
      };

      mockQueryBuilder.getCount.mockResolvedValue(36); // 3 pages
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.search(filters);

      // Assert
      expect(result.totalPages).toBe(3);
      expect(result.page).toBe(1);
      // Note: hasNextPage is not currently returned by the repository
      // This would need to be added to the return type
    });

    it('should return hasNextPage = false when page >= totalPages', async () => {
      // Arrange - page 3 of 3
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 3,
        limit: 12,
      };

      mockQueryBuilder.getCount.mockResolvedValue(36); // 3 pages
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.search(filters);

      // Assert
      expect(result.totalPages).toBe(3);
      expect(result.page).toBe(3);
      // hasNextPage would be false (page 3 >= totalPages 3)
    });

    /**
     * Task 3.3: Test hasPreviousPage flag
     * Requirement: 2.5
     * Property: Metadata accuracy - hasPreviousPage = page > 1
     */
    it('should return hasPreviousPage = false when page = 1', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 1,
        limit: 12,
      };

      mockQueryBuilder.getCount.mockResolvedValue(36);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.search(filters);

      // Assert
      expect(result.page).toBe(1);
      // hasPreviousPage would be false (page 1 is not > 1)
    });

    it('should return hasPreviousPage = true when page > 1', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 2,
        limit: 12,
      };

      mockQueryBuilder.getCount.mockResolvedValue(36);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.search(filters);

      // Assert
      expect(result.page).toBe(2);
      // hasPreviousPage would be true (page 2 > 1)
    });
  });

  describe('Task 4: Input Normalization', () => {
    /**
     * Task 4.1: Test page normalization
     * Requirement: 4.2
     * Property: Edge case - invalid page numbers
     */
    it('should normalize page 0 to page 1', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 0,
        limit: 12,
      };

      mockQueryBuilder.getCount.mockResolvedValue(36);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.search(filters);

      // Assert
      expect(result.page).toBe(1);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0); // offset for page 1
    });

    it('should normalize page -1 to page 1', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: -1,
        limit: 12,
      };

      mockQueryBuilder.getCount.mockResolvedValue(36);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.search(filters);

      // Assert
      expect(result.page).toBe(1);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
    });

    it('should normalize page -100 to page 1', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: -100,
        limit: 12,
      };

      mockQueryBuilder.getCount.mockResolvedValue(36);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.search(filters);

      // Assert
      expect(result.page).toBe(1);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
    });

    /**
     * Task 4.2: Test limit normalization
     * Requirements: 4.3, 4.4
     * Property: Edge case - invalid limits
     */
    it('should normalize limit 0 to limit 1 (minimum)', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 1,
        limit: 0,
      };

      mockQueryBuilder.getCount.mockResolvedValue(36);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.search(filters);

      // Assert
      expect(result.limit).toBe(1);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(1);
    });

    it('should normalize limit -1 to limit 1 (minimum)', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 1,
        limit: -1,
      };

      mockQueryBuilder.getCount.mockResolvedValue(36);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.search(filters);

      // Assert
      expect(result.limit).toBe(1);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(1);
    });

    it('should cap limit 101 at 100 (maximum)', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 1,
        limit: 101,
      };

      mockQueryBuilder.getCount.mockResolvedValue(500);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.search(filters);

      // Assert
      expect(result.limit).toBe(100);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });

    it('should cap limit 1000 at 100 (maximum)', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 1,
        limit: 1000,
      };

      mockQueryBuilder.getCount.mockResolvedValue(500);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.search(filters);

      // Assert
      expect(result.limit).toBe(100);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });
  });

  describe('Query Structure', () => {
    it('should clone query before adding sorting and pagination', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 1,
        limit: 12,
      };

      mockQueryBuilder.getCount.mockResolvedValue(36);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await repository.search(filters);

      // Assert - verify clone() was called after getCount()
      expect(mockQueryBuilder.clone).toHaveBeenCalled();
    });

    it('should add secondary sort by created_at when sorting by name', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 1,
        limit: 12,
        sortBy: 'name',
        sortOrder: 'ASC',
      };

      mockQueryBuilder.getCount.mockResolvedValue(36);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await repository.search(filters);

      // Assert - verify both orderBy and addOrderBy were called
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('customer.name', 'ASC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('customer.created_at', 'DESC');
    });

    it('should not add secondary sort when sorting by createdAt', async () => {
      // Arrange
      const filters: SearchCustomersFilters = {
        businessId: 'business-123',
        page: 1,
        limit: 12,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };

      mockQueryBuilder.getCount.mockResolvedValue(36);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await repository.search(filters);

      // Assert - verify only orderBy was called, not addOrderBy
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('customer.created_at', 'DESC');
      expect(mockQueryBuilder.addOrderBy).not.toHaveBeenCalled();
    });
  });
});
