import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerFactory } from '../customer.factory';
import { CustomerModel } from '../../models/customer.model';
import { UUID } from '@shared/vo/uuid';

/**
 * Unit tests for CustomerFactory
 *
 * Tests the factory logic for loading aggregates from persistence including:
 * - Loading by ID
 * - Loading by WhatsApp phone
 * - Preserving version for optimistic locking
 * - Reconstructing with userId (anonymous vs registered)
 *
 * **Validates: Requirements 5.2, 11.5**
 */
describe('CustomerFactory', () => {
  let factory: CustomerFactory;
  let mockRepository: jest.Mocked<Repository<CustomerModel>>;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<CustomerModel>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerFactory,
        {
          provide: getRepositoryToken(CustomerModel),
          useValue: mockRepository,
        },
      ],
    }).compile();

    factory = module.get<CustomerFactory>(CustomerFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadById', () => {
    it('should load customer aggregate with correct version', async () => {
      // Arrange
      const id = UUID.generate().getValue();
      const businessId = UUID.generate().getValue();

      const model: CustomerModel = {
        id,
        user_id: null,
        business_id: businessId,
        whatsapp_phone: '+18095551234',
        name: 'Test Customer',
        version: 5, // Specific version
        merged_into: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(model);

      // Act
      const customer = await factory.loadById(id);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(customer).toBeDefined();
      expect(customer!.getId().getValue()).toBe(id);
      expect(customer!.getVersion().getValue()).toBe(5); // Version preserved
      expect(customer!.getBusinessId().getValue()).toBe(businessId);
      expect(customer!.getWhatsAppPhone().getValue()).toBe('+18095551234');
      expect(customer!.getName()).toBe('Test Customer');
    });

    it('should return null when customer not found', async () => {
      // Arrange
      const id = UUID.generate().getValue();
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const customer = await factory.loadById(id);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(customer).toBeNull();
    });

    it('should load anonymous customer (userId null)', async () => {
      // Arrange
      const id = UUID.generate().getValue();

      const model: CustomerModel = {
        id,
        user_id: null, // Anonymous
        business_id: UUID.generate().getValue(),
        whatsapp_phone: '+18095555678',
        name: 'Anonymous Customer',
        version: 1,
        merged_into: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(model);

      // Act
      const customer = await factory.loadById(id);

      // Assert
      expect(customer!.isAnonymous()).toBe(true);
      expect(customer!.isRegistered()).toBe(false);
      expect(customer!.getUserId()).toBeNull();
    });

    it('should load registered customer (userId not null)', async () => {
      // Arrange
      const id = UUID.generate().getValue();
      const userId = UUID.generate().getValue();

      const model: CustomerModel = {
        id,
        user_id: userId, // Registered
        business_id: UUID.generate().getValue(),
        whatsapp_phone: '+18095559999',
        name: 'Registered Customer',
        version: 3,
        merged_into: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(model);

      // Act
      const customer = await factory.loadById(id);

      // Assert
      expect(customer!.isRegistered()).toBe(true);
      expect(customer!.isAnonymous()).toBe(false);
      expect(customer!.getUserId()?.getValue()).toBe(userId);
    });

    it('should reconstruct aggregate with business logic available', async () => {
      // Arrange
      const id = UUID.generate().getValue();

      const model: CustomerModel = {
        id,
        user_id: null,
        business_id: UUID.generate().getValue(),
        whatsapp_phone: '+18095558888',
        name: 'Test Customer',
        version: 2,
        merged_into: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(model);

      // Act
      const customer = await factory.loadById(id);

      // Assert - Business logic methods are available
      expect(() => customer!.updateName('New Name')).not.toThrow();
      expect(customer!.getName()).toBe('New Name');
      expect(customer!.getVersion().getValue()).toBe(3); // Version incremented
    });
  });

  describe('loadByWhatsAppPhone', () => {
    it('should load customer by phone and business', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const phone = '+18095551111';

      const model: CustomerModel = {
        id: UUID.generate().getValue(),
        user_id: null,
        business_id: businessId,
        whatsapp_phone: phone,
        name: 'Phone Customer',
        version: 1,
        merged_into: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(model);

      // Act
      const customer = await factory.loadByWhatsAppPhone(businessId, phone);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { business_id: businessId, whatsapp_phone: phone },
      });
      expect(customer).toBeDefined();
      expect(customer!.getWhatsAppPhone().getValue()).toBe(phone);
      expect(customer!.getBusinessId().getValue()).toBe(businessId);
    });

    it('should return null when customer not found by phone', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const phone = '+18095552222';

      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const customer = await factory.loadByWhatsAppPhone(businessId, phone);

      // Assert
      expect(customer).toBeNull();
    });

    it('should respect multi-tenant isolation', async () => {
      // Arrange
      const business1 = UUID.generate().getValue();
      const business2 = UUID.generate().getValue();
      const phone = '+18095553333';

      const model: CustomerModel = {
        id: UUID.generate().getValue(),
        user_id: null,
        business_id: business1,
        whatsapp_phone: phone,
        name: 'Customer 1',
        version: 1,
        merged_into: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock returns customer only for business1
      mockRepository.findOne.mockImplementation(async (options) => {
        const where = options?.where as { business_id?: string; whatsapp_phone?: string };
        if (where?.business_id === business1 && where?.whatsapp_phone === phone) {
          return model;
        }
        return null;
      });

      // Act
      const customer1 = await factory.loadByWhatsAppPhone(business1, phone);
      const customer2 = await factory.loadByWhatsAppPhone(business2, phone);

      // Assert
      expect(customer1).toBeDefined();
      expect(customer2).toBeNull();
    });
  });

  describe('Version preservation', () => {
    it('should preserve version for any valid version number', async () => {
      // Arrange
      const versions = [0, 1, 5, 10, 100, 1000];

      for (const version of versions) {
        const id = UUID.generate().getValue();

        const model: CustomerModel = {
          id,
          user_id: null,
          business_id: UUID.generate().getValue(),
          whatsapp_phone: `+1809555${version.toString().padStart(4, '0')}`,
          name: `Customer ${version}`,
          version,
          merged_into: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        mockRepository.findOne.mockResolvedValue(model);

        // Act
        const customer = await factory.loadById(id);

        // Assert
        expect(customer!.getVersion().getValue()).toBe(version);
      }
    });
  });
});
