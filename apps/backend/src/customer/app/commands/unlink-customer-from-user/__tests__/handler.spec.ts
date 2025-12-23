import { Test, TestingModule } from '@nestjs/testing';
import { UnlinkCustomerFromUserHandler } from '../handler';
import { UnlinkCustomerFromUserCommand } from '../command';
import { ICustomerFactory } from '@customer/domain/interfaces/factories/customer-factory';
import { ICustomerWriteRepository } from '@customer/domain/interfaces/repositories/customer-write';
import { Customer } from '@customer/domain/aggregates/customer';
import { CustomerNotFoundException } from '@customer/domain/exceptions/customer-not-found';
import { CustomerNotLinkedToUserException } from '@customer/domain/exceptions/customer-not-linked-to-user';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';

/**
 * Unit tests for UnlinkCustomerFromUserHandler
 *
 * Tests the handler logic for unlinking customers from users including:
 * - Successful unlinking of registered customers
 * - Error handling for non-existent customers
 * - Error handling for anonymous customers
 * - Event publishing
 *
 * **Validates: Requirements 9.2.1-9.2.4**
 * **Property 9: Unlinking preserves identity**
 */
describe('UnlinkCustomerFromUserHandler', () => {
  let handler: UnlinkCustomerFromUserHandler;
  let mockFactory: jest.Mocked<ICustomerFactory>;
  let mockWriteRepo: jest.Mocked<ICustomerWriteRepository>;

  beforeEach(async () => {
    mockFactory = {
      loadById: jest.fn(),
      loadByWhatsAppPhone: jest.fn(),
    } as jest.Mocked<ICustomerFactory>;

    mockWriteRepo = {
      save: jest.fn(),
    } as jest.Mocked<ICustomerWriteRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnlinkCustomerFromUserHandler,
        {
          provide: 'ICustomerFactory',
          useValue: mockFactory,
        },
        {
          provide: 'ICustomerWriteRepository',
          useValue: mockWriteRepo,
        },
      ],
    }).compile();

    handler = module.get<UnlinkCustomerFromUserHandler>(UnlinkCustomerFromUserHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should unlink registered customer from user successfully', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const userId = UUID.generate().getValue();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095551234');

      const customer = Customer.createAnonymous(
        UUID.fromString(customerId),
        businessId,
        phone,
        'Test Customer',
      );

      // Link first
      customer.linkToUser(UUID.fromString(userId));
      expect(customer.isRegistered()).toBe(true);

      mockFactory.loadById.mockResolvedValue(customer);
      mockWriteRepo.save.mockResolvedValue();

      const command = new UnlinkCustomerFromUserCommand(customerId);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockFactory.loadById).toHaveBeenCalledWith(customerId);
      expect(mockWriteRepo.save).toHaveBeenCalledWith(customer);
      expect(customer.isAnonymous()).toBe(true);
      expect(customer.isRegistered()).toBe(false);
      expect(customer.getUserId()).toBeNull();
    });

    it('should throw CustomerNotFoundException when customer does not exist', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();

      mockFactory.loadById.mockResolvedValue(null);

      const command = new UnlinkCustomerFromUserCommand(customerId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CustomerNotFoundException);
      expect(mockFactory.loadById).toHaveBeenCalledWith(customerId);
      expect(mockWriteRepo.save).not.toHaveBeenCalled();
    });

    it('should throw CustomerNotLinkedToUserException when customer is anonymous', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095555678');

      const customer = Customer.createAnonymous(
        UUID.fromString(customerId),
        businessId,
        phone,
        'Test Customer',
      );

      expect(customer.isAnonymous()).toBe(true);

      mockFactory.loadById.mockResolvedValue(customer);

      const command = new UnlinkCustomerFromUserCommand(customerId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CustomerNotLinkedToUserException);
      expect(mockFactory.loadById).toHaveBeenCalledWith(customerId);
      expect(mockWriteRepo.save).not.toHaveBeenCalled();
    });

    it('should increment version when unlinking', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const userId = UUID.generate().getValue();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095559999');

      const customer = Customer.createAnonymous(
        UUID.fromString(customerId),
        businessId,
        phone,
        'Test Customer',
      );

      customer.linkToUser(UUID.fromString(userId));
      const versionAfterLink = customer.getVersion().getValue();

      mockFactory.loadById.mockResolvedValue(customer);
      mockWriteRepo.save.mockResolvedValue();

      const command = new UnlinkCustomerFromUserCommand(customerId);

      // Act
      await handler.execute(command);

      // Assert
      expect(customer.getVersion().getValue()).toBe(versionAfterLink + 1);
    });

    it('should preserve customer identity when unlinking (Property 9)', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const userId = UUID.generate().getValue();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095558888');
      const name = 'Test Customer';

      const customer = Customer.createAnonymous(
        UUID.fromString(customerId),
        businessId,
        phone,
        name,
      );

      customer.linkToUser(UUID.fromString(userId));

      const originalId = customer.getId().getValue();
      const originalBusinessId = customer.getBusinessId().getValue();
      const originalPhone = customer.getWhatsAppPhone().getValue();
      const originalName = customer.getName();

      mockFactory.loadById.mockResolvedValue(customer);
      mockWriteRepo.save.mockResolvedValue();

      const command = new UnlinkCustomerFromUserCommand(customerId);

      // Act
      await handler.execute(command);

      // Assert - Identity preserved
      expect(customer.getId().getValue()).toBe(originalId);
      expect(customer.getBusinessId().getValue()).toBe(originalBusinessId);
      expect(customer.getWhatsAppPhone().getValue()).toBe(originalPhone);
      expect(customer.getName()).toBe(originalName);
    });
  });
});
