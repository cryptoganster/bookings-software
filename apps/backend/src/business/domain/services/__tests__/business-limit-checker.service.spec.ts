import { BusinessLimitChecker } from '../business-limit-checker.service';
import { IBusinessReadRepository } from '../../interfaces/repositories/business-read';
import { IBusinessOwnerReadRepository } from '@account/domain/interfaces/repositories/business-owner-read.interface';
import { BusinessReadModel } from '../../read-models/business.read-model';
import { BusinessOwnerReadModel } from '@account/domain/read_models/business-owner.read-model';
import { BusinessOwnerNotFoundException } from '../../exceptions/business-owner-not-found';

describe('BusinessLimitChecker', () => {
  let checker: BusinessLimitChecker;
  let mockBusinessReadRepo: jest.Mocked<IBusinessReadRepository>;
  let mockOwnerReadRepo: jest.Mocked<IBusinessOwnerReadRepository>;

  beforeEach(() => {
    mockBusinessReadRepo = {
      findByOwnerId: jest.fn(),
      findById: jest.fn(),
      findByWhatsAppPhone: jest.fn(),
    } as jest.Mocked<IBusinessReadRepository>;

    mockOwnerReadRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
    } as jest.Mocked<IBusinessOwnerReadRepository>;

    checker = new BusinessLimitChecker(mockBusinessReadRepo, mockOwnerReadRepo);
  });

  describe('canCreateBusiness', () => {
    it('should return true when under limit', async () => {
      // Arrange
      const ownerId = 'owner-1';
      const businesses: BusinessReadModel[] = [
        {
          id: 'business-1',
          ownerId,
          name: 'Business 1',
          whatsappPhone: '+18095551234',
          addressStreet: '123 Main St',
          addressCity: 'Santo Domingo',
          addressState: 'DN',
          addressCountry: 'DO',
          addressPostalCode: '10001',
          timezone: 'America/Santo_Domingo',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        },
      ];

      const owner: BusinessOwnerReadModel = {
        id: 'owner-1',
        userId: ownerId,
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        maxBusinesses: 3,
        maxAppointmentsPerMonth: 2000,
        price: 79,
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBusinessReadRepo.findByOwnerId.mockResolvedValue(businesses);
      mockOwnerReadRepo.findByUserId.mockResolvedValue(owner);

      // Act
      const result = await checker.canCreateBusiness(ownerId);

      // Assert
      expect(result).toBe(true);
      expect(mockBusinessReadRepo.findByOwnerId).toHaveBeenCalledWith(ownerId);
      expect(mockOwnerReadRepo.findByUserId).toHaveBeenCalledWith(ownerId);
    });

    it('should return false when at limit', async () => {
      // Arrange
      const ownerId = 'owner-1';
      const businesses: BusinessReadModel[] = [
        {
          id: 'business-1',
          ownerId,
          name: 'Business 1',
          whatsappPhone: '+18095551234',
          addressStreet: '123 Main St',
          addressCity: 'Santo Domingo',
          addressState: 'DN',
          addressCountry: 'DO',
          addressPostalCode: '10001',
          timezone: 'America/Santo_Domingo',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        },
        {
          id: 'business-2',
          ownerId,
          name: 'Business 2',
          whatsappPhone: '+18095555678',
          addressStreet: '456 Oak St',
          addressCity: 'Santiago',
          addressState: 'ST',
          addressCountry: 'DO',
          addressPostalCode: '20001',
          timezone: 'America/Santo_Domingo',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        },
        {
          id: 'business-3',
          ownerId,
          name: 'Business 3',
          whatsappPhone: '+18095559999',
          addressStreet: '789 Pine St',
          addressCity: 'La Vega',
          addressState: 'LV',
          addressCountry: 'DO',
          addressPostalCode: '30001',
          timezone: 'America/Santo_Domingo',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        },
      ];

      const owner: BusinessOwnerReadModel = {
        id: 'owner-1',
        userId: ownerId,
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        maxBusinesses: 3,
        maxAppointmentsPerMonth: 2000,
        price: 79,
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBusinessReadRepo.findByOwnerId.mockResolvedValue(businesses);
      mockOwnerReadRepo.findByUserId.mockResolvedValue(owner);

      // Act
      const result = await checker.canCreateBusiness(ownerId);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when over limit', async () => {
      // Arrange
      const ownerId = 'owner-1';
      const businesses: BusinessReadModel[] = [
        { id: 'business-1', ownerId } as BusinessReadModel,
        { id: 'business-2', ownerId } as BusinessReadModel,
      ];

      const owner: BusinessOwnerReadModel = {
        id: 'owner-1',
        userId: ownerId,
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        maxBusinesses: 1,
        maxAppointmentsPerMonth: 100,
        price: 0,
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBusinessReadRepo.findByOwnerId.mockResolvedValue(businesses);
      mockOwnerReadRepo.findByUserId.mockResolvedValue(owner);

      // Act
      const result = await checker.canCreateBusiness(ownerId);

      // Assert
      expect(result).toBe(false);
    });

    it('should throw exception when owner not found', async () => {
      // Arrange
      const ownerId = 'non-existent';
      mockBusinessReadRepo.findByOwnerId.mockResolvedValue([]);
      mockOwnerReadRepo.findByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(checker.canCreateBusiness(ownerId)).rejects.toThrow(
        BusinessOwnerNotFoundException,
      );
    });
  });

  describe('getBusinessCount', () => {
    it('should correctly calculate business count', async () => {
      // Arrange
      const ownerId = 'owner-1';
      const businesses: BusinessReadModel[] = [
        { id: 'business-1', ownerId } as BusinessReadModel,
        { id: 'business-2', ownerId } as BusinessReadModel,
      ];

      mockBusinessReadRepo.findByOwnerId.mockResolvedValue(businesses);

      // Act
      const result = await checker.getBusinessCount(ownerId);

      // Assert
      expect(result).toBe(2);
      expect(mockBusinessReadRepo.findByOwnerId).toHaveBeenCalledWith(ownerId);
    });

    it('should return 0 when no businesses found', async () => {
      // Arrange
      const ownerId = 'owner-1';
      mockBusinessReadRepo.findByOwnerId.mockResolvedValue([]);

      // Act
      const result = await checker.getBusinessCount(ownerId);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getMaxBusinessesAllowed', () => {
    it('should correctly retrieve max businesses from subscription plan', async () => {
      // Arrange
      const ownerId = 'owner-1';
      const owner: BusinessOwnerReadModel = {
        id: 'owner-1',
        userId: ownerId,
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        maxBusinesses: 3,
        maxAppointmentsPerMonth: 2000,
        price: 79,
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOwnerReadRepo.findByUserId.mockResolvedValue(owner);

      // Act
      const result = await checker.getMaxBusinessesAllowed(ownerId);

      // Assert
      expect(result).toBe(3);
      expect(mockOwnerReadRepo.findByUserId).toHaveBeenCalledWith(ownerId);
    });

    it('should throw exception when owner not found', async () => {
      // Arrange
      const ownerId = 'non-existent';
      mockOwnerReadRepo.findByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(checker.getMaxBusinessesAllowed(ownerId)).rejects.toThrow(
        BusinessOwnerNotFoundException,
      );
    });

    it('should handle FREE plan correctly', async () => {
      // Arrange
      const ownerId = 'owner-1';
      const owner: BusinessOwnerReadModel = {
        id: 'owner-1',
        userId: ownerId,
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        maxBusinesses: 1,
        maxAppointmentsPerMonth: 100,
        price: 0,
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOwnerReadRepo.findByUserId.mockResolvedValue(owner);

      // Act
      const result = await checker.getMaxBusinessesAllowed(ownerId);

      // Assert
      expect(result).toBe(1);
    });

    it('should handle ENTERPRISE plan correctly', async () => {
      // Arrange
      const ownerId = 'owner-1';
      const owner: BusinessOwnerReadModel = {
        id: 'owner-1',
        userId: ownerId,
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        maxBusinesses: 10,
        maxAppointmentsPerMonth: 10000,
        price: 199,
        onboardingCompleted: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOwnerReadRepo.findByUserId.mockResolvedValue(owner);

      // Act
      const result = await checker.getMaxBusinessesAllowed(ownerId);

      // Assert
      expect(result).toBe(10);
    });
  });
});
