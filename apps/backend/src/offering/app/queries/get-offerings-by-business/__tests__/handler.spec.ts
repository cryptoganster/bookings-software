import { Test, TestingModule } from '@nestjs/testing';
import { GetOfferingsByBusinessHandler } from '../handler';
import { GetOfferingsByBusinessQuery } from '../query';
import { IOfferingReadRepository } from '../../../../domain/interfaces/repositories/offering-read';
import { OfferingReadModel } from '../../../../domain/read-models/offering';
import { UUID } from '@shared/vo/uuid';

describe('GetOfferingsByBusinessHandler', () => {
  let handler: GetOfferingsByBusinessHandler;
  let mockReadRepository: jest.Mocked<IOfferingReadRepository>;

  beforeEach(async () => {
    mockReadRepository = {
      findById: jest.fn(),
      findActiveByBusinessId: jest.fn(),
      findByBusinessId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOfferingsByBusinessHandler,
        {
          provide: 'IOfferingReadRepository',
          useValue: mockReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetOfferingsByBusinessHandler>(
      GetOfferingsByBusinessHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all offerings for business', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
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
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Lavado',
          duration: 15,
          maxCapacityPerSlot: 2,
          maxDailyCapacity: null,
          isActive: false, // Inactive
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

      mockReadRepository.findByBusinessId.mockResolvedValue(offerings);

      const query = new GetOfferingsByBusinessQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(offerings);
      expect(result).toHaveLength(3);
      expect(mockReadRepository.findByBusinessId).toHaveBeenCalledWith(
        businessId,
      );
      expect(mockReadRepository.findByBusinessId).toHaveBeenCalledTimes(1);
    });

    it('should include both active and inactive offerings', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const offerings: OfferingReadModel[] = [
        {
          id: UUID.generate().getValue(),
          businessId,
          name: 'Active Offering',
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
          name: 'Inactive Offering',
          duration: 15,
          maxCapacityPerSlot: 2,
          maxDailyCapacity: null,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockReadRepository.findByBusinessId.mockResolvedValue(offerings);

      const query = new GetOfferingsByBusinessQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.filter((o) => o.isActive)).toHaveLength(1);
      expect(result.filter((o) => !o.isActive)).toHaveLength(1);
    });

    it('should return empty array if no offerings exist', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      mockReadRepository.findByBusinessId.mockResolvedValue([]);

      const query = new GetOfferingsByBusinessQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockReadRepository.findByBusinessId).toHaveBeenCalledWith(
        businessId,
      );
    });

    it('should return offerings ordered alphabetically', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
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

      mockReadRepository.findByBusinessId.mockResolvedValue(offerings);

      const query = new GetOfferingsByBusinessQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(offerings);
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

      mockReadRepository.findByBusinessId.mockResolvedValue(offerings);

      const query = new GetOfferingsByBusinessQuery(businessId);

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
