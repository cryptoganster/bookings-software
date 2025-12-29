import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { PinoLogger } from 'nestjs-pino';
import { CustomerMergeController } from '../customer-merge';
import { MergeCustomersCommand } from '@customer/app/commands/merge-customers/command';
import { UserPayload } from '@auth/presentation/decorators/current-user';

describe('CustomerMergeController', () => {
  let controller: CustomerMergeController;
  let commandBus: jest.Mocked<CommandBus>;
  let logger: jest.Mocked<PinoLogger>;

  const mockUser: UserPayload = {
    userId: 'user-123',
    businessId: 'business-123',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const mockCommandBus = {
      execute: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerMergeController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<CustomerMergeController>(CustomerMergeController);
    commandBus = module.get(CommandBus);
    logger = module.get(PinoLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('merge', () => {
    it('should merge customers successfully', async () => {
      // Arrange
      const dto = {
        sourceCustomerId: 'source-customer-123',
        targetCustomerId: 'target-customer-456',
      };
      commandBus.execute.mockResolvedValue(undefined);

      // Act
      const result = await controller.merge(dto, mockUser);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(
        new MergeCustomersCommand('source-customer-123', 'target-customer-456', 'user-123'),
      );
      expect(result).toEqual({ message: 'Customers merged successfully' });
    });

    it('should pass userId to command for audit trail', async () => {
      // Arrange
      const dto = {
        sourceCustomerId: 'source-123',
        targetCustomerId: 'target-456',
      };
      commandBus.execute.mockResolvedValue(undefined);

      // Act
      await controller.merge(dto, mockUser);

      // Assert
      const executedCommand = commandBus.execute.mock.calls[0][0] as MergeCustomersCommand;
      expect(executedCommand.mergedBy).toBe('user-123');
    });

    it('should log start of merge operation', async () => {
      // Arrange
      const dto = {
        sourceCustomerId: 'source-123',
        targetCustomerId: 'target-456',
      };
      commandBus.execute.mockResolvedValue(undefined);

      // Act
      await controller.merge(dto, mockUser);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'merge_customers_start',
          userId: 'user-123',
          sourceCustomerId: 'source-123',
          targetCustomerId: 'target-456',
        }),
        'Starting customer merge',
      );
    });

    it('should log completion of merge operation', async () => {
      // Arrange
      const dto = {
        sourceCustomerId: 'source-123',
        targetCustomerId: 'target-456',
      };
      commandBus.execute.mockResolvedValue(undefined);

      // Act
      await controller.merge(dto, mockUser);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'merge_customers_complete',
          userId: 'user-123',
          sourceCustomerId: 'source-123',
          targetCustomerId: 'target-456',
          duration: expect.any(Number),
        }),
        'Customers merged successfully',
      );
    });

    it('should log error when merge fails', async () => {
      // Arrange
      const dto = {
        sourceCustomerId: 'source-123',
        targetCustomerId: 'target-456',
      };
      const error = new Error('Merge failed');
      commandBus.execute.mockRejectedValue(error);

      // Act
      try {
        await controller.merge(dto, mockUser);
      } catch (_err) {
        // Expected to throw
      }

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'merge_customers_error',
          userId: 'user-123',
          sourceCustomerId: 'source-123',
          targetCustomerId: 'target-456',
          error: 'Merge failed',
          stack: expect.any(String),
          duration: expect.any(Number),
        }),
        'Customer merge failed',
      );
    });

    it('should track duration of operation', async () => {
      // Arrange
      const dto = {
        sourceCustomerId: 'source-123',
        targetCustomerId: 'target-456',
      };
      commandBus.execute.mockResolvedValue(undefined);

      // Act
      await controller.merge(dto, mockUser);

      // Assert
      const calls = logger.info.mock.calls as Array<
        [{ action: string; duration?: number }, string]
      >;
      const completeLog = calls.find((call) => call[0].action === 'merge_customers_complete');
      expect(completeLog).toBeDefined();
      expect(completeLog![0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should re-throw error after logging', async () => {
      // Arrange
      const dto = {
        sourceCustomerId: 'source-123',
        targetCustomerId: 'target-456',
      };
      const error = new Error('Command failed');
      commandBus.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.merge(dto, mockUser)).rejects.toThrow('Command failed');
    });

    it('should handle different user contexts', async () => {
      // Arrange
      const dto = {
        sourceCustomerId: 'source-123',
        targetCustomerId: 'target-456',
      };
      const differentUser: UserPayload = {
        userId: 'user-999',
        businessId: 'business-999',
        email: 'other@example.com',
      };
      commandBus.execute.mockResolvedValue(undefined);

      // Act
      await controller.merge(dto, differentUser);

      // Assert
      const executedCommand = commandBus.execute.mock.calls[0][0] as MergeCustomersCommand;
      expect(executedCommand.mergedBy).toBe('user-999');
    });

    it('should return success message with correct format', async () => {
      // Arrange
      const dto = {
        sourceCustomerId: 'source-123',
        targetCustomerId: 'target-456',
      };
      commandBus.execute.mockResolvedValue(undefined);

      // Act
      const result = await controller.merge(dto, mockUser);

      // Assert
      expect(result).toHaveProperty('message');
      expect(typeof result.message).toBe('string');
      expect(result.message).toBe('Customers merged successfully');
    });

    it('should handle unknown error types', async () => {
      // Arrange
      const dto = {
        sourceCustomerId: 'source-123',
        targetCustomerId: 'target-456',
      };
      commandBus.execute.mockRejectedValue('String error');

      // Act
      try {
        await controller.merge(dto, mockUser);
      } catch (_err) {
        // Expected to throw
      }

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'merge_customers_error',
          error: 'Unknown error',
          stack: undefined,
        }),
        'Customer merge failed',
      );
    });

    it('should track duration even when operation fails', async () => {
      // Arrange
      const dto = {
        sourceCustomerId: 'source-123',
        targetCustomerId: 'target-456',
      };
      commandBus.execute.mockRejectedValue(new Error('Failed'));

      // Act
      try {
        await controller.merge(dto, mockUser);
      } catch (_err) {
        // Expected to throw
      }

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: expect.any(Number),
        }),
        'Customer merge failed',
      );
      const errorLog = logger.error.mock.calls[0][0] as { duration: number };
      expect(errorLog.duration).toBeGreaterThanOrEqual(0);
    });
  });
});
