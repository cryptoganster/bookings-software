import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfferingFactory } from '../offering-factory';
import { OfferingModel } from '../../models/offering';
import { Offering } from '@offering/domain/aggregates/offering';

describe('OfferingFactory', () => {
  let factory: OfferingFactory;
  let repository: Repository<OfferingModel>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfferingFactory,
        {
          provide: getRepositoryToken(OfferingModel),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    factory = module.get<OfferingFactory>(OfferingFactory);
    repository = module.get<Repository<OfferingModel>>(getRepositoryToken(OfferingModel));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadById', () => {
    it('should reconstruct aggregate with correct version', async () => {
      // Arrange
      const offeringId = '550e8400-e29b-41d4-a716-446655440001';
      const businessId = '550e8400-e29b-41d4-a716-446655440002';
      const model: OfferingModel = {
        id: offeringId,
        businessId: businessId,
        name: 'Haircut',
        duration: 30,
        maxCapacityPerSlot: 4,
        maxDailyCapacity: 20,
        isActive: true,
        version: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(repository, 'findOne').mockResolvedValue(model);

      // Act
      const offering = await factory.loadById(offeringId);

      // Assert
      expect(offering).toBeDefined();
      expect(offering).toBeInstanceOf(Offering);
      expect(offering!.getVersion().getValue()).toBe(5);
      expect(offering!.getId().getValue()).toBe(offeringId);
      expect(offering!.getBusinessId().getValue()).toBe(businessId);
      expect(offering!.getName()).toBe('Haircut');
      expect(offering!.getDuration().getMinutes()).toBe(30);
      expect(offering!.getMaxCapacityPerSlot()).toBe(4);
      expect(offering!.getMaxDailyCapacity()).toBe(20);
      expect(offering!.isActiveOffering()).toBe(true);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: offeringId },
      });
    });

    it('should return null when offering not found', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // Act
      const offering = await factory.loadById('non-existent-uuid');

      // Assert
      expect(offering).toBeNull();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-uuid' },
      });
    });

    it('should reconstruct aggregate with business logic', async () => {
      // Arrange
      const offeringId = '550e8400-e29b-41d4-a716-446655440003';
      const businessId = '550e8400-e29b-41d4-a716-446655440004';
      const model: OfferingModel = {
        id: offeringId,
        businessId: businessId,
        name: 'Haircut',
        duration: 30,
        maxCapacityPerSlot: 4,
        maxDailyCapacity: 20,
        isActive: true,
        version: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(repository, 'findOne').mockResolvedValue(model);

      // Act
      const offering = await factory.loadById(offeringId);

      // Assert - Verify business logic is available
      expect(offering).toBeDefined();
      expect(() => offering!.deactivate()).not.toThrow();
      expect(offering!.isActiveOffering()).toBe(false);
      expect(offering!.getVersion().getValue()).toBe(4); // Version incremented by deactivate()
    });

    it('should preserve version for any valid version number', async () => {
      // Property-based test: version should be preserved for any valid version
      const testVersions = [0, 1, 5, 10, 100, 1000];
      const offeringId = '550e8400-e29b-41d4-a716-446655440005';
      const businessId = '550e8400-e29b-41d4-a716-446655440006';

      for (const version of testVersions) {
        // Arrange
        const model: OfferingModel = {
          id: offeringId,
          businessId: businessId,
          name: 'Haircut',
          duration: 30,
          maxCapacityPerSlot: 4,
          maxDailyCapacity: 20,
          isActive: true,
          version,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        jest.spyOn(repository, 'findOne').mockResolvedValue(model);

        // Act
        const offering = await factory.loadById(offeringId);

        // Assert
        expect(offering).toBeDefined();
        expect(offering!.getVersion().getValue()).toBe(version);
      }
    });
  });

  describe('loadByBusinessIdAndName', () => {
    it('should reconstruct aggregate by business ID and name', async () => {
      // Arrange
      const offeringId = '550e8400-e29b-41d4-a716-446655440007';
      const businessId = '550e8400-e29b-41d4-a716-446655440008';
      const model: OfferingModel = {
        id: offeringId,
        businessId: businessId,
        name: 'Haircut',
        duration: 30,
        maxCapacityPerSlot: 4,
        maxDailyCapacity: 20,
        isActive: true,
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(repository, 'findOne').mockResolvedValue(model);

      // Act
      const offering = await factory.loadByBusinessIdAndName(businessId, 'Haircut');

      // Assert
      expect(offering).toBeDefined();
      expect(offering).toBeInstanceOf(Offering);
      expect(offering!.getVersion().getValue()).toBe(2);
      expect(offering!.getId().getValue()).toBe(offeringId);
      expect(offering!.getBusinessId().getValue()).toBe(businessId);
      expect(offering!.getName()).toBe('Haircut');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          businessId: businessId,
          name: 'Haircut',
        },
      });
    });

    it('should return null when offering not found by business ID and name', async () => {
      // Arrange
      const businessId = '550e8400-e29b-41d4-a716-446655440009';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // Act
      const offering = await factory.loadByBusinessIdAndName(businessId, 'NonExistent');

      // Assert
      expect(offering).toBeNull();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          businessId: businessId,
          name: 'NonExistent',
        },
      });
    });

    it('should reconstruct aggregate with null maxDailyCapacity', async () => {
      // Arrange
      const offeringId = '550e8400-e29b-41d4-a716-446655440010';
      const businessId = '550e8400-e29b-41d4-a716-446655440011';
      const model: OfferingModel = {
        id: offeringId,
        businessId: businessId,
        name: 'Consultation',
        duration: 60,
        maxCapacityPerSlot: 1,
        maxDailyCapacity: null,
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(repository, 'findOne').mockResolvedValue(model);

      // Act
      const offering = await factory.loadByBusinessIdAndName(businessId, 'Consultation');

      // Assert
      expect(offering).toBeDefined();
      expect(offering!.getMaxDailyCapacity()).toBeNull();
    });
  });
});
