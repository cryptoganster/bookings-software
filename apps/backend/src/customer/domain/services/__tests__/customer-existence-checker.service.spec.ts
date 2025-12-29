import { CustomerExistenceChecker } from '../customer-existence-checker.service';
import { ICustomerReadRepository } from '../../interfaces/repositories/customer-read';
import { CustomerReadModel } from '../../read-models/customer';
import { CustomerNotFoundException } from '../../exceptions/customer-not-found';

describe('CustomerExistenceChecker', () => {
  let checker: CustomerExistenceChecker;
  let mockReadRepo: jest.Mocked<ICustomerReadRepository>;

  beforeEach(() => {
    mockReadRepo = {
      findById: jest.fn(),
      findByWhatsAppPhone: jest.fn(),
      findByBusinessId: jest.fn(),
      findByUserId: jest.fn(),
      findAnonymousByBusinessId: jest.fn(),
      search: jest.fn(),
      getStats: jest.fn(),
      getFullData: jest.fn(),
    } as jest.Mocked<ICustomerReadRepository>;

    checker = new CustomerExistenceChecker(mockReadRepo);
  });

  describe('exists', () => {
    it('should return true when customer exists', async () => {
      // Arrange
      const customerReadModel: CustomerReadModel = {
        id: 'customer-1',
        userId: null,
        businessId: 'business-1',
        whatsappPhone: '+18095551234',
        name: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReadRepo.findById.mockResolvedValue(customerReadModel);

      // Act
      const result = await checker.exists('customer-1');

      // Assert
      expect(result).toBe(true);
      expect(mockReadRepo.findById).toHaveBeenCalledWith('customer-1');
      expect(mockReadRepo.findById).toHaveBeenCalledTimes(1);
    });

    it('should return false when customer not found (throws exception)', async () => {
      // Arrange
      mockReadRepo.findById.mockRejectedValue(new CustomerNotFoundException('customer-999'));

      // Act
      const result = await checker.exists('customer-999');

      // Assert
      expect(result).toBe(false);
      expect(mockReadRepo.findById).toHaveBeenCalledWith('customer-999');
    });

    it('should return false when customer not found (returns null)', async () => {
      // Arrange
      // Note: findById throws exception, not returns null
      // This test is kept for completeness but won't be reached in practice
      mockReadRepo.findById.mockRejectedValue(new CustomerNotFoundException('customer-999'));

      // Act
      const result = await checker.exists('customer-999');

      // Assert
      expect(result).toBe(false);
      expect(mockReadRepo.findById).toHaveBeenCalledWith('customer-999');
    });

    it('should handle generic errors gracefully', async () => {
      // Arrange
      mockReadRepo.findById.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await checker.exists('customer-1');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getCustomer', () => {
    it('should return customer data when found', async () => {
      // Arrange
      const customerReadModel: CustomerReadModel = {
        id: 'customer-1',
        userId: 'user-1',
        businessId: 'business-1',
        whatsappPhone: '+18095551234',
        name: 'Jane Smith',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      mockReadRepo.findById.mockResolvedValue(customerReadModel);

      // Act
      const result = await checker.getCustomer('customer-1');

      // Assert
      expect(result).toEqual(customerReadModel);
      expect(result?.id).toBe('customer-1');
      expect(result?.userId).toBe('user-1');
      expect(result?.name).toBe('Jane Smith');
      expect(mockReadRepo.findById).toHaveBeenCalledWith('customer-1');
    });

    it('should return null when customer not found (throws exception)', async () => {
      // Arrange
      mockReadRepo.findById.mockRejectedValue(new CustomerNotFoundException('customer-999'));

      // Act
      const result = await checker.getCustomer('customer-999');

      // Assert
      expect(result).toBeNull();
      expect(mockReadRepo.findById).toHaveBeenCalledWith('customer-999');
    });

    it('should return null when customer not found (returns null)', async () => {
      // Arrange
      // Note: findById throws exception, not returns null
      // This test is kept for completeness but won't be reached in practice
      mockReadRepo.findById.mockRejectedValue(new CustomerNotFoundException('customer-999'));

      // Act
      const result = await checker.getCustomer('customer-999');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle anonymous customers correctly', async () => {
      // Arrange
      const anonymousCustomer: CustomerReadModel = {
        id: 'customer-2',
        userId: null, // ← Anonymous customer
        businessId: 'business-1',
        whatsappPhone: '+18095559999',
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReadRepo.findById.mockResolvedValue(anonymousCustomer);

      // Act
      const result = await checker.getCustomer('customer-2');

      // Assert
      expect(result).toEqual(anonymousCustomer);
      expect(result?.userId).toBeNull();
      expect(result?.name).toBeNull();
    });

    it('should handle registered customers correctly', async () => {
      // Arrange
      const registeredCustomer: CustomerReadModel = {
        id: 'customer-3',
        userId: 'user-123', // ← Registered customer
        businessId: 'business-1',
        whatsappPhone: '+18095558888',
        name: 'Bob Johnson',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReadRepo.findById.mockResolvedValue(registeredCustomer);

      // Act
      const result = await checker.getCustomer('customer-3');

      // Assert
      expect(result).toEqual(registeredCustomer);
      expect(result?.userId).toBe('user-123');
      expect(result?.name).toBe('Bob Johnson');
    });

    it('should handle generic errors gracefully', async () => {
      // Arrange
      mockReadRepo.findById.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await checker.getCustomer('customer-1');

      // Assert
      expect(result).toBeNull();
    });
  });
});
