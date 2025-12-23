import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { CustomerWriteRepository } from '../customer-write.repository';
import { CustomerModel } from '../../models/customer.model';
import { Customer } from '@customer/domain/aggregates/customer';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';
import { IUnitOfWork } from '@shared/kernel/uow';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';

/**
 * Unit tests for CustomerWriteRepository
 *
 * Tests the repository logic for persisting customers including:
 * - Successful saves
 * - Optimistic locking with version checking
 * - ConcurrencyException on version mismatch
 * - userId field handling (nullable)
 *
 * **Validates: Requirements 5.1, 5.4, 5.5, 11.5**
 * **Property 4: Optimistic locking prevents concurrent modifications**
 */
describe('CustomerWriteRepository', () => {
  let repository: CustomerWriteRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<CustomerModel>>;
  let mockUow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    mockTypeOrmRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<CustomerModel>>;

    mockUow = {
      transaction: jest.fn((work) => work()),
      getQueryRunner: jest.fn(),
    } as jest.Mocked<IUnitOfWork>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerWriteRepository,
        {
          provide: getRepositoryToken(CustomerModel),
          useValue: mockTypeOrmRepo,
        },
        {
          provide: 'IUnitOfWork',
          useValue: mockUow,
        },
      ],
    }).compile();

    repository = module.get<CustomerWriteRepository>(CustomerWriteRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save customer successfully with version increment', async () => {
      // Arrange
      const id = UUID.generate();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095551234');

      const customer = Customer.createAnonymous(id, businessId, phone, 'Test Customer');

      // Simulate updating an existing customer by calling updateName
      customer.updateName('Updated Name');

      const currentVersion = customer.getVersion().getValue(); // Should be 2 after updateName

      // Mock findOne to return existing customer
      mockTypeOrmRepo.findOne.mockResolvedValue({
        id: id.getValue(),
        version: currentVersion - 1, // Previous version in DB
      } as CustomerModel);

      const mockExecute = jest.fn().mockResolvedValue({ affected: 1 } as UpdateResult);
      const mockWhere = jest.fn().mockReturnThis();
      const mockAndWhere = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockUpdate = jest.fn().mockReturnValue({
        set: mockSet,
        where: mockWhere,
        andWhere: mockAndWhere,
        execute: mockExecute,
      });

      mockTypeOrmRepo.createQueryBuilder.mockReturnValue({
        update: mockUpdate,
      } as any);

      // Act
      await repository.save(customer);

      // Assert
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: id.getValue() },
      });
      expect(mockTypeOrmRepo.createQueryBuilder).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(CustomerModel);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          version: currentVersion, // New version from aggregate
        }),
      );
      expect(mockWhere).toHaveBeenCalledWith('id = :id', { id: id.getValue() });
      expect(mockAndWhere).toHaveBeenCalledWith('version = :version', {
        version: currentVersion - 1, // Check against previous version
      });
      expect(mockExecute).toHaveBeenCalled();
    });

    it('should throw ConcurrencyException when version mismatch', async () => {
      // Arrange
      const id = UUID.generate();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095555678');

      const customer = Customer.createAnonymous(id, businessId, phone, 'Test Customer');

      // Simulate updating an existing customer
      customer.updateName('Updated Name');

      const currentVersion = customer.getVersion().getValue();

      // Mock findOne to return existing customer
      mockTypeOrmRepo.findOne.mockResolvedValue({
        id: id.getValue(),
        version: currentVersion - 1,
      } as CustomerModel);

      const mockExecute = jest.fn().mockResolvedValue({ affected: 0 } as UpdateResult); // No rows affected
      const mockWhere = jest.fn().mockReturnThis();
      const mockAndWhere = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockUpdate = jest.fn().mockReturnValue({
        set: mockSet,
        where: mockWhere,
        andWhere: mockAndWhere,
        execute: mockExecute,
      });

      mockTypeOrmRepo.createQueryBuilder.mockReturnValue({
        update: mockUpdate,
      } as any);

      // Act & Assert
      await expect(repository.save(customer)).rejects.toThrow(ConcurrencyException);
      await expect(repository.save(customer)).rejects.toThrow(
        `Customer ${id.getValue()} was modified by another transaction`,
      );
    });

    it('should save anonymous customer with null userId', async () => {
      // Arrange
      const id = UUID.generate();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095559999');

      const customer = Customer.createAnonymous(id, businessId, phone, 'Anonymous');

      expect(customer.isAnonymous()).toBe(true);

      // Mock findOne to return null (new customer)
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      mockTypeOrmRepo.save.mockResolvedValue({} as CustomerModel);

      // Act
      await repository.save(customer);

      // Assert
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: id.getValue() },
      });
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: null, // Anonymous customer
          version: 1, // Initial version after creation
        }),
      );
    });

    it('should save registered customer with userId', async () => {
      // Arrange
      const id = UUID.generate();
      const userId = UUID.generate();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095558888');

      const customer = Customer.createAnonymous(id, businessId, phone, 'Test');
      customer.linkToUser(userId);

      expect(customer.isRegistered()).toBe(true);

      // Mock findOne to return null (new customer)
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      mockTypeOrmRepo.save.mockResolvedValue({} as CustomerModel);

      // Act
      await repository.save(customer);

      // Assert
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId.getValue(), // Registered customer
          version: 2, // Version incremented after linkToUser
        }),
      );
    });

    it('should update userId when linking customer', async () => {
      // Arrange
      const id = UUID.generate();
      const userId = UUID.generate();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095557777');

      const customer = Customer.createAnonymous(id, businessId, phone, 'Test');

      // Link to user
      customer.linkToUser(userId);

      // Mock findOne to return null (new customer)
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      mockTypeOrmRepo.save.mockResolvedValue({} as CustomerModel);

      // Act
      await repository.save(customer);

      // Assert
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId.getValue(),
          version: 2, // Version incremented after linkToUser
        }),
      );
    });

    it('should update userId to null when unlinking customer', async () => {
      // Arrange
      const id = UUID.generate();
      const userId = UUID.generate();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095556666');

      const customer = Customer.createAnonymous(id, businessId, phone, 'Test');
      customer.linkToUser(userId);

      // Unlink from user
      customer.unlinkFromUser();

      expect(customer.isAnonymous()).toBe(true);

      // Mock findOne to return null (new customer)
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      mockTypeOrmRepo.save.mockResolvedValue({} as CustomerModel);

      // Act
      await repository.save(customer);

      // Assert
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: null, // Unlinked
          version: 3, // Version incremented after linkToUser and unlinkFromUser
        }),
      );
    });

    it('should insert new customer directly without transaction', async () => {
      // Arrange
      const id = UUID.generate();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095555555');

      const customer = Customer.createAnonymous(id, businessId, phone, 'Test');

      // Mock findOne to return null (new customer)
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      mockTypeOrmRepo.save.mockResolvedValue({} as CustomerModel);

      // Act
      await repository.save(customer);

      // Assert
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalled();
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: id.getValue(),
          version: 1,
        }),
      );
    });
  });
});
