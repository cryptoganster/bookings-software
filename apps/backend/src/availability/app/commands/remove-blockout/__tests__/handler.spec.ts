import { Test, TestingModule } from '@nestjs/testing';
import { RemoveBlockoutHandler } from '../handler';
import { RemoveBlockoutCommand } from '../command';
import { IBlockoutFactory } from '@availability/domain/interfaces/factories/blockout-factory';
import { IBlockoutWriteRepository } from '@availability/domain/interfaces/repositories/blockout-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { Blockout } from '@availability/domain/aggregates/blockout';
import { UUID } from '@shared/vo/uuid';
import { DateRange } from '@availability/domain/vo/date-range.vo';
import { BlockoutNotFoundException } from '@availability/domain/exceptions/blockout-not-found.exception';

describe('RemoveBlockoutHandler', () => {
  let handler: RemoveBlockoutHandler;
  let mockBlockoutFactory: jest.Mocked<IBlockoutFactory>;
  let mockBlockoutWriteRepository: jest.Mocked<IBlockoutWriteRepository>;
  let mockUow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    mockBlockoutFactory = {
      loadById: jest.fn(),
    };

    mockBlockoutWriteRepository = {
      save: jest.fn(),
      delete: jest.fn(),
    };

    mockUow = {
      transaction: jest.fn((work) => work()),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveBlockoutHandler,
        {
          provide: 'IBlockoutFactory',
          useValue: mockBlockoutFactory,
        },
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

    handler = module.get<RemoveBlockoutHandler>(RemoveBlockoutHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should remove blockout', async () => {
      // Arrange
      const blockoutId = UUID.generate().getValue();
      const command = new RemoveBlockoutCommand(blockoutId);

      const existingBlockout = Blockout.fromPersistence(
        UUID.fromString(blockoutId),
        UUID.generate(),
        DateRange.fromPersistence(new Date('2024-12-25'), new Date('2024-12-26')),
        'Holiday',
      );

      mockBlockoutFactory.loadById.mockResolvedValue(existingBlockout);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockBlockoutFactory.loadById).toHaveBeenCalledWith(blockoutId);
      expect(mockBlockoutWriteRepository.delete).toHaveBeenCalledWith(blockoutId);
      expect(mockUow.transaction).toHaveBeenCalled();
    });

    it('should throw BlockoutNotFoundException when blockout does not exist', async () => {
      // Arrange
      const blockoutId = UUID.generate().getValue();
      const command = new RemoveBlockoutCommand(blockoutId);

      mockBlockoutFactory.loadById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(BlockoutNotFoundException);
      expect(mockBlockoutWriteRepository.delete).not.toHaveBeenCalled();
    });

    it('should use UnitOfWork for transaction', async () => {
      // Arrange
      const blockoutId = UUID.generate().getValue();
      const command = new RemoveBlockoutCommand(blockoutId);

      const existingBlockout = Blockout.fromPersistence(
        UUID.fromString(blockoutId),
        UUID.generate(),
        DateRange.fromPersistence(new Date('2024-12-25'), new Date('2024-12-26')),
        'Holiday',
      );

      mockBlockoutFactory.loadById.mockResolvedValue(existingBlockout);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockUow.transaction).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});
