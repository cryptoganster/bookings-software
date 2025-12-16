import { Test, TestingModule } from '@nestjs/testing';
import { GetActiveOfferingsHandler } from '../handler';
import { GetActiveOfferingsQuery } from '../query';
import { IOfferingReadRepository } from '../../../../domain/interfaces/repositories/offering-read';
import { OfferingReadModel } from '../../../../domain/read-models/offering';
import { UUID } from '@shared/vo/uuid';

describe('GetActiveOfferingsHandler', () => {
  let handler: GetActiveOfferingsHandler;
  let mockReadRepository: jest.Mocked<IOfferingReadRepository>;

  beforeEach(async () => {
    mockReadRepository = {
      findById: jest.fn(),
      findActiveByBusinessId: jest.fn(),
      findByBusinessId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetActiveOfferingsHandler,
        {
          provide: 'IOfferingReadRepository',
          useValue: mockReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetActiveOfferingsHandler>(
      GetActiveOfferingsHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return only active offerings', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const activeOfferings: OfferingReadModel[] = [
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Corte de Pelo',
          duration: 30,
          maxCapacityPerSlot: 4,
          maxDailyCapacity: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Lavado',
          duration: 15,
          maxCapacityPerSlot: 2,
          maxDailyCapacity: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockReadRepository.findActiveByBusinessId.mockResolvedValue(
        activeOfferings,
      );

      const query = new GetActiveOfferingsQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(activeOfferings);
      expect(result).toHaveLength(2);
      expect(result.every((o) => o.isActive)).toBe(true);
      expect(mockReadRepository.findActiveByBusinessId).toHaveBeenCalledWith(
        businessId,
      );
      expect(mockReadRepository.findActiveByBusinessId).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should return empty array if no active offerings', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      mockReadRepository.findActiveByBusinessId.mockResolvedValue([]);

      const query = new GetActiveOfferingsQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockReadRepository.findActiveByBusinessId).toHaveBeenCalledWith(
        businessId,
      );
    });

    it('should return offerings ordered alphabetically', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const activeOfferings: OfferingReadModel[] = [
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Corte de Pelo',
          duration: 30,
          maxCapacityPerSlot: 4,
          maxDailyCapacity: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Lavado',
          duration: 15,
          maxCapacityPerSlot: 2,
          maxDailyCapacity: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Tinte',
          duration: 60,
          maxCapacityPerSlot: 1,
          maxDailyCapacity: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockReadRepository.findActiveByBusinessId.mockResolvedValue(
        activeOfferings,
      );

      const query = new GetActiveOfferingsQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(activeOfferings);
      // Verify alphabetical order
      expect(result[0].name).toBe('Corte de Pelo');
      expect(result[1].name).toBe('Lavado');
      expect(result[2].name).toBe('Tinte');
    });

    it('should only return offerings for specified business', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const otherBusinessId = UUID.generate().getValue();

      const offerings: OfferingReadModel[] = [
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Corte de Pelo',
          duration: 30,
          maxCapacityPerSlot: 4,
          maxDailyCapacity: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockReadRepository.findActiveByBusinessId.mockResolvedValue(offerings);

      const query = new GetActiveOfferingsQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(offerings);
      expect(result.every((o) => o.businessId === businessId)).toBe(true);
      expect(result.every((o) => o.businessId === otherBusinessId)).toBe(
        false,
      );
    });
  });
});
