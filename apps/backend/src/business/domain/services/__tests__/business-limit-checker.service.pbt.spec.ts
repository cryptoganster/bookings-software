import * as fc from 'fast-check';
import { BusinessLimitChecker } from '../business-limit-checker.service';
import { IBusinessReadRepository } from '../../interfaces/repositories/business-read';
import { IBusinessOwnerReadRepository } from '@account/domain/interfaces/repositories/business-owner-read.interface';
import { BusinessReadModel } from '../../read-models/business.read-model';
import { BusinessOwnerReadModel } from '@account/domain/read_models/business-owner.read-model';

describe('BusinessLimitChecker PBT', () => {
  describe('Property: Idempotence', () => {
    it('calling canCreateBusiness twice with same input returns same result', () => {
      fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          async (ownerId, currentCount, maxBusinesses) => {
            // Arrange
            const businesses: BusinessReadModel[] = Array.from(
              { length: currentCount },
              (_, i) => ({ id: `business-${i}`, ownerId }) as BusinessReadModel,
            );

            const owner: BusinessOwnerReadModel = {
              id: 'owner-1',
              userId: ownerId,
              subscriptionPlan: 'PRO',
              subscriptionStatus: 'ACTIVE',
              maxBusinesses,
              maxAppointmentsPerMonth: 2000,
              price: 79,
              onboardingCompleted: true,
              version: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const mockBusinessReadRepo = {
              findByOwnerId: jest.fn().mockResolvedValue(businesses),
              findById: jest.fn(),
              findByWhatsAppPhone: jest.fn(),
            } as jest.Mocked<IBusinessReadRepository>;

            const mockOwnerReadRepo = {
              findById: jest.fn(),
              findByUserId: jest.fn().mockResolvedValue(owner),
            } as jest.Mocked<IBusinessOwnerReadRepository>;

            const checker = new BusinessLimitChecker(mockBusinessReadRepo, mockOwnerReadRepo);

            // Act
            const result1 = await checker.canCreateBusiness(ownerId);
            const result2 = await checker.canCreateBusiness(ownerId);

            // Assert
            expect(result1).toBe(result2);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('calling getBusinessCount twice with same input returns same result', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), fc.integer({ min: 0, max: 10 }), async (ownerId, count) => {
          // Arrange
          const businesses: BusinessReadModel[] = Array.from(
            { length: count },
            (_, i) => ({ id: `business-${i}`, ownerId }) as BusinessReadModel,
          );

          const mockBusinessReadRepo = {
            findByOwnerId: jest.fn().mockResolvedValue(businesses),
            findById: jest.fn(),
            findByWhatsAppPhone: jest.fn(),
          } as jest.Mocked<IBusinessReadRepository>;

          const mockOwnerReadRepo = {
            findById: jest.fn(),
            findByUserId: jest.fn(),
          } as jest.Mocked<IBusinessOwnerReadRepository>;

          const checker = new BusinessLimitChecker(mockBusinessReadRepo, mockOwnerReadRepo);

          // Act
          const result1 = await checker.getBusinessCount(ownerId);
          const result2 = await checker.getBusinessCount(ownerId);

          // Assert
          expect(result1).toBe(result2);
          expect(result1).toBe(count);
        }),
        { numRuns: 100 },
      );
    });

    it('calling getMaxBusinessesAllowed twice with same input returns same result', () => {
      fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 1, max: 10 }),
          async (ownerId, maxBusinesses) => {
            // Arrange
            const owner: BusinessOwnerReadModel = {
              id: 'owner-1',
              userId: ownerId,
              subscriptionPlan: 'PRO',
              subscriptionStatus: 'ACTIVE',
              maxBusinesses,
              maxAppointmentsPerMonth: 2000,
              price: 79,
              onboardingCompleted: true,
              version: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const mockBusinessReadRepo = {
              findByOwnerId: jest.fn(),
              findById: jest.fn(),
              findByWhatsAppPhone: jest.fn(),
            } as jest.Mocked<IBusinessReadRepository>;

            const mockOwnerReadRepo = {
              findById: jest.fn(),
              findByUserId: jest.fn().mockResolvedValue(owner),
            } as jest.Mocked<IBusinessOwnerReadRepository>;

            const checker = new BusinessLimitChecker(mockBusinessReadRepo, mockOwnerReadRepo);

            // Act
            const result1 = await checker.getMaxBusinessesAllowed(ownerId);
            const result2 = await checker.getMaxBusinessesAllowed(ownerId);

            // Assert
            expect(result1).toBe(result2);
            expect(result1).toBe(maxBusinesses);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: Deterministic behavior', () => {
    it('returns true when current count < max allowed', () => {
      fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 0, max: 5 }),
          fc.integer({ min: 6, max: 10 }),
          async (ownerId, currentCount, maxBusinesses) => {
            // Arrange
            const businesses: BusinessReadModel[] = Array.from(
              { length: currentCount },
              (_, i) => ({ id: `business-${i}`, ownerId }) as BusinessReadModel,
            );

            const owner: BusinessOwnerReadModel = {
              id: 'owner-1',
              userId: ownerId,
              subscriptionPlan: 'PRO',
              subscriptionStatus: 'ACTIVE',
              maxBusinesses,
              maxAppointmentsPerMonth: 2000,
              price: 79,
              onboardingCompleted: true,
              version: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const mockBusinessReadRepo = {
              findByOwnerId: jest.fn().mockResolvedValue(businesses),
              findById: jest.fn(),
              findByWhatsAppPhone: jest.fn(),
            } as jest.Mocked<IBusinessReadRepository>;

            const mockOwnerReadRepo = {
              findById: jest.fn(),
              findByUserId: jest.fn().mockResolvedValue(owner),
            } as jest.Mocked<IBusinessOwnerReadRepository>;

            const checker = new BusinessLimitChecker(mockBusinessReadRepo, mockOwnerReadRepo);

            // Act
            const result = await checker.canCreateBusiness(ownerId);

            // Assert
            expect(result).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('returns false when current count >= max allowed', () => {
      fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 1, max: 10 }),
          async (ownerId, maxBusinesses) => {
            // Arrange - current count equals max
            const businesses: BusinessReadModel[] = Array.from(
              { length: maxBusinesses },
              (_, i) => ({ id: `business-${i}`, ownerId }) as BusinessReadModel,
            );

            const owner: BusinessOwnerReadModel = {
              id: 'owner-1',
              userId: ownerId,
              subscriptionPlan: 'PRO',
              subscriptionStatus: 'ACTIVE',
              maxBusinesses,
              maxAppointmentsPerMonth: 2000,
              price: 79,
              onboardingCompleted: true,
              version: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const mockBusinessReadRepo = {
              findByOwnerId: jest.fn().mockResolvedValue(businesses),
              findById: jest.fn(),
              findByWhatsAppPhone: jest.fn(),
            } as jest.Mocked<IBusinessReadRepository>;

            const mockOwnerReadRepo = {
              findById: jest.fn(),
              findByUserId: jest.fn().mockResolvedValue(owner),
            } as jest.Mocked<IBusinessOwnerReadRepository>;

            const checker = new BusinessLimitChecker(mockBusinessReadRepo, mockOwnerReadRepo);

            // Act
            const result = await checker.canCreateBusiness(ownerId);

            // Assert
            expect(result).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: No side effects', () => {
    it('does not modify repository state', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), async (ownerId) => {
          // Arrange
          const mockBusinessReadRepo = {
            findByOwnerId: jest.fn().mockResolvedValue([]),
            findById: jest.fn(),
            findByWhatsAppPhone: jest.fn(),
          } as jest.Mocked<IBusinessReadRepository>;

          const mockOwnerReadRepo = {
            findById: jest.fn(),
            findByUserId: jest.fn().mockResolvedValue({
              id: 'owner-1',
              userId: ownerId,
              maxBusinesses: 3,
            } as BusinessOwnerReadModel),
          } as jest.Mocked<IBusinessOwnerReadRepository>;

          const checker = new BusinessLimitChecker(mockBusinessReadRepo, mockOwnerReadRepo);

          // Act
          await checker.canCreateBusiness(ownerId);

          // Assert - only read operations called, no write operations
          expect(mockBusinessReadRepo.findByOwnerId).toHaveBeenCalled();
          expect(mockOwnerReadRepo.findByUserId).toHaveBeenCalled();
          expect(mockBusinessReadRepo.findById).not.toHaveBeenCalled();
          expect(mockBusinessReadRepo.findByWhatsAppPhone).not.toHaveBeenCalled();
          expect(mockOwnerReadRepo.findById).not.toHaveBeenCalled();
        }),
        { numRuns: 100 },
      );
    });
  });
});
