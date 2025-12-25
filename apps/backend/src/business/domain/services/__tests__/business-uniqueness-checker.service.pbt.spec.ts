import * as fc from 'fast-check';
import { BusinessUniquenessChecker } from '../business-uniqueness-checker.service';
import { IBusinessReadRepository } from '../../interfaces/repositories/business-read';

describe('BusinessUniquenessChecker PBT', () => {
  describe('Property: Idempotence', () => {
    it('calling isWhatsAppPhoneUnique twice with same input returns same result', () => {
      fc.assert(
        fc.asyncProperty(fc.string({ minLength: 10, maxLength: 15 }), async (phone) => {
          // Arrange
          const mockReadRepo: jest.Mocked<IBusinessReadRepository> = {
            findByWhatsAppPhone: jest.fn().mockResolvedValue(null),
            findById: jest.fn(),
            findByOwnerId: jest.fn(),
          } as any;

          const checker = new BusinessUniquenessChecker(mockReadRepo);

          // Act
          const result1 = await checker.isWhatsAppPhoneUnique(phone);
          const result2 = await checker.isWhatsAppPhoneUnique(phone);

          // Assert
          expect(result1).toBe(result2);
          expect(mockReadRepo.findByWhatsAppPhone).toHaveBeenCalledTimes(2);
          expect(mockReadRepo.findByWhatsAppPhone).toHaveBeenCalledWith(phone);
        }),
        { numRuns: 100 },
      );
    });

    it('calling isWhatsAppPhoneUnique with excludeBusinessId is idempotent', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 15 }),
          fc.option(fc.uuid(), { nil: undefined }),
          async (phone, excludeBusinessId) => {
            // Arrange
            const mockReadRepo: jest.Mocked<IBusinessReadRepository> = {
              findByWhatsAppPhone: jest.fn().mockResolvedValue({
                id: 'business-1',
                whatsappPhone: phone,
              }),
              findById: jest.fn(),
              findByOwnerId: jest.fn(),
            } as any;

            const checker = new BusinessUniquenessChecker(mockReadRepo);

            // Act
            const result1 = await checker.isWhatsAppPhoneUnique(phone, excludeBusinessId);
            const result2 = await checker.isWhatsAppPhoneUnique(phone, excludeBusinessId);

            // Assert
            expect(result1).toBe(result2);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: Deterministic behavior', () => {
    it('returns true when repository returns null', () => {
      fc.assert(
        fc.asyncProperty(fc.string({ minLength: 10, maxLength: 15 }), async (phone) => {
          // Arrange
          const mockReadRepo: jest.Mocked<IBusinessReadRepository> = {
            findByWhatsAppPhone: jest.fn().mockResolvedValue(null),
            findById: jest.fn(),
            findByOwnerId: jest.fn(),
          } as any;

          const checker = new BusinessUniquenessChecker(mockReadRepo);

          // Act
          const result = await checker.isWhatsAppPhoneUnique(phone);

          // Assert
          expect(result).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it('returns false when repository returns different business', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 15 }),
          fc.uuid(),
          async (phone, businessId) => {
            // Arrange
            const mockReadRepo: jest.Mocked<IBusinessReadRepository> = {
              findByWhatsAppPhone: jest.fn().mockResolvedValue({
                id: businessId,
                whatsappPhone: phone,
              }),
              findById: jest.fn(),
              findByOwnerId: jest.fn(),
            } as any;

            const checker = new BusinessUniquenessChecker(mockReadRepo);

            // Act
            const result = await checker.isWhatsAppPhoneUnique(phone);

            // Assert
            expect(result).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('returns true when repository returns same business (update scenario)', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 15 }),
          fc.uuid(),
          async (phone, businessId) => {
            // Arrange
            const mockReadRepo: jest.Mocked<IBusinessReadRepository> = {
              findByWhatsAppPhone: jest.fn().mockResolvedValue({
                id: businessId,
                whatsappPhone: phone,
              }),
              findById: jest.fn(),
              findByOwnerId: jest.fn(),
            } as any;

            const checker = new BusinessUniquenessChecker(mockReadRepo);

            // Act
            const result = await checker.isWhatsAppPhoneUnique(phone, businessId);

            // Assert
            expect(result).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: No side effects', () => {
    it('does not modify repository state', () => {
      fc.assert(
        fc.asyncProperty(fc.string({ minLength: 10, maxLength: 15 }), async (phone) => {
          // Arrange
          const mockReadRepo: jest.Mocked<IBusinessReadRepository> = {
            findByWhatsAppPhone: jest.fn().mockResolvedValue(null),
            findById: jest.fn(),
            findByOwnerId: jest.fn(),
          } as any;

          const checker = new BusinessUniquenessChecker(mockReadRepo);

          // Act
          await checker.isWhatsAppPhoneUnique(phone);

          // Assert - only read operation called, no write operations
          expect(mockReadRepo.findByWhatsAppPhone).toHaveBeenCalled();
          expect(mockReadRepo.findById).not.toHaveBeenCalled();
          expect(mockReadRepo.findByOwnerId).not.toHaveBeenCalled();
        }),
        { numRuns: 100 },
      );
    });
  });
});
