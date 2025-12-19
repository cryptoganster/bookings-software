import { Test, TestingModule } from '@nestjs/testing';
import { GetCustomerHandler } from '../handler';
import { GetCustomerQuery } from '../query';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories/customer-read';
import { CustomerReadModel } from '@customer/domain/read-models/customer';
import { CustomerNotFoundException } from '@customer/domain/exceptions/customer-not-found';
import { UUID } from '@shared/vo/uuid';

/**
 * Unit tests for GetCustomerHandler
 *
 * Tests the handler logic for retrieving customer by ID including:
 * - Successful retrieval
 * - Error handling for non-existent customers
 *
 * **Validates: Requirements 2.5, 6.4**
 */
describe('GetCustomerHandler', () => {
  let handler: GetCustomerHandler;
  let mockReadRepo: jest.Mocked<ICustomerReadRepository>;

  beforeEach(async () => {
    mockReadRepo = {
      search: jest.fn(),
      findById: jest.fn() as any,
      findByWhatsAppPhone: jest.fn(),
      findByBusinessId: jest.fn(),
      findByUserId: jest.fn(),
      findAnonymousByBusinessId: jest.fn(),
    } as jest.Mocked<ICustomerReadRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCustomerHandler,
        {
          provide: 'ICustomerReadRepository',
          useValue: mockReadRepo,
        },
      ],
    }).compile();

    handler = module.get<GetCustomerHandler>(GetCustomerHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return customer read model when customer exists', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();

      const readModel = new CustomerReadModel(
        customerId,
        null,
        businessId,
        '+18095551234',
        'Test Customer',
        new Date(),
        new Date(),
      );

      mockReadRepo.findById.mockResolvedValue(readModel);

      const query = new GetCustomerQuery(customerId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockReadRepo.findById).toHaveBeenCalledWith(customerId);
      expect(result).toBe(readModel);
      expect(result.id).toBe(customerId);
      expect(result.name).toBe('Test Customer');
    });

    it('should throw CustomerNotFoundException when customer does not exist', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();

      mockReadRepo.findById.mockRejectedValue(new CustomerNotFoundException(customerId));

      const query = new GetCustomerQuery(customerId);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(CustomerNotFoundException);
      expect(mockReadRepo.findById).toHaveBeenCalledWith(customerId);
    });

    it('should return anonymous customer (userId null)', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();

      const readModel = new CustomerReadModel(
        customerId,
        null, // Anonymous
        businessId,
        '+18095555678',
        'Anonymous Customer',
        new Date(),
        new Date(),
      );

      mockReadRepo.findById.mockResolvedValue(readModel);

      const query = new GetCustomerQuery(customerId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.userId).toBeNull();
    });

    it('should return registered customer (userId not null)', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const userId = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();

      const readModel = new CustomerReadModel(
        customerId,
        userId, // Registered
        businessId,
        '+18095559999',
        'Registered Customer',
        new Date(),
        new Date(),
      );

      mockReadRepo.findById.mockResolvedValue(readModel);

      const query = new GetCustomerQuery(customerId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.userId).toBe(userId);
    });
  });
});
