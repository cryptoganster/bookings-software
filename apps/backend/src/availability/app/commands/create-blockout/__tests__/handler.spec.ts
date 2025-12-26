import { Test, TestingModule } from '@nestjs/testing';
import { CreateBlockoutHandler } from '../handler';
import { CreateBlockoutCommand } from '../command';
import { IBlockoutWriteRepository } from '@availability/domain/interfaces/repositories/blockout-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { UUID } from '@shared/vo/uuid';

describe('CreateBlockoutHandler', () => {
  let handler: CreateBlockoutHandler;
  let mockBlockoutWriteRepository: jest.Mocked<IBlockoutWriteRepository>;
  let mockUow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    mockBlockoutWriteRepository = {
      save: jest.fn(),
      delete: jest.fn(),
    };

    mockUow = {
      transaction: jest.fn((work) => work()),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBlockoutHandler,
        {
          provide: 'IBlockoutWriteRepository',
          useValue: mockBlockoutWriteRepository,
        },
        {
          provide: 'IUnitOfWork',
          useValue: mockUow,
        },
      ],
    }).compile();

    handler = module.get<CreateBlockoutHandler>(CreateBlockoutHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should create a new blockout', async () => {
      // Arrange
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // 7 days from now
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 8); // 8 days from now
      const command = new CreateBlockoutCommand(
        UUID.generate().getValue(),
        startDate,
        endDate,
        'Christmas Holiday',
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.blockoutId).toBeDefined();
      expect(mockBlockoutWriteRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          getBusinessId: expect.any(Function),
          getDateRange: expect.any(Function),
        }),
      );
      expect(mockUow.transaction).toHaveBeenCalled();
    });

    it('should create blockout with null reason', async () => {
      // Arrange
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 8);
      const command = new CreateBlockoutCommand(
        UUID.generate().getValue(),
        startDate,
        endDate,
        null,
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.blockoutId).toBeDefined();
      expect(mockBlockoutWriteRepository.save).toHaveBeenCalled();
    });

    it('should use UnitOfWork for transaction', async () => {
      // Arrange
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 8);
      const command = new CreateBlockoutCommand(
        UUID.generate().getValue(),
        startDate,
        endDate,
        'Holiday',
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(mockUow.transaction).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle single day blockout', async () => {
      // Arrange
      const date = new Date();
      date.setDate(date.getDate() + 7);
      const command = new CreateBlockoutCommand(
        UUID.generate().getValue(),
        date,
        date,
        'Single day off',
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.blockoutId).toBeDefined();
      expect(mockBlockoutWriteRepository.save).toHaveBeenCalled();
    });
  });
});
