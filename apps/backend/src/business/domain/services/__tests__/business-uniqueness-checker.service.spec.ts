import { BusinessUniquenessChecker } from '../business-uniqueness-checker.service';
import { IBusinessReadRepository } from '../../interfaces/repositories/business-read';
import { BusinessReadModel } from '../../read-models/business.read-model';

describe('BusinessUniquenessChecker', () => {
  let checker: BusinessUniquenessChecker;
  let mockReadRepo: jest.Mocked<IBusinessReadRepository>;

  beforeEach(() => {
    mockReadRepo = {
      findByWhatsAppPhone: jest.fn(),
      findById: jest.fn(),
      findByOwnerId: jest.fn(),
      findAll: jest.fn(),
    } as any;

    checker = new BusinessUniquenessChecker(mockReadRepo);
  });

  describe('isWhatsAppPhoneUnique', () => {
    it('should return true when phone not found', async () => {
      // Arrange
      mockReadRepo.findByWhatsAppPhone.mockResolvedValue(null);

      // Act
      const result = await checker.isWhatsAppPhoneUnique('+18095551234');

      // Assert
      expect(result).toBe(true);
      expect(mockReadRepo.findByWhatsAppPhone).toHaveBeenCalledWith('+18095551234');
      expect(mockReadRepo.findByWhatsAppPhone).toHaveBeenCalledTimes(1);
    });

    it('should return false when phone exists', async () => {
      // Arrange
      const existingBusiness: BusinessReadModel = {
        id: 'business-1',
        ownerId: 'owner-1',
        name: 'Existing Business',
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
      };

      mockReadRepo.findByWhatsAppPhone.mockResolvedValue(existingBusiness);

      // Act
      const result = await checker.isWhatsAppPhoneUnique('+18095551234');

      // Assert
      expect(result).toBe(false);
      expect(mockReadRepo.findByWhatsAppPhone).toHaveBeenCalledWith('+18095551234');
    });

    it('should return true when phone exists but belongs to same business (update scenario)', async () => {
      // Arrange
      const existingBusiness: BusinessReadModel = {
        id: 'business-1',
        ownerId: 'owner-1',
        name: 'My Business',
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
      };

      mockReadRepo.findByWhatsAppPhone.mockResolvedValue(existingBusiness);

      // Act
      const result = await checker.isWhatsAppPhoneUnique(
        '+18095551234',
        'business-1', // Exclude this business from check
      );

      // Assert
      expect(result).toBe(true);
      expect(mockReadRepo.findByWhatsAppPhone).toHaveBeenCalledWith('+18095551234');
    });

    it('should return false when phone exists and belongs to different business', async () => {
      // Arrange
      const existingBusiness: BusinessReadModel = {
        id: 'business-1',
        ownerId: 'owner-1',
        name: 'Other Business',
        whatsappPhone: '+18095551234',
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
      };

      mockReadRepo.findByWhatsAppPhone.mockResolvedValue(existingBusiness);

      // Act
      const result = await checker.isWhatsAppPhoneUnique(
        '+18095551234',
        'business-2', // Different business ID
      );

      // Assert
      expect(result).toBe(false);
      expect(mockReadRepo.findByWhatsAppPhone).toHaveBeenCalledWith('+18095551234');
    });

    it('should handle null results gracefully', async () => {
      // Arrange
      mockReadRepo.findByWhatsAppPhone.mockResolvedValue(null);

      // Act
      const result = await checker.isWhatsAppPhoneUnique('+18095559999');

      // Assert
      expect(result).toBe(true);
      expect(mockReadRepo.findByWhatsAppPhone).toHaveBeenCalledWith('+18095559999');
    });

    it('should handle undefined excludeBusinessId parameter', async () => {
      // Arrange
      mockReadRepo.findByWhatsAppPhone.mockResolvedValue(null);

      // Act
      const result = await checker.isWhatsAppPhoneUnique('+18095551234', undefined);

      // Assert
      expect(result).toBe(true);
    });
  });
});
