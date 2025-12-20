import { Test, TestingModule } from '@nestjs/testing';
import { DetectDuplicateCustomersHandler } from '../handler';
import { DetectDuplicateCustomersQuery } from '../query';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories';
import { CustomerDeduplicationService } from '@customer/domain/services/customer-deduplication.service';
import { CustomerReadModel } from '@customer/domain/read-models/customer';

describe('DetectDuplicateCustomersHandler', () => {
  let handler: DetectDuplicateCustomersHandler;
  let mockReadRepo: jest.Mocked<ICustomerReadRepository>;
  let deduplicationService: CustomerDeduplicationService;

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
        DetectDuplicateCustomersHandler,
        CustomerDeduplicationService,
        {
          provide: 'ICustomerReadRepository',
          useValue: mockReadRepo,
        },
      ],
    }).compile();

    handler = module.get<DetectDuplicateCustomersHandler>(DetectDuplicateCustomersHandler);
    deduplicationService = module.get<CustomerDeduplicationService>(CustomerDeduplicationService);
  });

  describe('execute', () => {
    it('should detect duplicates with similar names and phones', async () => {
      // Arrange
      const customers: CustomerReadModel[] = [
        new CustomerReadModel(
          'customer-1',
          null,
          'business-123',
          '+1 (809) 555-1234',
          'John Doe',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new CustomerReadModel(
          'customer-2',
          null,
          'business-123',
          '+1-809-555-1234',
          'Jon Doe',
          new Date('2024-01-02'),
          new Date('2024-01-02'),
        ),
      ];

      mockReadRepo.findByBusinessId.mockResolvedValue(customers);

      const query = new DetectDuplicateCustomersQuery('business-123', 0.8);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].customer1.id).toBe('customer-1');
      expect(result[0].customer2.id).toBe('customer-2');
      expect(result[0].similarityScore).toBeGreaterThanOrEqual(0.8);
      expect(result[0].reasons).toContain('Nombres muy similares');
      expect(result[0].reasons).toContain('Mismo número de teléfono');
    });

    it('should filter by threshold', async () => {
      // Arrange
      const customers: CustomerReadModel[] = [
        new CustomerReadModel(
          'customer-1',
          null,
          'business-123',
          '+18095551234',
          'John Doe',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new CustomerReadModel(
          'customer-2',
          null,
          'business-123',
          '+18095555678',
          'Jane Smith',
          new Date('2024-01-02'),
          new Date('2024-01-02'),
        ),
      ];

      mockReadRepo.findByBusinessId.mockResolvedValue(customers);

      const query = new DetectDuplicateCustomersQuery('business-123', 0.9); // High threshold

      // Act
      const result = await handler.execute(query);

      // Assert
      // These customers are not similar enough (different names, different phones)
      expect(result.length).toBe(0);
    });

    it('should verify symmetry property (A duplicate of B = B duplicate of A)', async () => {
      // Arrange - Property 2: Deduplication symmetry
      const customers: CustomerReadModel[] = [
        new CustomerReadModel(
          'customer-1',
          null,
          'business-123',
          '+18095551234',
          'John Doe',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new CustomerReadModel(
          'customer-2',
          null,
          'business-123',
          '+18095551234',
          'John Doe',
          new Date('2024-01-02'),
          new Date('2024-01-02'),
        ),
      ];

      mockReadRepo.findByBusinessId.mockResolvedValue(customers);

      const query = new DetectDuplicateCustomersQuery('business-123', 0.8);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.length).toBe(1);
      const pair = result[0];

      // Verify symmetry: if we swap customer1 and customer2, the score should be the same
      const reverseScore = deduplicationService.comparePair(pair.customer2, pair.customer1, 0.8);
      expect(reverseScore).not.toBeNull();
      expect(reverseScore!.similarityScore).toBe(pair.similarityScore);
    });

    it('should return empty array when less than 2 customers', async () => {
      // Arrange - Edge Case: < 2 customers
      const customers: CustomerReadModel[] = [
        new CustomerReadModel(
          'customer-1',
          null,
          'business-123',
          '+18095551234',
          'John Doe',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
      ];

      mockReadRepo.findByBusinessId.mockResolvedValue(customers);

      const query = new DetectDuplicateCustomersQuery('business-123', 0.8);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when no customers', async () => {
      // Arrange - Edge Case: no customers
      mockReadRepo.findByBusinessId.mockResolvedValue([]);

      const query = new DetectDuplicateCustomersQuery('business-123', 0.8);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when no duplicates found', async () => {
      // Arrange
      const customers: CustomerReadModel[] = [
        new CustomerReadModel(
          'customer-1',
          null,
          'business-123',
          '+18095551234',
          'John Doe',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new CustomerReadModel(
          'customer-2',
          null,
          'business-123',
          '+18095559999',
          'Jane Smith',
          new Date('2024-01-02'),
          new Date('2024-01-02'),
        ),
        new CustomerReadModel(
          'customer-3',
          null,
          'business-123',
          '+18095558888',
          'Bob Johnson',
          new Date('2024-01-03'),
          new Date('2024-01-03'),
        ),
      ];

      mockReadRepo.findByBusinessId.mockResolvedValue(customers);

      const query = new DetectDuplicateCustomersQuery('business-123', 0.8);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual([]);
    });

    it('should sort results by similarity score (descending)', async () => {
      // Arrange
      const customers: CustomerReadModel[] = [
        new CustomerReadModel(
          'customer-1',
          null,
          'business-123',
          '+18095551234',
          'John Doe',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new CustomerReadModel(
          'customer-2',
          null,
          'business-123',
          '+18095551234',
          'John Doe', // Exact match
          new Date('2024-01-02'),
          new Date('2024-01-02'),
        ),
        new CustomerReadModel(
          'customer-3',
          null,
          'business-123',
          '+18095551234',
          'Jon Doe', // Similar but not exact
          new Date('2024-01-03'),
          new Date('2024-01-03'),
        ),
      ];

      mockReadRepo.findByBusinessId.mockResolvedValue(customers);

      const query = new DetectDuplicateCustomersQuery('business-123', 0.8);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.length).toBeGreaterThan(0);
      // Verify descending order
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].similarityScore).toBeGreaterThanOrEqual(result[i + 1].similarityScore);
      }
    });

    it('should handle customers with null names (Edge Case 5)', async () => {
      // Arrange - Edge Case 5: Detecting duplicates with null names
      const customers: CustomerReadModel[] = [
        new CustomerReadModel(
          'customer-1',
          null,
          'business-123',
          '+18095551234',
          null, // Anonymous customer
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new CustomerReadModel(
          'customer-2',
          null,
          'business-123',
          '+1 809 555 1234', // Same phone, different format
          null, // Anonymous customer
          new Date('2024-01-02'),
          new Date('2024-01-02'),
        ),
      ];

      mockReadRepo.findByBusinessId.mockResolvedValue(customers);

      const query = new DetectDuplicateCustomersQuery('business-123', 0.8);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].similarityScore).toBe(1.0); // 100% phone match
      expect(result[0].reasons).toContain('Mismo número de teléfono');
    });

    it('should detect duplicates with different phone formats', async () => {
      // Arrange
      const customers: CustomerReadModel[] = [
        new CustomerReadModel(
          'customer-1',
          null,
          'business-123',
          '+1 (809) 555-1234',
          'John Doe',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new CustomerReadModel(
          'customer-2',
          null,
          'business-123',
          '18095551234',
          'John Doe',
          new Date('2024-01-02'),
          new Date('2024-01-02'),
        ),
      ];

      mockReadRepo.findByBusinessId.mockResolvedValue(customers);

      const query = new DetectDuplicateCustomersQuery('business-123', 0.8);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].reasons).toContain('Mismo número de teléfono');
    });

    it('should use default threshold of 0.8 when not provided', async () => {
      // Arrange
      const customers: CustomerReadModel[] = [
        new CustomerReadModel(
          'customer-1',
          null,
          'business-123',
          '+18095551234',
          'John Doe',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new CustomerReadModel(
          'customer-2',
          null,
          'business-123',
          '+18095551234',
          'Jon Doe',
          new Date('2024-01-02'),
          new Date('2024-01-02'),
        ),
      ];

      mockReadRepo.findByBusinessId.mockResolvedValue(customers);

      // Query without explicit threshold (should use default 0.8)
      const query = new DetectDuplicateCustomersQuery('business-123');

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].similarityScore).toBeGreaterThanOrEqual(0.8);
    });

    it('should call repository with correct businessId', async () => {
      // Arrange
      const businessId = 'business-456';
      mockReadRepo.findByBusinessId.mockResolvedValue([]);

      const query = new DetectDuplicateCustomersQuery(businessId, 0.8);

      // Act
      await handler.execute(query);

      // Assert
      expect(mockReadRepo.findByBusinessId).toHaveBeenCalledWith(businessId);
      expect(mockReadRepo.findByBusinessId).toHaveBeenCalledTimes(1);
    });

    it('should include reasons in duplicate pairs', async () => {
      // Arrange
      const customers: CustomerReadModel[] = [
        new CustomerReadModel(
          'customer-1',
          null,
          'business-123',
          '+18095551234',
          'John Doe',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new CustomerReadModel(
          'customer-2',
          null,
          'business-123',
          '+18095551234',
          'John Doe',
          new Date('2024-01-02'),
          new Date('2024-01-02'),
        ),
      ];

      mockReadRepo.findByBusinessId.mockResolvedValue(customers);

      const query = new DetectDuplicateCustomersQuery('business-123', 0.8);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].reasons).toBeDefined();
      expect(Array.isArray(result[0].reasons)).toBe(true);
      expect(result[0].reasons.length).toBeGreaterThan(0);
    });
  });
});
