import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { CustomerDuplicatesController } from '../customer-duplicates';
import { DetectDuplicateCustomersQuery } from '@customer/app/queries/detect-duplicate-customers/query';
import { UserPayload } from '@auth/presentation/decorators/current-user';

describe('CustomerDuplicatesController', () => {
  let controller: CustomerDuplicatesController;
  let queryBus: jest.Mocked<QueryBus>;
  let logger: jest.Mocked<PinoLogger>;

  const mockUser: UserPayload = {
    userId: 'user-123',
    businessId: 'business-123',
    email: 'test@example.com',
  };

  const mockDuplicatePairs = [
    {
      customer1: {
        id: 'customer-1',
        businessId: 'business-123',
        userId: null,
        whatsappPhone: '+1234567890',
        name: 'John Doe',
        createdAt: new Date('2024-01-01'),
      },
      customer2: {
        id: 'customer-2',
        businessId: 'business-123',
        userId: null,
        whatsappPhone: '+1234567891',
        name: 'Jon Doe',
        createdAt: new Date('2024-01-02'),
      },
      similarityScore: 0.95,
      reasons: ['Similar name'],
    },
  ];

  beforeEach(async () => {
    const mockQueryBus = {
      execute: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerDuplicatesController],
      providers: [
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<CustomerDuplicatesController>(CustomerDuplicatesController);
    queryBus = module.get(QueryBus);
    logger = module.get(PinoLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDuplicates', () => {
    it('should detect duplicates with default threshold', async () => {
      // Arrange
      const dto = {};
      queryBus.execute.mockResolvedValue(mockDuplicatePairs);

      // Act
      const result = await controller.getDuplicates(dto, mockUser);

      // Assert
      expect(queryBus.execute).toHaveBeenCalledWith(
        new DetectDuplicateCustomersQuery('business-123', 0.8),
      );
      expect(result.pairs).toHaveLength(1);
      expect(result.pairs[0].customer1.id).toBe('customer-1');
      expect(result.pairs[0].customer2.id).toBe('customer-2');
      expect(result.pairs[0].similarityScore).toBe(0.95);
      expect(result.pairs[0].reasons).toEqual(['Similar name']);
    });

    it('should detect duplicates with custom threshold', async () => {
      // Arrange
      const dto = { threshold: 0.9 };
      queryBus.execute.mockResolvedValue(mockDuplicatePairs);

      // Act
      const result = await controller.getDuplicates(dto, mockUser);

      // Assert
      expect(queryBus.execute).toHaveBeenCalledWith(
        new DetectDuplicateCustomersQuery('business-123', 0.9),
      );
      expect(result.pairs).toHaveLength(1);
    });

    it('should throw ForbiddenException when user has no businessId', async () => {
      // Arrange
      const dto = {};
      const userWithoutBusiness = { ...mockUser, businessId: undefined };

      // Act & Assert
      await expect(controller.getDuplicates(dto, userWithoutBusiness)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.getDuplicates(dto, userWithoutBusiness)).rejects.toThrow(
        'User does not have a business',
      );
      expect(queryBus.execute).not.toHaveBeenCalled();
    });

    it('should return empty array when no duplicates found', async () => {
      // Arrange
      const dto = { threshold: 0.95 };
      queryBus.execute.mockResolvedValue([]);

      // Act
      const result = await controller.getDuplicates(dto, mockUser);

      // Assert
      expect(result.pairs).toHaveLength(0);
    });

    it('should transform Date objects to ISO strings in response', async () => {
      // Arrange
      const dto = {};
      queryBus.execute.mockResolvedValue(mockDuplicatePairs);

      // Act
      const result = await controller.getDuplicates(dto, mockUser);

      // Assert
      expect(typeof result.pairs[0].customer1.createdAt).toBe('string');
      expect(typeof result.pairs[0].customer2.createdAt).toBe('string');
      expect(result.pairs[0].customer1.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result.pairs[0].customer2.createdAt).toBe('2024-01-02T00:00:00.000Z');
    });

    it('should log start of duplicate detection', async () => {
      // Arrange
      const dto = { threshold: 0.85 };
      queryBus.execute.mockResolvedValue([]);

      // Act
      await controller.getDuplicates(dto, mockUser);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'detect_duplicates_start',
          userId: 'user-123',
          businessId: 'business-123',
          threshold: 0.85,
        }),
        'Starting duplicate detection',
      );
    });

    it('should log completion of duplicate detection', async () => {
      // Arrange
      const dto = {};
      queryBus.execute.mockResolvedValue(mockDuplicatePairs);

      // Act
      await controller.getDuplicates(dto, mockUser);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'detect_duplicates_complete',
          userId: 'user-123',
          businessId: 'business-123',
          pairsFound: 1,
          threshold: 0.8,
          duration: expect.any(Number),
        }),
        'Duplicate detection completed',
      );
    });

    it('should log warning when user has no business', async () => {
      // Arrange
      const dto = {};
      const userWithoutBusiness = { ...mockUser, businessId: undefined };

      // Act
      try {
        await controller.getDuplicates(dto, userWithoutBusiness);
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'detect_duplicates_forbidden',
          userId: 'user-123',
          reason: 'no_business_id',
        }),
        'User does not have a business',
      );
    });

    it('should log error when query fails', async () => {
      // Arrange
      const dto = {};
      const error = new Error('Query failed');
      queryBus.execute.mockRejectedValue(error);

      // Act
      try {
        await controller.getDuplicates(dto, mockUser);
      } catch (err) {
        // Expected to throw
      }

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'detect_duplicates_error',
          userId: 'user-123',
          businessId: 'business-123',
          error: 'Query failed',
          stack: expect.any(String),
          duration: expect.any(Number),
        }),
        'Duplicate detection failed',
      );
    });

    it('should track duration of operation', async () => {
      // Arrange
      const dto = {};
      queryBus.execute.mockResolvedValue([]);

      // Act
      await controller.getDuplicates(dto, mockUser);

      // Assert
      const completeLog = logger.info.mock.calls.find(
        (call: any) => call[0].action === 'detect_duplicates_complete',
      );
      expect(completeLog).toBeDefined();
      expect((completeLog as any)[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple duplicate pairs', async () => {
      // Arrange
      const dto = {};
      const multiplePairs = [
        mockDuplicatePairs[0],
        {
          customer1: {
            id: 'customer-3',
            businessId: 'business-123',
            userId: null,
            whatsappPhone: '+1234567892',
            name: 'Jane Smith',
            createdAt: new Date('2024-01-03'),
          },
          customer2: {
            id: 'customer-4',
            businessId: 'business-123',
            userId: null,
            whatsappPhone: '+1234567893',
            name: 'Jane Smyth',
            createdAt: new Date('2024-01-04'),
          },
          similarityScore: 0.92,
          reasons: ['Similar name', 'Similar phone'],
        },
      ];
      queryBus.execute.mockResolvedValue(multiplePairs);

      // Act
      const result = await controller.getDuplicates(dto, mockUser);

      // Assert
      expect(result.pairs).toHaveLength(2);
      expect(result.pairs[0].customer1.id).toBe('customer-1');
      expect(result.pairs[1].customer1.id).toBe('customer-3');
    });

    it('should preserve all customer fields in response', async () => {
      // Arrange
      const dto = {};
      queryBus.execute.mockResolvedValue(mockDuplicatePairs);

      // Act
      const result = await controller.getDuplicates(dto, mockUser);

      // Assert
      const customer1 = result.pairs[0].customer1;
      expect(customer1).toHaveProperty('id');
      expect(customer1).toHaveProperty('businessId');
      expect(customer1).toHaveProperty('userId');
      expect(customer1).toHaveProperty('whatsappPhone');
      expect(customer1).toHaveProperty('name');
      expect(customer1).toHaveProperty('createdAt');
    });

    it('should preserve similarity score and reasons', async () => {
      // Arrange
      const dto = {};
      queryBus.execute.mockResolvedValue(mockDuplicatePairs);

      // Act
      const result = await controller.getDuplicates(dto, mockUser);

      // Assert
      expect(result.pairs[0]).toHaveProperty('similarityScore', 0.95);
      expect(result.pairs[0]).toHaveProperty('reasons', ['Similar name']);
    });
  });
});
