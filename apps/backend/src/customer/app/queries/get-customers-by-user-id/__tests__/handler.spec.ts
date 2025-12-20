import { Test, TestingModule } from '@nestjs/testing';
import { GetCustomersByUserIdHandler } from '../handler';
import { GetCustomersByUserIdQuery } from '../query';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories/customer-read';
import { CustomerReadModel } from '@customer/domain/read-models/customer';
import { UUID } from '@shared/vo/uuid';

/**
 * Unit tests for GetCustomersByUserIdHandler
 *
 * Tests the handler logic for retrieving all customers linked to a user including:
 * - Successful retrieval of multiple customers
 * - Empty array when no customers found
 * - Marketplace scenario support
 *
 * **Validates: Requirements 2.1.3, 9.1.5**
 */
describe('GetCustomersByUserIdHandler', () => {
  let handler: GetCustomersByUserIdHandler;
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
        GetCustomersByUserIdHandler,
        {
          provide: 'ICustomerReadRepository',
          useValue: mockReadRepo,
        },
      ],
    }).compile();

    handler = module.get<GetCustomersByUserIdHandler>(GetCustomersByUserIdHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all customers linked to user', async () => {
      // Arrange
      const userId = UUID.generate().getValue();
      const business1 = UUID.generate().getValue();
      const business2 = UUID.generate().getValue();

      const customers = [
        new CustomerReadModel(
          UUID.generate().getValue(),
          userId,
          business1,
          '+18095551234',
          'Customer 1',
          new Date(),
          new Date(),
        ),
        new CustomerReadModel(
          UUID.generate().getValue(),
          userId,
          business2,
          '+18095555678',
          'Customer 2',
          new Date(),
          new Date(),
        ),
      ];

      mockReadRepo.findByUserId.mockResolvedValue(customers);

      const query = new GetCustomersByUserIdQuery(userId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockReadRepo.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(userId);
      expect(result[1].userId).toBe(userId);
    });

    it('should return empty array when user has no customers', async () => {
      // Arrange
      const userId = UUID.generate().getValue();

      mockReadRepo.findByUserId.mockResolvedValue([]);

      const query = new GetCustomersByUserIdQuery(userId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockReadRepo.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should support marketplace scenario (user with multiple customer profiles)', async () => {
      // Arrange - Juan (abogado) es cliente del dentista y del mecánico
      const userId = UUID.generate().getValue();
      const dentistBusinessId = UUID.generate().getValue();
      const mechanicBusinessId = UUID.generate().getValue();

      const customers = [
        new CustomerReadModel(
          UUID.generate().getValue(),
          userId,
          dentistBusinessId,
          '+18095551111',
          'Juan López',
          new Date(),
          new Date(),
        ),
        new CustomerReadModel(
          UUID.generate().getValue(),
          userId,
          mechanicBusinessId,
          '+18095552222',
          'Juan López',
          new Date(),
          new Date(),
        ),
      ];

      mockReadRepo.findByUserId.mockResolvedValue(customers);

      const query = new GetCustomersByUserIdQuery(userId);

      // Act
      const result = await handler.execute(query);

      // Assert - User has customer profiles in multiple businesses
      expect(result).toHaveLength(2);
      expect(result[0].businessId).toBe(dentistBusinessId);
      expect(result[1].businessId).toBe(mechanicBusinessId);
      expect(result[0].userId).toBe(userId);
      expect(result[1].userId).toBe(userId);
    });

    it('should only return registered customers (not anonymous)', async () => {
      // Arrange
      const userId = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();

      const customers = [
        new CustomerReadModel(
          UUID.generate().getValue(),
          userId, // Registered
          businessId,
          '+18095559999',
          'Registered Customer',
          new Date(),
          new Date(),
        ),
      ];

      mockReadRepo.findByUserId.mockResolvedValue(customers);

      const query = new GetCustomersByUserIdQuery(userId);

      // Act
      const result = await handler.execute(query);

      // Assert - All returned customers have userId
      expect(result.every((c) => c.userId === userId)).toBe(true);
      expect(result.every((c) => c.userId !== null)).toBe(true);
    });

    it('should handle single customer profile', async () => {
      // Arrange
      const userId = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();

      const customers = [
        new CustomerReadModel(
          UUID.generate().getValue(),
          userId,
          businessId,
          '+18095558888',
          'Single Customer',
          new Date(),
          new Date(),
        ),
      ];

      mockReadRepo.findByUserId.mockResolvedValue(customers);

      const query = new GetCustomersByUserIdQuery(userId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(userId);
    });
  });
});
