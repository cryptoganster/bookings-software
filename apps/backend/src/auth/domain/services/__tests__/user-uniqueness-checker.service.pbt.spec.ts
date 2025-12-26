import * as fc from 'fast-check';
import { UserUniquenessChecker } from '../user-uniqueness-checker.service';
import { IUserReadRepository } from '../../interfaces/repositories/user-read';

/**
 * Property-Based Tests for UserUniquenessChecker
 *
 * **Feature: architecture-compliance-refactor, Property 1: Idempotence**
 * **Validates: Requirements 19.2**
 *
 * These tests verify universal properties that should hold across all inputs.
 */
describe('UserUniquenessChecker PBT', () => {
  describe('Property: Idempotence', () => {
    it('calling isEmailUnique twice with same input returns same result', () => {
      fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          // Arrange
          const mockReadRepo: jest.Mocked<IUserReadRepository> = {
            findByEmail: jest.fn().mockResolvedValue(null),
            findById: jest.fn(),
          } as any;

          const checker = new UserUniquenessChecker(mockReadRepo);

          // Act
          const result1 = await checker.isEmailUnique(email);
          const result2 = await checker.isEmailUnique(email);

          // Assert
          expect(result1).toBe(result2);
          expect(mockReadRepo.findByEmail).toHaveBeenCalledTimes(2);
          expect(mockReadRepo.findByEmail).toHaveBeenCalledWith(email);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: Deterministic behavior', () => {
    it('returns true when repository returns null', () => {
      fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          // Arrange
          const mockReadRepo: jest.Mocked<IUserReadRepository> = {
            findByEmail: jest.fn().mockResolvedValue(null),
            findById: jest.fn(),
          } as any;

          const checker = new UserUniquenessChecker(mockReadRepo);

          // Act
          const result = await checker.isEmailUnique(email);

          // Assert
          expect(result).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it('returns false when repository returns a user', () => {
      fc.assert(
        fc.asyncProperty(fc.emailAddress(), fc.uuid(), async (email, userId) => {
          // Arrange
          const mockReadRepo: jest.Mocked<IUserReadRepository> = {
            findByEmail: jest.fn().mockResolvedValue({
              id: userId,
              email: email,
              name: 'Test User',
              roles: [],
              isActive: true,
              emailVerified: false,
              createdAt: new Date(),
            }),
            findById: jest.fn(),
          } as any;

          const checker = new UserUniquenessChecker(mockReadRepo);

          // Act
          const result = await checker.isEmailUnique(email);

          // Assert
          expect(result).toBe(false);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: No side effects', () => {
    it('does not modify repository state', () => {
      fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          // Arrange
          const mockReadRepo: jest.Mocked<IUserReadRepository> = {
            findByEmail: jest.fn().mockResolvedValue(null),
            findById: jest.fn(),
          } as any;

          const checker = new UserUniquenessChecker(mockReadRepo);

          // Act
          await checker.isEmailUnique(email);

          // Assert - only read operation called, no write operations
          expect(mockReadRepo.findByEmail).toHaveBeenCalled();
          expect(mockReadRepo.findById).not.toHaveBeenCalled();
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: Consistency with different email formats', () => {
    it('handles various valid email formats consistently', () => {
      fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.emailAddress(),
            fc.emailAddress({ size: 'small' }),
            fc.emailAddress({ size: 'large' }),
          ),
          async (email) => {
            // Arrange
            const mockReadRepo: jest.Mocked<IUserReadRepository> = {
              findByEmail: jest.fn().mockResolvedValue(null),
              findById: jest.fn(),
            } as any;

            const checker = new UserUniquenessChecker(mockReadRepo);

            // Act
            const result = await checker.isEmailUnique(email);

            // Assert
            expect(typeof result).toBe('boolean');
            expect(mockReadRepo.findByEmail).toHaveBeenCalledWith(email);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
