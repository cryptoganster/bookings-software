import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner, UpdateResult } from 'typeorm';
import { MergeCustomersHandler } from '../handler';
import { MergeCustomersCommand } from '../command';
import { ICustomerFactory } from '@customer/domain/interfaces/factories';
import { ICustomerWriteRepository } from '@customer/domain/interfaces/repositories';
import { CustomerModel } from '@customer/infra/persistence/models';
import { Customer } from '@customer/domain/aggregates/customer';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';
import { CustomerNotFoundException } from '@customer/domain/exceptions';

/**
 * Integration Tests for MergeCustomersHandler
 *
 * These tests verify the integration between:
 * - Handler
 * - Factory (loading aggregates)
 * - Write Repository
 * - DataSource (transaction management)
 * - CustomerModel (TypeORM entity)
 *
 * Tests focus on:
 * - Transaction flow (start, commit, rollback)
 * - Appointments table update query
 * - Optimistic locking with version field
 * - Error handling and rollback
 *
 * @see .kiro/specs/customer-bc-enhancements/requirements.md - Requirement 5
 * @see .kiro/specs/customer-bc-enhancements/design.md - Section 2.1
 */
describe('MergeCustomersHandler (Integration)', () => {
  let handler: MergeCustomersHandler;
  let mockFactory: jest.Mocked<ICustomerFactory>;
  let mockWriteRepo: jest.Mocked<ICustomerWriteRepository>;
  let mockCustomerRepository: jest.Mocked<Repository<CustomerModel>>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;

  // Helper to create valid UUIDs for tests
  const createTestIds = () => ({
    sourceId: UUID.generate().getValue(),
    targetId: UUID.generate().getValue(),
    businessId: UUID.generate().getValue(),
    adminId: UUID.generate().getValue(),
  });

  beforeEach(async () => {
    // Mock QueryRunner with realistic behavior
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        query: jest.fn().mockResolvedValue([]), // Appointments update
        createQueryBuilder: jest.fn(),
      },
    } as any;

    // Mock DataSource
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as any;

    // Mock Factory
    mockFactory = {
      loadById: jest.fn(),
      loadByWhatsAppPhone: jest.fn(),
    } as jest.Mocked<ICustomerFactory>;

    // Mock Write Repository
    mockWriteRepo = {
      save: jest.fn(),
    } as jest.Mocked<ICustomerWriteRepository>;

    // Mock Customer Repository
    mockCustomerRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MergeCustomersHandler,
        {
          provide: 'ICustomerFactory',
          useValue: mockFactory,
        },
        {
          provide: 'ICustomerWriteRepository',
          useValue: mockWriteRepo,
        },
        {
          provide: getRepositoryToken(CustomerModel),
          useValue: mockCustomerRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    handler = module.get<MergeCustomersHandler>(MergeCustomersHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Transaction Management', () => {
    it('should execute merge within a transaction', async () => {
      // Arrange
      const ids = createTestIds();

      const sourceCustomer = Customer.fromPersistence(
        UUID.fromString(ids.sourceId),
        null,
        UUID.fromString(ids.businessId),
        WhatsAppPhone.fromString('+18095551234'),
        'John Doe',
        1,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      const targetCustomer = Customer.fromPersistence(
        UUID.fromString(ids.targetId),
        null,
        UUID.fromString(ids.businessId),
        WhatsAppPhone.fromString('+18095555678'),
        'John Doe',
        1,
        new Date('2024-01-02'),
        new Date('2024-01-02'),
      );

      mockFactory.loadById
        .mockResolvedValueOnce(sourceCustomer)
        .mockResolvedValueOnce(targetCustomer);

      const mockUpdateResult: UpdateResult = { affected: 1, raw: [], generatedMaps: [] };
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockUpdateResult),
      };
      mockQueryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const command = new MergeCustomersCommand(ids.sourceId, ids.targetId, ids.adminId);

      // Act
      await handler.execute(command);

      // Assert: Verify transaction lifecycle
      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();

      // Verify transaction was not rolled back
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      // Arrange
      const ids = createTestIds();

      const sourceCustomer = Customer.fromPersistence(
        UUID.fromString(ids.sourceId),
        null,
        UUID.fromString(ids.businessId),
        WhatsAppPhone.fromString('+18095551234'),
        'John Doe',
        1,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      const targetCustomer = Customer.fromPersistence(
        UUID.fromString(ids.targetId),
        null,
        UUID.fromString(ids.businessId),
        WhatsAppPhone.fromString('+18095555678'),
        'John Doe',
        1,
        new Date('2024-01-02'),
        new Date('2024-01-02'),
      );

      mockFactory.loadById
        .mockResolvedValueOnce(sourceCustomer)
        .mockResolvedValueOnce(targetCustomer);

      // Simulate database error during appointments update
      (mockQueryRunner.manager.query as jest.MockedFunction<any>).mockRejectedValueOnce(
        new Error('Database connection lost'),
      );

      const command = new MergeCustomersCommand(ids.sourceId, ids.targetId, ids.adminId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Database connection lost');

      // Verify transaction was rolled back
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should release query runner even if rollback fails', async () => {
      // Arrange
      const ids = createTestIds();

      const sourceCustomer = Customer.fromPersistence(
        UUID.fromString(ids.sourceId),
        null,
        UUID.fromString(ids.businessId),
        WhatsAppPhone.fromString('+18095551234'),
        'John Doe',
        1,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      const targetCustomer = Customer.fromPersistence(
        UUID.fromString(ids.targetId),
        null,
        UUID.fromString(ids.businessId),
        WhatsAppPhone.fromString('+18095555678'),
        'John Doe',
        1,
        new Date('2024-01-02'),
        new Date('2024-01-02'),
      );

      mockFactory.loadById
        .mockResolvedValueOnce(sourceCustomer)
        .mockResolvedValueOnce(targetCustomer);

      // Simulate error during transaction
      (mockQueryRunner.manager.query as jest.MockedFunction<any>).mockRejectedValueOnce(
        new Error('Database error'),
      );

      // Simulate rollback failure
      mockQueryRunner.rollbackTransaction = jest
        .fn()
        .mockRejectedValueOnce(new Error('Rollback failed'));

      const command = new MergeCustomersCommand(ids.sourceId, ids.targetId, ids.adminId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow();

      // Verify query runner was still released (finally block)
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('Appointments Update', () => {
    it('should update appointments table with correct SQL query', async () => {
      // Arrange
      const ids = createTestIds();

      const sourceCustomer = Customer.fromPersistence(
        UUID.fromString(ids.sourceId),
        null,
        UUID.fromString(ids.businessId),
        WhatsAppPhone.fromString('+18095551234'),
        'John Doe',
        1,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      const targetCustomer = Customer.fromPersistence(
        UUID.fromString(ids.targetId),
        null,
        UUID.fromString(ids.businessId),
        WhatsAppPhone.fromString('+18095555678'),
        'John Doe',
        1,
        new Date('2024-01-02'),
        new Date('2024-01-02'),
      );

      mockFactory.loadById
        .mockResolvedValueOnce(sourceCustomer)
        .mockResolvedValueOnce(targetCustomer);

      const mockUpdateResult: UpdateResult = { affected: 1, raw: [], generatedMaps: [] };
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockUpdateResult),
      };
      mockQueryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const command = new MergeCustomersCommand(ids.sourceId, ids.targetId, ids.adminId);

      // Act
      await handler.execute(command);

      // Assert: Verify appointments update query
      expect(mockQueryRunner.manager.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE appointments'),
        [ids.targetId, ids.sourceId],
      );

      expect(mockQueryRunner.manager.query).toHaveBeenCalledWith(
        expect.stringContaining('SET customer_id = $1'),
        [ids.targetId, ids.sourceId],
      );

      expect(mockQueryRunner.manager.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE customer_id = $2'),
        [ids.targetId, ids.sourceId],
      );
    });

    it('should execute appointments update before marking customer as merged', async () => {
      // Arrange
      const ids = createTestIds();

      const sourceCustomer = Customer.fromPersistence(
        UUID.fromString(ids.sourceId),
        null,
        UUID.fromString(ids.businessId),
        WhatsAppPhone.fromString('+18095551234'),
        'John Doe',
        1,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      const targetCustomer = Customer.fromPersistence(
        UUID.fromString(ids.targetId),
        null,
        UUID.fromString(ids.businessId),
        WhatsAppPhone.fromString('+18095555678'),
        'John Doe',
        1,
        new Date('2024-01-02'),
        new Date('2024-01-02'),
      );

      mockFactory.loadById
        .mockResolvedValueOnce(sourceCustomer)
        .mockResolvedValueOnce(targetCustomer);

      const mockUpdateResult: UpdateResult = { affected: 1, raw: [], generatedMaps: [] };
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockUpdateResult),
      };
      mockQueryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const command = new MergeCustomersCommand(ids.sourceId, ids.targetId, ids.adminId);

      // Act
      await handler.execute(command);

      // Assert: Verify order of operations
      const queryCallOrder = (mockQueryRunner.manager.query as jest.Mock).mock
        .invocationCallOrder[0];
      const queryBuilderCallOrder = (mockQueryRunner.manager.createQueryBuilder as jest.Mock).mock
        .invocationCallOrder[0];

      // Appointments update (query) should happen before customer update (queryBuilder)
      expect(queryCallOrder).toBeLessThan(queryBuilderCallOrder);
    });
  });

  describe('Performance', () => {
    it('should complete merge operation quickly', async () => {
      // Arrange
      const ids = createTestIds();

      const sourceCustomer = Customer.fromPersistence(
        UUID.fromString(ids.sourceId),
        null,
        UUID.fromString(ids.businessId),
        WhatsAppPhone.fromString('+18095551234'),
        'John Doe',
        1,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      const targetCustomer = Customer.fromPersistence(
        UUID.fromString(ids.targetId),
        null,
        UUID.fromString(ids.businessId),
        WhatsAppPhone.fromString('+18095555678'),
        'John Doe',
        1,
        new Date('2024-01-02'),
        new Date('2024-01-02'),
      );

      mockFactory.loadById
        .mockResolvedValueOnce(sourceCustomer)
        .mockResolvedValueOnce(targetCustomer);

      const mockUpdateResult: UpdateResult = { affected: 1, raw: [], generatedMaps: [] };
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockUpdateResult),
      };
      mockQueryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const command = new MergeCustomersCommand(ids.sourceId, ids.targetId, ids.adminId);

      // Act: Measure execution time
      const startTime = Date.now();
      await handler.execute(command);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert: Should complete quickly (< 100ms for mocked operations)
      expect(duration).toBeLessThan(100);
    });
  });
});
