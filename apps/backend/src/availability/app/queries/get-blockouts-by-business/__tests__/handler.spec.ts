import { Test, TestingModule } from '@nestjs/testing';
import { GetBlockoutsByBusinessHandler } from '../handler';
import { GetBlockoutsByBusinessQuery } from '../query';
import { IBlockoutReadRepository } from '@availability/domain/interfaces/repositories/blockout-read';
import { BlockoutReadModel } from '@availability/domain/read-models/blockout';

describe('GetBlockoutsByBusinessHandler', () => {
  let handler: GetBlockoutsByBusinessHandler;
  let blockoutReadRepository: jest.Mocked<IBlockoutReadRepository>;

  beforeEach(async () => {
    const mockBlockoutReadRepository: Partial<jest.Mocked<IBlockoutReadRepository>> = {
      findByBusinessId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBlockoutsByBusinessHandler,
        {
          provide: 'IBlockoutReadRepository',
          useValue: mockBlockoutReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetBlockoutsByBusinessHandler>(GetBlockoutsByBusinessHandler);
    blockoutReadRepository = module.get('IBlockoutReadRepository');
  });

  describe('execute', () => {
    it('should return blockouts for a business', async () => {
      // Arrange
      const businessId = 'business-123';
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const mockBlockouts: BlockoutReadModel[] = [
        {
          id: 'blockout-1',
          businessId,
          startDate: tomorrow,
          endDate: tomorrow,
          reason: 'Holiday',
          createdAt: new Date(),
        },
        {
          id: 'blockout-2',
          businessId,
          startDate: nextWeek,
          endDate: nextWeek,
          reason: 'Maintenance',
          createdAt: new Date(),
        },
      ];

      blockoutReadRepository.findByBusinessId.mockResolvedValue(mockBlockouts);

      const query = new GetBlockoutsByBusinessQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(mockBlockouts);
      expect(blockoutReadRepository.findByBusinessId).toHaveBeenCalledWith(businessId);
      expect(blockoutReadRepository.findByBusinessId).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when business has no blockouts', async () => {
      // Arrange
      const businessId = 'business-123';
      blockoutReadRepository.findByBusinessId.mockResolvedValue([]);

      const query = new GetBlockoutsByBusinessQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual([]);
      expect(blockoutReadRepository.findByBusinessId).toHaveBeenCalledWith(businessId);
    });

    it('should return blockouts with date ranges', async () => {
      // Arrange
      const businessId = 'business-123';
      const startDate = new Date('2025-12-25');
      const endDate = new Date('2025-12-31');

      const mockBlockouts: BlockoutReadModel[] = [
        {
          id: 'blockout-1',
          businessId,
          startDate,
          endDate,
          reason: 'Christmas Holiday',
          createdAt: new Date(),
        },
      ];

      blockoutReadRepository.findByBusinessId.mockResolvedValue(mockBlockouts);

      const query = new GetBlockoutsByBusinessQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(mockBlockouts);
      expect(result[0].startDate).toEqual(startDate);
      expect(result[0].endDate).toEqual(endDate);
    });

    it('should return blockouts sorted by start date', async () => {
      // Arrange
      const businessId = 'business-123';
      const date1 = new Date('2025-12-25');
      const date2 = new Date('2025-12-31');
      const date3 = new Date('2026-01-15');

      const mockBlockouts: BlockoutReadModel[] = [
        {
          id: 'blockout-1',
          businessId,
          startDate: date1,
          endDate: date1,
          reason: 'Christmas',
          createdAt: new Date(),
        },
        {
          id: 'blockout-2',
          businessId,
          startDate: date2,
          endDate: date2,
          reason: 'New Year',
          createdAt: new Date(),
        },
        {
          id: 'blockout-3',
          businessId,
          startDate: date3,
          endDate: date3,
          reason: 'Maintenance',
          createdAt: new Date(),
        },
      ];

      blockoutReadRepository.findByBusinessId.mockResolvedValue(mockBlockouts);

      const query = new GetBlockoutsByBusinessQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(mockBlockouts);
      // Verify blockouts are in chronological order
      for (let i = 1; i < result.length; i++) {
        expect(result[i].startDate.getTime()).toBeGreaterThanOrEqual(
          result[i - 1].startDate.getTime(),
        );
      }
    });

    it('should include blockout reason', async () => {
      // Arrange
      const businessId = 'business-123';
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockBlockouts: BlockoutReadModel[] = [
        {
          id: 'blockout-1',
          businessId,
          startDate: tomorrow,
          endDate: tomorrow,
          reason: 'Staff Training',
          createdAt: new Date(),
        },
      ];

      blockoutReadRepository.findByBusinessId.mockResolvedValue(mockBlockouts);

      const query = new GetBlockoutsByBusinessQuery(businessId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result[0].reason).toBe('Staff Training');
    });
  });
});
