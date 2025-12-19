import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerReadRepository } from '../customer-read.repository';
import { CustomerModel } from '../../models/customer.model';
import { UUID } from '@shared/vo/uuid';

/**
 * Unit tests for CustomerReadRepository
 *
 * Tests the repository logic for reading customer data including:
 * - Finding by ID
 * - Finding by WhatsApp phone
 * - Finding by business ID
 * - Finding by user ID
 * - Finding anonymous customers
 *
 * **Validates: Requirements 5.3, 5.6, 11.5**
 */
describe('CustomerReadRepository', () => {
  let repository: CustomerReadRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<CustomerModel>>;

  beforeEach(async () => {
    mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<CustomerModel>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerReadRepository,
        {
          provide: getRepositoryToken(CustomerModel),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<CustomerReadRepository>(CustomerReadRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return read model when customer exists', async () => {
      // Arrange
      const id = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();

      const model: CustomerModel = {
        id,
        user_id: null,
        business_id: businessId,
        whatsapp_phone: '+18095551234',
        name: 'Test Customer',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockTypeOrmRepo.findOne.mockResolvedValue(model);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toBeDefined();
      expect(result!.id).toBe(id);
      expect(result!.businessId).toBe(businessId);
      expect(result!.whatsappPhone).toBe('+18095551234');
      expect(result!.name).toBe('Test Customer');
      expect(result!.userId).toBeNull();
    });

    it('should throw CustomerNotFoundException when customer not found', async () => {
      // Arrange
      const id = UUID.generate().getValue();
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(repository.findById(id)).rejects.toThrow();
    });
  });

  describe('findByWhatsAppPhone', () => {
    it('should return customer by phone and business', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const phone = '+18095555678';

      const model: CustomerModel = {
        id: UUID.generate().getValue(),
        user_id: null,
        business_id: businessId,
        whatsapp_phone: phone,
        name: 'Phone Customer',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockTypeOrmRepo.findOne.mockResolvedValue(model);

      // Act
      const result = await repository.findByWhatsAppPhone(businessId, phone);

      // Assert
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { business_id: businessId, whatsapp_phone: phone },
      });
      expect(result).toBeDefined();
      expect(result!.whatsappPhone).toBe(phone);
      expect(result!.businessId).toBe(businessId);
    });

    it('should return null when not found', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const phone = '+18095559999';

      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByWhatsAppPhone(businessId, phone);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByBusinessId', () => {
    it('should return all customers for business', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();

      const models: CustomerModel[] = [
        {
          id: UUID.generate().getValue(),
          user_id: null,
          business_id: businessId,
          whatsapp_phone: '+18095551111',
          name: 'Customer 1',
          version: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          user_id: UUID.generate().getValue(),
          business_id: businessId,
          whatsapp_phone: '+18095552222',
          name: 'Customer 2',
          version: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockTypeOrmRepo.find.mockResolvedValue(models);

      // Act
      const result = await repository.findByBusinessId(businessId);

      // Assert
      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { business_id: businessId },
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0].businessId).toBe(businessId);
      expect(result[1].businessId).toBe(businessId);
    });

    it('should return empty array when no customers found', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      mockTypeOrmRepo.find.mockResolvedValue([]);

      // Act
      const result = await repository.findByBusinessId(businessId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findByUserId', () => {
    it('should return all customers linked to user', async () => {
      // Arrange
      const userId = UUID.generate().getValue();
      const business1 = UUID.generate().getValue();
      const business2 = UUID.generate().getValue();

      const models: CustomerModel[] = [
        {
          id: UUID.generate().getValue(),
          user_id: userId,
          business_id: business1,
          whatsapp_phone: '+18095553333',
          name: 'Customer 1',
          version: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          user_id: userId,
          business_id: business2,
          whatsapp_phone: '+18095554444',
          name: 'Customer 2',
          version: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockTypeOrmRepo.find.mockResolvedValue(models);

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: userId },
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(userId);
      expect(result[1].userId).toBe(userId);
    });

    it('should return empty array when user has no customers', async () => {
      // Arrange
      const userId = UUID.generate().getValue();
      mockTypeOrmRepo.find.mockResolvedValue([]);

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findAnonymousByBusinessId', () => {
    it('should return only anonymous customers for business', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();

      const models: CustomerModel[] = [
        {
          id: UUID.generate().getValue(),
          user_id: null, // Anonymous
          business_id: businessId,
          whatsapp_phone: '+18095555555',
          name: 'Anonymous 1',
          version: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: UUID.generate().getValue(),
          user_id: null, // Anonymous
          business_id: businessId,
          whatsapp_phone: '+18095556666',
          name: 'Anonymous 2',
          version: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockTypeOrmRepo.find.mockResolvedValue(models);

      // Act
      const result = await repository.findAnonymousByBusinessId(businessId);

      // Assert
      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            business_id: businessId,
          }),
        }),
      );
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.userId === null)).toBe(true);
    });

    it('should return empty array when no anonymous customers', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      mockTypeOrmRepo.find.mockResolvedValue([]);

      // Act
      const result = await repository.findAnonymousByBusinessId(businessId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('Read model mapping', () => {
    it('should map all fields correctly', async () => {
      // Arrange
      const id = UUID.generate().getValue();
      const userId = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const model: CustomerModel = {
        id,
        user_id: userId,
        business_id: businessId,
        whatsapp_phone: '+18095557777',
        name: 'Complete Customer',
        version: 5,
        created_at: createdAt,
        updated_at: updatedAt,
      };

      mockTypeOrmRepo.findOne.mockResolvedValue(model);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(result!.id).toBe(id);
      expect(result!.userId).toBe(userId);
      expect(result!.businessId).toBe(businessId);
      expect(result!.whatsappPhone).toBe('+18095557777');
      expect(result!.name).toBe('Complete Customer');
      expect(result!.createdAt).toEqual(createdAt);
      expect(result!.updatedAt).toEqual(updatedAt);
    });
  });
});
