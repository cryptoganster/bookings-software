import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFactory } from '../user-factory';
import { UserModel } from '../../models/user';
import { User } from '@auth/domain/aggregates/user';

describe('UserFactory', () => {
  let factory: UserFactory;
  let repository: Repository<UserModel>;

  const mockUserModel: UserModel = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    name: 'Test User',
    businessId: '550e8400-e29b-41d4-a716-446655440002',
    version: 5,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserFactory,
        {
          provide: getRepositoryToken(UserModel),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    factory = module.get<UserFactory>(UserFactory);
    repository = module.get<Repository<UserModel>>(getRepositoryToken(UserModel));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadById', () => {
    it('should reconstruct User aggregate with correct version', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUserModel);

      // Act
      const user = await factory.loadById(mockUserModel.id);

      // Assert
      expect(user).toBeDefined();
      expect(user).toBeInstanceOf(User);
      expect(user!.getId().getValue()).toBe(mockUserModel.id);
      expect(user!.getEmail().getValue()).toBe(mockUserModel.email);
      expect(user!.getName()).toBe(mockUserModel.name);
      expect(user!.getVersion().getValue()).toBe(5);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockUserModel.id },
      });
    });

    it('should return null when user not found', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // Act
      const user = await factory.loadById('non-existent-id');

      // Assert
      expect(user).toBeNull();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
    });

    it('should reconstruct aggregate with business logic available', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUserModel);

      // Act
      const user = await factory.loadById(mockUserModel.id);

      // Assert
      expect(user).toBeDefined();
      // Verify business logic methods are available
      expect(typeof user!.validatePassword).toBe('function');
      expect(typeof user!.getId).toBe('function');
      expect(typeof user!.getEmail).toBe('function');
    });

    it('should handle user without businessId', async () => {
      // Arrange
      const modelWithoutBusiness = { ...mockUserModel, businessId: null };
      jest.spyOn(repository, 'findOne').mockResolvedValue(modelWithoutBusiness);

      // Act
      const user = await factory.loadById(mockUserModel.id);

      // Assert
      expect(user).toBeDefined();
      expect(user!.getBusinessId()).toBeNull();
    });
  });

  describe('loadByEmail', () => {
    it('should reconstruct User aggregate by email', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUserModel);

      // Act
      const user = await factory.loadByEmail(mockUserModel.email);

      // Assert
      expect(user).toBeDefined();
      expect(user).toBeInstanceOf(User);
      expect(user!.getEmail().getValue()).toBe(mockUserModel.email);
      expect(user!.getVersion().getValue()).toBe(5);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: mockUserModel.email.toLowerCase() },
      });
    });

    it('should return null when user not found by email', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // Act
      const user = await factory.loadByEmail('nonexistent@example.com');

      // Assert
      expect(user).toBeNull();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });

    it('should handle email case-insensitively', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUserModel);

      // Act
      const user = await factory.loadByEmail('TEST@EXAMPLE.COM');

      // Assert
      expect(user).toBeDefined();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should preserve version for optimistic locking', async () => {
      // Arrange
      const modelWithDifferentVersion = { ...mockUserModel, version: 10 };
      jest.spyOn(repository, 'findOne').mockResolvedValue(modelWithDifferentVersion);

      // Act
      const user = await factory.loadByEmail(mockUserModel.email);

      // Assert
      expect(user).toBeDefined();
      expect(user!.getVersion().getValue()).toBe(10);
    });
  });
});
