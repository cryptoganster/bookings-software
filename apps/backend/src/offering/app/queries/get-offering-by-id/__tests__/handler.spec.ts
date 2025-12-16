import { Test, TestingModule } from '@nestjs/testing';
import { GetOfferingByIdHandler } from '../handler';
import { GetOfferingByIdQuery } from '../query';
import { IOfferingReadRepository } from '../../../../domain/interfaces/repositories/offering-read';
import { OfferingReadModel } from '../../../../domain/read-models/offering';
import { UUID } from '@shared/vo/uuid';

describe('GetOfferingByIdHandler', () => {
  let handler: GetOfferingByIdHandler;
  let mockReadRepository: jest.Mocked<IOfferingReadRepository>;

  beforeEach(async () => {
    mockReadRepository = {
      findById: jest.fn(),
      findActiveByBusinessId: jest.fn(),
      findByBusinessId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOfferingByIdHandler,
        {
          provide: 'IOfferingReadRepository',
          useValue: mockReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetOfferingByIdHandler>(GetOfferingByIdHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return offering if exists', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();

      const offering: OfferingReadModel = {
        id: offeringId,
        businessId,
        name: 'Corte de Pelo',
        duration: 30,
        maxCapacityPerSlot: 4,
        maxDailyCapacity: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReadRepository.findById.mockResolvedValue(offering);

      const query = new GetOfferingByIdQuery(offeringId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(offering);
      expect(mockReadRepository.findById).toHaveBeenCalledWith(offeringId);
      expect(mockReadRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should return null if offering does not exist', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      mockReadRepository.findById.mockResolvedValue(null);

      const query = new GetOfferingByIdQuery(offeringId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeNull();
      expect(mockReadRepository.findById).toHaveBeenCalledWith(offeringId);
    });

    it('should return offering when businessId matches', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();

      const offering: OfferingReadModel = {
        id: offeringId,
        businessId,
        name: 'Corte de Pelo',
        duration: 30,
        maxCapacityPerSlot: 4,
        maxDailyCapacity: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReadRepository.findById.mockResolvedValue(offering);

      const query = new GetOfferingByIdQuery(offeringId, businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(offering);
      expect(result?.businessId).toBe(businessId);
    });

    it('should return null when businessId does not match (multi-tenancy)', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();
      const otherBusinessId = UUID.generate().getValue();

      const offering: OfferingReadModel = {
        id: offeringId,
        businessId,
        name: 'Corte de Pelo',
        duration: 30,
        maxCapacityPerSlot: 4,
        maxDailyCapacity: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReadRepository.findById.mockResolvedValue(offering);

      const query = new GetOfferingByIdQuery(offeringId, otherBusinessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeNull();
      expect(mockReadRepository.findById).toHaveBeenCalledWith(offeringId);
    });

    it('should return offering without businessId validation when not provided', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();

      const offering: OfferingReadModel = {
        id: offeringId,
        businessId,
        name: 'Corte de Pelo',
        duration: 30,
        maxCapacityPerSlot: 4,
        maxDailyCapacity: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReadRepository.findById.mockResolvedValue(offering);

      const query = new GetOfferingByIdQuery(offeringId); // No businessId

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(offering);
    });

    it('should return inactive offerings', async () => {
      // Arrange
      const offeringId = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();

      const offering: OfferingReadModel = {
        id: offeringId,
        businessId,
        name: 'Corte de Pelo',
        duration: 30,
        maxCapacityPerSlot: 4,
        maxDailyCapacity: null,
        isActive: false, // Inactive
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReadRepository.findById.mockResolvedValue(offering);

      const query = new GetOfferingByIdQuery(offeringId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(offering);
      expect(result?.isActive).toBe(false);
    });
  });
});
