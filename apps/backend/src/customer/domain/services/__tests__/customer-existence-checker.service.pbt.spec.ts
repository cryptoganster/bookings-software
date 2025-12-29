import * as fc from 'fast-check';
import { CustomerExistenceChecker } from '../customer-existence-checker.service';
import { ICustomerReadRepository } from '../../interfaces/repositories/customer-read';
import { CustomerReadModel } from '../../read-models/customer';

/**
 * Property-Based Tests for CustomerExistenceChecker
 *
 * **Feature: architecture-compliance-refactor**
 * **Validates: Requirements 19.1, 19.2, 19.3, 19.4**
 */
describe('CustomerExistenceChecker PBT', () => {
  describe('Property 1: Idempotence - exists()', () => {
    /**
     * **Feature: architecture-compliance-refactor, Property 1: Idempotence**
     * **Validates: Requirements 19.2**
     *
     * Calling exists() twice with same input returns same result
     */
    it('calling exists twice with same customerId returns same result', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), async (customerId) => {
          // Arrange
          const mockReadRepo: jest.Mocked<ICustomerReadRepository> = {
            findById: jest.fn().mockResolvedValue({
              id: customerId,
              userId: null,
              businessId: 'business-1',
              whatsappPhone: '+18095551234',
              name: 'Test Customer',
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
            findByWhatsAppPhone: jest.fn(),
            findByBusinessId: jest.fn(),
            findByUserId: jest.fn(),
            findAnonymousByBusinessId: jest.fn(),
            search: jest.fn(),
            getStats: jest.fn(),
            getFullData: jest.fn(),
          } as jest.Mocked<ICustomerReadRepository>;

          const checker = new CustomerExistenceChecker(mockReadRepo);

          // Act
          const result1 = await checker.exists(customerId);
          const result2 = await checker.exists(customerId);

          // Assert
          expect(result1).toBe(result2);
          expect(mockReadRepo.findById).toHaveBeenCalledTimes(2);
          expect(mockReadRepo.findById).toHaveBeenCalledWith(customerId);
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Feature: architecture-compliance-refactor, Property 1: Idempotence**
     * **Validates: Requirements 19.2**
     *
     * Calling exists() for non-existent customer is idempotent
     */
    it('calling exists for non-existent customer is idempotent', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), async (customerId) => {
          // Arrange
          const mockReadRepo: jest.Mocked<ICustomerReadRepository> = {
            findById: jest.fn().mockResolvedValue(null),
            findByWhatsAppPhone: jest.fn(),
            findByBusinessId: jest.fn(),
            findByUserId: jest.fn(),
            findAnonymousByBusinessId: jest.fn(),
            search: jest.fn(),
            getStats: jest.fn(),
            getFullData: jest.fn(),
          } as jest.Mocked<ICustomerReadRepository>;

          const checker = new CustomerExistenceChecker(mockReadRepo);

          // Act
          const result1 = await checker.exists(customerId);
          const result2 = await checker.exists(customerId);

          // Assert
          expect(result1).toBe(false);
          expect(result2).toBe(false);
          expect(result1).toBe(result2);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 2: Idempotence - getCustomer()', () => {
    /**
     * **Feature: architecture-compliance-refactor, Property 2: Idempotence**
     * **Validates: Requirements 19.2**
     *
     * Calling getCustomer() twice with same input returns same result
     */
    it('calling getCustomer twice with same customerId returns same result', () => {
      fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.option(fc.uuid(), { nil: null }),
          fc.string({ minLength: 10, maxLength: 15 }),
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          async (customerId, userId, whatsappPhone, name) => {
            // Arrange
            const customerData: CustomerReadModel = {
              id: customerId,
              userId,
              businessId: 'business-1',
              whatsappPhone,
              name,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const mockReadRepo: jest.Mocked<ICustomerReadRepository> = {
              findById: jest.fn().mockResolvedValue(customerData),
              findByWhatsAppPhone: jest.fn(),
              findByBusinessId: jest.fn(),
              findByUserId: jest.fn(),
              findAnonymousByBusinessId: jest.fn(),
              search: jest.fn(),
              getStats: jest.fn(),
              getFullData: jest.fn(),
            } as jest.Mocked<ICustomerReadRepository>;

            const checker = new CustomerExistenceChecker(mockReadRepo);

            // Act
            const result1 = await checker.getCustomer(customerId);
            const result2 = await checker.getCustomer(customerId);

            // Assert
            expect(result1).toEqual(result2);
            expect(result1?.id).toBe(customerId);
            expect(result1?.userId).toBe(userId);
            expect(result1?.name).toBe(name);
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Feature: architecture-compliance-refactor, Property 2: Idempotence**
     * **Validates: Requirements 19.2**
     *
     * Calling getCustomer() for non-existent customer is idempotent
     */
    it('calling getCustomer for non-existent customer is idempotent', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), async (customerId) => {
          // Arrange
          const mockReadRepo: jest.Mocked<ICustomerReadRepository> = {
            findById: jest.fn().mockResolvedValue(null),
            findByWhatsAppPhone: jest.fn(),
            findByBusinessId: jest.fn(),
            findByUserId: jest.fn(),
            findAnonymousByBusinessId: jest.fn(),
            search: jest.fn(),
            getStats: jest.fn(),
            getFullData: jest.fn(),
          } as jest.Mocked<ICustomerReadRepository>;

          const checker = new CustomerExistenceChecker(mockReadRepo);

          // Act
          const result1 = await checker.getCustomer(customerId);
          const result2 = await checker.getCustomer(customerId);

          // Assert
          expect(result1).toBeNull();
          expect(result2).toBeNull();
          expect(result1).toBe(result2);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 3: Deterministic behavior', () => {
    /**
     * **Feature: architecture-compliance-refactor, Property 3: Deterministic behavior**
     * **Validates: Requirements 19.2**
     *
     * exists() returns true when repository returns customer data
     */
    it('exists returns true when repository returns customer data', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), async (customerId) => {
          // Arrange
          const mockReadRepo: jest.Mocked<ICustomerReadRepository> = {
            findById: jest.fn().mockResolvedValue({
              id: customerId,
              userId: null,
              businessId: 'business-1',
              whatsappPhone: '+18095551234',
              name: 'Test',
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
            findByWhatsAppPhone: jest.fn(),
            findByBusinessId: jest.fn(),
            findByUserId: jest.fn(),
            findAnonymousByBusinessId: jest.fn(),
            search: jest.fn(),
            getStats: jest.fn(),
            getFullData: jest.fn(),
          } as jest.Mocked<ICustomerReadRepository>;

          const checker = new CustomerExistenceChecker(mockReadRepo);

          // Act
          const result = await checker.exists(customerId);

          // Assert
          expect(result).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Feature: architecture-compliance-refactor, Property 3: Deterministic behavior**
     * **Validates: Requirements 19.2**
     *
     * exists() returns false when repository returns null
     */
    it('exists returns false when repository returns null', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), async (customerId) => {
          // Arrange
          const mockReadRepo: jest.Mocked<ICustomerReadRepository> = {
            findById: jest.fn().mockResolvedValue(null),
            findByWhatsAppPhone: jest.fn(),
            findByBusinessId: jest.fn(),
            findByUserId: jest.fn(),
            findAnonymousByBusinessId: jest.fn(),
            search: jest.fn(),
            getStats: jest.fn(),
            getFullData: jest.fn(),
          } as jest.Mocked<ICustomerReadRepository>;

          const checker = new CustomerExistenceChecker(mockReadRepo);

          // Act
          const result = await checker.exists(customerId);

          // Assert
          expect(result).toBe(false);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 4: No side effects', () => {
    /**
     * **Feature: architecture-compliance-refactor, Property 4: No side effects**
     * **Validates: Requirements 19.2**
     *
     * Service does not modify repository state
     */
    it('does not modify repository state', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), async (customerId) => {
          // Arrange
          const mockReadRepo: jest.Mocked<ICustomerReadRepository> = {
            findById: jest.fn().mockResolvedValue(null),
            findByWhatsAppPhone: jest.fn(),
            findByBusinessId: jest.fn(),
            findByUserId: jest.fn(),
            findAnonymousByBusinessId: jest.fn(),
            search: jest.fn(),
            getStats: jest.fn(),
            getFullData: jest.fn(),
          } as jest.Mocked<ICustomerReadRepository>;

          const checker = new CustomerExistenceChecker(mockReadRepo);

          // Act
          await checker.exists(customerId);
          await checker.getCustomer(customerId);

          // Assert - only read operation called, no write operations
          expect(mockReadRepo.findById).toHaveBeenCalled();
          expect(mockReadRepo.findByWhatsAppPhone).not.toHaveBeenCalled();
          expect(mockReadRepo.findByBusinessId).not.toHaveBeenCalled();
          expect(mockReadRepo.findByUserId).not.toHaveBeenCalled();
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 5: Consistency between exists() and getCustomer()', () => {
    /**
     * **Feature: architecture-compliance-refactor, Property 5: Consistency**
     * **Validates: Requirements 19.2**
     *
     * If exists() returns true, getCustomer() should return data
     * If exists() returns false, getCustomer() should return null
     */
    it('exists and getCustomer are consistent', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), fc.boolean(), async (customerId, shouldExist) => {
          // Arrange
          const customerData = shouldExist
            ? {
                id: customerId,
                userId: null,
                businessId: 'business-1',
                whatsappPhone: '+18095551234',
                name: 'Test',
                createdAt: new Date(),
                updatedAt: new Date(),
              }
            : null;

          const mockReadRepo: jest.Mocked<ICustomerReadRepository> = {
            findById: jest.fn().mockResolvedValue(customerData),
            findByWhatsAppPhone: jest.fn(),
            findByBusinessId: jest.fn(),
            findByUserId: jest.fn(),
            findAnonymousByBusinessId: jest.fn(),
            search: jest.fn(),
            getStats: jest.fn(),
            getFullData: jest.fn(),
          } as jest.Mocked<ICustomerReadRepository>;

          const checker = new CustomerExistenceChecker(mockReadRepo);

          // Act
          const exists = await checker.exists(customerId);
          const customer = await checker.getCustomer(customerId);

          // Assert
          if (exists) {
            expect(customer).not.toBeNull();
            expect(customer?.id).toBe(customerId);
          } else {
            expect(customer).toBeNull();
          }
        }),
        { numRuns: 100 },
      );
    });
  });
});
