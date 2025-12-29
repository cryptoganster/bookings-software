import { UserUniquenessChecker } from '../user-uniqueness-checker.service';
import { IUserReadRepository } from '../../interfaces/repositories/user-read';
import { UserReadModel } from '../../read-models/user';
import { UserRole } from '../../vo/user-role';

describe('UserUniquenessChecker', () => {
  let checker: UserUniquenessChecker;
  let mockReadRepo: jest.Mocked<IUserReadRepository>;

  beforeEach(() => {
    mockReadRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    } as jest.Mocked<IUserReadRepository>;

    checker = new UserUniquenessChecker(mockReadRepo);
  });

  describe('isEmailUnique', () => {
    it('should return true when email not found', async () => {
      // Arrange
      mockReadRepo.findByEmail.mockResolvedValue(null);

      // Act
      const result = await checker.isEmailUnique('newuser@example.com');

      // Assert
      expect(result).toBe(true);
      expect(mockReadRepo.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(mockReadRepo.findByEmail).toHaveBeenCalledTimes(1);
    });

    it('should return false when email exists', async () => {
      // Arrange
      const existingUser: UserReadModel = {
        id: 'user-1',
        email: 'existing@example.com',
        name: 'Existing User',
        roles: [UserRole.BUSINESS_OWNER],
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
      };

      mockReadRepo.findByEmail.mockResolvedValue(existingUser);

      // Act
      const result = await checker.isEmailUnique('existing@example.com');

      // Assert
      expect(result).toBe(false);
      expect(mockReadRepo.findByEmail).toHaveBeenCalledWith('existing@example.com');
    });

    it('should handle null results gracefully', async () => {
      // Arrange
      mockReadRepo.findByEmail.mockResolvedValue(null);

      // Act
      const result = await checker.isEmailUnique('unique@example.com');

      // Assert
      expect(result).toBe(true);
      expect(mockReadRepo.findByEmail).toHaveBeenCalledWith('unique@example.com');
    });

    it('should be case-sensitive for email comparison', async () => {
      // Arrange
      const existingUser: UserReadModel = {
        id: 'user-1',
        email: 'User@Example.com',
        name: 'Test User',
        roles: [UserRole.CUSTOMER],
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
      };

      mockReadRepo.findByEmail.mockResolvedValue(existingUser);

      // Act
      const result = await checker.isEmailUnique('User@Example.com');

      // Assert
      expect(result).toBe(false);
      expect(mockReadRepo.findByEmail).toHaveBeenCalledWith('User@Example.com');
    });

    it('should work with different email formats', async () => {
      // Arrange
      mockReadRepo.findByEmail.mockResolvedValue(null);

      // Act & Assert
      expect(await checker.isEmailUnique('simple@example.com')).toBe(true);
      expect(await checker.isEmailUnique('user+tag@example.com')).toBe(true);
      expect(await checker.isEmailUnique('user.name@example.co.uk')).toBe(true);
    });

    it('should handle repository errors by propagating them', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockReadRepo.findByEmail.mockRejectedValue(error);

      // Act & Assert
      await expect(checker.isEmailUnique('test@example.com')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
