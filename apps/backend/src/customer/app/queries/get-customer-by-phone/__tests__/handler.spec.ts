import { Test, TestingModule } from '@nestjs/testing';
import { GetCustomerByPhoneHandler } from '../handler';
import { GetCustomerByPhoneQuery } from '../query';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories/customer-read';
import { CustomerReadModel } from '@customer/domain/read-models/customer';
import { UUID } from '@shared/vo/uuid';

/**
 * Unit tests for GetCustomerByPhoneHandler
 *
 * Tests the handler logic for retrieving customer by phone including:
 * - Successful retrieval
 * - Returning null when not found (doesn't throw)
 * - Multi-tenant isolation
 *
 * **Validates: Requirements 6.5, 8.1**
 */
describe('GetCustomerByPhoneHandler', () => {
  let handler: GetCustomerByPhoneHandler;
  let mockReadRepo: jest.Mocked<ICustomerReadRepository>;

  beforeEach(async () => {
    mockReadRepo = {
      findById: jest.fn(),
      findByWhatsAppPhone: jest.fn(),
      findByBusinessId: jest.fn(),
      findByUserId: jest.fn(),
      findAnonymousByBusinessId: jest.fn(),
    } as jest.Mocked<ICustomerReadRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCustomerByPhoneHandler,
        {
          provide: 'ICustomerReadRepository',
          useValue: mockReadRepo,
        },
      ],
    }).compile();

    handler = module.get<GetCustomerByPhoneHandler>(GetCustomerByPhoneHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return customer when found by phone and business', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const phone = '+18095551234';

      const readModel = new CustomerReadModel(
        UUID.generate().getValue(),
        null,
        businessId,
        phone,
        'Test Customer',
        new Date(),
        new Date(),
      );

      mockReadRepo.findByWhatsAppPhone.mockResolvedValue(readModel);

      const query = new GetCustomerByPhoneQuery(businessId, phone);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockReadRepo.findByWhatsAppPhone).toHaveBeenCalledWith(businessId, phone);
      expect(result).toBe(readModel);
      expect(result!.whatsappPhone).toBe(phone);
      expect(result!.businessId).toBe(businessId);
    });

    it('should return null when customer not found', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const phone = '+18095555678';

      mockReadRepo.findByWhatsAppPhone.mockResolvedValue(null);

      const query = new GetCustomerByPhoneQuery(businessId, phone);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockReadRepo.findByWhatsAppPhone).toHaveBeenCalledWith(businessId, phone);
      expect(result).toBeNull();
    });

    it('should respect multi-tenant isolation', async () => {
      // Arrange
      const business1 = UUID.generate().getValue();
      const business2 = UUID.generate().getValue();
      const phone = '+18095559999';

      const customer1 = new CustomerReadModel(
        UUID.generate().getValue(),
        null,
        business1,
        phone,
        'Customer 1',
        new Date(),
        new Date(),
      );

      // Mock returns customer only for business1
      mockReadRepo.findByWhatsAppPhone.mockImplementation(async (businessId, whatsappPhone) => {
        if (businessId === business1 && whatsappPhone === phone) {
          return customer1;
        }
        return null;
      });

      const query1 = new GetCustomerByPhoneQuery(business1, phone);
      const query2 = new GetCustomerByPhoneQuery(business2, phone);

      // Act
      const result1 = await handler.execute(query1);
      const result2 = await handler.execute(query2);

      // Assert
      expect(result1).toBe(customer1);
      expect(result2).toBeNull();
    });

    it('should handle E.164 formatted phone numbers', async () => {
      // Arrange
      const businessId = UUID.generate().getValue();
      const phone = '+18095558888';

      const readModel = new CustomerReadModel(
        UUID.generate().getValue(),
        null,
        businessId,
        phone,
        'Test Customer',
        new Date(),
        new Date(),
      );

      mockReadRepo.findByWhatsAppPhone.mockResolvedValue(readModel);

      const query = new GetCustomerByPhoneQuery(businessId, phone);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result!.whatsappPhone).toBe(phone);
      expect(result!.whatsappPhone).toMatch(/^\+\d{10,15}$/);
    });
  });
});
