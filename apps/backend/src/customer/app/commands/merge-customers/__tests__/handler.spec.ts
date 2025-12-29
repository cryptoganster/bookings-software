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
import { CannotMergeCustomerWithItselfException } from '@customer/domain/exceptions';
import { CustomersFromDifferentBusinessesException } from '@customer/domain/exceptions';

describe('MergeCustomersHandler', () => {
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
    // Mock QueryRunner
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        query: jest.fn() as jest.MockedFunction<typeof jest.fn>,
        createQueryBuilder: jest.fn() as jest.MockedFunction<typeof jest.fn>,
      },
    } as unknown as jest.Mocked<QueryRunner>;

    // Mock DataSource
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as unknown as jest.Mocked<DataSource>;

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
    } as unknown as jest.Mocked<Repository<CustomerModel>>;

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

  describe('execute', () => {
    it('should successfully merge two customers from same business', async () => {
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

      const applySpy = jest.spyOn(sourceCustomer, 'apply');
      const commitSpy = jest.spyOn(sourceCustomer, 'commit');

      // Act
      await handler.execute(command);

      // Assert
      expect(mockFactory.loadById).toHaveBeenCalledWith(ids.sourceId);
      expect(mockFactory.loadById).toHaveBeenCalledWith(ids.targetId);
      expect(mockFactory.loadById).toHaveBeenCalledTimes(2);

      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();

      expect(mockQueryRunner.manager.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE appointments'),
        [ids.targetId, ids.sourceId],
      );

      expect(mockQueryRunner.manager.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(CustomerModel);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        merged_into: ids.targetId,
        updated_at: expect.any(Date),
        version: 2,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :id', { id: ids.sourceId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('version = :version', {
        version: 1,
      });

      expect(applySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceCustomerId: ids.sourceId,
          targetCustomerId: ids.targetId,
          mergedBy: ids.adminId,
        }),
      );
      expect(commitSpy).toHaveBeenCalled();
    });

    it('should throw CustomerNotFoundException when source customer not found', async () => {
      // Arrange
      const ids = createTestIds();
      mockFactory.loadById.mockResolvedValueOnce(null);

      const command = new MergeCustomersCommand(ids.sourceId, ids.targetId, ids.adminId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CustomerNotFoundException);
      expect(mockFactory.loadById).toHaveBeenCalledWith(ids.sourceId);
      expect(mockFactory.loadById).toHaveBeenCalledTimes(1);
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('should throw CustomerNotFoundException when target customer not found', async () => {
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

      mockFactory.loadById.mockResolvedValueOnce(sourceCustomer).mockResolvedValueOnce(null);

      const command = new MergeCustomersCommand(ids.sourceId, ids.targetId, ids.adminId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CustomerNotFoundException);
      expect(mockFactory.loadById).toHaveBeenCalledWith(ids.sourceId);
      expect(mockFactory.loadById).toHaveBeenCalledWith(ids.targetId);
      expect(mockFactory.loadById).toHaveBeenCalledTimes(2);
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('should throw CannotMergeCustomerWithItselfException when source equals target', async () => {
      // Arrange
      const ids = createTestIds();
      const command = new MergeCustomersCommand(ids.sourceId, ids.sourceId, ids.adminId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        CannotMergeCustomerWithItselfException,
      );
      expect(mockFactory.loadById).not.toHaveBeenCalled();
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('should throw CustomersFromDifferentBusinessesException when customers belong to different businesses', async () => {
      // Arrange
      const ids = createTestIds();
      const business2Id = UUID.generate().getValue();

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
        UUID.fromString(business2Id),
        WhatsAppPhone.fromString('+18095555678'),
        'Jane Smith',
        1,
        new Date('2024-01-02'),
        new Date('2024-01-02'),
      );

      mockFactory.loadById
        .mockResolvedValueOnce(sourceCustomer)
        .mockResolvedValueOnce(targetCustomer);

      const command = new MergeCustomersCommand(ids.sourceId, ids.targetId, ids.adminId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        CustomersFromDifferentBusinessesException,
      );
      expect(mockFactory.loadById).toHaveBeenCalledTimes(2);
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
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

      (mockQueryRunner.manager.query as jest.Mock).mockRejectedValueOnce(
        new Error('Database error'),
      );

      const command = new MergeCustomersCommand(ids.sourceId, ids.targetId, ids.adminId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Database error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw ConcurrencyException when version mismatch occurs', async () => {
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

      // Mock factory to return customers on all retry attempts (3 attempts × 2 customers = 6 calls)
      mockFactory.loadById.mockResolvedValue(sourceCustomer);
      mockFactory.loadById.mockResolvedValue(targetCustomer);

      const mockUpdateResult: UpdateResult = { affected: 0, raw: [], generatedMaps: [] };
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockUpdateResult),
      };
      mockQueryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const command = new MergeCustomersCommand(ids.sourceId, ids.targetId, ids.adminId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Unable to merge customers after multiple attempts',
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(3);
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('should retry on ConcurrencyException up to 3 times', async () => {
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

      mockFactory.loadById.mockResolvedValue(sourceCustomer);
      mockFactory.loadById.mockResolvedValue(targetCustomer);

      const mockFailedResult: UpdateResult = { affected: 0, raw: [], generatedMaps: [] };
      const mockSuccessResult: UpdateResult = { affected: 1, raw: [], generatedMaps: [] };
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest
          .fn()
          .mockResolvedValueOnce(mockFailedResult)
          .mockResolvedValueOnce(mockFailedResult)
          .mockResolvedValueOnce(mockSuccessResult),
      };
      mockQueryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const command = new MergeCustomersCommand(ids.sourceId, ids.targetId, ids.adminId);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockFactory.loadById).toHaveBeenCalledTimes(6);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(3);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(2);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });

    it('should throw error after max retries exceeded', async () => {
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

      mockFactory.loadById.mockResolvedValue(sourceCustomer);
      mockFactory.loadById.mockResolvedValue(targetCustomer);

      const mockFailedResult: UpdateResult = { affected: 0, raw: [], generatedMaps: [] };
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockFailedResult),
      };
      mockQueryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const command = new MergeCustomersCommand(ids.sourceId, ids.targetId, ids.adminId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Unable to merge customers after multiple attempts',
      );
      expect(mockFactory.loadById).toHaveBeenCalledTimes(6);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(3);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(3);
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('should update appointments table with correct customer IDs', async () => {
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

      // Assert
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

    it('should publish CustomersMerged event with correct data', async () => {
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

      const applySpy = jest.spyOn(sourceCustomer, 'apply');

      // Act
      await handler.execute(command);

      // Assert
      expect(applySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceCustomerId: ids.sourceId,
          targetCustomerId: ids.targetId,
          mergedBy: ids.adminId,
          occurredAt: expect.any(Date),
        }),
      );
    });

    it('should preserve version for optimistic locking', async () => {
      // Arrange
      const ids = createTestIds();

      const sourceCustomer = Customer.fromPersistence(
        UUID.fromString(ids.sourceId),
        null,
        UUID.fromString(ids.businessId),
        WhatsAppPhone.fromString('+18095551234'),
        'John Doe',
        5,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      const targetCustomer = Customer.fromPersistence(
        UUID.fromString(ids.targetId),
        null,
        UUID.fromString(ids.businessId),
        WhatsAppPhone.fromString('+18095555678'),
        'John Doe',
        3,
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

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('version = :version', {
        version: 5,
      });
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        merged_into: ids.targetId,
        updated_at: expect.any(Date),
        version: 6,
      });
    });
  });
});
